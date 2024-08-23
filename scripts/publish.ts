import { execSync } from 'child_process';
import * as process from 'process';
import * as path from 'path';
import { pathExistsSync, statSync, readdirSync, readJsonSync } from 'fs-extra';

const packagesDir = path.join(__dirname, '..', 'packages');

/**
 * Interface that represents package.json used data
 */
interface Package {
  /**
   * Name of the package
   */
  name: string;

  /**
   * Version of the package
   */
  version: string;

  /**
   * Link to the published npm package
   */
  link: string;
}

/**
 * Function that returns names of all packages in /packages directory
 */
function getPackages(): Package[] {
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

  const packages: Package[] = directories.map((dir) => {
    return readJsonSync(path.join('packages', dir, 'package.json')) as Package;
  });

  return packages;
}

execSync('npm run build', { stdio: 'inherit' });

let command = 'yarn npm publish --access public --tolerate-republish';

const packages = getPackages();

/**
 * For each package run yarn npm publish
 */
for (const { name, version, link } of packages) {
  const response = execSync(command, { cwd: path.join('packages', name.replace('@editorjs/', '')),
    encoding: 'utf8' });

  /**
   * If version of any package was updated, then notify, otherwise pass
   */
  if (!response.includes('Registry already knows about version') && process.env.NOTIFY_WEBHOOK !== undefined) {
    /**
     * Use notification webhook from workflow (script will not work fro)
     */
    fetch(process.env.NOTIFY_WEBHOOK, {
      method: 'POST',
      headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        message: `📦 [${name}](${link}) ${version} was published`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        parse_mode: 'Markdown',
      }),
    })
      .catch(error => console.error('Error:', error));
  }
}
