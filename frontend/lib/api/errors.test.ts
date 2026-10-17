import { describe, expect, it } from 'vitest'

import { ApiError } from './client'
import {
  apiErrorCode,
  apiErrorMessage,
  ErrorCode,
  extractFieldErrors,
  hasErrorCode,
} from './errors'

describe('error codes', () => {
  it('reads the code from an API error', () => {
    const error = new ApiError('Unauthorized', 401, { message: 'No.', code: 'invalid_otp' })

    expect(apiErrorCode(error)).toBe('invalid_otp')
    expect(hasErrorCode(error, ErrorCode.InvalidOtp)).toBe(true)
    expect(hasErrorCode(error, ErrorCode.MfaCodeRequired)).toBe(false)
  })

  it('has no code for errors that did not come from the API', () => {
    expect(apiErrorCode(new TypeError('Failed to fetch'))).toBeNull()
    expect(apiErrorCode('boom')).toBeNull()
  })
})

describe('messages', () => {
  it('prefers the server message', () => {
    const error = new ApiError('Bad Request', 400, { message: 'Current password is incorrect.' })

    expect(apiErrorMessage(error, 'Fallback')).toBe('Current password is incorrect.')
  })

  it('falls back when there is nothing to show', () => {
    expect(apiErrorMessage(null, 'Fallback')).toBe('Fallback')
  })
})

describe('field errors', () => {
  it('flattens DRF arrays to one message per field', () => {
    const error = new ApiError('Bad Request', 400, {
      errors: { email: ['Enter a valid email.', 'Second message.'], code: 'Too long.' },
    })

    expect(extractFieldErrors(error)).toEqual({ email: 'Enter a valid email.', code: 'Too long.' })
  })

  it('puts a message without field errors under __all__', () => {
    const error = new ApiError('Bad Request', 400, { message: 'Something failed.', errors: null })

    expect(extractFieldErrors(error)).toEqual({ __all__: 'Something failed.' })
  })
})
