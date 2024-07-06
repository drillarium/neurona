import * as express from 'express';         // express
import { AppConfig, readConfig } from './config';
import { Version, getCurrentVersion } from './version';
import { AddressInfo } from 'net';
import { initLogger, logger } from './logger';
import * as cors from "cors";                     // cors (cross origin)
import { userRouter } from './users/user.router';
import { AppDataBase } from './db';
import path = require('path');
import { multiviewerRouter } from './multiviewer/multiviewer.router';
import { MultiviewerApp } from './multiviewer/multiviewer.app';
import { LauncherApp } from './launcher/launcher.app';
import { launcherRouter } from './launcher/launcher.router';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketService } from './services/ws.service';

// config
const config: AppConfig = readConfig();
// current version
const version: Version = getCurrentVersion();
// DB
const db = AppDataBase.getInstance();
// Apps
const multiviewerApp = MultiviewerApp.getInstance();
const launcherApps = LauncherApp.getInstance();

// logger
initLogger(config);

// App started
logger.info(`App started version: ${version.version} config: ${JSON.stringify(config)}`);

// express
const app = express();

// vars
const PORT = config.port;
const INTERFACE = config.interface;
const PUBLIC_FOLDER = config.publicFolder;
const DB = config.db;
const UID = config.uid;
const session = uuidv4();

logger.info(`Session UID: ${session}`);

// parse incoming requests with JSON payload
app.use(express.json());

// enable all CORS requests
app.use(cors());

// router
app.get('/api/v1', (req, res) => { res.json(config); });
app.use("/api/v1/users", userRouter);
app.use("/api/v1/multiviewer", multiviewerRouter);
app.use("/api/v1/launchers", launcherRouter);

// Serve static files from the public folder
app.use(express.static(PUBLIC_FOLDER));

// Route for serving the Flutter app
app.get('/', (_req, res) => {
  res.sendFile(path.join(PUBLIC_FOLDER, 'index.html'));
});

// server
const server = app.listen(PORT, INTERFACE, async () => {
  const { address, port } = server.address() as AddressInfo;
  logger.info(`Server is running on ${address}:${port}`);

  try {
    // init db sync (default users and launchers must be created)
    await db.init(DB);

    // apps
    launcherApps.init(UID, session);

    // wait available scenes loaded from db
    await multiviewerApp.init();

    // create websocket
    const wss : WebSocketService = WebSocketService.getInstance();
    wss.init({server});

  } catch (error) {
    logger.error('Error init app:', error);
  }
});

function tearDown(signal: string, errorCode: number = 0) {
  logger.info(`Application ending -- ${signal} --`);

  // Close server
  server.close();

  logger.info('Server closed.');

  // apps
  launcherApps.deinit();
  multiviewerApp.deinit();

  // Close the database connection
  db.close();

  logger.info(`Application ends`);

  // exit process
  process.exit(errorCode);
}

process.on('SIGTERM', () => { tearDown("SIGTERM") });
process.on('SIGINT', () => { tearDown("SIGINT") });
process.on('uncaughtException', (err) => {
  logger.error('Unhandled Exception:', err);
  tearDown("uncaughtException", 1);
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
  tearDown("unhandledRejection", 1);
});
