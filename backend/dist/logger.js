"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLogger = exports.logger = void 0;
const tslog_1 = require("tslog");
const fs = require("fs");
const rotating_file_stream_1 = require("rotating-file-stream");
exports.logger = new tslog_1.Logger();
function initLogger(config) {
    const logDirectory = config.logs;
    // Ensure log directory exists
    try {
        if (!fs.existsSync(logDirectory)) {
            fs.mkdirSync(logDirectory);
        }
    }
    catch (error) {
    }
    const stream = (0, rotating_file_stream_1.createStream)(`${logDirectory}/logs.txt`, {
        size: "10M", // rotate every 10 MegaBytes written
        interval: "1d", // rotate daily
        compress: "gzip", // compress rotated files
    });
    exports.logger.attachTransport((logObj) => {
        try {
            stream.write(JSON.stringify(logObj) + "\n");
        }
        catch (error) {
        }
    });
}
exports.initLogger = initLogger;
