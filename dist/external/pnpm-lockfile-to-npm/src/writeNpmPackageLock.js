"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const writeFileAtomic = require("write-file-atomic");
async function writeNpmPackageLock(packageLock, filename) {
    const json = JSON.stringify(packageLock, null, 4);
    await writeFileAtomic(filename, json, (err) => { if (err) {
        throw err;
    } });
}
exports.writeNpmPackageLock = writeNpmPackageLock;
//# sourceMappingURL=writeNpmPackageLock.js.map