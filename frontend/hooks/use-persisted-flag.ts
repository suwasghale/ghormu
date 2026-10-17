"use client"

// ============================================================================
// A boolean remembered in localStorage
// ============================================================================
//
// Built on `useSyncExternalStore` rather than `useState` + an effect.
//
// Reading storage in a `useState` initialiser throws during the server
// render; reading it in an effect renders the default first and corrects
// on the next pass, which is a visible flash and what
// `react-hooks/set-state-in-effect` exists to prevent. This hook gives
// React an explicit server snapshot instead, so the first client render
// already has the stored value.
//
// Every access is wrapped: private windows, cleared site data and
// browsers set to block storage all make these throw, and not being able
// to *remember* a preference must never stop someone setting it.
// ============================================================================

import { useCallback, useSyncExternalStore } from "react"

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  // `storage` fires in *other* tabs, so a preference toggled in one
  // admin tab follows the editor into the next.
  window.addEventListener("storage", listener)

  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function read(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1"
  } catch {
    return false
  }
}

export function usePersistedFlag(
  key: string,
  fallback = false,
): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    // Server snapshot. There is no storage there, so the default is the
    // only honest answer.
    () => fallback,
  )

  const set = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, next ? "1" : "0")
      } catch {
        // Nothing to do: the toggle below still updates the UI.
      }

      emit()
    },
    [key],
  )

  return [value, set]
}
