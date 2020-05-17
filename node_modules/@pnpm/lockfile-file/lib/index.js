"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./read"));
const existsWantedLockfile_1 = require("./existsWantedLockfile");
exports.existsWantedLockfile = existsWantedLockfile_1.default;
const getLockfileImporterId_1 = require("./getLockfileImporterId");
exports.getLockfileImporterId = getLockfileImporterId_1.default;
const write_1 = require("./write");
exports.writeLockfiles = write_1.default;
exports.writeCurrentLockfile = write_1.writeCurrentLockfile;
exports.writeWantedLockfile = write_1.writeWantedLockfile;
