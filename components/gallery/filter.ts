import type { PrototypeEntry } from "@/lib/prototype-types"

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
    if (f.tags.length && !f.tags.every((t) => m.tags.includes(t))) return false
    if (!q) return true
    return [slug, m.title, m.description, ...m.tags].some((s) => s.toLowerCase().includes(q))
  })
}

/** Tags across visible entries, most used first. */
export function collectTags(entries: PrototypeEntry[], showHidden: boolean): string[] {
  const counts = new Map<string, number>()
  for (const e of entries) {
    if (e.metadata.hidden && !showHidden) continue
    for (const t of e.metadata.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t)
}
