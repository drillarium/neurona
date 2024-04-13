import * as fs from 'fs';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

export interface AppConfig {
  port: number;
  uid: string;
  name: string;
  interface: string;
  apps: string;
  logs: string;
}

const defaultConfig: AppConfig = {
    port: 0,
    uid: uuidv4(),
    name: os.hostname(),
    interface: "0.0.0.0",
    apps: "./apps",
    logs: "./logs"
};

export function readConfig(): AppConfig {
  if(!fs.existsSync('config.json')) {
    fs.writeFileSync('config.json', JSON.stringify(defaultConfig, null, 2));
  }
 
  const configData = fs.readFileSync('config.json', 'utf8');
  const config: AppConfig = JSON.parse(configData);
  return config;
}