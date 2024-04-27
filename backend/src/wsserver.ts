import { WebSocketServer } from 'ws';
import { logger } from './logger';

var wss: WebSocketServer | null = null;
var sessions: Map<string, any> = new Map<string, any>();

export function createWebsocketServer(server: any) {
  wss = new WebSocketServer({ server });

  // connection
  wss.on('connection', (ws, req) => {
    
    // register session_uid
    const clientInfo = req.headers;
    const session: string = req.headers.app_session_uid as string;
    if(session) {
        sessions.set(session, clientInfo);
    }

    logger.info(`WebSocket connection opened ${JSON.stringify(clientInfo)}`);

    // connection close event
    ws.on('close', () => {
        // unregister
        if(sessions.has(session)) {
            logger.info(`WebSocket connection closing sessions ${session}`);
            sessions.delete(session);
        }

        logger.info(`WebSocket connection close. Session: ${session}`);
    });

  });
}

// websocket broadcast message
export function broadcast(message: any) {
    if (wss) {
        const messageStr = JSON.stringify(message);
        wss.clients.forEach(client => {
            client.send(messageStr);
        });
    }
}