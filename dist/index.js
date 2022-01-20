"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAction = void 0;
const github = require('@actions/github');
const core = require('@actions/core');
const snyk_delta_1 = require("snyk-delta");
const processPnpmLockfile_1 = require("./compass/processPnpmLockfile");
const writeNpmPackageLock_1 = require("./compass/writeNpmPackageLock");
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const runAction = async () => {
    const breakBuild = core.getInput('breakBuild') == 'true' ? true : false;
    try {
        const snykToken = core.getInput('snykToken');
        const snykOrganization = core.getInput('snykOrganization');
        const path = core.getInput('pnpmLockfilePath') == '.' ? '/' : core.getInput('pnpmLockfilePath');
        const debug = core.getInput('debugMode');
        const showDeps = core.getInput('showDepsInfo');
        const snykArguments = core.getInput('snykArguments');
        const fullScan = core.getInput('fullScan') == 'true' ? true : false;
        const payload = github.context.payload;
        let snykArgs = snykArguments;
        checkSnykToken(snykToken);
        if (snykArgs != '') {
            checkSnykArgs(snykArgs);
        }
        const snykAuth = child_process_1.execSync(`npx snyk auth ${snykToken}`);
        const packageLock = await processPnpmLockfile_1.processPnpmLockfile(path + "pnpm-lock.yaml");
        await writeNpmPackageLock_1.writeNpmPackageLock(packageLock, path + "package-lock.json");
        snykArgs = '--org=' + snykOrganization + ' ' + snykArgs;
        if (payload.commits && payload.head_commit) {
            // On push, monitor
            const cmd = `npx snyk monitor ${snykArgs}`;
            const snykTest = child_process_1.execSync(cmd, { cwd: path });
            console.log(snykTest.toString());
        }
        else if (payload.pull_request) {
            const snykShowDepsArg = showDeps ? '' : '--print-deps';
            if (snykArgs.indexOf('--json') < 0 && !fullScan) {
                snykArgs = '--json ' + snykArgs;
            }
            if (snykArgs.indexOf('--print-deps') < 0 && showDeps) {
                snykArgs = snykShowDepsArg + ' ' + snykArgs;
            }
            if (!breakBuild) {
                console.log("================================");
                console.log("         NON BLOCKING MODE      ");
                console.log("================================");
            }
            if (fullScan) {
                const cmd = breakBuild ? `npx snyk test ${snykArgs}` : `npx snyk test ${snykArgs} || true`;
                try {
                    const snykTest = child_process_1.execSync(cmd, { cwd: path });
                    console.log(snykTest.toString());
                }
                catch (err) {
                    console.log(err.stdout.toString());
                    if (!breakBuild) {
                        process.exit(0);
                    }
                    else {
                        process.exit(1);
                    }
                }
            }
            else {
                const snykTest = child_process_1.execSync(`npx snyk test ${snykArgs} > out || true`, { cwd: path });
                if (debug) {
                    console.log("================================");
                    console.log("              DEBUG             ");
                    console.log("================================");
                    console.log("Converted lock file");
                    console.log(fs.readFileSync(path + 'package-lock.json').toString());
                    console.log("================================");
                    console.log("DEBUG - Snyk CLI commands");
                    console.log("DEBUG - Snyk auth");
                    console.log(snykAuth.toString());
                    console.log("DEBUG - Snyk test");
                    console.log(snykTest.toString());
                    console.log("================================");
                    console.log("          END OF DEBUG          ");
                    console.log("================================");
                }
                const result = await snyk_delta_1.getDelta(fs.readFileSync(path + 'out').toString());
                switch (result) {
                    case 1:
                        if (!breakBuild) {
                            process.exit(0);
                        }
                        else {
                            core.setFailed("New issue(s) introduced !");
                            process.exit(1);
                        }
                    case 2:
                        console.log("Error during delta computation - defaulting to full scan");
                        // Resets exit code
                        process.exitCode = 0;
                        let snykArgsNormal = snykArgs.replace('--json ', '');
                        if (!breakBuild) {
                            snykArgsNormal = snykArgsNormal + ' || true';
                        }
                        try {
                            const snykTest = child_process_1.execSync(`npx snyk test ${snykArgsNormal}`, { cwd: path });
                            console.log(snykTest.toString());
                        }
                        catch (err) {
                            console.log(err.stdout.toString());
                            if (!breakBuild) {
                                process.exit(0);
                            }
                            else {
                                process.exit(1);
                            }
                        }
                        break;
                    default:
                }
            }
        }
        else {
            console.log("Unexpected event type - works on PRs and Push events");
        }
    }
    catch (err) {
        console.log("Failed Check !");
        if (breakBuild) {
            core.setFailed(err);
        }
        else {
            console.log(err);
        }
    }
};
exports.runAction = runAction;
const checkSnykToken = (snykToken) => {
    const regex = /[^a-f0-9\-]/;
    if (!isStringAgainstRegexOK(snykToken, regex)) {
        throw new Error("Unauthorized characters in snyk token");
    }
};
const checkSnykArgs = (snykArgs) => {
    const regex = /[^a-zA-Z0-9\/\-_\\=\.\" ]/;
    if (!isStringAgainstRegexOK(snykArgs, regex)) {
        throw new Error("Unauthorized characters in snyk args");
    }
};
const isStringAgainstRegexOK = (stringItem, regex) => {
    const blacklistedCharacters = stringItem.match(regex);
    if (blacklistedCharacters && blacklistedCharacters.length > 0) {
        return false;
    }
    return true;
};
if (!module.parent) {
    runAction();
}
//# sourceMappingURL=index.js.map