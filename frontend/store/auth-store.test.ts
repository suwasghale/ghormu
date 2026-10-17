import { afterEach, describe, expect, it } from 'vitest'
import { queryClient } from '@/lib/query/client'
import type { User } from '@/types/auth'
import { useAuthStore } from './auth-store'

const account = (id: string) => ({ id } as User)
afterEach(() => useAuthStore.getState().logout())

describe('private query cache', () => {
  it('clears account data on logout', () => {
    useAuthStore.getState().login(account('first'))
    queryClient.setQueryData(['me'], { email: 'first@example.com' })
    useAuthStore.getState().logout()
    expect(queryClient.getQueryData(['me'])).toBeUndefined()
  })

  it('clears the previous account when identity changes', () => {
    useAuthStore.getState().login(account('first'))
    queryClient.setQueryData(['me'], { email: 'first@example.com' })
    useAuthStore.getState().login(account('second'))
    expect(queryClient.getQueryData(['me'])).toBeUndefined()
  })
})
