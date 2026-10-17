// ============================================================================
// HTTP API Client
// ============================================================================

type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"

interface RequestOptions
  extends Omit<RequestInit, "method" | "body"> {
  method?: HttpMethod
  body?: unknown

  _retry?: boolean
  auth?: boolean
}

class ApiError extends Error {
  readonly status: number
  readonly data: unknown

  constructor(
    message: string,
    status: number,
    data: unknown,
  ) {
    super(message)

    this.name = "ApiError"
    this.status = status
    this.data = data
  }

  /**
   * The server's stable, machine-readable error code (`invalid_otp`,
   * `mfa_code_required`, ...), when it sent one. Branch on this rather
   * than on `message`, which is written for people and may be reworded.
   */
  get code(): string | null {
    const code = (this.data as { code?: unknown } | null)?.code

    return typeof code === "string" ? code : null
  }
}

class ApiClient {
  private readonly baseUrl = "/api/proxy"

  private refreshPromise: Promise<void> | null = null

  private async refreshTokens(): Promise<void> {
    const response = await fetch('/api/auth/refresh', { method: 'POST' })
    if (!response.ok) throw new ApiError('Session expired.', response.status, null)
  }

  private async handleRefresh(): Promise<void> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshTokens().finally(() => {
        this.refreshPromise = null
      })
    }

    await this.refreshPromise
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
  const {
    method = "GET",
    body,
    headers,
    _retry = false,
    auth = true,
    ...rest
  } = options

    // -------------------------------------------------------------------------
    // Normalize URL
    // -------------------------------------------------------------------------

    const clean = endpoint.replace(/^\//, "").replace(/\/$/, "")
    const authRoutes: Record<string, string> = {
      "auth/login": "/api/auth/login", "auth/mfa/verify": "/api/auth/mfa",
      "auth/logout": "/api/auth/logout", "auth/logout/all": "/api/auth/logout-all",
    }
    // Paths under /api/ are this app's own route handlers (the BFF), and
    // are called as written rather than through the Django proxy.
    const url =
      authRoutes[clean] ??
      (endpoint.startsWith("/api/") ? endpoint : `${this.baseUrl}/${clean}`)

    // -------------------------------------------------------------------------
    // Request
    // -------------------------------------------------------------------------
    


    const response = await fetch(
      url,
      {
        method,

        headers: {
          ...(body !== undefined && {
            "Content-Type": "application/json",
          }),


          ...headers,
        },

        body:
          body !== undefined
            ? JSON.stringify(body)
            : undefined,

        ...rest,
      },
    )

    let data: unknown = null

    try {
      data = await response.json()
    } catch {
      //
      // Ignore empty response bodies
      //
    }

    if (!response.ok) {
      // A 401 with an application `code` (e.g. `invalid_otp`) rejected
      // what was submitted, not the session. Refreshing would rotate the
      // tokens for nothing and resend the request, spending a second
      // attempt against the server's throttle.
      const rejected =
        typeof (data as { code?: unknown } | null)?.code === "string"

      if (response.status === 401 && auth && !_retry && !rejected) {
        try {
          await this.handleRefresh()
        } catch {
          throw new ApiError(
            response.statusText,
            response.status,
            data,
          )
        }

      return this.request<T>(
        endpoint,
        {
          ...options,
          _retry: true,
        },
      )
      }

      throw new ApiError(
        response.statusText,
        response.status,
        data,
      )
    }

    return data as T
  }

  get<T>(
    endpoint: string,
    options?: RequestOptions,
  ) {
    return this.request<T>(
      endpoint,
      {
        ...options,
        method: "GET",
      },
    )
  }

  post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ) {
    return this.request<T>(
      endpoint,
      {
        ...options,
        method: "POST",
        body,
      },
    )
  }

  put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ) {
    return this.request<T>(
      endpoint,
      {
        ...options,
        method: "PUT",
        body,
      },
    )
  }

  patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ) {
    return this.request<T>(
      endpoint,
      {
        ...options,
        method: "PATCH",
        body,
      },
    )
  }

  delete<T>(
    endpoint: string,
    options?: RequestOptions,
  ) {
    return this.request<T>(
      endpoint,
      {
        ...options,
        method: "DELETE",
      },
    )
  }
}

export const apiClient = new ApiClient()

export { ApiError }
