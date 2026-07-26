import { defineConfig, devices } from '@playwright/test';

/**
 * Port the vite dev server (and hence the e2e fixtures) is served on
 */
const PORT = 3300;

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'yarn dev',
    /**
     * There is no index page in the package root, so readiness is checked against a fixture
     */
    url: `http://localhost:${PORT}/e2e/fixtures/menu.html`,
    reuseExistingServer: true,
    /**
     * Prevents vite from opening the preview page in a browser on every test run
     * @see vite.config.js
     */
    env: {
      NO_OPEN: 'true',
    },
  },
});
