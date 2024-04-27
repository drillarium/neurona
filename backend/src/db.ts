import * as sqlite3 from 'sqlite3';
import { User } from './users/user.model';

// database
export class AppDataBase {
    private static instance: AppDataBase;
    private db: sqlite3.Database;

    private constructor() {
        // Open a SQLite database connection
        this.db = new sqlite3.Database('backend.db');
        // Create a users table if it doesn't exist
        this.db.serialize(() => {
            this.db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                email TEXT,
                password TEXT
            )`);
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
                    const users: User[] = rows.map(row => new User(row.id, row.username, row.email, row.password));
                    resolve(users);
                }
            });
        });
    }

    public async saveUser(user: User): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [user.username, user.email, user.password], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public async getUserById(userId: number): Promise<User | undefined> {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row : any) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(undefined);
                } else {
                    const user = new User(row.id, row.username, row.email, row.password);
                    resolve(user);
                }
            });
        });
    }

    public async getUserByEmail(email: string): Promise<User | undefined> {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row : any) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(undefined);
                } else {
                    const user = new User(row.id, row.username, row.email, row.password);
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

    public validateUser(email: string, password: string): Promise<boolean> {
        const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
        return new Promise((resolve, reject) => {
            this.db.get(query, [email, password], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(!!row); // If row exists, user is valid
                }
            });
        });
    }

    public close(): void {
        this.db.close();
    }
}