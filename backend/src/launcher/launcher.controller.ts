import { logger } from "../logger";
import { WebSocket } from 'ws';

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

    // constructor
    public constructor() { 
    }

    public get connected() { return this.connected_; }

    // init
    public init(appUID: string, sessionUID: string, address: string) {
        this.address_ = address;
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
                this.config_ = await this.getCongig();
                logger.info(`Launcher ${this.address_} configuration is ${JSON.stringify(this.config_)}`);
            }
            catch(error) {
                logger.error(`Launcher ${this.address_} getConfig ${error}`);
            }

            // connected
            this.connected_ = true;
        });

        // close
        this.wsClient_.on('close', (code) => {
            if(this.connected_) {
                logger.info(`Launcher ${this.address_} disconnected ${code}`);

                // connected
                this.connected_ = false;
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
    public async getApps() : Promise<AppInfo[]> {
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
    public async addApp(appID: string, config: any) : Promise<void> {
        try {
            const uri = this.address_ + "/api/v1/apps/" + appID;
            const response = await fetch(uri, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: config
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

    // delete application
    public async deleteApp(appUID: string) : Promise<void> {
        try {
            const uri = this.address_ + "/api/v1/apps/" + appUID;
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
                body: config
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
}