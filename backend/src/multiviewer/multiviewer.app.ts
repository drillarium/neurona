import { AppDataBase } from "../db";
import { LauncherApp } from "../launcher/launcher.app";
import { logger } from "../logger" 
import { IInput, IOutput, IScene, LayoutScene } from "./scene";
import * as fs from 'fs';
import * as path from 'path';
import { broadcast } from "../services/ws.service";
import { Subscription } from "rxjs";

// multiviewer app
export class MultiviewerApp {
    private static instance: MultiviewerApp;
    private scenes: LayoutScene[] = [];
    private connectionSubscription_!: Subscription;
    private sessionUID: string = "";

    private constructor() {}

    public static getInstance(): MultiviewerApp {
        if (!MultiviewerApp.instance) {
            MultiviewerApp.instance = new MultiviewerApp();
        }
        return MultiviewerApp.instance;
    }

    // init
    public async init(sessionUID: string) {
        logger.info(`Multiviewer app init`);

        this.sessionUID = sessionUID;

        // load sencenes
        const db = AppDataBase.getInstance();
        const scenes = await db.loadScenes();
        scenes.forEach(scene => {
            const ls = new LayoutScene;
            ls.init(scene);
            this.scenes.push(ls);
            logger.info(`Scene ${scene.id} loaded`);

            try {
                this.startScene(scene); 
            }
            catch(error) {
                logger.warn(`Scene ${scene.id} cannot be started. ${error}`);
            }
        });        

        // detect launcher running / not running
        const connectionObserver = LauncherApp.getInstance().subscribeToConnection();
        this.connectionSubscription_ = connectionObserver.subscribe((status: any) => {
            const launcherUID: number = status.launcher_uid;
            const connected: boolean = status.connected;
            
            // run scenes case connected or stop them case not running
            this.scenes.forEach(scene => {
                if(scene.launcherId == launcherUID) {
                    if(connected) {
                        this.startScene(scene.scene);

                        logger.info(`Multiviewer app detects launcher ${launcherUID} running. ${scene.id} start running`);                        
                    }
                    else {
                        // TODO

                        logger.info(`Multiviewer app detects launcher ${launcherUID} not running. ${scene.id} stop running`);                        
                    }
                }        
            });                  
        });        
    }

    // deinit
    public deinit() {
        // unload
        if(this.connectionSubscription_) {
            this.connectionSubscription_.unsubscribe();
        }
    }

    // JSON schema for GUI
    public getSchema() : any {
        // all launchers
        const launchers = LauncherApp.getInstance().launchersStatus();

        // sechema
        const filePath = path.join(__dirname, 'multiviewer.schema.json');
        var JSONSchema: any = {};
        try {
            const fileContents = fs.readFileSync(filePath, 'utf-8');
            JSONSchema= JSON.parse(fileContents);

            // fill with available launchers
            JSONSchema.properties.launcher.enum = [];
            launchers.forEach((launcher) => {
                const name = LauncherApp.getInstance().name(launcher.uid);            
                JSONSchema.properties.launcher.enum.push(name);
                if(JSONSchema.properties.launcher.default === "") {
                    JSONSchema.properties.launcher.default = name;
                }
            });

            // update launchers
        } catch (error) {
            logger.error('Error reading or parsing the JSON file:', error);
        }
        
        return JSONSchema;
    }

    // get scenes
    public getScenes() : IScene[] {
        var scenes: IScene[] = [];
        this.scenes.forEach(scene => {
            scenes.push(scene.scene);
        });
        return scenes;
    }

    // get scenes
    public async getScenesGUI() : Promise<IScene[]> {
        var resolvedScenes: any[] = [];
        for(var i = 0; i < this.scenes.length; i++) {
            var sceneGUI: any = { ... this.scenes[i].scene };

            if("launcherId" in sceneGUI && "userId" in sceneGUI) {

                // replace launcherId by launcher
                var launcherName = "???";
                try { launcherName = LauncherApp.getInstance().name(sceneGUI.launcherId); }
                catch(error) { }
                sceneGUI.launcher = launcherName;
                delete sceneGUI.launcherId;

                // replace userId by user
                var username = "???";
                try { username  = (await AppDataBase.getInstance().getUserById(sceneGUI.userId)).username; }
                catch(error) { }
                sceneGUI.user = username;
                delete sceneGUI.userId;
            }
            
            resolvedScenes.push(sceneGUI);            
        }

        return resolvedScenes;
    }

