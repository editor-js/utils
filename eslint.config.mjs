import CodeX from 'eslint-config-codex';
/**
 * @todo connect architecture config
 */
export default [
  ...CodeX,
  {
    name: 'ts-notex.web',
    ignores: ['eslint.config.mjs'],
    /**
     * This are the options for typescript files
     */
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: './',
        sourceType: 'module', // Allows for the use of imports
      },
    },

    rules: {
      'n/no-missing-import': ['off'],
      'n/no-extraneous-import': ['error', {
        allowModules: ['nanoid'],
      }],
      'n/no-unpublished-import': ['off'],
      'n/no-unsupported-features/node-builtins': ['error', {
        version: '>=22.1.0',
        allowExperimental: true,
      }],
      '@typescript-eslint/naming-convention': ['error', {
        selector: 'property',
        format: ['UPPER_CASE' | 'camelCase'],
      }],
    },
  },
];
