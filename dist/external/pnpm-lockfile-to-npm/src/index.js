#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const processPnpmLockfile_1 = require("./processPnpmLockfile");
const writeNpmPackageLock_1 = require("./writeNpmPackageLock");
const minimist_1 = __importDefault(require("minimist"));
const path_1 = require("path");
function usage() {
    console.info('usage: pnpm-lockfile-to-npm src-lockfile-dir [dst-lockfile-path]');
    console.info('   src-lockfile-dir  directory containing pnpm lockfile');
    console.info('   dst-lockfile-path  path to output npm lockfile to; optional');
}
if (require.main === module) {
    let [lockfileDir, npmLockfilePath] = minimist_1.default(process.argv.slice(2))['_'];
    if (lockfileDir === undefined) {
        usage();
        process.exit(1);
    }
    const lockfilePath = path_1.resolve(lockfileDir, 'pnpm-lock.yaml');
    if (npmLockfilePath === undefined) {
        npmLockfilePath = path_1.resolve(lockfileDir, 'package-lock.json');
    }
    console.info('Source pnpm lockfile: ' + lockfilePath);
    console.info('Destination npm lockfile: ' + npmLockfilePath);
    (async () => {
        process.on('unhandledRejection', up => { throw up; });
        const packageLock = await processPnpmLockfile_1.processPnpmLockfile(lockfilePath);
        await writeNpmPackageLock_1.writeNpmPackageLock(packageLock, npmLockfilePath);
    })().catch(e => {
        throw e;
    });
}
//# sourceMappingURL=index.js.map