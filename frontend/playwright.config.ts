import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', workers: 1, timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://starter.test:8446', ignoreHTTPSErrors: true,
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: { args: ['--host-resolver-rules=MAP starter.test 127.0.0.1, MAP *.starter.test 127.0.0.1', '--no-proxy-server'] },
  },
})
