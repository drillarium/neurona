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
exports.AppDataBase = void 0;
const sqlite3 = require("sqlite3");
const user_model_1 = require("./users/user.model");
const launcher_model_1 = require("./launcher/launcher.model");
const logger_1 = require("./logger");
// database
class AppDataBase {
    constructor() { }
    init(db) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                // Open a SQLite database connection
                this.db = new sqlite3.Database(db);
                // Create a users table if it doesn't exist
                this.db.serialize(() => {
                    this.db.run(`CREATE TABLE IF NOT EXISTS users (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            username TEXT NOT NULL UNIQUE,
                            email TEXT NOT NULL UNIQUE,
                            password TEXT,
                            isAdmin INTEGER
                )`);
                    // Add admin user if not already exists
                    const adminUsername = 'admin';
                    const adminPassword = 'password';
                    this.db.get('SELECT * FROM users WHERE username = ?', [adminUsername], (err, row) => {
                        if (err) {
                            logger_1.logger.error(err.message);
                            reject(err);
                            return;
                        }
                        if (!row) {
                            this.db.run('INSERT INTO users (username, email, password, isAdmin) VALUES (?, "", ?, 1)', [adminUsername, adminPassword], (err) => {
                                if (err) {
                                    logger_1.logger.error(err.message);
                                }
                                else {
                                    logger_1.logger.info('Admin user created successfully');
                                }
                            });
                        }
                        else {
                            logger_1.logger.info('Admin user already exists');
                        }
                    });
                    // Create a scenes table if does not exist
                    this.db.run(`CREATE TABLE IF NOT EXISTS scenes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    scene JSON
                )`);
                    // Create launchers table if it does not exist
                    this.db.run(`CREATE TABLE IF NOT EXISTS launchers (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            address TEXT NOT NULL UNIQUE
                )`);
                    // Add launcher URL if not already exists
                    const launcherUrl = 'http://127.0.0.1:5555';
                    this.db.get('SELECT * FROM launchers WHERE address = ?', [launcherUrl], (err, row) => {
                        if (err) {
                            logger_1.logger.error(err.message);
                            reject(err);
                            return;
                        }
                        if (!row) {
                            this.db.run('INSERT INTO launchers (address) VALUES (?)', [launcherUrl], (err) => {
                                if (err) {
                                    logger_1.logger.error(err.message);
                                    reject(err);
                                }
                                else {
                                    logger_1.logger.info(`Server ${launcherUrl} added successfully`);
                                    resolve();
                                }
                            });
                        }
                        else {
                            logger_1.logger.info(`Server ${launcherUrl} already exists`);
                            resolve();
                        }
                    });
                    // Create launchers schemas table if it does not exist
                    this.db.run(`CREATE TABLE IF NOT EXISTS launchers_apps_schema (
                            id INTEGER PRIMARY KEY,
                            schemas TEXT,
                            FOREIGN KEY (id) REFERENCES launchers(id)
                )`);
                });
            });
        });
    }
    static getInstance() {
        if (!AppDataBase.instance) {
            AppDataBase.instance = new AppDataBase();
        }
        return AppDataBase.instance;
    }
    loadUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM users', (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const users = rows.map(row => new user_model_1.User(row.id, row.username, row.email, row.password, row.isAdmin));
                        resolve(users);
                    }
                });
            });
        });
    }
    saveUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run('INSERT INTO users (username, email, password, isAdmin) VALUES (?, ?, ?, ?)', [user.username, user.email, user.password, user.isAdmin], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        user.id = this.lastID;
                        resolve(user);
                    }
                });
            });
        });
    }
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else if (!row) {
                        reject("User not found");
                    }
                    else {
                        const user = new user_model_1.User(row.id, row.username, row.email, row.password, row.isAdmin);
                        resolve(user);
                    }
                });
            });
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else if (!row) {
                        reject(new Error(`User ${email} not found`));
                    }
                    else {
                        const user = new user_model_1.User(row.id, row.username, row.email, row.password, row.isAdmin);
                        resolve(user);
                    }
                });
            });
        });
    }
    getUserByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM users WHERE username = ?', [name], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else if (!row) {
                        reject(new Error(`User ${name} not found`));
                    }
                    else {
                        const user = new user_model_1.User(row.id, row.username, row.email, row.password, row.isAdmin);
                        resolve(user);
                    }
                });
            });
        });
    }
    updateUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run('UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?', [user.username, user.email, user.password, user.id], (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    deleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    validateUserByEmail(email, password) {
        const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
        return new Promise((resolve, reject) => {
            this.db.get(query, [email, password], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(!!row);
                }
            });
        });
    }
    validateUserByName(name, password) {
        const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
        return new Promise((resolve, reject) => {
            this.db.get(query, [name, password], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(!!row);
                }
            });
        });
    }
    loadLaunchers() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM launchers', (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    const launchers = rows.map(row => new launcher_model_1.Launcher(row.id, row.address));
                    resolve(launchers);
                }
            });
        });
    }
    // Function to create a new launcher
    addLauncher(launcher) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO launchers (address) VALUES (?)', [launcher.address], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    launcher.id = this.lastID;
                    resolve(launcher);
                }
            });
        });
    }
    updateLauncher(launcher) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run('UPDATE launchers SET address = ? WHERE id = ?', [launcher.address, launcher.id], (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    // Function to delete a launcer address
    deleteLauncher(launcherId) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM launchers WHERE id = ?', [launcherId], (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    // Functiom to update lauchher available apps and it's schema
    updateLauncherAppsSchema(launcherId, schemas) {
        return new Promise((resolve, reject) => {
            const obj = Object.fromEntries(schemas);
            this.db.run('INSERT OR REPLACE INTO launchers_apps_schema (id, schemas) VALUES (?, ?)', [launcherId, JSON.stringify(obj)], (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    // Function the get launcher avaialble apps and theyr's schema
    launcherAppsSchema(launcherId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM launchers_apps_schema WHERE id = ?', [launcherId], (err, row) => {
                if (err) {
                    reject(err);
                }
                else if (!row) {
                    reject(new Error(`Launcher ${launcherId} not found`));
                }
                else {
                    const schemas = row.schemas;
                    const obj = JSON.parse(schemas);
                    resolve(new Map(Object.entries(obj)));
                }
            });
        });
    }
    // load scenes
    loadScenes() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM scenes', (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const scenes = rows.map(row => { return Object.assign(Object.assign({}, JSON.parse(row.scene)), { id: row.id }); });
                        resolve(scenes);
                    }
                });
            });
        });
    }
    // Function to save a scene
    saveScene(scene) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO scenes (scene) VALUES (?)', [JSON.stringify(scene)], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.lastID);
                }
            });
        });
    }
    updateScene(scene) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run('UPDATE scenes SET scene = ? WHERE id = ?', [JSON.stringify(scene), scene.id], (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    deleteScene(sceneId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run('DELETE FROM scenes WHERE id = ?', [sceneId], (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}
exports.AppDataBase = AppDataBase;
