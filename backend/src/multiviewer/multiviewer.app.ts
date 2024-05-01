import { logger } from "../logger" 
import { IComponent, IDestination, ILayout, MultiviewerScene } from "./multiviewer.scene";

// multiviewer app
export class MultiviewerApp {
    private static instance: MultiviewerApp;
    private scenes: MultiviewerScene[] = [];

    private constructor() {}

    public static getInstance(): MultiviewerApp {
        if (!MultiviewerApp.instance) {
            MultiviewerApp.instance = new MultiviewerApp();
        }
        return MultiviewerApp.instance;
    }

    // init
    public init() {
        // load
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
    public addScene(launcherUID: string, layout: ILayout) : boolean {
        const scene = new MultiviewerScene;
        scene.init(launcherUID, layout);
        this.scenes.push(scene);
        return true;
    }

    // remove scene
    public removeScene(sceneUID: string) : boolean {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            this.scenes.splice(index, 1);
        }
        return true;
    }

    // modify scene components
    public addComponent(sceneUID: string, component: IComponent) {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            this.scenes[index].addComponent(component);
        }
    }

    public updateComponent(sceneUID: string, component: IComponent) {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            this.scenes[index].updateComponent(component);
        }
    }

    public removeComponent(sceneUID: string, componentUID: string) {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            this.scenes[index].removeComponent(componentUID);
        }
    }

    // modify scene destinations
    public addDestination(sceneUID: string, destination: IDestination) {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            this.scenes[index].addDestination(destination);
        }
    }

    public updateDestination(sceneUID: string, destination: IDestination) {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            this.scenes[index].updateDestination(destination);
        }
    }

    public removeDestination(sceneUID: string, destinationUID: string) {
        const index = this.scenes.findIndex(scene => scene.uid === sceneUID);
        if(index >= 0) {
            this.scenes[index].removeDestination(destinationUID);
        }
    }    
}