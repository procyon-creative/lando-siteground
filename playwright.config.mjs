import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './test',
  testMatch: 'browser.spec.mjs',
  timeout: 30000,
  use: {
    headless: true,
    ignoreHTTPSErrors: true,
  },
});
