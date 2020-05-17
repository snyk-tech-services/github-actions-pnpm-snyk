"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PnpmError extends Error {
    constructor(code, message) {
        super(message);
        this.code = `ERR_PNPM_${code}`;
    }
}
exports.default = PnpmError;
