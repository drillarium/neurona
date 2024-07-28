"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
/* user model */
class User {
    constructor(id, username, email, password, isAdmin) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.isAdmin = isAdmin;
    }
}
exports.User = User;
