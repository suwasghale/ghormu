import { cn } from "@/lib/utils"

/**
 * Illustrated ridgelines, standing in for photography until there is some.
 *
 * Colours are mixed from the theme tokens, so the illustration follows the
 * palette if it changes. `hero` is the full scene with sky, sun, snow peaks
 * and prayer flags; `strip` is only the ridges, for the foot of page headers.
 */

const shade = (amount: number, toward = "white") =>
  `color-mix(in oklch, var(--brand) ${amount}%, ${toward})`

/** Small conifers along the foreground ridge: [x, baseY, height]. */
const TREES: [number, number, number][] = [
  [60, 560, 34], [92, 552, 46], [124, 560, 30], [312, 532, 38], [340, 526, 52],
  [372, 534, 36], [612, 548, 30], [1010, 520, 40], [1040, 512, 56], [1074, 522, 42],
  [1104, 530, 30], [1300, 548, 44], [1332, 556, 32], [1372, 552, 40],
]

/** Prayer-flag colours, in their traditional order. */
const FLAGS = ["#2f6fb5", "#f4f1e8", "#c8463b", "#3f8f5a", "#e7b53c"]

function Trees() {
  return (
    <g style={{ fill: shade(70, "black") }}>
      {TREES.map(([x, y, h]) => (
        <path key={x} d={`M${x} ${y - h} L${x + h * 0.32} ${y} L${x - h * 0.32} ${y} Z`} />
      ))}
    </g>
  )
}

function PrayerFlags() {
  // Strung between two poles on the near ridge, sagging in the middle.
  const from = { x: 760, y: 372 }
  const to = { x: 1000, y: 352 }
  const count = 15
  const flags = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count
    const x = from.x + (to.x - from.x) * t
    const y = from.y + (to.y - from.y) * t + Math.sin(Math.PI * t) * 26
    return { x, y, color: FLAGS[i % FLAGS.length] }
  })

  return (
    <g>
      <path d={`M${from.x} ${from.y + 56} V${from.y}`} stroke={shade(60, "black")} strokeWidth="3" />
      <path d={`M${to.x} ${to.y + 50} V${to.y}`} stroke={shade(60, "black")} strokeWidth="3" />
      <path
        d={`M${from.x} ${from.y} Q${(from.x + to.x) / 2} ${(from.y + to.y) / 2 + 52} ${to.x} ${to.y}`}
        fill="none"
        stroke={shade(60, "black")}
        strokeWidth="1.2"
        opacity="0.7"
      />
      {flags.map((flag) => (
        <rect key={flag.x} x={flag.x - 5} y={flag.y + 1} width="10" height="13" rx="1" fill={flag.color} opacity="0.92" />
      ))}
    </g>
  )
}

export function Landscape({
  variant = "hero",
  className,
}: {
  variant?: "hero" | "strip"
  className?: string
}) {
  if (variant === "strip") {
    return (
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" className={cn("block w-full", className)}>
        <path d="M0 64 Q180 24 360 52 T720 40 T1080 54 T1440 34 V120 H0 Z" style={{ fill: shade(18) }} />
        <path d="M0 82 Q200 50 420 74 T860 64 T1440 70 V120 H0 Z" style={{ fill: shade(34) }} />
        {/* The front ridge is the page's own background, so the header flows into the content below. */}
        <path d="M0 102 Q240 76 480 98 T960 90 T1440 96 V120 H0 Z" fill="var(--background)" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 1440 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true" className={cn("block h-full w-full", className)}>
      <defs>
        <linearGradient id="ls-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--mist)" />
          <stop offset="0.7" stopColor="var(--snow)" />
        </linearGradient>
        <radialGradient id="ls-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--earth)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--earth)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ls-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="0.5" stopColor="white" stopOpacity="0.75" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1440" height="640" fill="url(#ls-sky)" />
      <circle cx="1090" cy="210" r="240" fill="url(#ls-sun)" />
      <circle cx="1090" cy="210" r="56" style={{ fill: "color-mix(in oklch, var(--earth) 30%, #ffe7b8)" }} />

      {/* Far snow range */}
      <g className="rise" style={{ ["--rise-delay" as string]: "0ms" }}>
        <path
          d="M0 380 L110 318 L190 344 L320 236 L410 292 L520 206 L640 284 L760 226 L880 296 L1000 214 L1130 290 L1240 238 L1350 296 L1440 262 V640 H0 Z"
          style={{ fill: "color-mix(in oklch, var(--mist) 70%, var(--ink))" }}
          opacity="0.55"
        />
        <g fill="white" opacity="0.95">
          <path d="M320 236 L296 256 L312 252 L322 262 L336 250 L348 256 Z" />
          <path d="M520 206 L494 228 L510 224 L522 236 L536 222 L550 230 Z" />
          <path d="M760 226 L738 244 L752 241 L763 251 L775 240 L786 245 Z" />
          <path d="M1000 214 L974 236 L991 231 L1003 243 L1017 230 L1030 238 Z" />
          <path d="M1240 238 L1220 254 L1233 251 L1243 260 L1254 250 L1264 255 Z" />
        </g>
      </g>

      <rect y="300" width="1440" height="120" fill="url(#ls-mist)" />

      {/* Mid hills */}
      <path
        className="rise"
        style={{ fill: shade(30), ["--rise-delay" as string]: "120ms" }}
        d="M0 420 Q160 360 320 396 T640 380 T960 392 T1280 368 T1440 380 V640 H0 Z"
      />

      {/* Near ridge with prayer flags */}
      <g className="rise" style={{ ["--rise-delay" as string]: "240ms" }}>
        <path
          style={{ fill: shade(62) }}
          d="M0 480 Q200 430 380 462 Q560 494 720 430 Q860 380 1000 410 Q1180 450 1300 430 Q1380 418 1440 428 V640 H0 Z"
        />
        <PrayerFlags />
      </g>

      {/* Foreground */}
      <g className="rise" style={{ ["--rise-delay" as string]: "360ms" }}>
        <path
          style={{ fill: shade(88, "black") }}
          d="M0 560 Q140 530 300 540 Q470 552 620 548 Q800 540 980 520 Q1160 500 1300 540 Q1380 560 1440 552 V640 H0 Z"
        />
        <Trees />
      </g>
    </svg>
  )
}
