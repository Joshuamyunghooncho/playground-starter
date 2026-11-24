// Password gate (Next 16 renamed middleware.ts → proxy.ts).
// Production only. Everything is private except the paths in isOpenPath().

import { NextResponse, type NextRequest } from "next/server"

import { AUTH_COOKIE, isAuthEnabled, isValidToken } from "@/lib/auth"
import { publicSlugs } from "@/lib/generated/public-slugs"

function isOpenPath(pathname: string) {
  if (pathname === "/login" || pathname === "/api/auth" || pathname === "/robots.txt") return true
  // Public prototype pages. Unknown/private slugs 404 inside the route, never redirect to login.
  if (pathname === "/p" || pathname.startsWith("/p/")) return true
  // OG images/videos for public prototypes (link-preview crawlers have no cookie).
  if (pathname.startsWith("/og/")) return true
  // API routes of public prototypes: /api/<slug>/...
  const api = /^\/api\/([^/]+)(?:\/|$)/.exec(pathname)
  if (api && publicSlugs.includes(api[1])) return true
  return false
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Unknown or private slug under /p/ → real 404 status. (With Partial
  // Prerendering, notFound() inside the page streams after a 200 shell.)
  // Rewriting to bare /p, which has no page, renders app/not-found.tsx as a 404.
  const pub = /^\/p\/([^/]+)/.exec(pathname)
  if (pub && !publicSlugs.includes(decodeURIComponent(pub[1]))) {
    return NextResponse.rewrite(new URL("/p", request.url))
  }

  if (!isAuthEnabled()) return NextResponse.next()
  if (isOpenPath(pathname)) return NextResponse.next()

  if (await isValidToken(request.cookies.get(AUTH_COOKIE)?.value)) return NextResponse.next()

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const login = new URL("/login", request.url)
  if (pathname !== "/") login.searchParams.set("next", pathname + search)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
