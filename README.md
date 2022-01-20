# Github Action for scanning pnpm projects with Snyk

Allows for pnpm projects to be scanned in a similar manner as for npm projects on Snyk.

## Usage

Steps:

1. Add your Snyk API token as a GitHub secret, e.g. `snykToken`
2. Create `.github/workflows/snyk.yaml` with the following content:

  ```yaml
  name: PNPM-PR-Snyk-Check

  on: 
    pull_request:
      types: [opened,reopened,synchronized]
    push:
      branches:
        - main
    
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
          # breakBuild: "false"
          # fullScan: "false"
  ```

Once created, any newly opened PR will trigger the workflow.
After merging it into your repo's main branch, it will monitor the project in the corresponding `snykOrganization`.

### Optional Action Inputs to override default values

```yaml
snykToken:
  description: "Snyk token"
  required: true
  default: ""

snykOrganization:
  description: "Snyk organization"
  required: true
  default: ""

breakBuild:
  description: "Boolean flag to break build if new issue(s) - default true"
  required: false
  default: "true"

showDepsInfo:
  description: "Enable dependency change details"
  required: false
  default: "false"

pnpmLockfilePath:
  description: "Path to pnpm lock file"
  required: false
  default: "."

debug:
  description: "Enable debug mode - boolean"
  required: false
  default: "false"

snykArguments:
  description: "Series of argument you would pass Snyk test"
  required: false
  default: ""

fullScan:
  description: "Enable to break if contains any issues, not just newly introduced issues"
  required: false
  default: "false"

branchPattern:
  description: "Branch pattern for which this logic should kick in"
  required: false
  default: ""
```
