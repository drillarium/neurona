import * as express from 'express';         // express
import { AppConfig, readConfig } from './config';
import { Version, getCurrentVersion } from './version';
import { AddressInfo } from 'net';
import { initLogger, logger } from './logger';
import * as cors from "cors";                     // cors (cross origin)
import { createWebsocketServer } from './wsserver';
import { userRouter } from './users/user.router';
import { AppDataBase } from './db';
import path = require('path');

// config
const config: AppConfig = readConfig();
// current version
const version: Version = getCurrentVersion();
// DB
const db = AppDataBase.getInstance();

// logger
initLogger(config);

// App started
logger.info(`App started version: ${version.version} config: ${JSON.stringify(config)}`);

// express
const app = express();
const PORT = config.port;
const INTERFACE = config.interface;
const PUBLIC_FOLDER = config.publicFolder;

// parse incoming requests with JSON payload
app.use(express.json());

// enable all CORS requests
app.use(cors());

// router
app.use("/api/v1/users", userRouter);

// Serve static files from the public folder
app.use(express.static(PUBLIC_FOLDER));

// Route for serving the Flutter app
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_FOLDER, 'index.html'));
});

// server
const server = app.listen(PORT, INTERFACE, () => {
  const { address, port } = server.address() as AddressInfo;
  logger.info(`Server is running on ${address}:${port}`);

  // create websocket
  createWebsocketServer(server);
});

function tearDown(signal: string, errorCode: number = 0) {
  logger.info(`Application ending -- ${signal} --`);

  // Close server
  server.close(async () => {
    logger.info('Server closed.');

    // Close the database connection
    db.close();

    logger.info(`Application ends`);

    // exit process
    process.exit(errorCode);
  });
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
