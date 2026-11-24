import type { MetadataRoute } from "next"

// Link-preview crawlers honour robots.txt, so /p/ and /og/ must stay allowed.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: ["/p/", "/og/"], disallow: "/" } }
}
