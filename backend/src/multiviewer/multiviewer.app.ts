import { logger } from "../logger" 

// multiviewer app
export class MultiviewerApp {
    private static instance: MultiviewerApp;

    private constructor() {}

    public static getInstance(): MultiviewerApp {
        if (!MultiviewerApp.instance) {
            MultiviewerApp.instance = new MultiviewerApp();
        }
        return MultiviewerApp.instance;
    }

    // init
    public init() {
    }

    // deinit
    public deinit() {

    }

}