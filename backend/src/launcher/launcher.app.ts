import { AppDataBase } from "../db";
import { logger } from "../logger" 
import { LauncherController } from "./launcher.controller";

const db = AppDataBase.getInstance();

// multiviewer app
export class LauncherApp {
    // singleton
    private static instance: LauncherApp;
    // list of launchers
    private launchers: Map<String, LauncherController> = new Map<String, LauncherController>();

    private constructor() {}

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
                this.launchers.set(launcher.id.toString(), l);
                l.init(appUID, sessionUID, launcher.address);
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

}