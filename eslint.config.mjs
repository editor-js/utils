/** eslint-disable-next-line n/no-unpublished-import */
import CodeX from 'eslint-config-codex';
import { plugin as TsPlugin, parser as TsParser } from 'typescript-eslint';
/**
 * @todo connect architecture config
 */
export default [
  ...CodeX,
  {
    name: 'ts-editorjs/utils',
    ignores: ['eslint.config.mjs'],
    /**
     * This are the options for typescript files
     */
    languageOptions: {
      parser: TsParser,
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: './',
        sourceType: 'module', // Allows for the use of imports
      },
    },
    plugins: {
      '@typescript-eslint': TsPlugin,
    },

    rules: {
      'n/no-missing-import': ['off'],
      'n/no-extraneous-import': ['error', {
        allowModules: ['nanoid', '@editorjs/caret', '@editorjs/dom', '@editorjs/helpers', '@editorjs/keyboard'],
      }],
      'n/no-unpublished-import': ['off'],
      'n/no-unsupported-features/node-builtins': ['error', {
        version: '>=22.1.0',
        allowExperimental: true,
      }],
      '@typescript-eslint/naming-convention': ['error', {
        selector: 'property',
        format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
      }],
    },
  },
];
