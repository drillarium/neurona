import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from '../config';
import { logger } from '../logger';
import { spawn, ChildProcess } from 'child_process';

interface AppInfo {
  type: string;         // "ffmpeg-input"
  id: number;
  name: string;
  appid: string;        // client app that creates the app
  appuid: string;       // client app uid
  appsession: string;   // client app session
  running: boolean;
}

interface AppRunningInfo {    
  appInfo: AppInfo;
  autostart: boolean;  
  program: string;
  args: string[];
  config: any | null; // Json config
  status: any | null; // last status received
  process: ChildProcess | null;
  kill: boolean;
}

const START_TOKEN = "+++++";
const END_TOKEN = "-----";

// AppCpntroller
export class AppController {
  private static instance: AppController;
  private appDirectory: string = "";
  private apps_: Map<string, AppRunningInfo> = new Map<string, AppRunningInfo>();

  private constructor() {
  }

  // init
  public init(config: AppConfig) : boolean {
    this.appDirectory = config.apps;

    // Ensure log directory exists
    try {
      if(!fs.existsSync(this.appDirectory)) {
        fs.mkdirSync(this.appDirectory);
      }
    }
    catch(error: any) {

    }

    // load configuration files
    this.loadApps();

    // run autostart ones
    this.autostart();

    return true;
  }

  // deinit
  public deinit() {
    // kill running
    this.apps_.forEach(app => {
      if(app.appInfo.running) {
        app.kill = true;
        app.process?.kill();
      }
    });

    // clear app map
    this.apps_ = new Map<string, AppRunningInfo>();
  }

  // singleton insance
  public static getInstance(): AppController {
    if(!AppController.instance) {
      AppController.instance = new AppController();
    }
    return AppController.instance;
  }

  // available apps
  public availablaApps() : string [] {
    try {
      // Read the contents of the directory
      const subfolders = fs.readdirSync(this.appDirectory);
  
      // Filter out only the directories
      return subfolders.filter((subfolder) => {
        const subfolderPath = path.join(this.appDirectory, subfolder);
        return fs.statSync(subfolderPath).isDirectory();
      });
    }
    catch(error) {
      logger.error('Error reading subfolders:', error);
      return [];
    }
  }

  // apps
  public get apps() : any {
    var appInfos: any = {};

    for(const value of this.apps_.values()) {
      const keyToCheck = value.appInfo.type;
      if(keyToCheck in appInfos) {
        appInfos[keyToCheck].push(value.config);
      }
      else {
        appInfos[keyToCheck] = [];
      }
    }

    return appInfos;
  }

  // first app load
  protected loadApps() {
    // clear app map
    this.apps_ = new Map<string, AppRunningInfo>();

    // Read the contents of the directory
    try {
      const subfolders = fs.readdirSync(this.appDirectory, { withFileTypes: true });

      // Iterate through each subfolder
      for(const subfolder of subfolders) {
        if(subfolder.isDirectory()) {
          const subfolderPath = path.join(this.appDirectory, subfolder.name);
          const files = fs.readdirSync(subfolderPath);

          // Iterate through each file in the subfolder
          for(const file of files) {
            if(file.endsWith('.json')) {           

              this.registerApp(subfolderPath, file, subfolder.name);                          
            }
          }
        }
      }
    }
    catch(error: any) {
      logger.error(`Error reading folder: ${error.message}`);
    }
  }

  protected registerApp(subfolderPath: string, file: string, appType: string) {
    const filePath = path.join(subfolderPath, file);

    try {
      // Read JSON file and extract name and uid
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const { name, id, appid, appuid, appsession, autostart } = jsonData;

      const program = `${subfolderPath}\\${appType}.exe`;
      const args = ["-c", file];
      const appRunningInfo: AppRunningInfo = {
          appInfo: {
              type: appType,
              name: name,
              id: id,
              appid: appid,
              appuid: appuid,
              appsession: appsession,
              running: false                                      
          },
          autostart: autostart,                    
          program: program,
          args: args,   
          config: jsonData, 
          status: null,
          process: null,
          kill: false     
      };

      // Create FolderInfo object and push to array       
      const uid = this.appUID(appRunningInfo);
      this.apps_.set(uid, appRunningInfo);

      logger.info(`Application configuration found '${program} ${args.join(' ')}' config: ${JSON.stringify(jsonData)}`);
    }
    catch(error: any) {
      logger.error(`Error parsing JSON file ${filePath}: ${error.message}`);
    }
  }

