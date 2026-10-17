import { Plus } from "lucide-react"

/** Questions as native disclosure widgets: keyboard and screen-reader ready, no script. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card">
      {items.map((item) => (
        <details key={item.q} className="group px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-medium [&::-webkit-details-marker]:hidden">
            {item.q}
            <Plus aria-hidden="true" className="size-5 shrink-0 text-brand transition-transform group-open:rotate-45" />
          </summary>
          <p className="pb-6 leading-relaxed text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  )
}
