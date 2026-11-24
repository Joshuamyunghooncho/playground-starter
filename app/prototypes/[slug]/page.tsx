// Catch-all for /prototypes/<slug>. Every real prototype has its own static
// folder (app/prototypes/<slug>/page.tsx), which always wins over this dynamic
// segment, so anything reaching here is an unknown slug.

import { notFound } from "next/navigation"

export function generateStaticParams() {
  // Cache Components needs at least one param.
  return [{ slug: "__none__" }]
}

export default function UnknownPrototype() {
  notFound()
}
