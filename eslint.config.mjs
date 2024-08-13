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
      'n/no-unpublished-import': ['off'],
    },
  },
];
