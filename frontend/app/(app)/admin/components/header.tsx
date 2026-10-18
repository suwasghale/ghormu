"use client"

// ============================================================================
// Admin header
// ============================================================================
//
// A breadcrumb and the signed-in identity. Deliberately not an <h1>: each
// page renders its own heading, and two h1s on a page is both a landmark
// problem for screen readers and a visual repetition for everyone else.
//
// The section name is derived from the resource registry, so it cannot
// name a page that does not exist.
// ============================================================================

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Menu } from "lucide-react"

import { getResource } from "@/lib/admin/resources"
import type { User } from "@/types/auth"

interface HeaderProps {
  user: User

  /** Opens the navigation drawer. Only reachable below `lg`. */
  onOpenNav: () => void
}

function useBreadcrumb(pathname: string) {
  // /admin/<resource>[/<id>]
  const [, , key, id] = pathname.split("/")

  if (!key || key === "dashboard") {
    return { section: "Dashboard", href: null, leaf: null }
  }

  const resource = getResource(key)

  if (!resource) return { section: "Administration", href: null, leaf: null }

  return {
    section: resource.label,
    href: `/admin/${key}`,
    leaf: id ? (id === "new" ? "New" : "Edit") : null,
  }
}

export default function Header({ user, onOpenNav }: HeaderProps) {
  const pathname = usePathname()

  const { section, href, leaf } = useBreadcrumb(pathname)

  const initial = (user.first_name || user.email).charAt(0).toUpperCase()

  return (
    <header className="flex h-20 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
      >
        <Menu size={20} />
      </button>

      <nav aria-label="Fil d'Ariane" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm text-gray-500">
          <li>
            <Link
              href="/admin/dashboard"
              className="transition-colors hover:text-gray-900"
            >
              Administration
            </Link>
          </li>

          <li aria-hidden className="text-gray-300">
            <ChevronRight size={14} />
          </li>

          <li>
            {href && leaf ? (
              <Link href={href} className="transition-colors hover:text-gray-900">
                {section}
              </Link>
            ) : (
              <span className="font-medium text-gray-900" aria-current="page">
                {section}
              </span>
            )}
          </li>

          {leaf && (
            <>
              <li aria-hidden className="text-gray-300">
                <ChevronRight size={14} />
              </li>
              <li>
                <span className="font-medium text-gray-900" aria-current="page">
                  {leaf}
                </span>
              </li>
            </>
          )}
        </ol>
      </nav>

      <div className="flex flex-shrink-0 items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 sm:px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black font-semibold text-white">
          {initial}
        </div>

        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold">
            {`${user.first_name} ${user.last_name}`.trim() || "Administrator"}
          </p>

          <p className="truncate text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
    </header>
  )
}
