import { defineConfig } from '@playwright/test';

/* Playwright only routes the requests of the extension's service worker with this set */
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';

const SITE_URL = 'http://127.0.0.1:4173/';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  projects: [
    {
      name: 'extension',
      testIgnore: 'website/**',
    },
    {
      name: 'website',
      testMatch: 'website/**/*.spec.ts',
      use: {
        baseURL: SITE_URL,
        trace: 'retain-on-failure',
        launchOptions: {
          /* A request that slips past the fake services can't reach the real ones */
          args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'],
        },
      },
    },
  ],
  webServer: {
    command:
      'npx vite preview --config website/vite.config.ts --host 127.0.0.1 --port 4173 --strictPort',
    url: SITE_URL,
    reuseExistingServer: !process.env.CI,
  },
});