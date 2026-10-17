"use client"

// ============================================================================
// "Has this hydrated yet?"
// ============================================================================
//
// A state flag flipped once, after mount. Anything that genuinely cannot run
// during the server render waits on it — a portal that needs `document`, a
// read from sessionStorage, a feature detection.
//
// `useSyncExternalStore(subscribe, () => true, () => false)` expresses the
// same idea without an effect and is worth preferring where it fits; it is
// what ShareBar and usePersistedFlag use. This one keeps the plain state
// flag because the value is consumed as a render guard (`if (!mounted)
// return null`) rather than as data, and one extra render on mount is the
// minimum cost for information that does not exist before then.
//
// The lint rule is about avoiding *cascading* renders. This is a single,
// bounded one, so the rule is disabled deliberately rather than worked
// around.
// ============================================================================

import { useEffect, useState } from "react"

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setMounted(true)
  }, [])

  return mounted
}
