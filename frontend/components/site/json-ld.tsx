/**
 * Schema.org structured data for search engines.
 *
 * `<` is escaped so text inside the data can never close the script tag.
 * Not executed by the browser, so the CSP's script rules do not apply.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c") }}
    />
  )
}
