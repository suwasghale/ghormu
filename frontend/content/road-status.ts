import { bilingual } from "./bilingual"

/**
 * Road and trail conditions to Ghormu, updated by hand.
 *
 * Set `level`, the date it was checked, and a short note in both languages,
 * then redeploy. Leave it "unknown" rather than guess: a stale "open" is
 * worse than no answer. Moves to the admin once the CMS exists.
 */
export type RoadLevel = "open" | "caution" | "closed" | "unknown"

export const roadStatus: {
  level: RoadLevel
  /** `YYYY-MM-DD`, the day someone confirmed it. */
  checked: string
} = {
  level: "unknown",
  checked: "",
}

export const roadNote = bilingual({
  ne: "",
  en: "",
})
