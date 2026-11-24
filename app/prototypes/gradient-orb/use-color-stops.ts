"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { readStorage, writeStorage } from "@/lib/storage"
import { DEFAULT_COLORS, MIN_COLORS, SLUG, STORAGE_KEYS } from "./data"
import { isHex, makeStops, randomColor, randomPalette } from "./palette"
import { MAX_COLORS } from "./shader"
import type { ColorStop } from "./types"

/**
 * Gradient colour stops (2–8). Persisted on every user change, loaded after
 * mount. Storage is written in handlers, never from an effect (see AGENTS.md).
 */
export function useColorStops() {
  const [stops, setStops] = useState<ColorStop[]>(() => makeStops(DEFAULT_COLORS))
  const stopsRef = useRef(stops)

  useEffect(() => {
    const stored = readStorage<unknown>(SLUG, STORAGE_KEYS.colors)
    if (!Array.isArray(stored)) return
    const hexes = stored.filter(isHex).slice(0, MAX_COLORS)
    if (hexes.length < MIN_COLORS) return
    const loaded = makeStops(hexes, stopsRef.current)
    stopsRef.current = loaded
    // Loading persisted state after mount is intentional (no SSR mismatch).
    setStops(loaded)
  }, [])

  const commit = useCallback((next: ColorStop[]) => {
    stopsRef.current = next
    setStops(next)
    writeStorage(SLUG, STORAGE_KEYS.colors, next.map((s) => s.hex))
  }, [])

  const update = useCallback(
    (id: string, hex: string) => commit(stopsRef.current.map((s) => (s.id === id ? { ...s, hex } : s))),
    [commit]
  )
  const add = useCallback(() => {
    if (stopsRef.current.length >= MAX_COLORS) return
    commit([...stopsRef.current, ...makeStops([randomColor()])])
  }, [commit])
  const remove = useCallback(
    (id: string) => {
      if (stopsRef.current.length <= MIN_COLORS) return
      commit(stopsRef.current.filter((s) => s.id !== id))
    },
    [commit]
  )
  /** Keeps ids so rows recolour in place instead of animating out and in. */
  const randomize = useCallback(() => {
    const hexes = randomPalette(stopsRef.current.length)
    commit(stopsRef.current.map((s, i) => ({ ...s, hex: hexes[i] })))
  }, [commit])
  const replaceAll = useCallback((hexes: string[]) => commit(makeStops(hexes, stopsRef.current)), [commit])
  const reset = useCallback(() => commit(makeStops(DEFAULT_COLORS, stopsRef.current)), [commit])

  const hexes = useMemo(() => stops.map((s) => s.hex), [stops])

  return { stops, hexes, update, add, remove, randomize, replaceAll, reset }
}

export type ColorStopsApi = ReturnType<typeof useColorStops>
