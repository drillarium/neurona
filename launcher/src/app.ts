import * as express from 'express';         // express
import { AppConfig, readConfig } from './config';
import { Version, getCurrentVersion } from './version';
import { AddressInfo } from 'net';
import { initLogger, logger } from './logger';
import * as cors from "cors";                     // cors (cross origin)
import { appsRouter } from './app/app.router';
import { AppController } from './app/app.controller';
import { WebSocketService } from './services/ws.service';

// current version
const config: AppConfig = readConfig();
const version: Version = getCurrentVersion();
const appController = AppController.getInstance();

initLogger(config);

// App started
logger.info(`App started version: ${version.version} config: ${JSON.stringify(config)}`);

// express
const app = express();
const PORT = config.port;
const INTERFACE = config.interface;

// parse incoming requests with JSON payload
app.use(express.json());

// enable all CORS requests
app.use(cors());

// router
app.use("/api/v1/apps", appsRouter);

// server
const server = app.listen(PORT, INTERFACE, () => {
  const { address, port } = server.address() as AddressInfo;
  logger.info(`Server is running on ${address}:${port}`);

  // create websocket
  const wss : WebSocketService = WebSocketService.getInstance();
  wss.init({server});

  // init
  appController.init(config);
});

function tearDown(signal: string, errorCode: number = 0) {
  logger.info(`Application ending -- ${signal} --`);

  // Close server
  server.close();

  logger.info('Server closed.');

  // app
  appController.deinit();

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
