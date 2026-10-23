import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { publishedPages } from "../config/navigation"
import { locales } from "../lib/i18n/config"

/**
 * Every public page, in every language, against WCAG 2.1 A and AA plus
 * axe's best practices: contrast, names that match visible text, landmarks,
 * list structure. Needs no fixtures, so it runs against any address:
 *
 *   E2E_BASE_URL=http://localhost:3010 pnpm exec playwright test e2e/accessibility.spec.ts
 */

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]

for (const locale of locales) {
  for (const path of publishedPages) {
    const address = `/${locale}${path === "/" ? "" : path}`

    test(`${address} meets WCAG 2.1 AA`, async ({ page }) => {
      // Content that fades in on scroll is shown at once, so axe can read it.
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto(address, { waitUntil: "load" })

      const { violations } = await new AxeBuilder({ page })
        .withTags(TAGS)
        // The map canvases are drawn by MapLibre and Cesium, not by us.
        .exclude(".maplibregl-canvas-container")
        .exclude(".cesium-widget")
        .analyze()

      expect(violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([])
    })
  }
}