    // get scene
    public getScene(id: number) : IScene | null {
        const index = this.scenes.findIndex(scene => scene.id === id);
        if(index >= 0) {
            return this.scenes[index].scene;
        }
        else {
            return null;
        }
    }

    // get scene
    public async getSceneGUI(id: number) : Promise<any | null> {
        const index = this.scenes.findIndex(scene => scene.id === id);
        if(index >= 0) {
            var sceneGUI: any = { ... this.scenes[index].scene };
            if("launcherId" in sceneGUI && "userId" in sceneGUI) {

                // replace launcherId by launcher
                var launcherName = "???";
                try { launcherName = LauncherApp.getInstance().name(sceneGUI.launcherId); }
                catch(error) {}
                sceneGUI.launcher = launcherName;
                delete sceneGUI.launcherId;

                // replace userId by user
                const user = await AppDataBase.getInstance().getUserById(sceneGUI.userId);
                sceneGUI.user = user.username;
                delete sceneGUI.userId;
            }

            return sceneGUI;
        }
        else {
            return null;
        }
    }

    // add scene
    public async addScene(scene: IScene) : Promise<IScene> {
        try {
            // save scene
            const db = AppDataBase.getInstance();
            scene.id = await db.saveScene(scene);

            // create
            const sceneLayout = new LayoutScene;
            sceneLayout.init(scene);
            this.scenes.push(sceneLayout);
            logger.info(`Scene ${scene.id} loaded`);

            // start process if launcher is running
            try {
                this.startScene(scene); 
            }
            catch(error) {
                logger.warn(`Scene ${scene.id} cannot be started. ${error}`);
            }

            // notify
            const message = { message: "scene_list_change", action: "scene_added", uid: scene.id };
            broadcast(message);
        }
        catch(error) {
            throw error;
        }

        return scene;
    }

    protected startScene(scene : IScene) {
        const launcherController = LauncherApp.getInstance().launcher(scene.launcherId);
        if(!launcherController) {
            throw Error(`Launcher ${scene.launcherId} not found`);
        }
        if(launcherController.connected) {
            // MIXER
            try {
                const config = {
                    title: "",
                    name: "",
                    id: scene.id,
                    autostart: true, // create app and start it
                    scene: scene
                };

                launcherController.addApp("sdl-mixer", config, this.sessionUID);
            }
            catch(error) {
                throw error;
            }

            // OUTPUTS
        }
        else {
            throw Error(`Launcher ${scene.launcherId} not running`);
        }
    }

    // add scene
    public async addSceneGUI(scene: any) : Promise<any> {
        // convert to IScene
        const launcherName = scene.launcher;
        const userName = scene.user;
        delete scene.launcher;
        delete scene.user;
        var sceneResolved : IScene = { ... scene };   
        const launcher = LauncherApp.getInstance().idByName(launcherName);     
        sceneResolved.launcherId = launcher;
        const user = await AppDataBase.getInstance().getUserByName(userName);
        sceneResolved.userId = user.id;

        // convert to sceneGUI
        var ret: any = { ... await this.addScene(sceneResolved) };
        delete ret.launcherId;
        delete ret.userID;
        ret.launcher = launcherName;
        ret.user = userName;

        return ret;
    }

