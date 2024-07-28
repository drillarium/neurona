"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express"); // express
const config_1 = require("./config");
const version_1 = require("./version");
const logger_1 = require("./logger");
const cors = require("cors"); // cors (cross origin)
const user_router_1 = require("./users/user.router");
const db_1 = require("./db");
const path = require("path");
const multiviewer_router_1 = require("./multiviewer/multiviewer.router");
const multiviewer_app_1 = require("./multiviewer/multiviewer.app");
const launcher_app_1 = require("./launcher/launcher.app");
const launcher_router_1 = require("./launcher/launcher.router");
const uuid_1 = require("uuid");
const ws_service_1 = require("./services/ws.service");
// config
const config = (0, config_1.readConfig)();
// current version
const version = (0, version_1.getCurrentVersion)();
// DB
const db = db_1.AppDataBase.getInstance();
// Apps
const multiviewerApp = multiviewer_app_1.MultiviewerApp.getInstance();
const launcherApps = launcher_app_1.LauncherApp.getInstance();
// logger
(0, logger_1.initLogger)(config);
// App started
logger_1.logger.info(`App started version: ${version.version} config: ${JSON.stringify(config)}`);
// express
const app = express();
// vars
const PORT = config.port;
const INTERFACE = config.interface;
const PUBLIC_FOLDER = config.publicFolder;
const DB = config.db;
const UID = config.uid;
const session = (0, uuid_1.v4)();
logger_1.logger.info(`Session UID: ${session}`);
// parse incoming requests with JSON payload
app.use(express.json());
// enable all CORS requests
app.use(cors());
// router
app.get('/api/v1', (req, res) => { res.json(config); });
app.use("/api/v1/users", user_router_1.userRouter);
app.use("/api/v1/multiviewer", multiviewer_router_1.multiviewerRouter);
app.use("/api/v1/launchers", launcher_router_1.launcherRouter);
// Serve static files from the public folder
app.use(express.static(PUBLIC_FOLDER));
// Route for serving the Flutter app
app.get('/', (_req, res) => {
    res.sendFile(path.join(PUBLIC_FOLDER, 'index.html'));
});
// server
const server = app.listen(PORT, INTERFACE, () => __awaiter(void 0, void 0, void 0, function* () {
    const { address, port } = server.address();
    logger_1.logger.info(`Server is running on ${address}:${port}`);
    try {
        // init db sync (default users and launchers must be created)
        yield db.init(DB);
        // apps
        launcherApps.init(UID, session);
        // wait available scenes loaded from db
        yield multiviewerApp.init();
        // create websocket
        const wss = ws_service_1.WebSocketService.getInstance();
        wss.init({ server });
    }
    catch (error) {
        logger_1.logger.error('Error init app:', error);
    }
}));
function tearDown(signal, errorCode = 0) {
    logger_1.logger.info(`Application ending -- ${signal} --`);
    // Close server
    server.close();
    logger_1.logger.info('Server closed.');
    // apps
    launcherApps.deinit();
    multiviewerApp.deinit();
    // Close the database connection
    db.close();
    logger_1.logger.info(`Application ends`);
    // exit process
    process.exit(errorCode);
}
process.on('SIGTERM', () => { tearDown("SIGTERM"); });
process.on('SIGINT', () => { tearDown("SIGINT"); });
process.on('uncaughtException', (err) => {
    logger_1.logger.error('Unhandled Exception:', err);
    tearDown("uncaughtException", 1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection:', reason);
    tearDown("unhandledRejection", 1);
});
