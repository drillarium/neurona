import { Logger } from "tslog";
import * as fs from 'fs';
import { AppConfig } from "./config";
import { createStream } from "rotating-file-stream";

export const logger = new Logger();

export function initLogger(config: AppConfig) {
  const logDirectory = config.logs;

  // Ensure log directory exists
  try {
    if(!fs.existsSync(logDirectory)) {    
      fs.mkdirSync(logDirectory);
    }
  }
  catch(error: any) {
    
  }

  const stream = createStream(`${logDirectory}/logs.txt`, {
    size: "10M",      // rotate every 10 MegaBytes written
    interval: "1d",   // rotate daily
    compress: "gzip", // compress rotated files
  });

  logger.attachTransport((logObj) => {
    try {
      stream.write(JSON.stringify(logObj) + "\n");
    }
    catch(error: any) {

    }
  });
}

