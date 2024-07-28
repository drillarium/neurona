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
exports.launcherRouter = void 0;
const express = require("express"); // express
const logger_1 = require("../logger"); // logger
const db_1 = require("../db");
const launcher_app_1 = require("./launcher.app");
// db
const db = db_1.AppDataBase.getInstance();
// router definition
exports.launcherRouter = express.Router();
// GET launchers
exports.launcherRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const launchers = yield db.loadLaunchers();
        if (!launchers) {
            throw Error("loadLaunchers() error");
        }
        if (launchers.length > 0) {
            res.status(200).send(launchers);
        }
        else {
            res.status(204).send();
        }
    }
    catch (error) {
        logger_1.logger.error(`GET "/" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// POST launcher
exports.launcherRouter.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const newLauncher = req.body;
    try {
        const launcher = yield db.addLauncher(newLauncher);
        res.status(201).send(launcher);
    }
    catch (error) {
        logger_1.logger.error(`POST "/" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// PUT launcher
exports.launcherRouter.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    var launcher = req.body;
    launcher.id = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id;
    try {
        yield db.updateLauncher(launcher);
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`PUT "/:id" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// DELETE launcher
exports.launcherRouter.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    try {
        yield db.deleteLauncher(parseInt(id));
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`DELETE "/:id" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// GET launcher status
exports.launcherRouter.get("/:id/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    try {
        const launcherApp = launcher_app_1.LauncherApp.getInstance();
        const status = launcherApp.status(id);
        res.status(200).send(status);
    }
    catch (error) {
        logger_1.logger.error(`GET "/:id/status" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// GET launcher schema
exports.launcherRouter.get("/:id/schema", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    try {
        const schemas = yield db.launcherAppsSchema(Number(id));
        const obj = Object.fromEntries(schemas);
        res.status(200).send(obj);
    }
    catch (error) {
        logger_1.logger.error(`GET "/:id/schema" "${error.message}"`);
        res.status(400).send(error.message);
    }
}));
// 
