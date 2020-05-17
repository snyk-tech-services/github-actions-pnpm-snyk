"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github = require('@actions/github');
const core = require('@actions/core');
const snyk = require('snyk');
const snykprevent = require('/home/antoine/Documents/SnykTSDev/snyk-prevent/dist/index');
async function runAction() {
    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set myToken with the GitHub Secret Token
    // myToken: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    try {
        const snykToken = core.getInput('snykToken');
        // const snykFixBranchPattern = core.getInput('branchPattern')
        // const payload = github.context.payload
        // const ORGANIZATION = payload.organization.login
        // const REPO = payload.pull_request.base.repo.name
        // const BRANCH = payload.pull_request.head.ref
        // const DIFFURL = payload.pull_request.diff_url
        //`https://patch-diff.githubusercontent.com/raw/mtyates/puppet_webapp/pull/3.diff`
        // if(BRANCH.startsWith(snykFixBranchPattern)) {    
        //     // DO Whatever
        // }
        // 1. Convert pnpm lock into package-lock.json
        // if PR
        // 2. run Snyk test --json
        // 3. run snyk prevent
        // else if merged in default branch
        // 2. run snyk monitor
        const resultsJson = await snyk.test(".", { "print-deps": true, "json": true });
        console.log(resultsJson);
        console.log('fd');
        //console.log(await snykprevent(resultsJson))
    }
    catch (err) {
        console.log(err);
    }
}
runAction();
//# sourceMappingURL=index.js.map