import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Unit and component tests.
 *
 * Pure logic (sanitising, redirects, error handling, the API client) runs
 * in Node. Components opt into a DOM with a `// @vitest-environment jsdom`
 * docblock, so the fast majority of tests never pay for one. Whole pages
 * and real browser flows are covered by the Playwright suite in e2e/.
 */
export default defineConfig({
  resolve: {
    alias: {
      // Mirrors the `@/*` path alias in tsconfig.
      '@': fileURLToPath(new URL('.', import.meta.url)),
      // Next resolves `server-only` itself; outside Next it would throw on
      // import, so route-handler tests get an empty module instead.
      'server-only': fileURLToPath(new URL('./vitest.server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
