import { NextResponse } from "next/server"

import { AUTH_COOKIE, AUTH_MAX_AGE, safeEqual, tokenFor } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const expected = process.env.SITE_PASSWORD
    if (!expected) {
      return NextResponse.json({ error: "SITE_PASSWORD is not configured" }, { status: 503 })
    }
    const body = (await request.json().catch(() => null)) as { password?: unknown } | null
    const password = typeof body?.password === "string" ? body.password : ""
    const [given, wanted] = await Promise.all([tokenFor(password), tokenFor(expected)])
    if (!safeEqual(given, wanted)) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 })
    }
    const res = NextResponse.json({ ok: true })
    res.cookies.set(AUTH_COOKIE, wanted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_MAX_AGE,
    })
    return res
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(AUTH_COOKIE)
  return res
}
