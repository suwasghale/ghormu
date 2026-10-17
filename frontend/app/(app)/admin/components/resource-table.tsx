"use client"

// ============================================================================
// Resource list
// ============================================================================
//
// Search, filters, sorting, pagination and delete for any resource defined
// in lib/admin/resources.ts. One component serves all nine because the
// only thing that differs between them is configuration.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { renderCell } from "./cells"
import ConfirmDialog from "./confirm-dialog"

import {
  adminResource,
  errorMessage,
  type AdminRow,
  type Pagination,
} from "@/lib/api/admin/client"
import { RESOURCES } from "@/lib/admin/resources"
import { useAuthStore } from "@/store/auth-store"

type Row = AdminRow & Record<string, unknown>

/**
 * Rows per page.
 *
 * Matches the public site's page size so an editor paging through a
 * list sees the same grouping a visitor does.
 */
const PAGE_SIZE = 6

interface Props {
  /**
   * The resource key, not the definition itself.
   *
   * The definition holds Lucide icon components, and a React component
   * is not serialisable across the server/client boundary — passing the
   * whole object from the server page throws at render. The key is a
   * string; the lookup happens here, on the client.
   */
  resourceKey: string
}

export default function ResourceTable({ resourceKey }: Props) {
  const isSuperuser = useAuthStore((state) => state.user?.is_superuser === true)
  const canManage = resourceKey !== "users" || isSuperuser
  const resource = RESOURCES[resourceKey]
  const api = adminResource<Row>(resource.key)

  const [rows, setRows] = useState<Row[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [ordering, setOrdering] = useState("")

  const [pendingDelete, setPendingDelete] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState(false)

  // --------------------------------------------------------------------------
  // Fetching
  // --------------------------------------------------------------------------

  // Every fetch carries a sequence number, and a response is applied only
  // if it is still the newest request. Without this, typing quickly in the
  // search box can land an early, slower response after a later one and
  // show results for a query the user has already changed.
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current

    setLoading(true)
    setError(null)

    try {
      const data = await api.list({
        page,
        page_size: PAGE_SIZE,
        search: search || undefined,
        ordering: ordering || undefined,
        filters,
      })

      if (id !== requestId.current) return

      setRows(data.results)
      setPagination(data.pagination)
    } catch (caught) {
      if (id !== requestId.current) return

      setError(errorMessage(caught, "Could not load the list."))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
    // `api` is recreated each render but is stateless, so it is not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, ordering, filters])

  // Debounced: the search box fires on every keystroke, and one request
  // per character is both wasteful and racy.
  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)

    return () => clearTimeout(timer)
  }, [load, search])

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  function toggleSort(name: string) {
    setOrdering((current) => {
      if (current === name) return `-${name}`
      if (current === `-${name}`) return ""
      return name
    })
    setPage(1)
  }

  function setFilter(name: string, value: string) {
    setFilters((current) => {
      const next = { ...current }

      if (value) next[name] = value
      else delete next[name]

      return next
    })
    setPage(1)
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    setDeleting(true)

    try {
      await api.remove(pendingDelete.id)

      toast.success(
        `${resource.labelSingular} ${
          resource.deleteLabel ? "deactivated" : "deleted"
        }.`,
      )

      setPendingDelete(null)
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught, "Deleting failed."))
    } finally {
      setDeleting(false)
    }
  }

  const canCreate = canManage && resource.canCreate !== false
  const rowLabel = (row: Row) => String(row[resource.titleField] ?? row.id)

  // --------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* Header                                                               */}
      {/* ==================================================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {resource.label}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{resource.description}</p>
        </div>

        {canCreate && (
          <Link
            href={`/admin/${resource.key}/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            <Plus size={16} />
            New
          </Link>
        )}
      </div>

      {/* ==================================================================== */}
      {/* Search and filters                                                   */}
      {/* ==================================================================== */}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder={resource.searchPlaceholder}
            aria-label={`Search ${resource.label}`}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-gray-900"
          />
        </div>

        {resource.filters.map((filter) => (
          <select
            key={filter.name}
            value={filters[filter.name] ?? ""}
            onChange={(event) => setFilter(filter.name, event.target.value)}
            aria-label={filter.label}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-gray-900"
          >
            <option value="">{filter.label}: all</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* Table                                                                */}
      {/* ==================================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {resource.columns.map((column) => {
                  const sorted =
                    ordering === column.name
                      ? "asc"
                      : ordering === `-${column.name}`
                        ? "desc"
                        : null

                  return (
                    <th
                      key={column.name}
                      scope="col"
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${column.className ?? ""}`}
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : "none"
                      }
                    >
                      {column.label ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(column.name)}
                          className="inline-flex items-center gap-1 transition-colors hover:text-gray-900"
                        >
                          {column.label}
                          {sorted === "asc" && <ArrowUp size={12} />}
                          {sorted === "desc" && <ArrowDown size={12} />}
                        </button>
                      ) : (
                        <span className="sr-only">Preview</span>
                      )}
                    </th>
                  )
                })}
                <th scope="col" className="w-24 px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={resource.columns.length + 1}
                    className="px-4 py-16 text-center"
                  >
                    <Loader2
                      size={20}
                      className="mx-auto animate-spin text-gray-400"
                    />
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    colSpan={resource.columns.length + 1}
                    className="px-4 py-16 text-center"
                  >
                    <p className="text-sm text-red-600">{error}</p>
                    <button
                      type="button"
                      onClick={load}
                      className="mt-3 text-sm font-medium text-gray-900 underline"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              )}

              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={resource.columns.length + 1}
                    className="px-4 py-16 text-center text-sm text-gray-500"
                  >
                    {search || Object.keys(filters).length > 0
                      ? "No results for this search."
                      : `No ${resource.label.toLowerCase()} yet.`}
                  </td>
                </tr>
              )}

              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  {resource.columns.map((column) => {
                    const filter = resource.filters.find(
                      (candidate) => candidate.name === column.name,
                    )

                    return (
                      <td
                        key={column.name}
                        className={`px-4 py-3 ${column.className ?? ""}`}
                      >
                        {renderCell(
                          column.type,
                          row[column.name],
                          filter?.options,
                        )}
                      </td>
                    )
                  })}

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {canManage && <Link
                        href={`/admin/${resource.key}/${row.id}`}
                        aria-label={`Edit ${rowLabel(row)}`}
                        className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                      >
                        <Pencil size={15} />
                      </Link>}

                      {canManage && resource.canDelete !== false && (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(row)}
                          aria-label={`${resource.deleteLabel ?? "Delete"} ${rowLabel(row)}`}
                          className="rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================================================================== */}
        {/* Pagination                                                         */}
        {/* ================================================================== */}

        {pagination && pagination.count > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            {/*
              "result(s)" rather than the resource name: several labels
              are section names, not count nouns.
            */}
            <p className="text-sm text-gray-500">
              {pagination.count} result{pagination.count === 1 ? "" : "s"}
              {pagination.pages > 1 &&
                ` · page ${pagination.page} of ${pagination.pages}`}
            </p>

            {pagination.pages > 1 && (
              <PageNumbers
                page={pagination.page}
                pages={pagination.pages}
                disabled={loading}
                onSelect={setPage}
              />
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}

      <ConfirmDialog
        open={pendingDelete !== null}
        busy={deleting}
        title={`${resource.deleteLabel ?? "Delete"} ${resource.labelSingular.toLowerCase()}`}
        body={
          pendingDelete
            ? resource.deleteLabel
              ? `${rowLabel(pendingDelete)} will no longer be able to sign in. The account and its history are kept.`
              : `${rowLabel(pendingDelete)} will be permanently deleted. This cannot be undone.`
            : ""
        }
        confirmLabel={resource.deleteLabel ?? "Delete"}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

// ============================================================================
// Numbered pages
// ============================================================================
//
// Buttons rather than links, unlike the public site's Pagination: the admin
// list keeps its search, filters and sort in component state, so a real URL
// would either lose them or need every one mirrored into the query string.
// The window logic is the same — first, last, and a span around the current
// page — so the control never wraps to a second row.

function PageNumbers({
  page,
  pages,
  disabled,
  onSelect,
}: {
  page: number
  pages: number
  disabled: boolean
  onSelect: (page: number) => void
}) {
  const numbers: (number | "gap")[] = []

  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) numbers.push(n)
    else if (numbers[numbers.length - 1] !== "gap") numbers.push("gap")
  }

  const box =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40"

  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onSelect(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
        className={`${box} text-gray-500 hover:bg-gray-100 hover:text-gray-900`}
      >
        <ChevronLeft size={16} />
      </button>

      {numbers.map((n, index) =>
        n === "gap" ? (
          <span key={`gap-${index}`} className={`${box} text-gray-400`} aria-hidden>
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            disabled={disabled}
            aria-current={n === page ? "page" : undefined}
            aria-label={`Page ${n}`}
            className={`${box} ${
              n === page
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {n}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onSelect(page + 1)}
        disabled={disabled || page >= pages}
        aria-label="Next page"
        className={`${box} text-gray-500 hover:bg-gray-100 hover:text-gray-900`}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
