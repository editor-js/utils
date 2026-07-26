import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /** Playwright specs are run by their own runner, see packages/ui-kit/playwright.config.ts */
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
