"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentVersion = void 0;
var versionHistory = {
    currentVersion: {
        version: "1.0.0",
        changes: ["Initial release"]
    },
    previousVersions: []
};
function getCurrentVersion() {
    return versionHistory.currentVersion;
}
exports.getCurrentVersion = getCurrentVersion;
