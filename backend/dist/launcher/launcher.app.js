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
exports.LauncherApp = void 0;
const db_1 = require("../db");
const logger_1 = require("../logger");
const launcher_controller_1 = require("./launcher.controller");
const db = db_1.AppDataBase.getInstance();
// multiviewer app
class LauncherApp {
    constructor() {
        // list of launchers
        this.launchers = new Map();
    }
    static getInstance() {
        if (!LauncherApp.instance) {
            LauncherApp.instance = new LauncherApp();
        }
        return LauncherApp.instance;
    }
    // init
    init(appUID, sessionUID) {
        logger_1.logger.info(`Launcher app init`);
        db.loadLaunchers().then((launchers) => {
            launchers.forEach(launcher => {
                logger_1.logger.info(`Launcher ${launcher.address} created`);
                const l = new launcher_controller_1.LauncherController;
                this.launchers.set(launcher.id, l);
                l.init(launcher.id, appUID, sessionUID, launcher.address);
            });
        });
    }
    // deinit
    deinit() {
        this.launchers.forEach(launcher => {
            launcher.deinit();
        });
        logger_1.logger.info(`Launcher app deinit`);
    }
    // status
    status(launcherID) {
        var _a;
        if (!this.launchers.has(launcherID)) {
            throw Error(`Launcher ${launcherID} not found`);
        }
        return (_a = this.launchers.get(launcherID)) === null || _a === void 0 ? void 0 : _a.getStatus();
    }
    name(launcherID) {
        var _a;
        if (!this.launchers.has(launcherID)) {
            throw Error("");
        }
        const status = (_a = this.launchers.get(launcherID)) === null || _a === void 0 ? void 0 : _a.getStatus();
        if (status === null || status === void 0 ? void 0 : status.connected) {
            return status.config.name;
        }
        else {
            return status === null || status === void 0 ? void 0 : status.address;
        }
    }
    idByName(name) {
        for (let [key, value] of this.launchers) {
            const status = value.getStatus();
            if (status.connected) {
                if (status.config.name == name) {
                    return value.uid;
                }
            }
            else {
                if (status.address == name) {
                    return value.uid;
                }
            }
        }
        return -1;
    }
    // running launchers
    launchersStatus() {
        var ret = [];
        this.launchers.forEach((launcher) => {
            const status = launcher.getStatus();
            ret.push(status);
        });
        return ret;
    }
    launcher(launcherId) {
        return this.launchers.get(launcherId);
    }
    // build schema like this with all available inputs schemas
    // const schema = { "BlackMagic (SDI)" : {schema: {title: "", description: "", type: "object", required: [], properties: {id: {type: "number", title: "Id", default: -1, readOnly: true}, name: {type: "string", title: "Name", default: "Input name"}, type: {type: "string", title: "Type", default: "BlackMagic (SDI)", readOnly: true}}}},
    //                  "NDI" : {schema: {title: "", description: "", type: "object", required: [], properties: {id: {type: "number", title: "Id", default: -1, readOnly: true}, name: {type: "string", title: "Name", default: "Input name"}, type: {type: "string", title: "Type", default: "NDI", readOnly: true}}}}
    //                };
    getSchemas(launcherID, moduleType) {
        const status = this.status(launcherID);
        if (status == undefined) {
            throw Error("");
        }
        // mergeSchemas contains all schemas for input
        const filteredSchemas = status.availableSchemas.filter(schema => schema.app.indexOf(moduleType) >= 0);
        return filteredSchemas === null || filteredSchemas === void 0 ? void 0 : filteredSchemas.reduce((acc, obj) => {
            return Object.assign(Object.assign({}, acc), obj.schema);
        }, {});
    }
    // build json object like this, with all the configurations
    // const engines = [ {id: 1, name: "Input#1", type:"BlackMagic (SDI)"}, {id: 2, name: "Input#2", type:"NDI"} ];
    getEngines(launcherID, moduleType) {
        return __awaiter(this, void 0, void 0, function* () {
            const launcher = this.launcher(launcherID);
            if (!launcher) {
                throw Error("");
            }
            const apps = yield launcher.getApps();
            var avaialbleApps = [];
            for (const key of Object.keys(apps)) {
                if (key.indexOf(moduleType) >= 0) {
                    avaialbleApps = [...avaialbleApps, ...apps[key]];
                }
            }
            return avaialbleApps;
        });
    }
    getAppModuleAppType(launcherID, moduleType, app) {
        // launcher
        const status = this.status(launcherID);
        if (status == undefined) {
            throw Error("Launcher status not found");
        }
        const filteredSchema = status.availableSchemas.find(schema => schema.app.indexOf(moduleType) >= 0 && schema.schema[app]);
        if (!filteredSchema) {
            throw Error("App not found");
        }
        console.log("3333");
        return filteredSchema === null || filteredSchema === void 0 ? void 0 : filteredSchema.app;
    }
}
exports.LauncherApp = LauncherApp;
