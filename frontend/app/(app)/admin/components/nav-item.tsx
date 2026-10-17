"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { LucideIcon } from "lucide-react"

interface NavItemProps {
  href: string
  label: string
  icon: LucideIcon

  /** Icon-only rail. The label stays in the DOM for screen readers. */
  collapsed?: boolean
}

export default function NavItem({
  href,
  label,
  icon: Icon,
  collapsed = false,
}: NavItemProps) {
  const pathname = usePathname()

  const active = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      // The native tooltip is the label's only visible form when
      // collapsed, so it is set there and omitted when the text is
      // already on screen.
      title={collapsed ? label : undefined}
      className={`
        group/nav relative flex items-center rounded-lg py-3
        transition-all duration-200
        ${collapsed ? "justify-center px-0" : "gap-3 px-4"}
        ${
          active
            ? "bg-black text-white shadow"
            : "text-gray-600 hover:bg-gray-100 hover:text-black"
        }
      `}
    >
      <Icon size={20} className="flex-shrink-0" aria-hidden />

      {/*
        Hidden visually rather than removed: a screen reader still reads
        the destination, and the collapsed rail stays navigable without
        relying on the tooltip.
      */}
      <span className={collapsed ? "sr-only" : "truncate font-medium"}>
        {label}
      </span>
    </Link>
  )
}
