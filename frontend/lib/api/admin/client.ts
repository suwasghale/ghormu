// ============================================================================
// Admin resource client
// ============================================================================
//
// One generic CRUD client over `apiClient`, rather than nine near-identical
// modules. Every admin resource exposes the same five operations against
// the same envelope, so the only thing that varies is the path and the row
// type — which are parameters, not code.
//
// This is the browser-side counterpart to lib/api/content/*, which is
// server-side and read-only. The two never share a call: public reads are
// anonymous and cached, admin reads are authenticated and must not be.
// ============================================================================

import { apiClient } from "@/lib/api/client"

// Re-exported so the admin components keep one import. The
// implementations are shared with the profile forms — see
// lib/api/errors.ts.
export {
  apiErrorMessage as errorMessage,
  extractFieldErrors,
  type FieldErrors,
} from "@/lib/api/errors"

// ----------------------------------------------------------------------------
// Envelope
// ----------------------------------------------------------------------------

interface Envelope<T> {
  success: boolean
  message: string
  data: T
}

export interface Pagination {
  count: number
  page: number
  pages: number
  page_size: number
  next: string | null
  previous: string | null
}

export interface Page<T> {
  results: T[]
  pagination: Pagination
}

/** Every admin row carries these, whatever else it has. */
export interface AdminRow {
  id: string
  created_at?: string
  updated_at?: string
}

// ----------------------------------------------------------------------------
// Query
// ----------------------------------------------------------------------------

export interface ListQuery {
  page?: number
  page_size?: number
  search?: string
  ordering?: string

  /**
   * Resource-specific exact-match filters (`status`, `category`, ...).
   * Unknown keys are ignored by the API rather than rejected, so a stale
   * saved view degrades to an unfiltered list instead of an error.
   */
  filters?: Record<string, string | undefined>
}

function buildQuery(query: ListQuery = {}): string {
  const params = new URLSearchParams()

  const { filters, ...rest } = query

  for (const [key, value] of Object.entries({ ...rest, ...filters })) {
    if (value === undefined || value === null || value === "") continue

    params.set(key, String(value))
  }

  const encoded = params.toString()

  return encoded ? `?${encoded}` : ""
}

// ----------------------------------------------------------------------------
// Resource
// ----------------------------------------------------------------------------

/**
 * A typed handle on one admin endpoint.
 *
 *     const projects = adminResource<Project>("projects")
 *     await projects.list({ search: "banepa" })
 */
export function adminResource<T extends AdminRow>(path: string) {
  const base = `/admin/${path.replace(/^\/+|\/+$/g, "")}/`

  return {
    async list(query: ListQuery = {}): Promise<Page<T>> {
      const response = await apiClient.get<Envelope<Page<T>>>(
        `${base}${buildQuery(query)}`,
      )

      return response.data
    },

    async retrieve(id: string): Promise<T> {
      const response = await apiClient.get<Envelope<T>>(`${base}${id}/`)

      return response.data
    },

    async create(payload: Partial<T>): Promise<T> {
      const response = await apiClient.post<Envelope<T>>(base, payload)

      return response.data
    },

    /**
     * Partial update. There is no `update` — the API takes PATCH only, so
     * two editors on one record cannot silently overwrite each other's
     * untouched fields.
     */
    async patch(id: string, payload: Partial<T>): Promise<T> {
      const response = await apiClient.patch<Envelope<T>>(
        `${base}${id}/`,
        payload,
      )

      return response.data
    },

    async remove(id: string): Promise<void> {
      await apiClient.delete<Envelope<null>>(`${base}${id}/`)
    },
  }
}

export type AdminResource<T extends AdminRow> = ReturnType<
  typeof adminResource<T>
>

// ----------------------------------------------------------------------------
// Dashboard
// ----------------------------------------------------------------------------

export interface DashboardStats {
  users: { total: number; active: number; staff: number; unverified: number }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get<Envelope<DashboardStats>>(
    "/admin/dashboard/",
  )

  return response.data
}
