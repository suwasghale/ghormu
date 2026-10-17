import { MapPin } from "lucide-react"

import { cn } from "@/lib/utils"

import { TopoPattern } from "./topo-pattern"

/** Where each label's pin stands on the tilted terrain, in percent of the frame. */
const PINS = [
  { left: "26%", top: "34%" },
  { left: "58%", top: "24%" },
  { left: "40%", top: "60%" },
  { left: "72%", top: "52%" },
]

/**
 * A preview of the coming 3D map: contour lines tilted into perspective so
 * they read as terrain, with pins standing on it. Pure CSS and SVG; the
 * real map (MapLibre) will load only on its own page.
 */
export function Terrain3D({ labels, className }: { labels: string[]; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative isolate min-h-80 overflow-hidden [perspective:900px]", className)}>
      <div className="absolute -inset-[35%] [transform:rotateX(62deg)_rotateZ(-24deg)]">
        <TopoPattern className="h-full w-full text-brand-foreground/55" />
      </div>
      {labels.slice(0, PINS.length).map((label, index) => (
        <div key={label} className="absolute -translate-x-1/2 -translate-y-full" style={PINS[index]}>
          <div className="flex flex-col items-center">
            <span className="rounded-full bg-snow px-3 py-1 text-sm font-medium whitespace-nowrap text-ink shadow-lg shadow-black/20">
              {label}
            </span>
            <span className="h-6 w-px bg-snow/70" />
            <span className="relative flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-earth opacity-60" />
              <span className="relative inline-flex size-3 rounded-full bg-earth ring-2 ring-snow" />
            </span>
          </div>
        </div>
      ))}
      <MapPin className="absolute right-6 bottom-6 size-6 text-brand-foreground/50" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand to-transparent" />
    </div>
  )
}