  // check autostart flag
  protected autostart() {
    this.apps_.forEach(app => {
      if(app.autostart) {
        this.startApp(app);
      }
    });
  }

  protected appUID(app: AppRunningInfo) {
    return `${app.appInfo.type}####${app.appInfo.id}`;
  }

  // start app
  protected startApp(app: AppRunningInfo) : boolean {
    const uid = this.appUID(app);
    if(this.isRunning(uid)) {
        logger.info(`App ${uid} already running`);
        return false;
    }

    // process
    app.process = spawn(app.program, app.args);
    app.process.on('spawn', () => {
        logger.info(`App ${uid} is running`);
        this.setIsRunning(uid, true);       
    });
    app.process.stdout!.on('data', (data) => {      
      var message = data.toString();
      while(1) {
        var startTokenIndex = message.indexOf(START_TOKEN);
        var endTokenIndex = message.indexOf(END_TOKEN);
        if( (startTokenIndex < 0) || (endTokenIndex < 0) || (endTokenIndex < startTokenIndex) ) {
          break;
        }

        const submessage = message.substring(startTokenIndex + START_TOKEN.length, endTokenIndex);
        message = message.substring(endTokenIndex + END_TOKEN.length);
      
        try { 
          const jmessage = JSON.parse(submessage);
          
          if(jmessage.type == "log") {
            if(jmessage.severity == "error") {
              logger.error(`App ${uid} message: ${jmessage.message}`);  
            }
            else if(jmessage.severity == "warning") {
              logger.warn(`App ${uid} message: ${jmessage.message}`);
            }
            else if(jmessage.severity == "info") {
              logger.info(`App ${uid} message: ${jmessage.message}`);
            }
          }
        }
        catch (error) {
            logger.info(`Error parsing ${submessage}`);
        }
      }
    });
    app.process.stderr!.on('data', (data) => {

    });
    app.process.on('exit', (code: number, signal) => {
      logger.info(`App ${uid} exit code: ${code} signal: ${signal}`);
    });
    app.process.on('close', (code: number, args: any[])=> {
      logger.info(`App ${uid} close code: ${code} arg: ${args}`);
      this.setIsRunning(uid, false);    
      if(this.canRestartApp(app, code)) {
        this.startApp(app);
      }
      app.kill = false;
    });
    app.process.on('error', (error: string) => {
      logger.info(`App ${uid} error: ${error}`);
    });

    return true;
  }

  // change is running flag
  protected setIsRunning(uid: string, value: boolean) {
    var rapp = this.apps_.get(uid);
    if(rapp) {
      rapp.appInfo.running = value;
      if(!value) {
        rapp.status = null;
      }
      this.apps_.set(uid, rapp);
    }
  }

  // isRunning
  public isRunning(uid: string) : boolean {
    var rapp = this.apps_.get(uid);
    if(rapp) {
      return rapp.appInfo.running;
    }
    return false;
  }

  // case crash or exit, cheks if app can be restarted
  protected canRestartApp(app: AppRunningInfo, code: number) : boolean {
    // 0: normal exit, 1: Kill using task manager
    if(app.kill || ( (code != 0) && (code != 1) ) ) {
        return false;
    }
    return true;
  }

  // status
  public status(appuid: string) {
    var result: any | null = null;
    var error: string = "";

    var app = this.apps_.get(appuid);
    if(app) {      
      var status = {
        running: app.appInfo.running,
        status: app.status
      };
      result = status;
    }
    else {
      error = `App ${appuid} not found`;
      logger.error(error);
    }

    return { result: result, error: error };
  }

  // configuration
  public configuration(appuid: string) {
    var result: any | null = null;
    var error: string = "";

    var app = this.apps_.get(appuid);
    if(app) {      
      result = app.config;
    }
    else {
      error = `App ${appuid} not found`;
      logger.error(error);
    }

    return { result: result, error: error };
  }

  // schema
  public schema(appid: string) {
    return new Promise((resolve, reject) => {
      const program = path.join(this.appDirectory, appid, `${appid}.exe`);
      var args: any = ["-s"];
      var schema: string = "";
      logger.info(`Schema for ${program} ${args.join(" ")}`);
  
      // spawn
      const process = spawn(program, args);
      process.stdout.on('data', (data) => {      
          schema += data.toString();
      });
      process.on('close', (code: number, args: any[])=> {
        if(code == 0) {
          resolve(this.parseSchema(appid, schema));
        }
        else {
          resolve({result: null, error: `Schema error ${code} spawning process`});
        }
      });
      process.on('error', (error: string) => {
      });
    });
  }

