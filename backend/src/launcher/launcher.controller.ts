import { logger } from "../logger";
import { WebSocket } from 'ws';

// Engine
export interface IEngines {
    type: string;
    uid: string;
    name: string;
    running: boolean;
}

// Launcher
export class LauncherController {
    // uid
    private uid_: string= "";
    // name
    private name_: string = "";
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
        this.wsClient_.on('open', () => {
            logger.info(`Launcher ${this.address_} connected`);

            // await get launcher info

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

        logger.info(`Launcher ${this.address_} shutdown`);

        // connected
        this.connected_ = false;
    }
}