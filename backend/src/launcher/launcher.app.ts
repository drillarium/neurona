import { AppDataBase } from "../db";
import { logger } from "../logger" 
import { LauncherController } from "./launcher.controller";
import { Observable, Subject } from "rxjs";

const db = AppDataBase.getInstance();

// Launcher app
export class LauncherApp {
    // singleton
    private static instance: LauncherApp;
    // list of launchers
    private launchers: Map<number, LauncherController> = new Map<number, LauncherController>();
    // connection subject
    private connectionSubject: Subject<any>;

    private constructor() {
        this.connectionSubject = new Subject<any>();
    }

    public static getInstance(): LauncherApp {
        if (!LauncherApp.instance) {
            LauncherApp.instance = new LauncherApp();
        }
        return LauncherApp.instance;
    }

    // init
    public init(appUID: string, sessionUID: string) {
        logger.info(`Launcher app init`);
        
        db.loadLaunchers().then((launchers) => {
            launchers.forEach(launcher => {
                logger.info(`Launcher ${launcher.address} created`);
                const l = new LauncherController;    
                this.launchers.set(launcher.id, l);
                l.init(launcher.id, appUID, sessionUID, launcher.address);
            });            
        });
    }

    // deinit
    public deinit() {
        this.launchers.forEach(launcher => {
            launcher.deinit();
        });
        logger.info(`Launcher app deinit`);
    }

    // status
    public status(launcherID: number) {
        if(!this.launchers.has(launcherID)) {        
            throw Error(`Launcher ${launcherID} not found`);
        }
        return this.launchers.get(launcherID)?.getStatus();
    }

    public name(launcherID: number) {
        if(!this.launchers.has(launcherID)) {        
            throw Error("");
        }
        const status = this.launchers.get(launcherID)?.getStatus();
        if(status?.connected) {
            return status.config.name;
        }
        else {
            return status?.address;
        }
    }

    public idByName(name: string) {
        for (let [key, value] of this.launchers) {
            const status = value.getStatus();
            if(status.connected) {
                if(status.config.name == name) {
                    return value.uid;
                }
            }
            else {
                if(status.address == name) {
                    return value.uid;
                }
            }
        }
        return -1;
    }

    // running launchers
    public launchersStatus() {
        var ret: any[] = [];

        this.launchers.forEach((launcher) => {
            const status = launcher.getStatus();
            ret.push(status);          
        });

        return ret;
    }

    public launcher(launcherId: number) {
        return this.launchers.get(launcherId);
    }
    
    // build schema like this with all available inputs schemas
    // const schema = { "BlackMagic (SDI)" : {schema: {title: "", description: "", type: "object", required: [], properties: {id: {type: "number", title: "Id", default: -1, readOnly: true}, name: {type: "string", title: "Name", default: "Input name"}, type: {type: "string", title: "Type", default: "BlackMagic (SDI)", readOnly: true}}}},
    //                  "NDI" : {schema: {title: "", description: "", type: "object", required: [], properties: {id: {type: "number", title: "Id", default: -1, readOnly: true}, name: {type: "string", title: "Name", default: "Input name"}, type: {type: "string", title: "Type", default: "NDI", readOnly: true}}}}
    //                };
    public getSchemas(launcherID: number, moduleType: string) {
        const status = this.status(launcherID);
        if(status == undefined) {
            throw Error(""); 
        }

        // mergeSchemas contains all schemas for input
        const filteredSchemas = status.availableSchemas.filter(schema => schema.app.indexOf(moduleType) >= 0);
        return filteredSchemas?.reduce((acc, obj) => {
          return { ...acc, ...obj.schema };
        }, {});
    }

    // build json object like this, with all the configurations
    // const engines = [ {id: 1, name: "Input#1", type:"BlackMagic (SDI)"}, {id: 2, name: "Input#2", type:"NDI"} ];
    async getEngines(launcherID: number, moduleType: string) {
        const launcher = this.launcher(launcherID);
        if(!launcher) {
            throw Error("");
        }

        const apps = await launcher.getApps();

        var avaialbleApps: any [] = [];
        for (const key of Object.keys(apps)) {
            if(key.indexOf(moduleType) >= 0) {                
                avaialbleApps = [...avaialbleApps, ...apps[key]];
            }
        }

        return avaialbleApps;
    }

    public getAppModuleAppType(launcherID: number, moduleType: string, app: string) {
        // launcher
        const status = this.status(launcherID);
        if(status == undefined) {
            throw Error("Launcher status not found"); 
        }

        const filteredSchema = status.availableSchemas.find(schema => schema.app.indexOf(moduleType) >= 0 && schema.schema[app]);
        if(!filteredSchema) {
            throw Error("App not found");
        }

        return filteredSchema?.app;
    }

    // Subscribe to connection state change
    public subscribeToConnection(): Observable<any> {
        return this.connectionSubject.asObservable();
    }

    // notify
    public notifyConnectionChange(status: any) : void {
        this.connectionSubject.next(status);
    }
}