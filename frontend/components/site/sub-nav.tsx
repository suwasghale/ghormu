import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * Sibling pages of one navbar group, as tabs under the page header, so a
 * reader can move between News, Announcements and Development without
 * going back to the menu.
 */
export function SubNav({ label, links, current }: { label: string; links: { href: string; label: string }[]; current: string }) {
  return (
    <nav aria-label={label} className="-mt-2 mb-12 overflow-x-auto">
      <ul className="flex w-max gap-2 rounded-full bg-muted p-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={link.href === current ? "page" : undefined}
              className={cn(
                "block rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                "aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-sm",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
