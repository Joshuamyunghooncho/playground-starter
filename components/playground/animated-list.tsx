"use client"

import { useEffect, useState, type ReactNode } from "react"

import { AnimateHeight } from "./animate-height"

type Phase = "enter" | "open" | "exit"
type Row<T> = { key: string; item: T; phase: Phase }

const EXIT_MS = 320

function reconcile<T>(prev: Row<T>[], items: T[], getKey: (item: T) => string): Row<T>[] {
  const prevByKey = new Map(prev.map((r) => [r.key, r]))
  const nextKeys = new Set(items.map(getKey))
  const out: Row<T>[] = items.map((item) => {
    const key = getKey(item)
    const old = prevByKey.get(key)
    return { key, item, phase: old ? (old.phase === "exit" ? "open" : old.phase) : "enter" }
  })
  // Keep removed rows where they were, collapsing, until the exit animation ends.
  prev.forEach((r, i) => {
    if (!nextKeys.has(r.key)) out.splice(Math.min(i, out.length), 0, { ...r, phase: "exit" })
  })
  return out
}

/**
 * A list whose rows animate their height in when added and out when removed,
 * so the page never jumps. Rows need stable keys. Put spacing inside `render`
 * (e.g. `pb-2`), not as a flex gap, so collapsed rows take no space.
 */
export function AnimatedList<T>({
  items,
  getKey,
  render,
  className,
}: {
  items: T[]
  getKey: (item: T) => string
  render: (item: T) => ReactNode
  className?: string
}) {
  const [prevItems, setPrevItems] = useState(items)
  const [rows, setRows] = useState<Row<T>[]>(() =>
    items.map((item) => ({ key: getKey(item), item, phase: "open" as const }))
  )

  // Adjust state while rendering when the items prop changes (React-recommended pattern).
  if (items !== prevItems) {
    setPrevItems(items)
    setRows(reconcile(rows, items, getKey))
  }

  // New rows render collapsed for one frame, then open.
  useEffect(() => {
    if (!rows.some((r) => r.phase === "enter")) return
    const id = requestAnimationFrame(() =>
      setRows((rs) => rs.map((r) => (r.phase === "enter" ? { ...r, phase: "open" } : r)))
    )
    return () => cancelAnimationFrame(id)
  }, [rows])

  // Removed rows are dropped once they've collapsed.
  useEffect(() => {
    if (!rows.some((r) => r.phase === "exit")) return
    const id = setTimeout(() => setRows((rs) => rs.filter((r) => r.phase !== "exit")), EXIT_MS)
    return () => clearTimeout(id)
  }, [rows])

  return (
    <div className={className}>
      {rows.map((r) => (
        <AnimateHeight key={r.key} open={r.phase === "open"}>
          {render(r.item)}
        </AnimateHeight>
      ))}
    </div>
  )
}
