import { test, expect, type Page } from './fixtures'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { totp } from './totp'

const root = resolve(process.cwd(), '..')
const composeArgs = ['compose', '--project-name', 'ghormu-e2e', '--env-file', 'infra/e2e/generated/test.env', '-f', 'docker-compose.prod.yml', '-f', 'infra/e2e/compose.yml']
const password = 'Validation-Only-Strong-Password-42!'
function compose(...args: string[]) {
  return execFileSync('docker', [...composeArgs, ...args], { cwd: root, encoding: 'utf8', timeout: 120_000 }).trim()
}
function snapshot() { return JSON.parse(compose('exec', '-T', 'web', 'python', '/fixtures/probe.py').split('\n').at(-1)!) }
async function login(page: Page, email = 'admin@example.test') {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
}
async function json(page: Page, path: string, body?: unknown, key?: string) {
  return page.evaluate(async ({ path, body, key }) => {
    const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(key ? { 'Idempotency-Key': key } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { status: response.status, data: await response.json() }
  }, { path, body, key })
}

test('MFA accepts a recovery code through the real login form', async ({ page }) => {
  await login(page, 'mfa@example.test')
  await page.getByLabel('Authentication or recovery code').fill('incorrect')
  await page.getByRole('button', { name: 'Verify code' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByLabel('Authentication or recovery code').fill('A1B2-C3D4-E5F6')
  await page.getByRole('button', { name: 'Verify code' }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
})

test('invalid refresh ends the session on the public login origin', async ({ page, context }) => {
  await context.addCookies([{ name: 'ghormu-e2e_refresh', value: 'expired-invalid-token', url: 'https://starter.test:8446', httpOnly: true, secure: true, sameSite: 'Lax' }])
  await page.goto('/admin/users')
  await expect(page).toHaveURL('https://starter.test:8446/login?next=%2Fadmin%2Fusers&expired=1')
  expect((await context.cookies()).some(cookie => cookie.name === 'ghormu-e2e_refresh')).toBe(false)
})

test('expired access cookies renew across two tabs without revoking the session', async ({ page, context }) => {
  await login(page)
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  const oldRefresh = (await context.cookies()).find(c => c.name === 'ghormu-e2e_refresh')!.value
  await context.clearCookies({ name: 'ghormu-e2e_access' })
  const other = await context.newPage()
  await Promise.all([page.goto('/admin'), other.goto('/admin/users')])
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await expect(other).toHaveURL(/\/admin\/users$/)
  expect((await context.cookies()).find(c => c.name === 'ghormu-e2e_refresh')!.value).not.toBe(oldRefresh)
  const result = await json(page, '/api/proxy/auth/me')
  expect(result.status).toBe(200)
})

test('temporary API failure preserves refresh cookies and allows retry', async ({ page, context }) => {
  await login(page); await expect(page).toHaveURL(/\/admin\/dashboard$/)
  const before = (await context.cookies()).find(c => c.name === 'ghormu-e2e_refresh')!.value
  compose('stop', 'web')
  try {
    const response = await json(page, '/api/auth/refresh', {})
    expect(response.status).toBe(503)
    expect((await context.cookies()).find(c => c.name === 'ghormu-e2e_refresh')!.value).toBe(before)
  } finally { compose('start', 'web') }
  // While the backend comes back, a request can fail outright rather than
  // answer 503 -- Compose v2 (CI's) re-runs web's one-shot dependencies before
  // restarting it, so the window is longer and messier than on Compose v5.
  // `expect.poll` retries a failed assertion but aborts on a thrown callback,
  // so a thrown fetch counts as "not recovered yet" (0) instead of ending the
  // wait. This does not soften what is being proven: had the outage cost the
  // session, refresh would answer 401 forever and this still fails.
  await expect.poll(async () => {
    try { return (await json(page, '/api/auth/refresh', {})).status } catch { return 0 }
  }, { timeout: 45_000 }).toBe(200)
  expect((await json(page, '/api/proxy/auth/me')).status).toBe(200)
})

test('large image passes through nginx and Next into object storage', async ({ page }) => {
  await login(page); await expect(page).toHaveURL(/\/admin\/dashboard$/)
  const result = await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 1200
    const ctx = canvas.getContext('2d')!
    const pixels = ctx.createImageData(canvas.width, canvas.height)
    for (let i = 0; i < pixels.data.length; i++) pixels.data[i] = i % 4 === 3 ? 255 : Math.floor(Math.random() * 256)
    ctx.putImageData(pixels, 0, 0)
    const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), 'image/png'))
    const form = new FormData(); form.append('file', blob, 'large.png'); form.append('alt', 'Validation image')
    const res = await fetch('/api/proxy/admin/media', { method: 'POST', body: form })
    return { bytes: blob.size, status: res.status, data: await res.json() }
  })
  expect(result.bytes).toBeGreaterThan(1024 * 1024)
  expect(result.status, JSON.stringify(result.data)).toBe(201)
})

test('private backup can be restored into a scratch database', async () => {
  const anonymousStatus = compose('exec', '-T', 'frontend', 'node', '-e', "fetch('http://minio:9000/private-backups/').then(r => console.log(r.status))")
  expect(anonymousStatus).toBe('403')
  compose('run', '--rm', '--no-deps', '--entrypoint', '/usr/local/bin/backup', 'backup')
  const count = snapshot().accounts
  const output = compose('run', '--rm', '--no-deps', '--entrypoint', '/usr/local/bin/restore', 'backup', '--verify-latest')
  expect(output).toContain('restore verified')
  expect(output).toContain(`${count} accounts`)
})

test('production login rate limit still rejects the eleventh attempt within one test', async ({ page }) => {
  await page.goto('/login')
  for (let attempt = 0; attempt < 10; attempt++) {
    const result = await json(page, '/api/auth/login', { email: `unknown-${attempt}@example.test`, password })
    expect(result.status).toBe(401)
  }
  const blocked = await json(page, '/api/auth/login', { email: 'unknown-limit@example.test', password })
  expect(blocked.status).toBe(429)
})

test('image failures are not cached as immutable successes', async ({ page }) => {
  const response = await page.goto('/_next/image?url=%2Fimages%2Fmissing-validation.png&w=640&q=75')
  expect(response?.status()).toBeGreaterThanOrEqual(400)
  expect(response!.headers()['cache-control'] ?? '').not.toMatch(/immutable|max-age=31536000/)
})

test('a user can enable two-factor authentication and then delete the account', async ({ page }) => {
  await login(page, 'lifecycle@example.test')
  await expect(page).toHaveURL(/\/profile$/)

  await page.goto('/profile/two-factor')
  await page.getByRole('button', { name: 'Set up' }).click()
  const secret = (await page.locator('code').innerText()).replace(/\s/g, '')
  await page.getByLabel('Verification code').fill(totp(secret))
  await page.getByRole('button', { name: 'Turn on' }).click()

  await expect(page.getByText('They will not be shown again.')).toBeVisible()
  await page.getByLabel('I have saved my recovery codes').check()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByText(/unused recovery codes/)).toBeVisible()

  await page.goto('/profile')
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  const dialog = page.getByRole('alertdialog')
  await dialog.getByLabel('Confirm with your password').fill(password)
  await dialog.getByLabel('Authentication or recovery code').fill(totp(secret))
  await dialog.getByRole('button', { name: 'Delete my account' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await login(page, 'lifecycle@example.test')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})
