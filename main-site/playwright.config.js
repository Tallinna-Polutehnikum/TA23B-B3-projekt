import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.js',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node server/index.js',
      cwd: '.',
      env: {
        ...process.env,
        PORT: '4000',
      },
      port: 4000,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'node ./node_modules/vite/bin/vite.js --host localhost --port 5173',
      cwd: '.',
      port: 5173,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
