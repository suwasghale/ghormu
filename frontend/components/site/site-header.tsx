"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { NavigationMenu } from "@base-ui/react/navigation-menu"
import { ChevronDown, Menu, X } from "lucide-react"

import { mainNav, type NavItem, type NavLink } from "@/config/navigation"
import type { Dictionary } from "@/lib/i18n"
import { localizePath, stripLocale, type Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

import { LanguageSwitcher } from "./language-switcher"
import { LogoMark } from "./logo-mark"

type SiteHeaderProps = {
  locale: Locale
  siteName: string
  nav: Dictionary["nav"]
  ui: Dictionary["header"]
}

function hrefFor(locale: Locale, link: NavLink): string {
  return link.localized === false ? link.href : localizePath(locale, link.href)
}

/** Whether `link` is the page being viewed, given a locale-less path. */
function isCurrent(path: string, link: NavLink): boolean {
  return link.localized !== false && path === link.href
}

/** Whether the current page sits anywhere inside a top-level item. */
function isWithin(path: string, item: NavItem): boolean {
  if (item.href === "/") return path === "/"

  return path === item.href || path.startsWith(`${item.href}/`)
}

const triggerClass =
  "inline-flex h-10 items-center gap-1 rounded-full px-3.5 text-[0.95rem] font-medium text-foreground/80 transition-colors outline-none select-none hover:bg-brand-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand data-popup-open:bg-brand-muted data-popup-open:text-foreground data-[current=true]:text-brand"

const menuLinkClass =
  "block rounded-lg px-3 py-2.5 text-[0.95rem] text-foreground/85 transition-colors outline-none hover:bg-brand-muted hover:text-foreground focus-visible:bg-brand-muted focus-visible:outline-2 focus-visible:outline-brand aria-[current=page]:font-semibold aria-[current=page]:text-brand"

export function SiteHeader({ locale, siteName, nav, ui }: SiteHeaderProps) {
  const path = stripLocale(usePathname())
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={localizePath(locale, "/")}
          aria-label={ui.homeLink}
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <LogoMark />
          <span className="text-xl font-bold tracking-tight">{siteName}</span>
        </Link>

        {/* Desktop */}
        <NavigationMenu.Root aria-label={ui.mainNavigation} className="hidden lg:block">
          <NavigationMenu.List className="flex items-center gap-0.5">
            {mainNav.map((item) =>
              item.children ? (
                <NavigationMenu.Item key={item.key}>
                  <NavigationMenu.Trigger
                    className={triggerClass}
                    data-current={isWithin(path, item)}
                  >
                    {nav[item.key]}
                    <NavigationMenu.Icon className="transition-transform duration-200 data-popup-open:rotate-180">
                      <ChevronDown aria-hidden="true" className="size-4 opacity-70" />
                    </NavigationMenu.Icon>
                  </NavigationMenu.Trigger>

                  <NavigationMenu.Content className="w-60 p-2 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0">
                    <ul className="flex flex-col">
                      {item.children.map((child) => (
                        <li key={child.key}>
                          <NavigationMenu.Link
                            render={<Link href={hrefFor(locale, child)} />}
                            active={isCurrent(path, child)}
                            className={menuLinkClass}
                          >
                            {nav[child.key]}
                          </NavigationMenu.Link>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              ) : (
                <NavigationMenu.Item key={item.key}>
                  <NavigationMenu.Link
                    render={<Link href={hrefFor(locale, item)} />}
                    active={isCurrent(path, item)}
                    className={cn(triggerClass, "aria-[current=page]:text-brand")}
                  >
                    {nav[item.key]}
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              ),
            )}
          </NavigationMenu.List>

          <NavigationMenu.Portal>
            <NavigationMenu.Positioner
              sideOffset={8}
              collisionPadding={16}
              className="z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-200 ease-out data-instant:transition-none"
            >
              <NavigationMenu.Popup className="relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg shadow-black/5 transition-[opacity,transform,width,height] duration-200 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                <NavigationMenu.Viewport className="relative h-full w-full overflow-hidden" />
              </NavigationMenu.Popup>
            </NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        </NavigationMenu.Root>

        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} label={ui.switchLanguage} className="hidden sm:inline-flex" />

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? ui.closeMenu : ui.openMenu}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label={ui.mainNavigation}
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border/70 bg-background lg:hidden"
          onKeyDown={(event) => {
            if (event.key === "Escape") closeMenu()
          }}
        >
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
            {mainNav.map((item) =>
              item.children ? (
                <li key={item.key}>
                  <details className="group rounded-xl" open={isWithin(path, item)}>
                    <summary
                      className={cn(
                        "flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-3 text-base font-medium hover:bg-brand-muted [&::-webkit-details-marker]:hidden",
                        isWithin(path, item) && "text-brand",
                      )}
                    >
                      {nav[item.key]}
                      <ChevronDown aria-hidden="true" className="size-4 opacity-70 transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="mt-1 mb-2 ml-3 flex flex-col border-l border-border pl-3">
                      {item.children.map((child) => (
                        <li key={child.key}>
                          <Link
                            href={hrefFor(locale, child)}
                            aria-current={isCurrent(path, child) ? "page" : undefined}
                            onClick={closeMenu}
                            className={menuLinkClass}
                          >
                            {nav[child.key]}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ) : (
                <li key={item.key}>
                  <Link
                    href={hrefFor(locale, item)}
                    aria-current={isCurrent(path, item) ? "page" : undefined}
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-brand-muted aria-[current=page]:text-brand"
                  >
                    {nav[item.key]}
                  </Link>
                </li>
              ),
            )}
            <li className="mt-3 border-t border-border pt-4 sm:hidden">
              <LanguageSwitcher locale={locale} label={ui.switchLanguage} onNavigate={closeMenu} />
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
