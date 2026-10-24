"use client"

import { WifiOff } from "lucide-react"
import { useEffect, useSyncExternalStore } from "react"

/**
 * Installs public/sw.js, which keeps pages a visitor has opened readable on
 * a weak or missing signal. Production only: in development it would cache
 * files that change on every save.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Not supported here (private window, old browser): the site works without it.
    })
  }, [])

  return null
}

function subscribe(update: () => void) {
  window.addEventListener("online", update)
  window.addEventListener("offline", update)
  return () => {
    window.removeEventListener("online", update)
    window.removeEventListener("offline", update)
  }
}

/** A quiet note while the connection is down; gone when it returns. */
export function OfflineNotice({ message }: { message: string }) {
  const offline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  )

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      {offline && (
        <p className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm text-ink-foreground shadow-lg ring-1 ring-ink-foreground/25">
          <WifiOff aria-hidden="true" className="size-4 shrink-0 text-earth-bright" />
          {message}
        </p>
      )}
    </div>
  )
}
