/** Shape of app/prototypes/<slug>/metadata.json. Validated by scripts/generate-registry.mjs. */
export type PrototypeMetadata = {
  title: string
  description: string
  tags: string[]
  /** YYYY-MM-DD */
  createdAt: string
  /** ISO timestamp. Bump on every edit. */
  updatedAt: string
  hidden: boolean
  public: boolean
}

export type PrototypeAssets = {
  thumbnailLight: string | null
  thumbnailDark: string | null
  ogImage: string | null
  ogVideo: { url: string; type: "video/mp4" | "video/webm" } | null
}

export type PrototypeEntry = {
  slug: string
  metadata: PrototypeMetadata
  assets: PrototypeAssets
}
