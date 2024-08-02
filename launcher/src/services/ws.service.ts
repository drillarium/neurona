import { WebSocketServer } from "ws";
import { logger } from "../logger";
import { Observable, Subject } from "rxjs";

export class WebSocketService {
    // singleton instance
    private static instance_: WebSocketService;
    // 
    private wss_?: WebSocketServer;
    // sessions
    private sessions_: Map<string, any> = new Map<string, any>();
    // connection subject
    private sessionSubject: Subject<string>;

    // Private constructor prevents instantiation outside of this class.
    private constructor() { 
        this.sessionSubject = new Subject<string>();
    }
    
    // Return the only instance
    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance_) {
            WebSocketService.instance_ = new WebSocketService();
        }
    
        return WebSocketService.instance_;
    }

    public init(_server: any) {
        // websocket
        this.wss_ = new WebSocketServer(_server);
        this.wss_.on('connection', (ws, req) => {
            // register
            const clientInfo = req.headers;
            const session: string = clientInfo.session as string;
            this.sessions_.set(session, clientInfo);
            logger.info(`WebSocket connection opened ${JSON.stringify(clientInfo)}`);

            // connection close event
            ws.on('close', () => {
                // unregister
                if (this.sessions_.has(session)) {
                    logger.info(`WebSocket connection closing session ${session}`);
                    this.sessions_.delete(session);

                    // kill session engines
                    this.notifySessionEnds(session);
                }
                else {
                    logger.info(`WebSocket connection close`);
                }
            });
        });    
    }

    public send(_message: any) {
        if(this.wss_) {
            const messageStr = JSON.stringify(_message);
            this.wss_.clients.forEach(client => {
                client.send(messageStr);
            });
        }
    }

    // Subscribe to connection state change
    public subscribeToSessionEnds(): Observable<string> {
        return this.sessionSubject.asObservable();
    }

    // notify
    public notifySessionEnds(session: string) : void {
        this.sessionSubject.next(session);
    }
}

export function broadcast(_message: any) {
    const wss : WebSocketService = WebSocketService.getInstance();
    wss.send(_message);
}
