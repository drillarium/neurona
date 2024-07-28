"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LauncherController = void 0;
const db_1 = require("../db");
const logger_1 = require("../logger");
const ws_1 = require("ws");
const ws_service_1 = require("../services/ws.service");
// Launcher
class LauncherController {
    // constructor
    constructor() {
        this.config_ = null;
        // connected
        this.connected_ = false;
        // websocket client
        this.wsClient_ = null;
        // address
        this.address_ = "";
        // UID (DB key)
        this.uid_ = -1;
        // available apps
        this.availableApps_ = [];
        // schema
        this.availableSchemas_ = new Map();
    }
    get connected() { return this.connected_; }
    get uid() { return this.uid_; }
    // init
    init(launcherUID, appUID, sessionUID, address) {
        this.address_ = address;
        this.uid_ = launcherUID;
        this.connect(appUID, sessionUID);
    }
    connect(appUID, sessionUID) {
        const wsaddress = this.address_.replace("http://", "ws://");
        // header information valid to create session apps
        const headers = { uid: appUID, session: sessionUID };
        this.wsClient_ = new ws_1.WebSocket(wsaddress, undefined, { headers: headers });
        // open
        this.wsClient_.on('open', () => __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info(`Launcher ${this.address_} connected`);
            try {
                // configuration
                this.config_ = yield this.getCongig();
                logger_1.logger.info(`Launcher ${this.address_} configuration is ${JSON.stringify(this.config_)}`);
                // available apps
                this.availableApps_ = yield this.getAvailableApps();
                logger_1.logger.info(`Launcher ${this.address_} available apps are ${JSON.stringify(this.availableApps_)}`);
                // schema                
                for (var i = 0; i < this.availableApps_.length; i++) {
                    this.availableSchemas_.set(this.availableApps_[i], {});
                    try {
                        const schema = yield this.getAppSchema(this.availableApps_[i]);
                        this.availableSchemas_.set(this.availableApps_[i], schema);
                    }
                    catch (error) {
                    }
                }
                // save to DB. Schemas can be used case launcher not present to configure apps
                const db = db_1.AppDataBase.getInstance();
                db.updateLauncherAppsSchema(Number(this.uid_), this.availableSchemas_);
            }
            catch (error) {
                logger_1.logger.error(`Launcher ${this.address_} getConfig ${error}`);
            }
            // connected
            this.connected_ = true;
            // notify
            const message = { message: "launcher_status_change", "uid": this.uid_, "connected": true, status: this.getStatus() };
            (0, ws_service_1.broadcast)(message);
        }));
        // close
        this.wsClient_.on('close', (code) => {
            if (this.connected_) {
                logger_1.logger.info(`Launcher ${this.address_} disconnected ${code}`);
                // connected
                this.connected_ = false;
                // notify
                const message = { message: "launcher_status_change", "uid": this.uid_, "connected": false, status: null };
                (0, ws_service_1.broadcast)(message);
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
                logger_1.logger.error(`Launcher ${this.address_} parser error ${error}`);
            }
        });
        // error
        this.wsClient_.on('error', (code) => {
            if (this.connected_) {
                logger_1.logger.error(`Launcher ${this.address_} error ${code}`);
            }
        });
    }
    // deinit
    deinit() {
        // close websocket connection
        if (this.wsClient_) {
            this.wsClient_.close();
        }
        logger_1.logger.info(`Launcher ${this.address_} deinit`);
        // connected
        this.connected_ = false;
        // notify
        const message = { message: "launcher_status_change", "uid": this.uid_, "connected": false, status: null };
        (0, ws_service_1.broadcast)(message);
    }
    // getCongig
    getCongig() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const uri = this.address_ + "/api/v1/config";
                const response = yield fetch(uri, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                if (response.status === 200) {
                    return yield response.json();
                }
                else if (response.status === 204) {
                    return [];
                }
                else {
                    throw new Error('Unexpected status code: ' + response.status);
                }
            }
            catch (error) {
                logger_1.logger.error('Error fetching data:', error);
                throw error;
            }
        });
    }
    // getAvailableApps
    getAvailableApps() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const uri = this.address_ + "/api/v1/apps";
                const response = yield fetch(uri, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                if (response.status === 200) {
                    return yield response.json();
                }
                else if (response.status === 204) {
                    return [];
                }
                else {
                    throw new Error('Unexpected status code: ' + response.status);
                }
            }
            catch (error) {
                logger_1.logger.error('Error fetching data:', error);
                throw error;
            }
        });
    }
    // getApps
    getApps() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const uri = this.address_ + "/api/v1/apps/all";
                const response = yield fetch(uri, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                if (response.status === 200) {
                    return yield response.json();
                }
                else if (response.status === 204) {
                    return [];
                }
                else {
                    throw new Error('Unexpected status code: ' + response.status);
                }
            }
            catch (error) {
                logger_1.logger.error('Error fetching data:', error);
                throw error;
            }
        });
    }
    // getAppStatus
    getAppStatus(appUID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const uri = this.address_ + "/api/v1/apps/status/" + appUID;
                const response = yield fetch(uri, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                if (response.status === 200) {
                    return yield response.json();
                }
                else {
                    throw new Error('Unexpected status code: ' + response.status);
                }
            }
            catch (error) {
                logger_1.logger.error('Error fetching data:', error);
                throw error;
            }
        });
    }
    // add application
    addApp(appID, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const uri = this.address_ + "/api/v1/apps/" + appID;
                const response = yield fetch(uri, {
                    method: 'POST',
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
            }
            catch (error) {
                logger_1.logger.error('Error fetching data:', error);
                throw error;
            }
        });
    }
    // delete application
    deleteApp(appId, appUID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var uri = this.address_ + "/api/v1/apps/" + appId + "/" + appUID;
                uri = encodeURI(uri);
                const response = yield fetch(uri, {
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
            }
            catch (error) {
                logger_1.logger.error('Error fetching data:', error);
                throw error;
            }
        });
    }
    // update application configuration
    updateApp(appID, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const uri = this.address_ + "/api/v1/apps/" + appID;
                const response = yield fetch(uri, {
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
            }
            catch (error) {
                logger_1.logger.error('Error fetching data:', error);
                throw error;
            }
        });
    }
    // Get app schema
    getAppSchema(appID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const uri = this.address_ + "/api/v1/apps/schema/" + appID;
                const response = yield fetch(uri, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                if (response.status === 200) {
                    return yield response.json();
                }
                else {
                    throw new Error('Unexpected status code: ' + response.status);
                }
            }
            catch (error) {
                logger_1.logger.error('Error fetching data:', error);
                throw error;
            }
        });
    }
    // Get app configuration
    getAppConfiguration(appUID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const uri = this.address_ + "/api/v1/apps/config/" + appUID;
                const response = yield fetch(uri, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                if (response.status === 200) {
                    return yield response.json();
                }
                else {
                    throw new Error('Unexpected status code: ' + response.status);
                }
            }
            catch (error) {
                logger_1.logger.error('Error fetching data:', error);
                throw error;
            }
        });
    }
    // run a command
    runAppCommand(appUID_1, command_1) {
        return __awaiter(this, arguments, void 0, function* (appUID, command, params = null) {
            try {
                const uri = this.address_ + "/api/v1/apps/command/" + command + "/" + appUID;
                const response = yield fetch(uri, {
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
            }
            catch (error) {
                logger_1.logger.error('Error fetching data:', error);
                throw error;
            }
        });
    }
    getStatus() {
        const schemas = Array.from(this.availableSchemas_, ([key, value]) => ({ 'app': key, 'schema': value }));
        return { address: this.address_, uid: this.uid_, connected: this.connected, config: this.config_, availableApps: this.availableApps_, availableSchemas: schemas };
    }
}
exports.LauncherController = LauncherController;
