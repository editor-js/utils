import { execSync } from 'child_process';
import * as path from 'path';
import { pathExistsSync, statSync, readdirSync } from 'fs-extra';

const packagesDir = path.join(__dirname, '..', 'packages');

/**
 * Function that returns names of all packages in /packages directory
 */
function getPackages(): string[] {
  const directories = readdirSync(packagesDir).filter((dir) => {
    /**
     * Actutal path to the package in project
     */
    const pathToPackage = path.join('packages', dir);

    /**
     * Check if path is a directory (not a file)
     * Check if path contains package.json (directory is actually package and could be published)
     */
    return statSync(pathToPackage).isDirectory() && pathExistsSync(path.join(pathToPackage, 'package.json'));
  });

  return directories;
}

execSync('npm run build', { stdio: 'inherit' });

let command = 'npm publish --access public';

const packages = getPackages();

/**
 * For each package run yarn npm publish
 */
for (const name of packages) {
  execSync(command, { stdio: 'inherit',
    cwd: path.join('packages', name) });
}
