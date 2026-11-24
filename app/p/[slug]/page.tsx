// Public route: renders the same component as /prototypes/<slug>, but only for
// prototypes with `"public": true`. Anything else is a 404 (never a login
// redirect), so private slugs don't leak.

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { publicComponents } from "@/lib/generated/public-components"
import { getPublicPrototype, getPublicPrototypes } from "@/lib/prototypes"
import { absoluteUrl } from "@/lib/site"

// Cache Components needs at least one param; the placeholder resolves to 404.
const PLACEHOLDER = "__none__"

export function generateStaticParams() {
  const slugs = getPublicPrototypes().map((p) => ({ slug: p.slug }))
  return slugs.length ? slugs : [{ slug: PLACEHOLDER }]
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const entry = getPublicPrototype(slug)
  if (!entry) return { title: "Not found" }
  const { metadata: m, assets } = entry
  const image = assets.ogImage ?? assets.thumbnailDark ?? assets.thumbnailLight
  return {
    title: { absolute: m.title },
    description: m.description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      url: `/p/${slug}`,
      title: m.title,
      description: m.description,
      images: image ? [{ url: image, width: assets.ogImage ? 1200 : 960, height: assets.ogImage ? 630 : 600, alt: m.title }] : undefined,
      // Next resolves image URLs against metadataBase but not video URLs.
      videos: assets.ogVideo ? [{ url: absoluteUrl(assets.ogVideo.url), type: assets.ogVideo.type, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: "summary_large_image", title: m.title, description: m.description, images: image ? [image] : undefined },
  }
}

export default async function PublicPrototypePage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params
  const entry = getPublicPrototype(slug)
  const Component = publicComponents[slug]
  if (!entry || !Component) notFound()
  return <Component />
}
