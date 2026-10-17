"use client"

// ============================================================================
// Admin sidebar
// ============================================================================
//
// Driven by RESOURCE_ORDER so the navigation cannot drift from the
// resources that actually exist.
//
// Collapses to an icon rail, the way Claude's and ChatGPT's sidebars do:
// the toggle is a real button, the choice is remembered per browser, and
// labels stay in the DOM as screen-reader text so the rail is still
// navigable without the tooltips.
// ============================================================================

import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react"

import { site } from "@/config/site"

import { useRouter } from "next/navigation"

import NavItem from "./nav-item"

import { logout } from "@/lib/auth/logout"
import {
  DASHBOARD_ICON,
  RESOURCES,
  RESOURCE_ORDER,
} from "@/lib/admin/resources"

export default function Sidebar({
  collapsed = false,
  onToggle,
}: {
  collapsed?: boolean

  /** Omitted in the mobile drawer, where the rail makes no sense. */
  onToggle?: () => void
}) {
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.replace("/login")
  }

  // Accounts get their own group; every other registered resource is
  // listed under Content, which only appears once a project adds one.
  const content = RESOURCE_ORDER.filter((key) => key !== "users")

  return (
    <aside
      className={`flex h-screen flex-col border-r border-gray-200 bg-white transition-[width] duration-200 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* ======================================== */}
      {/* Logo + toggle */}
      {/* ======================================== */}

      <div
        className={`flex items-center border-b border-gray-200 py-5 ${
          collapsed ? "flex-col gap-3 px-2" : "justify-between gap-2 px-6"
        }`}
      >
        {/*
          The wordmark is branding, not a heading. It used to be an <h1>,
          which meant every admin screen had two — one here and one on
          the page — and a screen reader's heading list opened with a
          phantom entry above the actual page title.
        */}
        {collapsed ? (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-sm font-bold tracking-tight text-white"
            aria-hidden
          >
            SG
          </span>
        ) : (
          <div className="min-w-0">
            <span className="block text-2xl font-bold tracking-tight">{site.name}</span>
            <span className="mt-0.5 block text-sm text-gray-500">
              Administration
            </span>
          </div>
        )}

        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={
              collapsed
                ? "Expand navigation"
                : "Collapse navigation"
            }
            aria-expanded={!collapsed}
            title={collapsed ? "Expand" : "Collapse"}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            {collapsed ? (
              <ChevronsRight size={18} aria-hidden />
            ) : (
              <ChevronsLeft size={18} aria-hidden />
            )}
          </button>
        )}
      </div>

      {/* ======================================== */}
      {/* Navigation */}
      {/* ======================================== */}

      <nav
        className={`flex-1 space-y-1 overflow-y-auto overflow-x-hidden py-4 ${
          collapsed ? "px-2" : "px-4"
        }`}
      >
        <NavItem
          href="/admin/dashboard"
          label="Dashboard"
          icon={DASHBOARD_ICON}
          collapsed={collapsed}
        />

        {content.length > 0 && <SectionLabel collapsed={collapsed}>Content</SectionLabel>}

        {content.map((key) => {
          const resource = RESOURCES[key]

          return (
            <NavItem
              key={key}
              href={`/admin/${key}`}
              label={resource.label}
              icon={resource.icon}
              collapsed={collapsed}
            />
          )
        })}

        <SectionLabel collapsed={collapsed}>Accounts</SectionLabel>

        <NavItem
          href="/admin/users"
          label={RESOURCES.users.label}
          icon={RESOURCES.users.icon}
          collapsed={collapsed}
        />
      </nav>

      {/* ======================================== */}
      {/* Sign out */}
      {/* ======================================== */}

      <div className={`border-t border-gray-200 py-4 ${collapsed ? "px-2" : "px-4"}`}>
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Sign out" : undefined}
          className={`flex w-full items-center rounded-lg py-3 text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-black ${
            collapsed ? "justify-center px-0" : "gap-3 px-4"
          }`}
        >
          <LogOut size={20} className="flex-shrink-0" aria-hidden />
          <span className={collapsed ? "sr-only" : "font-medium"}>
            Sign out
          </span>
        </button>
      </div>
    </aside>
  )
}

/**
 * A group heading, or a hairline when there is no room for one.
 *
 * Dropping the text entirely at rail width would leave the icons in one
 * undifferentiated column; the rule keeps the grouping visible.
 */
function SectionLabel({
  collapsed,
  children,
}: {
  collapsed: boolean
  children: React.ReactNode
}) {
  if (collapsed) {
    return <div className="mx-3 my-3 h-px bg-gray-200" role="presentation" />
  }

  return (
    <p className="px-4 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">
      {children}
    </p>
  )
}
