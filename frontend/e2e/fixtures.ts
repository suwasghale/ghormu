import { test as base, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

// Test cases share one client IP. Reset that scope between tests, never within
// a journey, so added personnel/login tests cannot exhaust another test's budget.
export const test = base.extend<{ isolatedLoginBudget: void }>({
  isolatedLoginBudget: [async ({ baseURL }, use) => {
    if (baseURL !== 'https://starter.test:8446') throw new Error('This fixture requires the isolated validation origin')
    execFileSync('docker', [
      'compose', '--project-name', 'ghormu-e2e', '--env-file', 'infra/e2e/generated/test.env',
      '-f', 'docker-compose.prod.yml', '-f', 'infra/e2e/compose.yml',
      'exec', '-T', 'web', 'python', '/fixtures/reset_login_throttle.py',
    ], { cwd: resolve(process.cwd(), '..'), encoding: 'utf8', timeout: 30_000 })
    await use()
  }, { auto: true }],
})
export { expect }
export type { Page } from '@playwright/test'
