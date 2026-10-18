import { afterEach, describe, expect, it, vi } from 'vitest'

import { apiClient, ApiError } from './client'

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockFetch(...responses: Response[]) {
  const fetchMock = vi.fn<typeof fetch>()
  for (const response of responses) fetchMock.mockResolvedValueOnce(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function calledUrls(fetchMock: ReturnType<typeof mockFetch>) {
  return fetchMock.mock.calls.map(([url]) => String(url))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('401 handling', () => {
  it('refreshes and retries when the session expired', async () => {
    const fetchMock = mockFetch(
      jsonResponse(401, { success: false, message: 'Token expired.', errors: null }),
      jsonResponse(200, { success: true }),
      jsonResponse(200, { success: true, data: { ok: true } }),
    )

    const result = await apiClient.get<{ data: { ok: boolean } }>('/auth/me/')

    expect(result.data.ok).toBe(true)
    expect(calledUrls(fetchMock)).toEqual([
      '/api/proxy/auth/me',
      '/api/auth/refresh',
      '/api/proxy/auth/me',
    ])
  })

  it('does not refresh when the 401 rejected what was submitted', async () => {
    const fetchMock = mockFetch(
      jsonResponse(401, {
        success: false,
        message: 'Invalid one-time password.',
        code: 'invalid_otp',
        errors: null,
      }),
    )

    const error = await apiClient
      .post('/auth/mfa/confirm/', { code: '000000' })
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('invalid_otp')
    expect(calledUrls(fetchMock)).toEqual(['/api/proxy/auth/mfa/confirm'])
  })

  it('gives up after one retry', async () => {
    const fetchMock = mockFetch(
      jsonResponse(401, { success: false, message: 'Token expired.' }),
      jsonResponse(401, { message: 'Session expired.' }),
    )

    await expect(apiClient.get('/auth/me/')).rejects.toBeInstanceOf(ApiError)
    expect(calledUrls(fetchMock)).toEqual(['/api/proxy/auth/me', '/api/auth/refresh'])
  })
})

describe('routing', () => {
  it('calls this app’s own route handlers as written', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { providers: [] }))

    await apiClient.get('/api/auth/social', { auth: false })

    expect(calledUrls(fetchMock)).toEqual(['/api/auth/social'])
  })

  it('drops the trailing slash before a query, so the proxy is not redirected', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { success: true, data: {} }))

    await apiClient.get('/admin/posts/?page=1&page_size=6')

    expect(calledUrls(fetchMock)).toEqual(['/api/proxy/admin/posts?page=1&page_size=6'])
  })

  it('sends sign-in requests to the dedicated route, not the proxy', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { success: true, data: {} }))

    await apiClient.post('/auth/login/', { email: 'a@b.test', password: 'x' }, { auth: false })

    expect(calledUrls(fetchMock)).toEqual(['/api/auth/login'])
  })
})

describe('ApiError.code', () => {
  it('is null when the server sent no code', () => {
    expect(new ApiError('Bad', 400, { message: 'Bad' }).code).toBeNull()
    expect(new ApiError('Bad', 500, null).code).toBeNull()
  })
})
