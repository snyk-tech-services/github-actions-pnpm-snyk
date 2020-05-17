"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const processPnpmLockfile_1 = require("../src/processPnpmLockfile");
const path_1 = require("path");
const fs_1 = require("fs");
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
chai_1.default.use(chai_as_promised_1.default);
const expect = chai_1.default.expect;
describe('processPnpmLockfile.ts', () => {
    describe('loading pnpm lockfile', () => {
        it('throws an exception when loading pnpm lockfile fails', async () => {
            const lockfilePath = '/tmp/Rf3QEp35hLexvKgU/pnpm-lock.json';
            await expect(processPnpmLockfile_1.processPnpmLockfile(lockfilePath))
                .to.be.rejectedWith(Error, 'Failed to load pnpm lock file ' + lockfilePath);
        });
    });
    describe('processing pnpm lockfile', () => {
        it('processes a lockfile with a single dependency', async () => {
            const result = await processPnpmLockfile_1.processPnpmLockfile(path_1.resolve(__dirname, 'data', 'single-dependency.yaml'));
            const expected = parseJsonFile('single-dependency.json');
            expect(result).to.deep.equal(expected);
        });
        it('throws an exception when a package corresponding with a dependency can not be found', async () => {
            await expect(processPnpmLockfile_1.processPnpmLockfile(path_1.resolve(__dirname, 'data', 'invalid-dependency.yaml')))
                .to.be.rejectedWith(Error, 'Failed to lookup /is-positive/3.1.0 in packages');
        });
        it('throws an exception when a package subdependency can not be found', async () => {
            await expect(processPnpmLockfile_1.processPnpmLockfile(path_1.resolve(__dirname, 'data', 'missing-subdependency.yaml')))
                .to.be.rejectedWith(Error, 'Failed to lookup /is-positive/3.0.1 in dependencies; used by fake-package');
        });
        it('processes a lockfile with multiple versions of the same dependency', async () => {
            const result = await processPnpmLockfile_1.processPnpmLockfile(path_1.resolve(__dirname, 'data', 'multi-version-dependency.yaml'));
            const expected = parseJsonFile('multi-version-dependency.json');
            expect(result).to.deep.equal(expected);
        });
        it('translates a pnpm version number required in a subdependency into an npm version number', async () => {
            const result = await processPnpmLockfile_1.processPnpmLockfile(path_1.resolve(__dirname, 'data', 'subdependency-pnpm-version.yaml'));
            const expected = parseJsonFile('subdependency-pnpm-version.json');
            expect(result).to.deep.equal(expected);
        });
        it('throws an exception when a dependency with an invalid GitHub URI is encountered', async () => {
            await expect(processPnpmLockfile_1.processPnpmLockfile(path_1.resolve(__dirname, 'data', 'github-invalid-uri.yaml')))
                .to.be.rejectedWith(Error, 'Error parsing github URI github.com/kevva/is-positive');
        });
        it('processes a lockfile with a package version that is a github scheme URI', async () => {
            const result = await processPnpmLockfile_1.processPnpmLockfile(path_1.resolve(__dirname, 'data', 'github-scheme-dependency.yaml'));
            const expected = parseJsonFile('github-scheme-dependency.json');
            expect(result).to.deep.equal(expected);
        });
        it('processes a lockfile with a subdependency version that is a github scheme URI', async () => {
            const result = await processPnpmLockfile_1.processPnpmLockfile(path_1.resolve(__dirname, 'data', 'github-scheme-subdependency.yaml'));
            const expected = parseJsonFile('github-scheme-subdependency.json');
            expect(result).to.deep.equal(expected);
        });
        it('processes a lockfile with a dependency with a version that is a package path', async () => {
            const result = await processPnpmLockfile_1.processPnpmLockfile(path_1.resolve(__dirname, 'data', 'dependency-path-version.yaml'));
            const expected = parseJsonFile('dependency-path-version.json');
            expect(result).to.deep.equal(expected);
        });
        it('processes a lockfile with a dependency with a version that is a URI host and path', async () => {
            const result = await processPnpmLockfile_1.processPnpmLockfile(path_1.resolve(__dirname, 'data', 'uri-host-and-path.yaml'));
            const expected = parseJsonFile('uri-host-and-path.json');
            expect(result).to.deep.equal(expected);
        });
    });
});
function parseJsonFile(filename) {
    const path = path_1.resolve(__dirname, 'data', filename);
    const data = fs_1.readFileSync(path, 'utf8');
    return JSON.parse(data);
}
//# sourceMappingURL=processPnpmLockfile.spec.js.map