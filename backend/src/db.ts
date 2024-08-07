import * as sqlite3 from 'sqlite3';
import { User } from './users/user.model';
import { Launcher } from './launcher/launcher.model';
import { logger } from './logger';
import { IScene } from './multiviewer/scene';

// database
export class AppDataBase {
    private static instance: AppDataBase;
    private db!: sqlite3.Database;

    private constructor() {}

    public async init(db: string) : Promise<void> {
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
                        logger.error(err.message);      
                        reject(err);           
                        return;
                    }
                    if (!row) {
                        this.db.run('INSERT INTO users (username, email, password, isAdmin) VALUES (?, "", ?, 1)', [adminUsername, adminPassword], (err) => {
                            if (err) {
                                logger.error(err.message);
                            } else {
                                logger.info('Admin user created successfully');
                            }
                        });
                    } else {
                        logger.info('Admin user already exists');
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
                        logger.error(err.message);
                        reject(err);
                        return;
                    }
                    if (!row) {
                        this.db.run('INSERT INTO launchers (address) VALUES (?)', [launcherUrl], (err) => {
                            if (err) {
                                logger.error(err.message);
                                reject(err);
                            } else {
                                logger.info(`Server ${launcherUrl} added successfully`);
                                resolve();
                            }                            
                        });
                    } else {
                        logger.info(`Server ${launcherUrl} already exists`);
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
    }

    public static getInstance(): AppDataBase {
        if (!AppDataBase.instance) {
            AppDataBase.instance = new AppDataBase();
        }
        return AppDataBase.instance;
    }

    public async loadUsers(): Promise<User[]> {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM users', (err, rows: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    const users: User[] = rows.map(row => new User(row.id, row.username, row.email, row.password, row.isAdmin));
                    resolve(users);
                }
            });
        });
    }

    public async saveUser(user: User): Promise<User> {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO users (username, email, password, isAdmin) VALUES (?, ?, ?, ?)', [user.username, user.email, user.password, user.isAdmin], function (err) {
                if (err) {
                    reject(err);
                } else {
                    user.id = this.lastID;
                    resolve(user);
                }
            });
        });
    }

    public async getUserById(userId: number): Promise<User> {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row : any) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    reject("User not found");
                } else {
                    const user = new User(row.id, row.username, row.email, row.password, row.isAdmin);
                    resolve(user);
                }
            });
        });
    }

    public async getUserByEmail(email: string): Promise<User> {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row : any) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    reject(new Error(`User ${email} not found`));
                } else {
                    const user = new User(row.id, row.username, row.email, row.password, row.isAdmin);
                    resolve(user);
                }
            });
        });
    }

    public async getUserByName(name: string): Promise<User> {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE username = ?', [name], (err, row : any) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    reject(new Error(`User ${name} not found`));
                } else {
                    const user = new User(row.id, row.username, row.email, row.password, row.isAdmin);
                    resolve(user);
                }
            });
        });
    }    

    public async updateUser(user: User): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?', [user.username, user.email, user.password, user.id], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public async deleteUser(userId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public validateUserByEmail(email: string, password: string): Promise<boolean> {
        const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
        return new Promise((resolve, reject) => {
            this.db.get(query, [email, password], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(!!row);
                }
            });
        });
    }

    public validateUserByName(name: string, password: string): Promise<boolean> {
        const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
        return new Promise((resolve, reject) => {
            this.db.get(query, [name, password], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(!!row);
                }
            });
        });
    }    

    public loadLaunchers() : Promise<Launcher[]>{
        return new Promise((resolve, reject) => {
          this.db.all('SELECT * FROM launchers', (err, rows: any[]) => {
            if (err) {
              reject(err);
            } else {
              const launchers: Launcher[] = rows.map(row => new Launcher(row.id, row.address));
              resolve(launchers);           
            }
          });
        });
    }

    // Function to create a new launcher
    public addLauncher(launcher: Launcher) : Promise<Launcher> {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO launchers (address) VALUES (?)', [launcher.address], function (err) {
                if (err) {
                    reject(err);
                } else {
                    launcher.id = this.lastID;
                    resolve(launcher);
                }
            });
        });
    }

    public async updateLauncher(launcher: Launcher): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE launchers SET address = ? WHERE id = ?', [launcher.address, launcher.id], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // Function to delete a launcer address
    public deleteLauncher(launcherId: number) : Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM launchers WHERE id = ?', [launcherId], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // Functiom to update lauchher available apps and it's schema
    public updateLauncherAppsSchema(launcherId: number, schemas: Map<string, any>) : Promise<void> {
        return new Promise((resolve, reject) => {
            const obj = Object.fromEntries(schemas);
            this.db.run('INSERT OR REPLACE INTO launchers_apps_schema (id, schemas) VALUES (?, ?)', [launcherId, JSON.stringify(obj)], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // Function the get launcher avaialble apps and theyr's schema
    public launcherAppsSchema(launcherId: number) : Promise<Map<string, any>> {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM launchers_apps_schema WHERE id = ?', [launcherId], (err, row : any) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    reject(new Error(`Launcher ${launcherId} not found`));
                } else {
                    const schemas = row.schemas;
                    const obj = JSON.parse(schemas);
                    resolve(new Map(Object.entries(obj)));
                }
            });
        });
    }

    // load scenes
    public async loadScenes(): Promise<IScene[]> {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM scenes', (err, rows: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    const scenes: IScene[] = rows.map(row => { return { ... JSON.parse(row.scene), id: row.id }; });
                    resolve(scenes);
                }
            });
        });
    }    

    // Function to save a scene
    public saveScene(scene: IScene) : Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO scenes (scene) VALUES (?)', [JSON.stringify(scene)], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    public async updateScene(scene: IScene): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE scenes SET scene = ? WHERE id = ?', [JSON.stringify(scene), scene.id], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }    

    public async deleteScene(sceneId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM scenes WHERE id = ?', [sceneId], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }    

    public close(): void {
        if(this.db) {
            this.db.close();
        }
    }
}