import * as webSocket from "ws";
import { connection } from "./ws.js";
import * as randomstring from "randomstring";
import { readFileSync, writeFileSync, } from "fs";
import { formatText, isWhole, removeComments, writeTables } from "./format.js";
import { error } from "console";
import { log } from "./logger.js";
import ON_DEATH from "death";
import * as express from "express";
import { get, started } from "./express.js";
// Read in the settings
var rawData = readFileSync("settings.json", "utf8");
export const settings = JSON.parse(removeComments(rawData));
// PORT
const webSocketPort = settings.port;
const webServerPort = settings.webPort;
// TOKEN
export var token;
// handles the token setting
if (settings.token > 0 && isWhole(settings.token)) {
    //generates a random Token 
    token = randomstring.generate({ length: settings.token, readable: true, charset: settings.tokenCharset });
}
else if (settings.token == 0) {
    // reads the token.txt
    try {
        var t = readFileSync("token.txt", "utf8");
        // formats the token.txt
        token = formatText(t);
    }
    catch (err) {
        // generates a random token cause token.txt wasnt found
        token = randomstring.generate({ length: 20, readable: true, charset: settings.tokenCharset });
        log("Token.txt not found, generated token");
        // writes the random token to token.txt
        writeFileSync("token.txt", token);
    }
}
else {
    throw error("invalid token setting");
}
// writes out the token if the setting is enabled
if (settings.writeToken) {
    log("TOKEN", ["The token is: " + token]);
}
// Initializes the "database"
export var tables = new Map();
// Initialize websocket server
export const wss = new webSocket.WebSocketServer({ port: webSocketPort });
wss.on("connection", connection);
// varaibles for webserver
export var app = null;
export var redirects = null;
if (settings.webServer) {
    // Initializes the web server
    app = express.default();
    redirects = new Map();
    app.get("*", get);
    app.listen(webServerPort, started);
    // Initializes redirects
    settings.pages.forEach(page => {
        page.redirects.forEach(redirect => {
            redirects.set(redirect, { cache: page.cache, fileLocation: page.path, contentType: page.contentType });
        });
    });
}
// File saving
if (settings.saveTablesToFile) {
    // if the server closes or anything happens writes the tables to a file
    wss.on("error", writeTables);
    wss.on("close", writeTables);
    process.on("SIGHUP", writeTables);
    ON_DEATH(writeTables);
}
else {
    log("!! SAVING FILES IS TURNED OFF !!");
}
//# sourceMappingURL=index.js.map