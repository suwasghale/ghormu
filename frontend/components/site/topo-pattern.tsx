import { cn } from "@/lib/utils"

/**
 * Contour lines, like a topographic map, as a quiet background texture.
 *
 * Rings are computed rather than drawn by hand: each is a circle whose
 * radius wobbles with a few sine waves, so neighbouring rings stay roughly
 * parallel the way real contours do. Deterministic, so server and client
 * render the same paths.
 */
function ring(cx: number, cy: number, radius: number, seed: number): string {
  const steps = 72
  const points = Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2
    const wobble =
      Math.sin(a * 3 + seed) * 0.09 + Math.sin(a * 5 + seed * 1.7) * 0.05 + Math.sin(a * 2 - seed) * 0.07
    const r = radius * (1 + wobble)
    return `${(cx + Math.cos(a) * r * 1.35).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`
  })
  return `M${points.join(" L")} Z`
}

const PEAKS = [
  { cx: 260, cy: 180, rings: 9, seed: 0.4 },
  { cx: 980, cy: 420, rings: 11, seed: 2.1 },
]

export function TopoPattern({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={cn("pointer-events-none", className)}>
      <g fill="none" stroke="currentColor" strokeWidth="1">
        {PEAKS.flatMap((peak) =>
          Array.from({ length: peak.rings }, (_, i) => (
            <path key={`${peak.cx}-${i}`} d={ring(peak.cx, peak.cy, 22 + i * 26, peak.seed + i * 0.18)} />
          )),
        )}
      </g>
    </svg>
  )
}
