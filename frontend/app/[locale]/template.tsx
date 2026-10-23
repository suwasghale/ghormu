import { ViewTransition } from "react"

/**
 * Wraps every public page. Unlike the layout, a template is mounted afresh
 * on each navigation, so the page leaving fades out and the one arriving
 * fades in (the browser's View Transitions; styles in globals.css under
 * "Page transitions"). The header stays put. Browsers without view
 * transitions, and visitors who ask for less motion, just see the new page.
 */
export default function PageTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  )
}
