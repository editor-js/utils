import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

/**
 * Port the vite dev server (and hence the e2e fixtures) is served on
 */
const PORT = 3300;

/**
 * True when running on a CI machine, where the run has to be reproducible from a clean slate
 */
const isCI = process.env.CI !== undefined;

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  reporter: 'list',

  /** A committed test.only would silently reduce a CI run to that single test */
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
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

    /**
     * Locally this reuses the dev server that is likely already running. On CI it would instead
     * mean silently testing whatever process happens to hold the port, so a fresh one is started
     */
    reuseExistingServer: !isCI,
    /**
     * Prevents vite from opening the preview page in a browser on every test run
     * @see vite.config.js
     */
    env: {
      NO_OPEN: 'true',
    },
  },
});