    // remove scene
    public async removeScene(id: number) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.id === id);
        if(index >= 0) {
            // stop scene
            this.scenes[index].deinit();

            // remove from db
            const db = AppDataBase.getInstance();
            await db.deleteScene(this.scenes[index].id);
            const sceneID = this.scenes[index].id;
            const launcherId = this.scenes[index].launcherId;

            // remove
            this.scenes.splice(index, 1);

            // stop process
            const launcherController = LauncherApp.getInstance().launcher(launcherId);
            if(!launcherController) {
                throw Error("Launcher not found");
            }
            if(launcherController.connected) {
                try {        
                    launcherController.deleteApp("sdl-mixer", sceneID);
                }
                catch(error) {
                    throw error;
                }
            }            

            logger.info(`Scene ${id} removed`);

            // notify
            const message = { message: "scene_list_change", action: "scene_removed", uid: id };
            broadcast(message);
        } else {
            throw Error(`Scene ${id} not found`);
        }
    }

    // update scene
    public async updateScene(scene: IScene) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.id === scene.id);
        if(index >= 0) {
            // stop scene
            this.scenes[index].deinit();

            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(scene);

            // update
            this.scenes[index].init(scene);

            // update scene
            const launcherController = LauncherApp.getInstance().launcher(this.scenes[index].launcherId);
            if(!launcherController) {
                throw Error("Launcher not found");
            }
            if(launcherController.connected) {
                try {            
                    launcherController.runAppCommand(this.scenes[index].id.toString(), "play_scene", this.scenes[index].scene);
                }
                catch(error) {
                    throw error;
                }
            }

            logger.info(`Scene ${scene.id} updated`);

            // notify
            const message = { message: "scene_list_change", action: "scene_updated", uid: scene.id };
            broadcast(message);
        } else {
            throw Error(`Scene ${scene.id} not found`);
        }
    }

    // update scene GUI
    public async updateSceneGUI(scene: any) : Promise<void> {
    const index = this.scenes.findIndex(scene => scene.id === scene.id);
        if(index >= 0) {
            // convert to IScene
            const launcherName = scene.launcher;
            const userName = scene.user;
            delete scene.launcher;
            delete scene.user;
            var sceneResolved : IScene = { ... scene };   
            const launcher = LauncherApp.getInstance().idByName(launcherName);     
            sceneResolved.launcherId = launcher;
            const user = await AppDataBase.getInstance().getUserByName(userName);
            sceneResolved.userId = user.id;

            // update scene
            return this.updateScene(sceneResolved);
        }
    }

    // scene inputs
    public async addInput(id: number, input: IInput) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.id === id);
        if(index >= 0) {
            this.scenes[index].addInput(input);
        
            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(this.scenes[index].scene);

            // notify
            const message = { message: "scene_list_change", action: "scene_input_added", uid: id, input_index: this.scenes[index].numInputs() - 1 };
            broadcast(message);

            logger.info(`Scene ${id} updated. Input ${input.id} added`);
        } else {
            throw Error(`Scene ${id} not found`);
        }
    }

    public async updateInput(id: number, inputIndex: number, input: IInput) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.id === id);
        if(index >= 0) {
            this.scenes[index].updateInput(inputIndex, input);
            
            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(this.scenes[index].scene);

            // notify
            const message = { message: "scene_list_change", action: "scene_input_updated", uid: id, input_index: inputIndex };
            broadcast(message);

            logger.info(`Scene ${id} updated. Input ${input.id} updated`);
        } else {
            throw Error(`Scene ${id} not found`);
        }
    }

    public async removeInput(id: number, inputIndex: number) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.id === id);
        if(index >= 0) {
            this.scenes[index].removeInput(inputIndex);
            
            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(this.scenes[index].scene);

            // notify
            const message = { message: "scene_list_change", action: "scene_input_removed", uid: id, input_index: inputIndex };
            broadcast(message);

            logger.info(`Scene ${id} updated. Input ${inputIndex} removed`);
        } else {
            throw Error(`Scene ${id} not found`);
        }
    }

    // scene output
    public async addOutput(id: number, output: IOutput) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.id === id);
        if(index >= 0) {
            this.scenes[index].addOutput(output);
            
            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(this.scenes[index].scene);

            // notify
            const message = { message: "scene_list_change", action: "scene_output_added", uid: id, output_index: this.scenes[index].numOutputs() - 1 };
            broadcast(message);

            logger.info(`Scene ${id} updated. Output ${output.id} added`);
        } else {
            throw Error(`Scene ${id} not found`);
        }
    }

    public async updateOutput(id: number, outputIndex: number, output: IOutput) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.id === id);
        if(index >= 0) {
            this.scenes[index].updateOutput(outputIndex, output);

            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(this.scenes[index].scene);

            // notify
            const message = { message: "scene_list_change", action: "scene_output_updated", uid: id, input_index: outputIndex };
            broadcast(message);

            logger.info(`Scene ${id} updated. Output ${outputIndex} updated`);
        } else {
            throw Error(`Scene ${id} not found`);
        }
    }

    public async removeOutput(id: number, outputIndex: number) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.id === id);
        if(index >= 0) {
        this.scenes[index].removeOutput(outputIndex);

            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(this.scenes[index].scene);

            // notify
            const message = { message: "scene_list_change", action: "scene_input_removed", uid: id, input_index: outputIndex };
            broadcast(message);

            logger.info(`Scene ${id} updated. Output ${outputIndex} removed`);
        } else {
            throw Error(`Scene ${id} not found`);
        }
    }
}