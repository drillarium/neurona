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
exports.MultiviewerApp = void 0;
const db_1 = require("../db");
const launcher_app_1 = require("../launcher/launcher.app");
const logger_1 = require("../logger");
const scene_1 = require("./scene");
const fs = require("fs");
const path = require("path");
const ws_service_1 = require("../services/ws.service");
// multiviewer app
class MultiviewerApp {
    constructor() {
        this.scenes = [];
    }
    static getInstance() {
        if (!MultiviewerApp.instance) {
            MultiviewerApp.instance = new MultiviewerApp();
        }
        return MultiviewerApp.instance;
    }
    // init
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            // load sencenes
            const db = db_1.AppDataBase.getInstance();
            const scenes = yield db.loadScenes();
            scenes.forEach(scene => {
                const ls = new scene_1.LayoutScene;
                ls.init(scene);
                this.scenes.push(ls);
                logger_1.logger.info(`Scene ${scene.id} loaded`);
            });
            // run scenes
        });
    }
    // deinit
    deinit() {
        // unload
    }
    // JSON schema for GUI
    getSchema() {
        // all launchers
        const launchers = launcher_app_1.LauncherApp.getInstance().launchersStatus();
        // sechema
        const filePath = path.join(__dirname, 'multiviewer.schema.json');
        var JSONSchema = {};
        try {
            const fileContents = fs.readFileSync(filePath, 'utf-8');
            JSONSchema = JSON.parse(fileContents);
            // fill with available launchers
            JSONSchema.properties.launcher.enum = [];
            launchers.forEach((launcher) => {
                const name = launcher_app_1.LauncherApp.getInstance().name(launcher.uid);
                JSONSchema.properties.launcher.enum.push(name);
                if (JSONSchema.properties.launcher.default === "") {
                    JSONSchema.properties.launcher.default = name;
                }
            });
            // update launchers
        }
        catch (error) {
            logger_1.logger.error('Error reading or parsing the JSON file:', error);
        }
        return JSONSchema;
    }
    // get scenes
    getScenes() {
        var scenes = [];
        this.scenes.forEach(scene => {
            scenes.push(scene.scene);
        });
        return scenes;
    }
    // get scenes
    getScenesGUI() {
        return __awaiter(this, void 0, void 0, function* () {
            var resolvedScenes = [];
            for (var i = 0; i < this.scenes.length; i++) {
                var sceneGUI = Object.assign({}, this.scenes[i].scene);
                if ("launcherId" in sceneGUI && "userId" in sceneGUI) {
                    // replace launcherId by launcher
                    var launcherName = "???";
                    try {
                        launcherName = launcher_app_1.LauncherApp.getInstance().name(sceneGUI.launcherId);
                    }
                    catch (error) { }
                    sceneGUI.launcher = launcherName;
                    delete sceneGUI.launcherId;
                    // replace userId by user
                    var username = "???";
                    try {
                        username = (yield db_1.AppDataBase.getInstance().getUserById(sceneGUI.userId)).username;
                    }
                    catch (error) { }
                    sceneGUI.user = username;
                    delete sceneGUI.userId;
                }
                resolvedScenes.push(sceneGUI);
            }
            return resolvedScenes;
        });
    }
    // get scene
    getScene(id) {
        const index = this.scenes.findIndex(scene => scene.id === id);
        if (index >= 0) {
            return this.scenes[index].scene;
        }
        else {
            return null;
        }
    }
    // get scene
    getSceneGUI(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.scenes.findIndex(scene => scene.id === id);
            if (index >= 0) {
                var sceneGUI = Object.assign({}, this.scenes[index].scene);
                if ("launcherId" in sceneGUI && "userId" in sceneGUI) {
                    // replace launcherId by launcher
                    var launcherName = "???";
                    try {
                        launcherName = launcher_app_1.LauncherApp.getInstance().name(sceneGUI.launcherId);
                    }
                    catch (error) { }
                    sceneGUI.launcher = launcherName;
                    delete sceneGUI.launcherId;
                    // replace userId by user
                    const user = yield db_1.AppDataBase.getInstance().getUserById(sceneGUI.userId);
                    sceneGUI.user = user.username;
                    delete sceneGUI.userId;
                }
                return sceneGUI;
            }
            else {
                return null;
            }
        });
    }
    // add scene
    addScene(scene) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // save scene
                const db = db_1.AppDataBase.getInstance();
                scene.id = yield db.saveScene(scene);
                // create
                const sceneLayout = new scene_1.LayoutScene;
                sceneLayout.init(scene);
                this.scenes.push(sceneLayout);
                logger_1.logger.info(`Scene ${scene.id} loaded`);
                // run scene
                // notify
                const message = { message: "scene_list_change", action: "scene_added", uid: scene.id };
                (0, ws_service_1.broadcast)(message);
            }
            catch (error) {
                throw error;
            }
            return scene;
        });
    }
    // add scene
    addSceneGUI(scene) {
        return __awaiter(this, void 0, void 0, function* () {
            // convert to IScene
            const launcherName = scene.launcher;
            const userName = scene.user;
            delete scene.launcher;
            delete scene.user;
            var sceneResolved = Object.assign({}, scene);
            const launcher = launcher_app_1.LauncherApp.getInstance().idByName(launcherName);
            sceneResolved.launcherId = launcher;
            const user = yield db_1.AppDataBase.getInstance().getUserByName(userName);
            sceneResolved.userId = user.id;
            // convert to sceneGUI
            var ret = Object.assign({}, yield this.addScene(sceneResolved));
            delete ret.launcherId;
            delete ret.userID;
            ret.launcher = launcherName;
            ret.user = userName;
            return ret;
        });
    }
    // remove scene
    removeScene(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.scenes.findIndex(scene => scene.id === id);
            if (index >= 0) {
                // stop scene
                this.scenes[index].deinit();
                // remove from db
                const db = db_1.AppDataBase.getInstance();
                yield db.deleteScene(this.scenes[index].id);
                // remove
                this.scenes.splice(index, 1);
                logger_1.logger.info(`Scene ${id} removed`);
                // notify
                const message = { message: "scene_list_change", action: "scene_removed", uid: id };
                (0, ws_service_1.broadcast)(message);
            }
            else {
                throw Error(`Scene ${id} not found`);
            }
        });
    }
    // update scene
    updateScene(scene) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.scenes.findIndex(scene => scene.id === scene.id);
            if (index >= 0) {
                // stop scene
                this.scenes[index].deinit();
                // update from db
                const db = db_1.AppDataBase.getInstance();
                yield db.updateScene(scene);
                // remove
                this.scenes[index].init(scene);
                logger_1.logger.info(`Scene ${scene.id} updated`);
                // notify
                const message = { message: "scene_list_change", action: "scene_updated", uid: scene.id };
                (0, ws_service_1.broadcast)(message);
            }
            else {
                throw Error(`Scene ${scene.id} not found`);
            }
        });
    }
    // update scene GUI
    updateSceneGUI(scene) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.scenes.findIndex(scene => scene.id === scene.id);
            if (index >= 0) {
                // convert to IScene
                const launcherName = scene.launcher;
                const userName = scene.user;
                delete scene.launcher;
                delete scene.user;
                var sceneResolved = Object.assign({}, scene);
                const launcher = launcher_app_1.LauncherApp.getInstance().idByName(launcherName);
                sceneResolved.launcherId = launcher;
                const user = yield db_1.AppDataBase.getInstance().getUserByName(userName);
                sceneResolved.userId = user.id;
                // update scene
                return this.updateScene(sceneResolved);
            }
        });
    }
    // scene inputs
    addInput(id, input) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.scenes.findIndex(scene => scene.id === id);
            if (index >= 0) {
                this.scenes[index].addInput(input);
                // update from db
                const db = db_1.AppDataBase.getInstance();
                yield db.updateScene(this.scenes[index].scene);
                // notify
                const message = { message: "scene_list_change", action: "scene_input_added", uid: id, input_index: this.scenes[index].numInputs() - 1 };
                (0, ws_service_1.broadcast)(message);
                logger_1.logger.info(`Scene ${id} updated. Input ${input.id} added`);
            }
            else {
                throw Error(`Scene ${id} not found`);
            }
        });
    }
    updateInput(id, inputIndex, input) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.scenes.findIndex(scene => scene.id === id);
            if (index >= 0) {
                this.scenes[index].updateInput(inputIndex, input);
                // update from db
                const db = db_1.AppDataBase.getInstance();
                yield db.updateScene(this.scenes[index].scene);
                // notify
                const message = { message: "scene_list_change", action: "scene_input_updated", uid: id, input_index: inputIndex };
                (0, ws_service_1.broadcast)(message);
                logger_1.logger.info(`Scene ${id} updated. Input ${input.id} updated`);
            }
            else {
                throw Error(`Scene ${id} not found`);
            }
        });
    }
    removeInput(id, inputIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.scenes.findIndex(scene => scene.id === id);
            if (index >= 0) {
                this.scenes[index].removeInput(inputIndex);
                // update from db
                const db = db_1.AppDataBase.getInstance();
                yield db.updateScene(this.scenes[index].scene);
                // notify
                const message = { message: "scene_list_change", action: "scene_input_removed", uid: id, input_index: inputIndex };
                (0, ws_service_1.broadcast)(message);
                logger_1.logger.info(`Scene ${id} updated. Input ${inputIndex} removed`);
            }
            else {
                throw Error(`Scene ${id} not found`);
            }
        });
    }
    // scene output
    addOutput(id, output) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.scenes.findIndex(scene => scene.id === id);
            if (index >= 0) {
                this.scenes[index].addOutput(output);
                // update from db
                const db = db_1.AppDataBase.getInstance();
                yield db.updateScene(this.scenes[index].scene);
                // notify
                const message = { message: "scene_list_change", action: "scene_output_added", uid: id, output_index: this.scenes[index].numOutputs() - 1 };
                (0, ws_service_1.broadcast)(message);
                logger_1.logger.info(`Scene ${id} updated. Output ${output.id} added`);
            }
            else {
                throw Error(`Scene ${id} not found`);
            }
        });
    }
    updateOutput(id, outputIndex, output) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.scenes.findIndex(scene => scene.id === id);
            if (index >= 0) {
                this.scenes[index].updateOutput(outputIndex, output);
                // update from db
                const db = db_1.AppDataBase.getInstance();
                yield db.updateScene(this.scenes[index].scene);
                // notify
                const message = { message: "scene_list_change", action: "scene_output_updated", uid: id, input_index: outputIndex };
                (0, ws_service_1.broadcast)(message);
                logger_1.logger.info(`Scene ${id} updated. Output ${outputIndex} updated`);
            }
            else {
                throw Error(`Scene ${id} not found`);
            }
        });
    }
    removeOutput(id, outputIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = this.scenes.findIndex(scene => scene.id === id);
            if (index >= 0) {
                this.scenes[index].removeOutput(outputIndex);
                // update from db
                const db = db_1.AppDataBase.getInstance();
                yield db.updateScene(this.scenes[index].scene);
                // notify
                const message = { message: "scene_list_change", action: "scene_input_removed", uid: id, input_index: outputIndex };
                (0, ws_service_1.broadcast)(message);
                logger_1.logger.info(`Scene ${id} updated. Output ${outputIndex} removed`);
            }
            else {
                throw Error(`Scene ${id} not found`);
            }
        });
    }
}
exports.MultiviewerApp = MultiviewerApp;
