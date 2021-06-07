import { ResolvedDependencies, PackageSnapshots } from '@pnpm/lockfile-file'
import { DEPENDENCIES_FIELDS } from '@pnpm/types'
import readYamlFile from 'read-yaml-file'


interface PnpmPackageLock {
  dependencies?: ResolvedDependencies,
  devDependencies?: ResolvedDependencies,
  optionalDependencies?: ResolvedDependencies,
  lockfileVersion: number,
  packages: PackageSnapshots,
  specifiers: ResolvedDependencies,
}

export interface NpmPackageLock {
  requires?: boolean,
  lockfileVersion: number,
  dependencies: NpmLockedPackageDependencyMap,
}

export interface NpmLockedPackageDependency {
  version?: string,
  resolved?: string,
  from?: string,
  integrity?: string,
  dev?: boolean,
  requires?: NpmLockedPackageRequiresMap,
  dependencies?: NpmLockedPackageSubdependencyMap,
}

export interface NpmLockedPackageDependencyMap {
  [name: string]: NpmLockedPackageDependency,
}

export interface NpmLockedPackageRequiresMap {
  [name: string]: string,
}

export interface NpmLockedPackageSubdependency {
  version: string,
  resolved?: string,
  integrity?: string,
}

export interface NpmLockedPackageSubdependencyMap {
  [name: string]: NpmLockedPackageSubdependency,
}

enum PnpmPackageDescType {
  Version,
  Github,
  Uri,
};

interface PnpmPackageDesc {
  type: PnpmPackageDescType,
  fullname: string,
  name: string,
  version: string,
  extra?: string,
}

export async function processPnpmLockfile(lockfilePath: string) {
  const lockfile = await readPnpmLockfile(lockfilePath);
  if (lockfile == null) {
    throw new Error('Failed to load pnpm lock file ' + lockfilePath);
  }
  
  return processLockfile(lockfile);
}

async function readPnpmLockfile(lockfilePath: string): Promise<PnpmPackageLock | null> {
  try {
    return await readYamlFile<PnpmPackageLock>(lockfilePath)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
    return null;
  }
}

function getGithubPackageDesc(uri: string): PnpmPackageDesc {
  const result = /^github.com\/([^\/]+\/([^\/]+))\/([0-9a-f]{40})$/.exec(uri)
  if (result == null) {
    throw new Error("Error parsing github URI " + uri);
  }
  const versionUri = 'github:' + result[1] + '#' + result[3];
  const name = result[2];
  return { type: PnpmPackageDescType.Github, fullname: uri, name, version: versionUri };
}

// Package names look like:
//   /@pnpm/error/1.0.0
//   /@pnpm/lockfile-file/1.1.3_@pnpm+logger@2.1.1
//   /@emotion/core/10.0.14_react@16.8.6
//   /@uc/modal-loader/0.7.1_2eb23211954108c6f87c7fe8e90d1312
//   npm.example.com/axios/0.19.0
//   npm.example.com/@sentry/node/5.1.0_@other@1.2.3
//   github.com/LewisArdern/eslint-plugin-angularjs-security-rules/41da01727c87119bd523e69e22af2d04ab558ec9
function getPathPackageDesc(fullname: string): PnpmPackageDesc {
  if (!fullname.startsWith('github.com/')) {
    const result = /^[^\/]*\/((?:@[^\/]+\/)?[^\/]+)\/(.*)$/.exec(fullname)
    if (result == null) {
      throw new Error("Error parsing package name " + fullname);
    }

    let type;
    if (fullname[0] === '/') {
      type = PnpmPackageDescType.Version;
    } else {
      type = PnpmPackageDescType.Uri;
    }

    const name = result[1];
    const version = result[2];
    let versionNumber;
    let extra;
    const firstUnderscore = version.indexOf('_');  
    if (firstUnderscore != -1) {
      versionNumber = version.substr(0, firstUnderscore)
      extra = version.substr(firstUnderscore + 1)
    } else {
      versionNumber = version;
    }
    return { type, fullname, name, version: versionNumber, extra }
  } else {
    return getGithubPackageDesc(fullname);
  }
}

