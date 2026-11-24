"use client"

import { useState, type FormEvent } from "react"

import { ToolButton, ToolInput } from "@/components/playground/tool"
import { safeNextPath } from "@/lib/auth"

export function LoginForm() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? "Login failed")
        return
      }
      const next = new URLSearchParams(window.location.search).get("next")
      window.location.assign(safeNextPath(next))
    } catch {
      setError("Network error")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <ToolInput
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        aria-label="Password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-invalid={error ? true : undefined}
        className="h-9 max-md:h-11"
      />
      {error && <p className="text-destructive">{error}</p>}
      <ToolButton type="submit" variant="primary" className="h-9 max-md:h-11" disabled={pending || !password}>
        Enter
      </ToolButton>
    </form>
  )
}
