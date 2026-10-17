import { describe, expect, it } from 'vitest'

import { ApiError } from '../client'
import { mfaChallengeFrom, toLoginResult } from './login'

const challenge = new ApiError('Unauthorized', 401, {
  message: 'A second authentication factor is required.',
  code: 'mfa_required',
  errors: { mfa_ticket: 'ticket-123', expires_in: 300 },
})

describe('second-factor challenges', () => {
  it('recognises a challenge', () => {
    expect(mfaChallengeFrom(challenge)).toEqual({ ticket: 'ticket-123', expiresIn: 300 })
  })

  it('ignores other failures', () => {
    expect(mfaChallengeFrom(new ApiError('Unauthorized', 401, { message: 'Invalid email or password.' }))).toBeNull()
    expect(mfaChallengeFrom(new ApiError('Bad Request', 400, { errors: { mfa_ticket: 'x', expires_in: 1 } }))).toBeNull()
    expect(mfaChallengeFrom(new Error('offline'))).toBeNull()
  })
})

describe('sign-in results', () => {
  it('turns a session into an authenticated result', async () => {
    const session = { user: { id: '1' } }
    const result = await toLoginResult(Promise.resolve({ success: true, message: '', data: session } as never))

    expect(result).toEqual({ kind: 'authenticated', session })
  })

  it('turns a challenge into an mfa result', async () => {
    await expect(toLoginResult(Promise.reject(challenge))).resolves.toEqual({
      kind: 'mfa',
      ticket: 'ticket-123',
      expiresIn: 300,
    })
  })

  it('rethrows everything else', async () => {
    const failure = new ApiError('Unauthorized', 401, { message: 'Invalid email or password.' })

    await expect(toLoginResult(Promise.reject(failure))).rejects.toBe(failure)
  })
})
