import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

const tones = {
  default: "bg-background",
  mist: "bg-mist",
  brand: "bg-brand-muted",
  ink: "bg-ink text-ink-foreground",
} as const

export type Tone = keyof typeof tones

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>
}

/** A full-width band of the page. `id` doubles as an in-page anchor. */
export function Section({
  id,
  tone = "default",
  className,
  children,
  labelledBy,
}: {
  id?: string
  tone?: Tone
  className?: string
  children: React.ReactNode
  /** Id of the heading that names this section, for screen readers. */
  labelledBy?: string
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("relative scroll-mt-20 py-20 sm:py-28", tones[tone], className)}>
      <Container>{children}</Container>
    </section>
  )
}

/** Small label above a heading, led by a short rule. */
export function Eyebrow({ children, tone = "default", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-sm font-semibold tracking-wide",
        tone === "ink" ? "text-earth" : "text-brand",
        className,
      )}
    >
      <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />
      {children}
    </p>
  )
}

export function SectionHeader({
  id,
  eyebrow,
  title,
  lead,
  align = "start",
  tone = "default",
  className,
}: {
  id?: string
  eyebrow?: string
  title: string
  lead?: string
  align?: "start" | "center"
  tone?: Tone
  className?: string
}) {
  const onInk = tone === "ink"

  return (
    <div className={cn("reveal max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow tone={tone} className={align === "center" ? "justify-center" : undefined}>{eyebrow}</Eyebrow>}
      <h2 id={id} className="mt-3 font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {lead && (
        <p className={cn("mt-5 text-lg leading-relaxed", onInk ? "text-ink-foreground/75" : "text-muted-foreground")}>
          {lead}
        </p>
      )}
    </div>
  )
}

/** "Read more →" style link. */
export function ArrowLink({
  href,
  children,
  tone = "default",
  className,
}: {
  href: string
  children: React.ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4",
        tone === "ink" ? "text-earth focus-visible:outline-earth" : "text-brand focus-visible:outline-brand",
        className,
      )}
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

const buttonBase =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2"

export const buttonStyles = {
  primary: cn(buttonBase, "bg-brand text-brand-foreground hover:opacity-90 focus-visible:outline-brand"),
  secondary: cn(buttonBase, "border border-border bg-background hover:border-brand hover:text-brand focus-visible:outline-brand"),
  onInk: cn(buttonBase, "bg-earth text-ink hover:opacity-90 focus-visible:outline-earth"),
  ghostOnInk: cn(buttonBase, "border border-ink-foreground/30 text-ink-foreground hover:border-earth hover:text-earth focus-visible:outline-earth"),
} as const
