"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { readStorage, writeStorage } from "@/lib/storage"
import { SLUG, STORAGE_KEYS } from "./data"
import { parsePresets, toStored } from "./presets"
import type { Preset } from "./types"

/** Saved presets, each with a stable id for animated add/remove. Persisted in handlers. */
export function usePresets() {
  const [presets, setPresets] = useState<(Preset & { id: string })[]>([])
  const ref = useRef(presets)
  const nextId = useRef(0)
  const withIds = useCallback((list: Preset[]) => list.map((p) => ({ ...p, id: `p${nextId.current++}` })), [])

  useEffect(() => {
    const loaded = withIds(parsePresets(readStorage<unknown>(SLUG, STORAGE_KEYS.presets) ?? []))
    ref.current = loaded
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load persisted state after mount (no SSR mismatch)
    setPresets(loaded)
  }, [withIds])

  const commit = useCallback((next: (Preset & { id: string })[]) => {
    ref.current = next
    setPresets(next)
    writeStorage(SLUG, STORAGE_KEYS.presets, next.map(toStored))
  }, [])

  const add = useCallback((p: Preset) => commit([...ref.current, ...withIds([p])]), [commit, withIds])
  const addMany = useCallback((list: Preset[]) => commit([...ref.current, ...withIds(list)]), [commit, withIds])
  const remove = useCallback((id: string) => commit(ref.current.filter((p) => p.id !== id)), [commit])

  return { presets, add, addMany, remove }
}

export type PresetsApi = ReturnType<typeof usePresets>
