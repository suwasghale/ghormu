import { describe, expect, it } from 'vitest'
import { postLoginPath, safeReturnPath } from './redirect'
import type { User } from '@/types/auth'

describe('return destinations', () => {
  it.each(['//evil.example', '/\\evil.example', 'https://evil.example', '/\tevil.example', 'javascript:alert(1)', ''])('rejects %s', path => {
    expect(safeReturnPath(path)).toBe('/admin')
  })
  it('preserves a valid application destination', () => {
    expect(safeReturnPath('/admin/../admin/reservations?q=1#row')).toBe('/admin/reservations?q=1#row')
  })
})

describe('after sign-in', () => {
  const member = { is_staff: false } as User
  const staff = { is_staff: true } as User

  it('uses the default page when nothing was requested', () => {
    expect(postLoginPath(member, null)).toBe('/profile')
    expect(postLoginPath(staff, null)).toBe('/admin/dashboard')
  })

  it('returns to a requested page', () => {
    expect(postLoginPath(member, '/profile/two-factor')).toBe('/profile/two-factor')
  })

  it('never leaves the site', () => {
    expect(postLoginPath(staff, 'https://evil.example')).toBe('/admin')
  })

  it('does not send a non-staff account into the admin', () => {
    expect(postLoginPath(member, '/admin/users')).toBe('/profile')
    expect(postLoginPath(member, 'https://evil.example')).toBe('/profile')
  })
})
