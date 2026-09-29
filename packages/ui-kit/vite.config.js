/* eslint-disable */
import path from 'path';

import postcssApply from 'postcss-apply';
import postcssNested from 'postcss-nested';
import postcssPresetEnv from 'postcss-preset-env';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import dts from 'vite-plugin-dts';

import * as pkg from './package.json';

const NODE_ENV = process.argv.mode || 'development';
const VERSION = pkg.version;

/**
 * Trick to use Vite server.open option on macOS
 *
 * @see https://github.com/facebook/create-react-app/pull/1690#issuecomment-283518768
 */
process.env.BROWSER = 'open';

/**
 * Sibling workspace packages resolve to their built `dist` by default, so a change in one of
 * them stays invisible to the dev server — and hence to the e2e suite, which runs against it —
 * until that package is rebuilt. A stale build is not an error either: it just silently tests
 * yesterday's code. Pointing the dev server at their sources removes the rebuild step entirely.
 *
 * Applied to `serve` only: the library build keeps resolving them the way a consumer would.
 */
const workspaceSources = ['caret', 'dom', 'helpers'].map((name) => ({
  /**
   * Anchored, so that only the bare specifier is rewritten. A plain string alias matches by
   * prefix, which would turn a future '@editorjs/dom/something' into a path ending in
   * 'index.tssomething' instead of leaving it alone
   */
  find: new RegExp(`^@editorjs/${name}$`),
  replacement: path.resolve(__dirname, '..', name, 'src', 'index.ts'),
}));

export default ({ command }) => ({
  resolve: {
    alias: command === 'serve' ? workspaceSources : [],
  },

  css: {
    postcss: {
      plugins: [
        postcssApply(),
        postcssNested(),
        postcssPresetEnv({
          stage: 0,
          browsers: [
            'last 2 versions',
            '> 1%',
          ],
          preserve: false,
          features: {
            'nesting-rules': false,
          },
        }),
      ],
    },
  },

  build: {
    copyPublicDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src', 'index.ts'),
      name: 'UIKit',
      fileName: 'index',
    }
  },

  define: {
    NODE_ENV: JSON.stringify(NODE_ENV),
    VERSION: JSON.stringify(VERSION),
  },

  server: {
    port: 3300,
    /**
     * NO_OPEN is set by the e2e runner, which starts the dev server itself and
     * should not pop a browser window up on every run
     */
    open: process.env.NO_OPEN === 'true' ? false : './preview/index.html',
  },

  plugins: [
    cssInjectedByJsPlugin(),

    /**
     * The package tsconfig includes every file, but the e2e declarations must not reach dist:
     * they import from '@playwright/test', a devDependency, which a consumer's TypeScript then
     * fails to resolve. The suite is typechecked separately, see the root 'typecheck:e2e'
     */
    dts({
      exclude: ['e2e/**', 'playwright.config.ts'],
    }),
  ],
});
