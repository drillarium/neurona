import { AppDataBase } from "../db";
import { logger } from "../logger" 
import { IComponent, IDestination, ILayout, LayoutScene } from "./layout.scene";

// multiviewer app
export class MultiviewerApp {
    private static instance: MultiviewerApp;
    private scenes: LayoutScene[] = [];

    private constructor() {}

    public static getInstance(): MultiviewerApp {
        if (!MultiviewerApp.instance) {
            MultiviewerApp.instance = new MultiviewerApp();
        }
        return MultiviewerApp.instance;
    }

    // init
    public async init() {
        // load sencenes
        const db = AppDataBase.getInstance();
        const scenes = await db.loadScenes();
        scenes.forEach(scene => {
            const ls = new LayoutScene;
            ls.init(scene);
            this.scenes.push(ls);
            logger.info(`Scene ${scene.uid} loaded`);
        });

        // run scenes
    }

    // deinit
    public deinit() {
        // unload
    }

    // get scenes
    public getScenes() : ILayout[] {
        var layouts: ILayout[] = [];
        this.scenes.forEach(scene => {
            layouts.push(scene.layout);
        });
        return layouts;
    }

    // get scene
    public getScene(sceneUID: string) : ILayout | null {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            return this.scenes[index].layout;
        }
        else {
            return null;
        }
    }

    // add scene
    public async addScene(layout: ILayout) : Promise<void> {
        try {
            // save scene
            const db = AppDataBase.getInstance();
            layout.id = await db.saveScene(layout);

            // create
            const scene = new LayoutScene;
            scene.init(layout);
            this.scenes.push(scene);
            logger.info(`Scene ${scene.uid} loaded`);

            // run scene
        }
        catch(error) {
            throw error;
        }
    }

    // remove scene
    public async removeScene(sceneUID: string) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            // stop scene
            this.scenes[index].deinit();

            // remove from db
            const db = AppDataBase.getInstance();
            await db.deleteScene(this.scenes[index].id);

            // remove
            this.scenes.splice(index, 1);

            logger.info(`Scene ${sceneUID} removed`);
        } else {
            throw Error(`Scene ${sceneUID} not found`);
        }
    }

    // update scene
    public async updateScene(layout: ILayout) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.uid === layout.uid);
        if(index >= 0) {
            // stop scene
            this.scenes[index].deinit();

            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(layout);

            // remove
            this.scenes[index].init(layout);

            logger.info(`Scene ${layout.uid} updated`);
        } else {
            throw Error(`Scene ${layout.uid} not found`);
        }
    }

    // modify scene components
    public async addComponent(sceneUID: string, component: IComponent) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            this.scenes[index].addComponent(component);
        
            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(this.scenes[index].layout);

            logger.info(`Scene ${sceneUID} updated`);
        } else {
            throw Error(`Scene ${sceneUID} not found`);
        }
    }

    public async updateComponent(sceneUID: string, component: IComponent) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            this.scenes[index].updateComponent(component);
            
            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(this.scenes[index].layout);

            logger.info(`Scene ${sceneUID} updated`);
        } else {
            throw Error(`Scene ${sceneUID} not found`);
        }
    }

    public async removeComponent(sceneUID: string, componentUID: string) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            this.scenes[index].removeComponent(componentUID);
            
            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(this.scenes[index].layout);

            logger.info(`Scene ${sceneUID} updated`);
        } else {
            throw Error(`Scene ${sceneUID} not found`);
        }
    }

    // modify scene destinations
    public async addDestination(sceneUID: string, destination: IDestination) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            this.scenes[index].addDestination(destination);
            
            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(this.scenes[index].layout);

            logger.info(`Scene ${sceneUID} updated`);
        } else {
            throw Error(`Scene ${sceneUID} not found`);
        }
    }

    public async updateDestination(sceneUID: string, destination: IDestination) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            this.scenes[index].updateDestination(destination);

            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(this.scenes[index].layout);

            logger.info(`Scene ${sceneUID} updated`);
        } else {
            throw Error(`Scene ${sceneUID} not found`);
        }
    }

    public async removeDestination(sceneUID: string, destinationUID: string) : Promise<void> {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            this.scenes[index].removeDestination(destinationUID);

            // update from db
            const db = AppDataBase.getInstance();
            await db.updateScene(this.scenes[index].layout);

            logger.info(`Scene ${sceneUID} updated`);
        } else {
            throw Error(`Scene ${sceneUID} not found`);
        }
    }
}