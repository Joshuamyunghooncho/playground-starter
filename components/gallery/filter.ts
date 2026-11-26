import type { PrototypeEntry } from "@/lib/prototype-types"
import { tagGroups } from "./tag-groups"

export type GalleryFilter = {
  query: string
  tags: string[]
  showHidden: boolean
}

/** Pure: entries are assumed pre-sorted (most recently updated first). */
export function filterPrototypes(entries: PrototypeEntry[], f: GalleryFilter): PrototypeEntry[] {
  const q = f.query.trim().toLowerCase()
  return entries.filter(({ slug, metadata: m }) => {
    if (m.hidden && !f.showHidden) return false
    if (f.tags.length) {
      const groups = tagGroups(m.tags)
      if (!f.tags.every((t) => groups.includes(t))) return false
    }
    if (!q) return true
    return [slug, m.title, m.description, ...m.tags].some((s) => s.toLowerCase().includes(q))
  })
}

/** Filters (grouped tags) across visible entries, most used first. */
export function collectTags(entries: PrototypeEntry[], showHidden: boolean): string[] {
  const counts = new Map<string, number>()
  for (const e of entries) {
    if (e.metadata.hidden && !showHidden) continue
    for (const t of tagGroups(e.metadata.tags)) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t)
}
