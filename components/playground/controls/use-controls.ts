"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { readStorage, removeStorage, writeStorage } from "@/lib/storage"
import {
  defaultValues,
  randomValues,
  sanitizeValues,
  type ControlSchema,
  type ControlValues,
} from "./schema"

export type ControlsApi<S extends ControlSchema> = {
  schema: S
  values: ControlValues<S>
  set: <K extends keyof S>(key: K, value: ControlValues<S>[K]) => void
  /** Set several values at once (e.g. applying a preset). Unknown/invalid values are sanitized. */
  replace: (values: Partial<ControlValues<S>>) => void
  reset: () => void
  randomize: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

/** Edits of one control closer together than this form one undo step (a drag, a typing burst). */
const BURST_MS = 700
const MAX_HISTORY = 200

/**
 * State for a control panel. Values persist to localStorage under
 * `playground:<namespace>:controls` (use the prototype slug as namespace).
 * Stored values load after mount, so the first render always uses defaults.
 *
 * Storage is written only on user changes (set/randomize), never from an
 * effect: an effect-based save races the initial load and can overwrite the
 * stored values with defaults (especially under React Strict Mode).
 *
 * Every change is undoable (`undo`/`redo`); the tool shell binds ⌘Z / ⇧⌘Z.
 */
export function useControls<const S extends ControlSchema>(namespace: string, schema: S): ControlsApi<S> {
  const schemaRef = useRef(schema)
  const [values, setValues] = useState<ControlValues<S>>(() => defaultValues(schema))
  // Latest values for handlers. Next values are computed here, not inside a
  // setState updater: updaters must be pure (Strict Mode calls them twice, so
  // Math.random in Randomize would store one result and show another).
  const valuesRef = useRef(values)
  const history = useRef({ undo: [] as ControlValues<S>[], redo: [] as ControlValues<S>[], key: "", at: 0 })
  const [depth, setDepth] = useState({ undo: 0, redo: 0 })

  useEffect(() => {
    const stored = readStorage<unknown>(namespace, "controls")
    if (stored === undefined) return
    const loaded = sanitizeValues(schemaRef.current, stored)
    valuesRef.current = loaded
    // Loading persisted state after mount is intentional (no SSR mismatch).
    setValues(loaded)
  }, [namespace])

  const syncDepth = useCallback(() => {
    const h = history.current
    setDepth({ undo: h.undo.length, redo: h.redo.length })
  }, [])

  /** Saves the current values as an undo step, unless this edit continues the last burst. */
  const remember = useCallback(
    (key: string) => {
      const h = history.current
      const now = performance.now()
      if (key && h.key === key && now - h.at < BURST_MS) {
        h.at = now
        return
      }
      h.undo.push(valuesRef.current)
      if (h.undo.length > MAX_HISTORY) h.undo.shift()
      h.redo = []
      h.key = key
      h.at = now
      syncDepth()
    },
    [syncDepth]
  )

  const commit = useCallback(
    (next: ControlValues<S>) => {
      valuesRef.current = next
      setValues(next)
      writeStorage(namespace, "controls", next)
    },
    [namespace]
  )

  const set = useCallback(
    <K extends keyof S>(key: K, value: ControlValues<S>[K]) => {
      if (Object.is(valuesRef.current[key], value)) return
      remember(String(key))
      commit({ ...valuesRef.current, [key]: value })
    },
    [commit, remember]
  )

  const replace = useCallback(
    (partial: Partial<ControlValues<S>>) => {
      remember("")
      commit(sanitizeValues(schemaRef.current, { ...valuesRef.current, ...partial }))
    },
    [commit, remember]
  )

  const randomize = useCallback(() => {
    remember("")
    commit(randomValues(schemaRef.current, valuesRef.current))
  }, [commit, remember])

  const reset = useCallback(() => {
    remember("")
    removeStorage(namespace, "controls")
    const defaults = defaultValues(schemaRef.current)
    valuesRef.current = defaults
    setValues(defaults)
  }, [namespace, remember])

  const travel = useCallback(
    (from: "undo" | "redo") => {
      const h = history.current
      const target = h[from].pop()
      if (!target) return
      h[from === "undo" ? "redo" : "undo"].push(valuesRef.current)
      h.key = ""
      commit(target)
      syncDepth()
    },
    [commit, syncDepth]
  )
  const undo = useCallback(() => travel("undo"), [travel])
  const redo = useCallback(() => travel("redo"), [travel])

  return {
    schema,
    values,
    set,
    replace,
    reset,
    randomize,
    undo,
    redo,
    canUndo: depth.undo > 0,
    canRedo: depth.redo > 0,
  }
}