// A package in the 'dependencies' section of the lockfile
function getDependencyPackageDesc(name: string, version: string): PnpmPackageDesc {
  if (/^\d/.test(version)) {
    return getPathPackageDesc(['', name, version].join('/'));
  } else {
    return getPathPackageDesc(version);
  }
}

function getPackage(lockfile: PnpmPackageLock, packageDesc: PnpmPackageDesc, remove: boolean): NpmLockedPackageDependency {
  const snapshot = (lockfile.packages || {})[packageDesc.fullname];
  if (snapshot === undefined) {
    throw new Error('Failed to lookup ' + packageDesc.fullname + ' in packages');
  }

  let dep: NpmLockedPackageDependency;
  dep = { version: packageDesc.version };

  if (packageDesc.type === PnpmPackageDescType.Github && snapshot.name !== undefined) {
    if (lockfile.specifiers[snapshot.name] !== undefined) {
      dep.from = lockfile.specifiers[snapshot.name];
    }
  }

  if ('integrity' in snapshot.resolution) {
    dep.integrity = snapshot.resolution.integrity;
  }

  if (snapshot.dependencies !== undefined) {
    dep.requires = snapshot.dependencies;
  }

  if (snapshot.dev === true) {
    dep.dev = snapshot.dev;
  }

  if (remove) {
    delete lockfile.packages[packageDesc.fullname];
  }
  return dep;
}

function getSubdependencyFromDependency(dep: NpmLockedPackageDependency): NpmLockedPackageSubdependency {
  const subdep = { version: dep.version } as NpmLockedPackageSubdependency;
  if (dep.resolved !== undefined) {
    subdep.resolved = dep.resolved;
  }
  if (dep.integrity !== undefined) {
    subdep.integrity = dep.integrity;
  }
  return subdep;
}

function processLockfile(lockfile: PnpmPackageLock): NpmPackageLock {
  const deps = {} as NpmLockedPackageDependencyMap;
  const subdeps = {} as NpmLockedPackageDependencyMap;

  console.log('processing lock pnpm file')

  // establish precedence of direct dependencies that would exist in node_modules root
  for (const deptype of DEPENDENCIES_FIELDS) {
    let depsMap = lockfile[deptype]
    if (depsMap !== undefined) {
      for (const [name, version] of Object.entries(depsMap)) {  
        const packageDesc = getDependencyPackageDesc(name, version);
        deps[packageDesc.name] = getPackage(lockfile, packageDesc, true);
      }
    }
  }

  // process remaining packages, which must be secondary dependencies
  for (const [key, val] of Object.entries(lockfile.packages)) {
    const packageDesc = getPathPackageDesc(key);
    const pkg = getPackage(lockfile, packageDesc, false);
    if (deps[packageDesc.name] !== undefined) {
      subdeps[packageDesc.fullname] = pkg;
    } else {
      deps[packageDesc.name] = pkg;
    }
  }

  // add required subdependencies from the 'requires' of dependencies
  for (const [key, val] of Object.entries(deps)) {
    if (val.requires !== undefined) {
      for (let [name, version] of Object.entries(val.requires)) {
        const packageDesc = getDependencyPackageDesc(name, version);
        // secondary dependencies are declared in the 'dependencies' of a package
        if (packageDesc.fullname in subdeps) {
          const dep = subdeps[packageDesc.fullname];
          if (val.dependencies === undefined) {
            val.dependencies = {}
          }    
          val.dependencies[name] = getSubdependencyFromDependency(dep);
        } else {
          const dep = deps[name];
          if (dep.version != packageDesc.version) {
            throw new Error('Failed to lookup ' + packageDesc.fullname + ' in dependencies; used by ' + key);
          }
        }

        // remove any extraneous info from the name in 'requires'
        if (packageDesc.extra !== undefined || packageDesc.type == PnpmPackageDescType.Uri) {
          val.requires[name] = packageDesc.version;
        }
      }
    }
  }
  return { requires: true, lockfileVersion: 1, dependencies: deps };
}