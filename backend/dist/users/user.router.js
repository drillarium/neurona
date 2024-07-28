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
exports.userRouter = void 0;
const express = require("express"); // express
const logger_1 = require("../logger"); // logger
const db_1 = require("../db");
// db
const db = db_1.AppDataBase.getInstance();
// router definition
exports.userRouter = express.Router();
// GET users
exports.userRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield db.loadUsers();
        if (!users) {
            throw Error("loadUsers() error");
        }
        if (users.length > 0) {
            res.status(200).send(users);
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
// GET user by email or name
exports.userRouter.get("/:emailorname", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const emailorname = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.emailorname;
    try {
        const user = yield db.getUserByEmail(emailorname);
        res.status(200).send(user);
    }
    catch (error) {
        try {
            const user = yield db.getUserByName(emailorname);
            res.status(200).send(user);
        }
        catch (error) {
            logger_1.logger.error(`GET "/:emailorname" ${error.message}`);
            res.status(400).send(error.message);
        }
    }
}));
// POST user
exports.userRouter.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const newUser = req.body;
    try {
        const user = yield db.saveUser(newUser);
        res.status(201).send(user);
    }
    catch (error) {
        logger_1.logger.error(`POST "/" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// POST user
exports.userRouter.post("/validate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.body;
    try {
        const isValidUser = yield db.validateUserByEmail(user.emailorname, user.password);
        if (isValidUser) {
            res.status(200).send();
        }
        else {
            const isValidUser = yield db.validateUserByName(user.emailorname, user.password);
            if (isValidUser) {
                res.status(200).send();
            }
            else {
                throw new Error(`User ${user.email} not found or invalid password`);
            }
        }
    }
    catch (error) {
        logger_1.logger.error(`POST "/" ${JSON.stringify(user)} ${error.message}`);
        res.status(400).send(error.message);
    }
}));
// PUT user
exports.userRouter.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    var user = req.body;
    user.id = parseInt((_b = req === null || req === void 0 ? void 0 : req.params) === null || _b === void 0 ? void 0 : _b.id);
    try {
        yield db.updateUser(user);
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`PUT "/:id" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
// DELETE user
exports.userRouter.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const id = (_c = req === null || req === void 0 ? void 0 : req.params) === null || _c === void 0 ? void 0 : _c.id;
    try {
        yield db.deleteUser(parseInt(id));
        res.status(200).send();
    }
    catch (error) {
        logger_1.logger.error(`DELETE "/:appuid" ${JSON.stringify(error)}`);
        res.status(400).send(error.message);
    }
}));
