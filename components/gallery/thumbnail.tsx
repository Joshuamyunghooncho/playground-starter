/* eslint-disable @next/next/no-img-element -- static, pre-sized thumbnails; no optimizer needed */
import type { PrototypeAssets } from "@/lib/prototype-types"

/**
 * Static screenshots only (never a live iframe). Light and dark images are both
 * in the markup and switched with the `dark:` variant, so there is no flash.
 */
export function Thumbnail({ assets, title }: { assets: PrototypeAssets; title: string }) {
  const light = assets.thumbnailLight ?? assets.thumbnailDark
  const dark = assets.thumbnailDark ?? assets.thumbnailLight

  if (!light || !dark) {
    return (
      <div className="flex aspect-[8/5] items-center justify-center bg-foreground/5 text-muted-foreground">
        No preview yet
      </div>
    )
  }

  const common = "aspect-[8/5] w-full object-cover object-top"
  return (
    <>
      <img src={light} alt={title} loading="lazy" decoding="async" width={960} height={600} className={`${common} dark:hidden`} />
      <img src={dark} alt={title} loading="lazy" decoding="async" width={960} height={600} className={`${common} hidden dark:block`} />
    </>
  )
}
