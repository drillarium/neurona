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
exports.multiviewerRouter = void 0;
const express = require("express"); // express
const logger_1 = require("../logger"); // logger
const multiviewer_app_1 = require("./multiviewer.app");
const launcher_app_1 = require("../launcher/launcher.app");
// app
const app = multiviewer_app_1.MultiviewerApp.getInstance();
// Launcher app
const launcherApp = launcher_app_1.LauncherApp.getInstance();
// router definition
exports.multiviewerRouter = express.Router();
// GET SCENE schema
exports.multiviewerRouter.get("/scene/schema", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = app.getSchema();
        res.status(200).send(schema);
    }
    catch (error) {
        logger_1.logger.error(`GET "/scene" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// GET SCENE schema for inputs
exports.multiviewerRouter.get("/scene/:id/input/schema", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const sceneID = parseInt((_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id);
    try {
        // launcherID from sceneID
        const scene = app.getScene(sceneID);
        if (!scene) {
            throw Error("getScene() error");
        }
        const mergedSchemas = launcherApp.getSchemas(scene.launcherId, "input");
        res.status(200).send(mergedSchemas);
    }
    catch (error) {
        logger_1.logger.error(`GET "/scene/:id/input/schema" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// GET SCENE schema for outputs
exports.multiviewerRouter.get("/scene/:id/output/schema", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const sceneID = parseInt((_b = req === null || req === void 0 ? void 0 : req.params) === null || _b === void 0 ? void 0 : _b.id);
    try {
        // launcherID from sceneID
        const scene = app.getScene(sceneID);
        if (!scene) {
            throw Error("getScene() error");
        }
        const mergedSchemas = launcherApp.getSchemas(scene.launcherId, "output");
        res.status(200).send(mergedSchemas);
    }
    catch (error) {
        logger_1.logger.error(`GET "/scene/:id/output/schema" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// GET avaialbe inputs for this launcher
exports.multiviewerRouter.get("/scene/:id/input", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const sceneID = parseInt((_c = req === null || req === void 0 ? void 0 : req.params) === null || _c === void 0 ? void 0 : _c.id);
    try {
        // launcherID from sceneID
        const scene = app.getScene(sceneID);
        if (!scene) {
            throw Error("getScene() error");
        }
        const engines = yield launcherApp.getEngines(scene.launcherId, "input");
        res.status(200).send(engines);
    }
    catch (error) {
        logger_1.logger.error(`GET "/scene/:id/input" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// GET avaialbe outupts for this launcher
exports.multiviewerRouter.get("/scene/:id/output", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const sceneID = parseInt((_d = req === null || req === void 0 ? void 0 : req.params) === null || _d === void 0 ? void 0 : _d.id);
    try {
        // launcherID from sceneID
        const scene = app.getScene(sceneID);
        if (!scene) {
            throw Error("getScene() error");
        }
        const engines = yield launcherApp.getEngines(scene.launcherId, "output");
        res.status(200).send(engines);
    }
    catch (error) {
        logger_1.logger.error(`GET "/scene/:id/output" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// GET SCENES
exports.multiviewerRouter.get("/scene", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const scenes = yield app.getScenesGUI();
        if (scenes.length == 0) {
            res.status(204).send();
        }
        else {
            res.status(200).send(scenes);
        }
    }
    catch (error) {
        logger_1.logger.error(`GET "/scene" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// GET SCENE
exports.multiviewerRouter.get("/scene/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const id = parseInt((_e = req === null || req === void 0 ? void 0 : req.params) === null || _e === void 0 ? void 0 : _e.id);
    try {
        const scene = app.getScene(id);
        if (!scene) {
            throw Error("getScene() error");
        }
        res.status(200).send(scene);
    }
    catch (error) {
        logger_1.logger.error(`GET "/scene/:id" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// ADD SCENE
exports.multiviewerRouter.post("/scene", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const scene = req.body;
    try {
        // scene from GUI or already with UIDs resolved
        var sceneWithId = {};
        if ('launcher' in scene) {
            sceneWithId = yield app.addSceneGUI(scene);
        }
        else {
            sceneWithId = yield app.addScene(scene);
        }
        res.status(201).send(sceneWithId);
    }
    catch (error) {
        logger_1.logger.error(`POST "/scene" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// REMOVE SCENE
exports.multiviewerRouter.delete("/scene/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = parseInt(req.params.id);
    try {
        yield app.removeScene(id);
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`DELETE  "/scene/:id" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// MODIFY SCENE
exports.multiviewerRouter.put("/scene/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    var scene = req.body;
    scene.id = parseInt((_f = req === null || req === void 0 ? void 0 : req.params) === null || _f === void 0 ? void 0 : _f.id);
    try {
        yield app.updateSceneGUI(scene);
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`POST "/scene" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// MODIFY SCENE - ADD INPUT TO SCENE
exports.multiviewerRouter.post("/input/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const scene = parseInt(req.params.id);
    const input = req.body;
    try {
        yield app.addInput(scene, input);
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`POST "/input/:id" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// MODIFY SCENE - MODIFY INPUT SCENE
exports.multiviewerRouter.put("/input/:id/:input_id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const scene = parseInt(req.params.id);
    const inputID = parseInt(req.params.input_id);
    const input = req.body;
    try {
        yield app.updateInput(scene, inputID, input);
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`PUT "/input/:id" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// MODIFY SCENE - REMOVE INPUT SCENE
exports.multiviewerRouter.delete("/input/:id/:input", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const scene = parseInt(req.params.id);
    const input = parseInt(req.params.input);
    try {
        yield app.removeInput(scene, input);
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`DELETE "/input/:id/:input" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// MODIFY SCENE - ADD OUTPUT TO SCENE
exports.multiviewerRouter.post("/output/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const scene = parseInt(req.params.id);
    const output = req.body;
    try {
        yield app.addOutput(scene, output);
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`POST "/output/:id" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// MODIFY SCENE - MODIFY OUTPUT SCENE
exports.multiviewerRouter.put("/output/:id/:output_id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const scene = parseInt(req.params.id);
    const output_id = parseInt(req.params.output_id);
    const output = req.body;
    try {
        yield app.updateOutput(scene, output_id, output);
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`PUT "/output/:id" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// MODIFY SCENE - REMOVE OUTPUT SCENE
exports.multiviewerRouter.delete("/output/:id/:output", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const scene = parseInt(req.params.id);
    const output = parseInt(req.params.output);
    try {
        yield app.removeOutput(scene, output);
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`DELETE "/output/:id/:destination" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// CREATE INPUT FROM LAUNCHER 
exports.multiviewerRouter.post("/scene/:id/input/launcher", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    const sceneID = parseInt((_g = req === null || req === void 0 ? void 0 : req.params) === null || _g === void 0 ? void 0 : _g.id);
    const config = req.body;
    try {
        // launcherID from sceneID
        const scene = app.getScene(sceneID);
        if (!scene) {
            throw Error("getScene() error");
        }
        const launcherId = scene.launcherId;
        const module = launcherApp.getAppModuleAppType(launcherId, "input", config.type);
        // add input aaplication
        const launcher = launcherApp.launcher(launcherId);
        if (!launcher) {
            throw Error("Launcher not found");
        }
        // case error thows an exception
        yield launcher.addApp(module, config);
        // response
        res.status(201).send(config);
    }
    catch (error) {
        logger_1.logger.error(`POST "/scene/:id/input/launcher" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// CREATE OUTPUT FROM LAUNCHER 
exports.multiviewerRouter.post("/scene/:id/output/launcher", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    const sceneID = parseInt((_h = req === null || req === void 0 ? void 0 : req.params) === null || _h === void 0 ? void 0 : _h.id);
    const config = req.body;
    try {
        // launcherID from sceneID
        const scene = app.getScene(sceneID);
        if (!scene) {
            throw Error("getScene() error");
        }
        const launcherId = scene.launcherId;
        const module = launcherApp.getAppModuleAppType(launcherId, "output", config.type);
        // add output aaplication
        const launcher = launcherApp.launcher(launcherId);
        if (!launcher) {
            throw Error("Launcher not found");
        }
        // case error thows an exception
        yield launcher.addApp(module, config);
        // response
        res.status(200).send(config);
    }
    catch (error) {
        logger_1.logger.error(`POST "/scene/:id/output/launcher" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// UPDATE INPUT FROM LAUNCHER 
exports.multiviewerRouter.put("/scene/:id/input/launcher", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    const sceneID = parseInt((_j = req === null || req === void 0 ? void 0 : req.params) === null || _j === void 0 ? void 0 : _j.id);
    const config = req.body;
    try {
        // launcherID from sceneID
        const scene = app.getScene(sceneID);
        if (!scene) {
            throw Error("getScene() error");
        }
        const launcherId = scene.launcherId;
        const module = launcherApp.getAppModuleAppType(launcherId, "input", config.type);
        // update input aaplication
        const launcher = launcherApp.launcher(launcherId);
        if (!launcher) {
            throw Error("Launcher not found");
        }
        // case error thows an exception
        yield launcher.updateApp(module, config);
        // response
        res.status(200).send(config);
    }
    catch (error) {
        logger_1.logger.error(`PUT "/scene/:id/input/launcher" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// UPDATE OUTPUT FROM LAUNCHER 
exports.multiviewerRouter.put("/scene/:id/output/launcher", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _k;
    const sceneID = parseInt((_k = req === null || req === void 0 ? void 0 : req.params) === null || _k === void 0 ? void 0 : _k.id);
    const config = req.body;
    try {
        // launcherID from sceneID
        const scene = app.getScene(sceneID);
        if (!scene) {
            throw Error("getScene() error");
        }
        const launcherId = scene.launcherId;
        const module = launcherApp.getAppModuleAppType(launcherId, "output", config.type);
        // update otput aaplication
        const launcher = launcherApp.launcher(launcherId);
        if (!launcher) {
            throw Error("Launcher not found");
        }
        // case error thows an exception
        yield launcher.updateApp(module, config);
        // response
        res.status(200).send(config);
    }
    catch (error) {
        logger_1.logger.error(`PUT "/scene/:id/output/launcher" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// REMOVE INPUT FROM LAUNCHER 
exports.multiviewerRouter.delete("/scene/:id/input/:type/:input/launcher", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _l, _m, _o;
    const sceneID = parseInt((_l = req === null || req === void 0 ? void 0 : req.params) === null || _l === void 0 ? void 0 : _l.id);
    const type = (_m = req === null || req === void 0 ? void 0 : req.params) === null || _m === void 0 ? void 0 : _m.type;
    const inputId = parseInt((_o = req === null || req === void 0 ? void 0 : req.params) === null || _o === void 0 ? void 0 : _o.input);
    try {
        // launcherID from sceneID
        const scene = app.getScene(sceneID);
        if (!scene) {
            throw Error("getScene() error");
        }
        const launcherId = scene.launcherId;
        const module = launcherApp.getAppModuleAppType(launcherId, "input", type);
        // remove input aaplication
        const launcher = launcherApp.launcher(launcherId);
        if (!launcher) {
            throw Error("Launcher not found");
        }
        // case error thows an exception
        yield launcher.deleteApp(module, inputId);
        // response
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`DELETE "/scene/:id/input/:type/:input/launcher" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// REMOVE OUTPUT FROM LAUNCHER 
exports.multiviewerRouter.delete("/scene/:id/output/:type/:output/launcher", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _p, _q, _r;
    const sceneID = parseInt((_p = req === null || req === void 0 ? void 0 : req.params) === null || _p === void 0 ? void 0 : _p.id);
    const type = (_q = req === null || req === void 0 ? void 0 : req.params) === null || _q === void 0 ? void 0 : _q.type;
    const outputId = parseInt((_r = req === null || req === void 0 ? void 0 : req.params) === null || _r === void 0 ? void 0 : _r.output);
    try {
        // launcherID from sceneID
        const scene = app.getScene(sceneID);
        if (!scene) {
            throw Error("getScene() error");
        }
        const launcherId = scene.launcherId;
        const module = launcherApp.getAppModuleAppType(launcherId, "output", type);
        // remove input aaplication
        const launcher = launcherApp.launcher(launcherId);
        if (!launcher) {
            throw Error("Launcher not found");
        }
        // case error thows an exception
        yield launcher.deleteApp(module, outputId);
        // response
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`DELETE "/scene/:id/output/:type/:output/:launcher" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
