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

export default {
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
      name: 'UiKit',
      fileName: 'ui-kit',
    },
    sourcemap: true,
  },

  define: {
    NODE_ENV: JSON.stringify(NODE_ENV),
    VERSION: JSON.stringify(VERSION),
  },

  server: {
    port: 3300,
    open: './preview/index.html',
  },

  plugins: [
    cssInjectedByJsPlugin(),
    dts(),
  ],
};
