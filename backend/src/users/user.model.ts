/* user model */
export class User {
    id: number;
    username: string;
    email: string;
    password: string;
    isAdmin: boolean;

    constructor(id: number, username: string, email: string, password: string, isAdmin: boolean) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.isAdmin = isAdmin;
    }
}