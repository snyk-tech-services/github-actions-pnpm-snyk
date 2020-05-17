# Github action to snyk test and monitor pnpm projects


Testing some stuff


<!-- Add Circle + Snyk badges here -->

Allows for pnpm projects to be scanned in a similar manner as for NPM projects on Snyk.


## Usage

Public github action makes it very easy to use. 
In your repo:
1. Add your github token as a secret
2. Create .github/workflows/main.yaml with the following

```
name: PNPM-PR-Snyk-Check

on: 
  pull_request:
    types: [opened,reopened,synchronized]
  push:
    branches:
      - master
  
jobs:
  pnpm_snyk_check:
    runs-on: ubuntu-latest
    name: Snyk post processing
    steps:
    - uses: actions/checkout@v2
    - name: pnpm Snyk Delta
      id: pnpm-snyk-delta
      uses: snyk-tech-services/github-actions-pnpm-snyk@master
      with:
        snykToken: ${{ secrets.snykToken }}
        pnpmLockfilePath: "tests/fixtures/with-tslint/"
        snykOrganization: playground
        # snykArguments: "--severity-threshold=high"
        # breakBuild: false
        # fullScan: false


```
        

Once there, any newly opened PR will trigger your logic.
Merging to master (change for branch name of your choice) will monitor the project in the corresponding `snykOrganization`.

### Optional Action Inputs to override default values
```
snykToken:
  description: 'Snyk token'
  required: true
  default: ''

snykOrganization:
  description: 'Snyk organization'
  required: true
  default: ''

breakBuild:
  description: 'Boolean flag to break build if new issue(s) - default true'
  required: false
  default: true

showDepsInfo:
  description: 'Enable dependency change details'
  required: false
  default: false

pnpmLockfilePath:
  description: 'Path to pnpm lock file'
  required: false
  default: '.'

debug:
  description: 'Enable debug mode - boolean'
  required: false
  default: false

snykArguments:
  description: 'Series of argument you would pass Snyk test'
  required: false
  default: ''
  
fullScan:
  description: 'Enable to break if contains any issues, not just newly introduced issues'
  required: false
  default: false
  ```