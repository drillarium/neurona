"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcast = exports.WebSocketService = void 0;
const ws_1 = require("ws");
const logger_1 = require("../logger");
class WebSocketService {
    // Private constructor prevents instantiation outside of this class.
    constructor() {
    }
    // Return the only instance
    static getInstance() {
        if (!WebSocketService.instance_) {
            WebSocketService.instance_ = new WebSocketService();
        }
        return WebSocketService.instance_;
    }
    init(_server) {
        // websocket
        this.wss_ = new ws_1.WebSocketServer(_server);
        this.wss_.on('connection', (ws, req) => {
            logger_1.logger.info(`WebSocket connection opened`);
            // connection close event
            ws.on('close', () => {
                logger_1.logger.info(`WebSocket connection close`);
            });
        });
    }
    send(_message) {
        if (this.wss_) {
            const messageStr = JSON.stringify(_message);
            this.wss_.clients.forEach(client => {
                client.send(messageStr);
            });
        }
    }
}
exports.WebSocketService = WebSocketService;
function broadcast(_message) {
    const wss = WebSocketService.getInstance();
    wss.send(_message);
}
exports.broadcast = broadcast;
