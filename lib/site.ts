/** Absolute base URL for OG tags. Set NEXT_PUBLIC_SITE_URL to use a custom domain. */
export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return "http://localhost:3000"
}

export function absoluteUrl(pathname: string) {
  return new URL(pathname, siteUrl()).toString()
}
