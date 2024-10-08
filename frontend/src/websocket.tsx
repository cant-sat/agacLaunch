import { setAuthenticatedGlobal, setConnectedGlobal } from "./App"
import { setLaunchedGlobal } from "./Button"
import { globalSetLocalTables } from "./Live"
import { setGlobLaunched } from "./main"

export let socket : WebSocket
export let tables : Map<string, unknown[]> = new Map<string, unknown[]>()


export function initializeWebsocket(token? : string){
    socket = new WebSocket("ws://"+window.location.hostname+":443")

    socket.addEventListener("open", () =>{
        setConnectedGlobal(true)
        if(token || token === ""){
            socket.send(token)
        }
    })

    socket.addEventListener("close", () =>{
        setAuthenticatedGlobal(false)
        setConnectedGlobal(false)
    })

    socket.addEventListener("error", ()=>{
        try {
            socket.close()
            setAuthenticatedGlobal(false)
            setConnectedGlobal(false)
        } catch (error) {
            setAuthenticatedGlobal(false)
            setConnectedGlobal(false)
            
        }
    })

    socket.addEventListener("message", (event)=>{
        if(event.data == "authenticated"){
            setAuthenticatedGlobal(true)
            return
        }

        let data : {
            entries : [{
                table : string,
                values : unknown[]
            }]
        } = JSON.parse(event.data)

        data.entries.forEach((entrie)=>{
            let newValues = (tables.get(entrie.table)) ? tables.get(entrie.table)?.concat(entrie.values) : entrie.values

            if(newValues == undefined){
                throw "this will never happen but i need it to chill out the compiler"
            }

            if(entrie.table == "launched"){
                
                if (typeof (entrie.values[entrie.values.length - 1]) === "boolean" || typeof (entrie.values[entrie.values.length - 1]) === "undefined") {
                    setGlobLaunched( entrie.values[entrie.values.length - 1] as boolean | undefined) // Assert the type
                }
                
                setLaunchedGlobal.forEach((setFunc)=>{
                    setFunc(entrie.values[entrie.values.length -1])
                })
            }

            tables.set(entrie.table, newValues)
        })

        globalSetLocalTables(new Map(tables))
    })
}


