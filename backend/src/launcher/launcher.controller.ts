import { AppDataBase } from "../db";
import { logger } from "../logger";
import { WebSocket } from 'ws';
import { broadcast } from "../services/ws.service";
import { LauncherApp } from "./launcher.app";

// TODO: Move to a common place used by Launcher and Backend
export interface AppInfo {
    type: string;
    uid: string;
    name: string;
    appid: string;        // client app that creates the app
    appuid: string;       // client app uid
    appsession: string;   // client app session
    running: boolean;
}

export interface AppStatus {
    running: boolean;
    status: any;
}

// Launcher
export class LauncherController {
    private config_: any | null = null;
    // connected
    private connected_: boolean = false;
    // websocket client
    private wsClient_: WebSocket | null = null;
    // address
    private address_: string = "";
    // UID (DB key)
    private uid_: number = -1;
    // available apps
    private availableApps_: string[] = [];
    // schema
    private availableSchemas_: Map<string, any> = new Map<string, any>();

    // constructor
    public constructor() {
    }

    public get connected() { return this.connected_; }
    public get uid() { return this.uid_; }

    // init
    public init(launcherUID: number, appUID: string, sessionUID: string, address: string) {
        this.address_ = address;
        this.uid_ = launcherUID;
        this.connect(appUID, sessionUID);
    }

    private connect(appUID: string, sessionUID: string) {
        const wsaddress: string = this.address_.replace("http://", "ws://");

        // header information valid to create session apps
        const headers = { uid: appUID, session: sessionUID };
        this.wsClient_ = new WebSocket(wsaddress, undefined, { headers: headers });

        // open
        this.wsClient_.on('open', async () => {
            logger.info(`Launcher ${this.address_} connected`);

            try {
                // configuration
                this.config_ = await this.getCongig();
                logger.info(`Launcher ${this.address_} configuration is ${JSON.stringify(this.config_)}`);

                // available apps
                this.availableApps_ = await this.getAvailableApps();
                logger.info(`Launcher ${this.address_} available apps are ${JSON.stringify(this.availableApps_)}`);

                // schema                
                for(var i = 0; i < this.availableApps_.length; i++) {
                    this.availableSchemas_.set(this.availableApps_[i], {});
                    try {
                        const schema = await this.getAppSchema(this.availableApps_[i]);
                        this.availableSchemas_.set(this.availableApps_[i], schema);
                    }
                    catch(error) {
                    }    
                }

                // save to DB. Schemas can be used case launcher not present to configure apps
                const db = AppDataBase.getInstance();
                db.updateLauncherAppsSchema(Number(this.uid_), this.availableSchemas_);
            }
            catch(error) {
                logger.error(`Launcher ${this.address_} getConfig ${error}`);
            }

            // connected
            this.connected_ = true;

            // TODO: observers: Notify launcher running
            LauncherApp.getInstance().notifyConnectionChange({launcher_uid: this.uid_, connected: true});

            // notify
            const message = { message: "launcher_status_change", "uid": this.uid_, "connected": true, status: this.getStatus() };
            broadcast(message);
        });

        // close
        this.wsClient_.on('close', (code) => {
            if(this.connected_) {
                logger.info(`Launcher ${this.address_} disconnected ${code}`);

                // connected
                this.connected_ = false;

                // TODO: Observers, notify lauchers not running
                LauncherApp.getInstance().notifyConnectionChange({launcher_uid: this.uid_, connected: false});

                // notify
                const message = { message: "launcher_status_change", "uid": this.uid_, "connected": false, status: null };
                broadcast(message);
            }

            // reconnection
            setTimeout(() => this.connect(appUID, sessionUID), 1000);
        });

        // message
        this.wsClient_.on('message', (_msg) => {
            try {
                const msg = JSON.parse(_msg.toString());
            }            
            catch (error) {
                logger.error(`Launcher ${this.address_} parser error ${error}`);
            }
        });

        // error
        this.wsClient_.on('error', (code) => {
            if(this.connected_) {
                logger.error(`Launcher ${this.address_} error ${code}`);
            }
        }); 
    }

    // deinit
    public deinit() {
        // close websocket connection
        if(this.wsClient_) {
            this.wsClient_.close();           
        }

        logger.info(`Launcher ${this.address_} deinit`);

        // connected
        this.connected_ = false;

        // TODO: Notify launchers not running
        LauncherApp.getInstance().notifyConnectionChange({launcher_uid: this.uid_, connected: false});

        // notify
        const message = { message: "launcher_status_change", "uid": this.uid_, "connected": false, status: null };
        broadcast(message);
    }

