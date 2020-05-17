const github = require('@actions/github')
const core = require('@actions/core')
import { getDelta } from 'snyk-delta'
import { processPnpmLockfile  } from './compass/processPnpmLockfile'
import { writeNpmPackageLock  } from './compass/writeNpmPackageLock'
import { execSync } from 'child_process';
import * as fs from 'fs'


const runAction = async () => {
     
    const breakBuild: boolean = core.getInput('breakBuild') == 'true' ? true : false
    try{
        const snykToken: string = core.getInput('snykToken');
        const snykOrganization: string = core.getInput('snykOrganization');
        const path: string = core.getInput('pnpmLockfilePath') == '.' ? __dirname : core.getInput('pnpmLockfilePath')
        
        const debug: boolean = core.getInput('debugMode')
        const showDeps: boolean = core.getInput('showDepsInfo')
        const snykArguments: string = core.getInput('snykArguments')
        const fullScan = core.getInput('fullScan') == 'true' ? true : false
        const payload = github.context.payload
        let snykArgs: string = snykArguments

        checkSnykToken(snykToken)
        if(snykArgs != '') {
            checkSnykArgs(snykArgs)
        }


        const snykAuth = execSync(`npx snyk auth ${snykToken}`)

        const packageLock = await processPnpmLockfile(path+"pnpm-lock.yaml");
        
        await writeNpmPackageLock(packageLock, path+"package-lock.json"); 

        snykArgs = '--org=' + snykOrganization + ' ' + snykArgs
        

        if(payload.commits && payload.head_commit) {
            // On push, monitor
            const cmd = `npx snyk monitor ${snykArgs}`
            const snykTest = execSync(cmd, {cwd: path })
            console.log(snykTest.toString())

        } else if(payload.pull_request){
            
            const snykShowDepsArg: string = showDeps ? '': '--print-deps'
            if(snykArgs.indexOf('--json') < 0 && !fullScan){
                snykArgs = '--json '+snykArgs
            }
            if(snykArgs.indexOf('--print-deps') < 0 && showDeps){
                snykArgs = snykShowDepsArg + ' ' + snykArgs
            }
            

            if(!breakBuild){
                console.log("================================")
                console.log("         NON BLOCKING MODE      ")
                console.log("================================")
            }
            


            
            if(fullScan) {
                const cmd = breakBuild ? `npx snyk test ${snykArgs}` : `npx snyk test ${snykArgs} || true`
                try {
                    const snykTest = execSync(cmd, {cwd: path })
                    console.log(snykTest.toString())
                } catch (err) {
                    console.log(err.stdout.toString())
                    if(!breakBuild){
                        process.exit(0)
                    } else {
                        process.exit(1)
                    }
                }
            } else {
                const snykTest = execSync(`npx snyk test ${snykArgs} > out || true`, {cwd: path })
                if(debug){
                    console.log("================================")
                    console.log("              DEBUG             ")
                    console.log("================================")
                    console.log("Converted lock file")
                    console.log(fs.readFileSync(path+'package-lock.json').toString())
                    console.log("================================")
                    console.log("DEBUG - Snyk CLI commands")
                    console.log("DEBUG - Snyk auth")
                    console.log(snykAuth.toString())
                    console.log("DEBUG - Snyk test")
                    console.log(snykTest.toString())
                    console.log("================================")
                    console.log("          END OF DEBUG          ")
                    console.log("================================")
                }
                
                const result = await getDelta(fs.readFileSync(path+'out').toString())
                switch(result) {
                    case 1:
                        if(!breakBuild){
                            process.exit(0)
                        } else {
                            core.setFailed("New issue(s) introduced !")
                            process.exit(1)
                        }
                    case 2:
                        console.log("Error during delta computation - defaulting to full scan")
                        // Resets exit code
                        process.exitCode = 0
                        let snykArgsNormal = snykArgs.replace('--json ','')
                        if(!breakBuild) {
                            snykArgsNormal = snykArgsNormal + ' || true'
                        }
                        try {
                            const snykTest = execSync(`npx snyk test ${snykArgsNormal}`, {cwd: path })
                            console.log(snykTest.toString())
                        } catch (err) {
                            console.log(err.stdout.toString())
                            if(!breakBuild){
                                process.exit(0)
                            } else {
                                process.exit(1)
                            }
                        }
                        break;
                    default:
                        
                }
               
                
            }
        } else {
            console.log("Unexpected event type - works on PRs and Push events")
        }
    } catch(err) {
        console.log("Failed Check !")
        if(breakBuild) {
            core.setFailed(err)
        } else {
            console.log(err)
        }

    }
}

const checkSnykToken = (snykToken: string) => {
    const regex = /[^a-f0-9\-]/
    if(!isStringAgainstRegexOK(snykToken,regex)){
        throw new Error("Unauthorized characters in snyk token")
    }
    
}
const checkSnykArgs = (snykArgs: string) => {
    const regex = /[^a-zA-Z0-9\/\-_\\=\.\" ]/
    if(!isStringAgainstRegexOK(snykArgs,regex)) {
        throw new Error("Unauthorized characters in snyk args")
    }
    
}

const isStringAgainstRegexOK = (stringItem: string, regex: RegExp): boolean => {
    const blacklistedCharacters = stringItem.match(regex)
    if (blacklistedCharacters && blacklistedCharacters.length > 0) {
        return false
    }
    return true
}



if(!module.parent){
    runAction()
}
 

export {
    runAction
}
