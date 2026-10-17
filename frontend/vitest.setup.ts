import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

// Testing Library only cleans up automatically when test globals are on.
afterEach(async () => {
  if (typeof document === 'undefined') return
  const { cleanup } = await import('@testing-library/react')
  cleanup()
})