    // getCongig
    public async getCongig() : Promise<any> {
        try {
            const uri = this.address_ + "/api/v1/config";
            const response = await fetch(uri, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            if (response.status === 200) {
                return await response.json();
            } else if (response.status === 204) {
                return [];
            } else {
                throw new Error('Unexpected status code: ' + response.status);
            }
        } catch (error) {
            logger.error('Error fetching data:', error);
            throw error;
        }
    }

    // getAvailableApps
    public async getAvailableApps() : Promise<string[]> {
        try {
            const uri = this.address_ + "/api/v1/apps";
            const response = await fetch(uri, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            if (response.status === 200) {
                return await response.json();
            } else if (response.status === 204) {
                return [];
            } else {
                throw new Error('Unexpected status code: ' + response.status);
            }
        } catch (error) {
            logger.error('Error fetching data:', error);
            throw error;
        }
    }

    // getApps
    public async getApps() : Promise<any> {
        try {
            const uri = this.address_ + "/api/v1/apps/all";
            const response = await fetch(uri, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            if (response.status === 200) {
                return await response.json();
            } else if (response.status === 204) {
                return [];
            } else {
                throw new Error('Unexpected status code: ' + response.status);
            }
        } catch (error) {
            logger.error('Error fetching data:', error);
            throw error;
        }
    }

    // getAppStatus
    public async getAppStatus(appUID: string) : Promise<AppStatus> {
        try {
            const uri = this.address_ + "/api/v1/apps/status/" + appUID;
            const response = await fetch(uri, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            if (response.status === 200) {
                return await response.json();
            }
            else {
                throw new Error('Unexpected status code: ' + response.status);
            }
        } catch (error) {
            logger.error('Error fetching data:', error);
            throw error;
        }
    }

    // add application
    public async addApp(appID: string, config: any, sessionUID: string = "") : Promise<void> {
        try {
            const uri = this.address_ + "/api/v1/apps/" + appID + `/${sessionUID}`;
            const response = await fetch(uri, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            else if (response.status === 200) {
                return;
            }
            else {
                throw new Error('Unexpected status code: ' + response.status);
            }
        } catch (error) {
            logger.error('Error fetching data:', error);
            throw error;
        }
    }

    // delete application
    public async deleteApp(appId: string, appUID: number) : Promise<void> {
        try {
            var uri = this.address_ + "/api/v1/apps/" + appId + "/" + appUID;
            uri = encodeURI(uri);
            const response = await fetch(uri, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            if (response.status === 200) {
                return;
            }
            else {
                throw new Error('Unexpected status code: ' + response.status);
            }
        } catch (error) {
            logger.error('Error fetching data:', error);
            throw error;
        }
    }

    // update application configuration
    public async updateApp(appID: string, config: any) : Promise<void> {
        try {
            const uri = this.address_ + "/api/v1/apps/" + appID;
            const response = await fetch(uri, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            if (response.status === 200) {
                return;
            }
            else {
                throw new Error('Unexpected status code: ' + response.status);
            }
        } catch (error) {
            logger.error('Error fetching data:', error);
            throw error;
        }
    }

    // Get app schema
    public async getAppSchema(appID: string) : Promise<any> {
        try {
            const uri = this.address_ + "/api/v1/apps/schema/" + appID;
            const response = await fetch(uri, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            if (response.status === 200) {
                return await response.json();
            }
            else {
                throw new Error('Unexpected status code: ' + response.status);
            }
        } catch (error) {
            logger.error('Error fetching data:', error);
            throw error;
        }
    }

    // Get app configuration
    public async getAppConfiguration(appUID: string) : Promise<any> {
        try {
            const uri = this.address_ + "/api/v1/apps/config/" + appUID;
            const response = await fetch(uri, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            if (response.status === 200) {
                return await response.json();
            }
            else {
                throw new Error('Unexpected status code: ' + response.status);
            }
        } catch (error) {
            logger.error('Error fetching data:', error);
            throw error;
        }
    }

    // run a command
    public async runAppCommand(appUID: string, command: string, params: any | null = null) : Promise<void> {
        try {
            const uri = this.address_ + "/api/v1/apps/command/" + command + "/" + appUID;
            const response = await fetch(uri, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: params    
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            if (response.status === 200) {
                return;
            }
            else {
                throw new Error('Unexpected status code: ' + response.status);
            }
        } catch (error) {
            logger.error('Error fetching data:', error);
            throw error;
        }
    }

    public getStatus() {
        const schemas = Array.from(this.availableSchemas_, ([key, value]) => ({ 'app': key, 'schema': value }));
        return { address: this.address_, uid: this.uid_, connected: this.connected, config: this.config_, availableApps: this.availableApps_, availableSchemas: schemas };
    }
}