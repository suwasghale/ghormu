import { cn } from "@/lib/utils"

/**
 * Placeholder mark: two ridgelines under a sun. Swap for the real Ghormu
 * logo when there is one; everything else references this component.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
    >
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <circle cx="22" cy="10" r="3" className="fill-brand-foreground/80" />
      <path
        d="M4 25 L12 13 L17 20 L20 16 L28 25 Z"
        className="fill-brand-foreground"
      />
      <path
        d="M10.2 15.7 L12 13 L13.9 15.7 Z"
        className="fill-brand"
        opacity="0.35"
      />
    </svg>
  )
}
