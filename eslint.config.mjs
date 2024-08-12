import CodeX from 'eslint-config-codex';

/**
 * @todo connect architecture config
 */
export default [
  // ...CodeX,
  ...{
    name: 'ts-editorjs/utils',

    /**
     * This are the options for typescript files
     */
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: './',
        sourceType: 'module', // Allows for the use of imports
      },
    },
    rules: {
      'n/no-unpublished-import': ['off'],
    },
  },
];
