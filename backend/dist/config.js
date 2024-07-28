"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readConfig = void 0;
const fs = require("fs");
const os = require("os");
const uuid_1 = require("uuid");
const defaultConfig = {
    port: 5556,
    uid: (0, uuid_1.v4)(),
    name: os.hostname(),
    interface: "0.0.0.0",
    logs: "./logs",
    publicFolder: "./www",
    db: "backend.db"
};
function readConfig() {
    if (!fs.existsSync('config.json')) {
        fs.writeFileSync('config.json', JSON.stringify(defaultConfig, null, 2));
    }
    const configData = fs.readFileSync('config.json', 'utf8');
    const config = JSON.parse(configData);
    return config;
}
exports.readConfig = readConfig;
