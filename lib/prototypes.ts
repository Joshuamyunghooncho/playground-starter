import { registry } from "@/lib/generated/registry"
import type { PrototypeEntry } from "@/lib/prototype-types"

export type { PrototypeEntry, PrototypeMetadata, PrototypeAssets } from "@/lib/prototype-types"

/** Every prototype, most recently updated first. Includes hidden ones. */
export function getAllPrototypes(): PrototypeEntry[] {
  return [...registry].sort(
    (a, b) => Date.parse(b.metadata.updatedAt) - Date.parse(a.metadata.updatedAt)
  )
}

export function getPrototype(slug: string): PrototypeEntry | undefined {
  return registry.find((p) => p.slug === slug)
}

/** Only prototypes whose metadata says `"public": true`. */
export function getPublicPrototypes(): PrototypeEntry[] {
  return getAllPrototypes().filter((p) => p.metadata.public)
}

export function getPublicPrototype(slug: string): PrototypeEntry | undefined {
  const p = getPrototype(slug)
  return p?.metadata.public ? p : undefined
}
