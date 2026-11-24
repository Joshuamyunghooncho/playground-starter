"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

import { createClock, type ToolClock } from "./clock"

/**
 * One playback clock for the component's lifetime. Starts paused when the
 * user prefers reduced motion. Pass it to the render loop and to `ToolShell`.
 */
export function useToolClock({ start = 0, duration = 0 }: { start?: number; duration?: number } = {}): ToolClock {
  const [clock] = useState(() => createClock({ start, duration }))

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) clock.setPlaying(false)
  }, [clock])

  return clock
}

/** Re-renders on play/pause changes. */
export function useClockPlaying(clock: ToolClock) {
  return useSyncExternalStore(
    clock.subscribe,
    () => clock.playing,
    () => clock.playing
  )
}
