"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@pnpm/constants");
const fs = require("fs");
const path = require("path");
exports.default = (pkgPath) => new Promise((resolve, reject) => {
    fs.access(path.join(pkgPath, constants_1.WANTED_LOCKFILE), (err) => {
        if (!err) {
            resolve(true);
            return;
        }
        if (err.code === 'ENOENT') {
            resolve(false);
            return;
        }
        reject(err);
    });
});
