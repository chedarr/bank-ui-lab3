const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,

  timeout: 30000,
  expect: {
    timeout: 5000
  },

  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],

  outputDir: 'test-results',

  use: {
    baseURL: 'http://127.0.0.1:3000',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },

  webServer: {
    command: 'node server.cjs',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: false,
    timeout: 15000
  }
});