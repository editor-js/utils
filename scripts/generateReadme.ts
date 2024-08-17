import * as fs from 'fs-extra';
import * as path from 'path';
import * as ts from 'typescript';

/**
 * Parse the first line of JSDoc description from a method node
 * @param node - TypeScript AST node
 * @returns First line of JSDoc description string
 */
function parseJSDocDescription(node: ts.Node): string {
  const jsDocs = ts.getJSDocCommentsAndTags(node);

  if (jsDocs.length > 0) {
    const comment = jsDocs.find(doc => ts.isJSDoc(doc));

    if (comment && ts.isJSDoc(comment)) {
      const commentText = comment.comment;

      if (commentText !== undefined) {
        const description = typeof commentText === 'string' ? commentText : commentText.map(c => c.text).join(' ');
        const firstLine = description.split('\n')[0];

        return firstLine;
      }
    }
  }

  return '';
}

/**
 * Extract method names, descriptions, and file paths from a TypeScript file
 * @param filePath - Path to the TypeScript file
 * @returns Array of strings with function name, description, and file path
 */
function extractMethodDescriptions(filePath: string): string[] {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);
  const descriptions: string[] = [];
  const relativePath = path.relative(path.join(__dirname, '../packages'), filePath).replace(/\\/g, '/');

  /**
   * Visits each node in the AST and extracts method names, descriptions, and file paths
   * @param node - The current TypeScript AST node
   */
  function visit(node: ts.Node): void {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const functionName = node.name.text;
      const description = parseJSDocDescription(node);

      if (description) {
        const githubUrl = `https://github.com/editor-js/utils/blob/main/packages/${relativePath}`;

        descriptions.push(`- [${functionName}](${githubUrl}) - ${description}`);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return descriptions;
}

/**
 * Extract the description from package.json
 * @param packageDir - Directory path where package.json is located
 * @returns The description from package.json, or a default message if not found
 */
function extractPackageDescription(packageDir: string): string {
  const packageJsonPath = path.join(packageDir, 'package.json');

  // Check if package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`package.json not found in ${packageDir}`);

    return 'Description not available';
  }

  try {
    // Read and parse package.json
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const packageJson = fs.readJSONSync(packageJsonPath);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    return (Boolean(packageJson.description)) ? packageJson.description : 'Description not available';
  } catch (error) {
    console.error(`Failed to read or parse ${packageJsonPath}:`, error);

    return 'Description not available';
  }
}

/**
 * Returns array of paths to the files in srcPath directory (except index.ts files)
 * @param srcPath - path to the src directory
 * @returns array of the paths to the files
 */
function getFilePaths(srcPath: string): string[] {
  let filePaths: string[] = [];

  /**
   * Function for recursive check of the directory
   * @param directory - directory for recursive file searching
   */
  function exploreDirectory(directory: string): void {
    /**
     * Get all elements in current directory
     */
    const items = fs.readdirSync(directory);

    items.forEach((item) => {
      const itemPath = path.join(directory, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        exploreDirectory(itemPath);
      } else if (stats.isFile() && item.endsWith('.ts') && !item.endsWith('.test.ts') && item !== 'index.ts') {
        /**
         * If this file is .ts and not .test.ts, then we add it to the paths
         */
        filePaths.push(itemPath);
      }
    });
  }

  exploreDirectory(srcPath);

  return filePaths;
}

/**
 * Generate README.md documentation by parsing TypeScript files
 * @param dirPath - Directory path
 */
function generateDocs(dirPath: string): void {
  const packageName = path.basename(dirPath);
  const srcPath = path.join(dirPath, 'src');
  const files = getFilePaths(srcPath);
  const readmePath = path.join(dirPath, 'README.md');
  const docContent: string[] = [`# @editorjs/${packageName}`];
  const docFooter: string = '# About CodeX\n \
  <img align="right" width="120" height="120" src="https://codex.so/public/app/img/codex-logo.svg" hspace="50">\n\n \
  CodeX is a team of digital specialists around the world interested in building high-quality open source products on a global market. We are [open](https://codex.so/join) for young people who want to constantly improve their skills and grow professionally with experiments in cutting-edge technologies.\n\n\
  | 🌐 | Join  👋  | Twitter | Instagram |\n \
  | -- | -- | -- | -- | \n \
  | [codex.so](https://codex.so) | [codex.so/join](https://codex.so/join) |[@codex_team](http://twitter.com/codex_team) | [@codex_team](http://instagram.com/codex_team/) |';
  const description = extractPackageDescription(dirPath);
  const packageInstall: string = `### Installation \n \
\`\`\`\n \
  npm install @editorjs/${packageName}\n\
\`\`\``;

  docContent.push(description);
  docContent.push(packageInstall);
  docContent.push('### Function list');

  files.forEach((file) => {
    const descriptions = extractMethodDescriptions(file);

    if (descriptions.length > 0) {
      docContent.push(...descriptions);
    }
  });

  docContent.push(docFooter);

  /**
   * Check that we have contents besides header and footer and installation and description of the package
   */
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  if (docContent.length > 5) {
    fs.writeFileSync(readmePath, docContent.join('\n'), 'utf8');
    console.log(`Documentation generated in ${readmePath}`);
  } else {
    console.log(`No documentation found for ${dirPath}`);
  }
}

/**
 * Generate README.md files for all packages
 */
function generateDocsForAllPackages(): void {
  const packagesDir = path.resolve(__dirname, '../packages');
  const packages = fs.readdirSync(packagesDir);

  packages.forEach((pkg) => {
    const pkgPath = path.join(packagesDir, pkg);

    if (fs.lstatSync(pkgPath).isDirectory()) {
      generateDocs(pkgPath);
    }
  });
}

// Execute the script
generateDocsForAllPackages();