  // parse schema
  protected parseSchema(appid: string, schema: string) {
    if(schema.length > 0) {
      try {
          logger.info(`App ${appid} schema is ${schema}`);
          return { result: JSON.parse(schema), error: ""};
      }
      catch(error) {
          logger.error(`App ${appid} schema JSON parser error ${error}`);
          return { result: null, error: `App ${appid} schema JSON parser error ${error}`};
      }
    }
    return { result: null, error: `App ${appid} schema is empty`};
  }

  // update configuration
  public updateConfiguration(appid: string, newConfig: any) {
    const appuid = `${appid}####${newConfig.id}`;
    var result: boolean = false;
    var error: string = "";

    var app = this.apps_.get(appuid);
    if(app) {
      const configFile = path.join(this.appDirectory, appid, `${app.appInfo.id}.json`);
      try {
        fs.writeFileSync(configFile, JSON.stringify(newConfig, null, 2));
        logger.info(`Configuration file ${configFile} saved. ${JSON.stringify(newConfig)}`);
        result = true;
      }
      catch(_error: any) {
        logger.error(`Configuration file ${configFile} cannot be saved. ${_error.message}`);
        error = _error.message;
      }
    }
    else {
      error = `App ${appuid} not found`;
      logger.error(error);
    }

    return { result: result, error: error };
  }

  // delete app
  public deleteApplication(appid: string, _appuid: string) {
    var result: boolean = false;
    var error: string = "";
    const appuid = `${appid}####${_appuid}`;

    var app = this.apps_.get(appuid);
    if(app) {      
      // stop application case running
      if(app.appInfo.running) {
        app.kill = true;
        app.process?.kill();
      }

      // remove from internal map
      this.apps_.delete(appuid);

      // remove config file
      const configFile = path.join(this.appDirectory, app.appInfo.type, `${app.appInfo.id}.json`);
      try {
        fs.unlinkSync(configFile);
        logger.info(`Configuration file ${configFile} removed`);
        result = true;
      }
      catch(_error: any) {
        logger.error(`Configuration file ${configFile} cannot be removed. ${_error.message}`);
        error = _error.message;
      }
    }
    else {
      error = `App ${appuid} not found`;
      logger.error(error);
    }

    return { result: result, error: error }; 
  }

  // create configuration
  public createConfiguration(appid: string, newConfig: any) {
    const appuid = `${appid}####${newConfig.id}`;
    const configFileName = `${newConfig.id}.json`;
    var result: boolean = false;
    var error: string = "";

    var app = this.apps_.get(appuid);
    if(!app) {      
      const configFile = path.join(this.appDirectory, appid, configFileName);
      try {
        fs.writeFileSync(configFile, JSON.stringify(newConfig, null, 2));
        logger.info(`Configuration file ${configFile} saved. ${JSON.stringify(newConfig)}`);        

        // register app
        this.registerApp(this.appDirectory, configFileName, appid);

        // case autostart, run it
        var app = this.apps_.get(appuid);
        if(app && app.autostart) {   
          this.startApp(app);
        }

        result = true;
      }
      catch(_error: any) {
        logger.error(`Configuration file ${configFile} cannot be saved. ${_error.message}`);
        error = _error.message;
      }
    }
    else {
      error = `App ${appuid} alrady created`;
      logger.error(error);
    }

    return { result: result, error: error };
  }

  // run command configuration
  public runCommand(appuid: string, command: string, params: any) {
    var result: boolean = false;
    var error: string = "";

    logger.info(`App ${appuid} command: ${command} params: ${JSON.stringify(params)}`);

    var app = this.apps_.get(appuid);
    if(app) {
      if(command == "start") {
        if(!app.appInfo.running) {
          this.startApp(app);
          result = true;          
        }
        else {
          error = `App ${appuid} already running`;
          logger.error(error);
        }
      }
      else if(command == "stop") {
        if(app.appInfo.running) {
          app.kill = true;
          app.process?.kill();
          result = true;          
        }
        else {
          error = `App ${appuid} already stopped`;
          logger.error(error);
        }
      }
      else {
        if(!app.appInfo.running) {
          error = `App ${appuid} not running. Command cannot run`;
          logger.error(error);
        }
        else {
          const cmd = { command: command, params: params };
          app.process?.stdin?.write(Buffer.from(JSON.stringify(cmd)).toString('base64'));
          app.process?.stdin?.write("\n");
          result = true;
        }
      }
    }
    else {
      error = `App ${appuid} not found`;
      logger.error(error);
    }

    return { result: result, error: error };
  }  
}