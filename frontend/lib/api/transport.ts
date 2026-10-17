/** Server calls use the private network; browser calls retain the public URL. */
export function backendFetch(url: string, init: RequestInit & { next?: NextFetchRequestConfig } = {}, request?: Request) {
  const internal = typeof window === 'undefined' ? process.env.API_INTERNAL_URL : undefined
  const headers = new Headers(init.headers)
  if (internal) {
    const target = new URL(url)
    url = internal.replace(/\/$/, '') + target.pathname + target.search
    headers.set('X-Forwarded-Proto', 'https')
    headers.set('X-Internal-Proxy-Secret', process.env.INTERNAL_PROXY_SECRET ?? '')
    if (request && process.env.TRUST_EDGE_PROXY_HEADERS === '1') {
      const ip = request.headers.get('x-real-ip')
      if (ip) headers.set('X-Forwarded-For', ip)
    }
  }
  if (request) headers.set('User-Agent', (request.headers.get('user-agent') ?? '').slice(0, 512))
  return fetch(url, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(15_000) })
}
