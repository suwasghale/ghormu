"use client"

// ============================================================================
// Admin shell
// ============================================================================
//
// Gates on staff status, then frames the page.
//
// The sidebar is fixed-width and was previously always rendered, with no
// `min-w-0` on the content column — so below roughly 1000px the table and
// the form pushed the whole document sideways and the page scrolled
// horizontally. It now collapses into a drawer, and the content column is
// allowed to shrink.
//
// From `lg` up the sidebar can also be collapsed to an icon rail, the way
// Claude's and ChatGPT's are. The choice is remembered per browser.
// ============================================================================

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import Sidebar from "./components/sidebar"
import Header from "./components/header"

import { getCurrentUser } from "@/lib/api/auth/me"
import { usePersistedFlag } from "@/hooks/use-persisted-flag"

import type { User } from "@/types/auth"

/** localStorage key for the collapsed rail. */
const RAIL_KEY = "ghormu.admin.sidebar.collapsed"

interface Props {
  children: React.ReactNode
}

export default function AdminLayout({ children }: Props) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [navOpen, setNavOpen] = useState(false)

  const [collapsed, setCollapsed] = usePersistedFlag(RAIL_KEY)

  useEffect(() => {
    async function validateAdmin() {
      try {
        const currentUser = await getCurrentUser()

        if (!currentUser.is_staff) {
          router.replace("/profile")
          return
        }

        setUser(currentUser)
      } catch {
        router.replace("/login")
      } finally {
        setLoading(false)
      }
    }

    validateAdmin()
  }, [router])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Checking permissions…
      </main>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Permanent from lg up. */}
      <div className="hidden lg:flex">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Drawer below lg. */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setNavOpen(false)}
            aria-hidden
          />
          {/*
            Closing on a link click rather than on a pathname effect:
            the drawer must not stay open over the page just requested,
            and reacting to the route in an effect costs a second render
            of the whole shell on every navigation.
          */}
          <div
            className="relative h-full w-72"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setNavOpen(false)
            }}
          >
            <Sidebar />
          </div>
        </div>
      )}

      {/* `min-w-0` is what stops a wide table from widening the whole
          page: a flex child defaults to min-width:auto and refuses to
          shrink below its content. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} onOpenNav={() => setNavOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
