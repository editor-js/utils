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
 * Generate README.md documentation by parsing TypeScript files
 * @param dirPath - Directory path
 */
function generateDocs(dirPath: string): void {
  const packageName = path.basename(dirPath);
  const srcPath = path.join(dirPath, 'src');
  const files = fs.readdirSync(srcPath).filter(file => file.endsWith('.ts') && file !== 'index.ts');
  const readmePath = path.join(dirPath, 'README.md');
  const docContent: string[] = [`# @editorjs/${packageName}`, ''];

  files.forEach((file) => {
    const filePath = path.join(srcPath, file);
    const descriptions = extractMethodDescriptions(filePath);

    if (descriptions.length > 0) {
      docContent.push(...descriptions);
    }
  });

  if (docContent.length > 1) { // Сначала заголовок, поэтому минимум 2 строки
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
