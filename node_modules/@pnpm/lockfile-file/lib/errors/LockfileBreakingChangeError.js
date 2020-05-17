"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
class LockfileBreakingChangeError extends error_1.default {
    constructor(filename) {
        super('LOCKFILE_BREAKING_CHANGE', `Lockfile ${filename} not compatible with current pnpm`);
        this.filename = filename;
    }
}
exports.default = LockfileBreakingChangeError;
