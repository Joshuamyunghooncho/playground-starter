// Shared by proxy.ts, app/api/auth/route.ts and scripts/capture-thumbnails.ts.
// The cookie holds a SHA-256 digest of the password, never the password itself.
// Changing SITE_PASSWORD invalidates every existing session.

export const AUTH_COOKIE = "playground_auth"
export const AUTH_MAX_AGE = 60 * 60 * 24 * 365

/** The gate is on for production builds (`next start`, Vercel production and previews). */
export function isAuthEnabled() {
  return process.env.NODE_ENV === "production"
}

export async function tokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode(`prototype-playground:v1:${password}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function isValidToken(token: string | undefined): Promise<boolean> {
  const password = process.env.SITE_PASSWORD
  if (!password || !token) return false
  return safeEqual(token, await tokenFor(password))
}

/** Only allow same-site relative redirects after login. */
export function safeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/"
  return next
}
