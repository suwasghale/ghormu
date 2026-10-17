import { cn } from "@/lib/utils"

/**
 * Three faded snapshots on a pile, standing for the old photographs the
 * archive collects. Drawn, not real photos, so nothing implies a place or
 * person that is not Ghormu's.
 */
const FRAMES = [
  { rotate: -8, left: "2%", top: "10%", ridge: "M0 78 L28 50 L50 64 L78 36 L104 58 L132 44 L160 62 V120 H0Z", tone: 34 },
  { rotate: 6, left: "30%", top: "2%", ridge: "M0 70 L36 46 L62 60 L96 30 L122 54 L160 40 V120 H0Z", tone: 22 },
  { rotate: -2, left: "14%", top: "26%", ridge: "M0 84 L24 62 L58 72 L84 44 L118 66 L142 52 L160 60 V120 H0Z", tone: 28 },
]

export function PhotoStack({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative mx-auto aspect-square w-full max-w-sm", className)}>
      {FRAMES.map((frame) => (
        <div
          key={frame.left}
          className="absolute w-[66%] bg-snow p-2.5 pb-10 shadow-xl shadow-ink/15 ring-1 ring-ink/5 transition-transform duration-500 hover:-translate-y-1"
          style={{ left: frame.left, top: frame.top, rotate: `${frame.rotate}deg` }}
        >
          <svg viewBox="0 0 160 120" className="block w-full">
            <rect width="160" height="120" style={{ fill: `color-mix(in oklch, var(--earth) ${frame.tone}%, var(--snow))` }} />
            <circle cx="120" cy="34" r="11" style={{ fill: "color-mix(in oklch, var(--earth) 18%, var(--snow))" }} />
            <path d={frame.ridge} style={{ fill: `color-mix(in oklch, var(--earth) ${frame.tone + 26}%, var(--ink) 18%)` }} />
            <path d="M0 98 Q40 84 80 94 T160 88 V120 H0Z" style={{ fill: "color-mix(in oklch, var(--earth) 50%, var(--ink))" }} />
          </svg>
        </div>
      ))}
    </div>
  )
}
