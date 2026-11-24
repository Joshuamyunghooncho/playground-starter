// Playback clock shared by a prototype's render loop and the tool shell's
// timeline. Plain mutable object (no React): the render loop reads and
// advances it every frame, the timeline reads it for display, and React
// components subscribe only to play/pause changes.

export const FRAME_STEP = 1 / 30

export type ToolClock = {
  /** Current time in seconds. */
  readonly t: number
  readonly playing: boolean
  /** Loop length in seconds; 0 means open-ended (time just counts up). */
  readonly duration: number
  /** Advance by dt seconds when playing (wrapping at `duration`) and return the new time. */
  advance: (dt: number) => number
  seek: (t: number) => void
  /** Pause and move by whole frames (1/30 s). */
  step: (frames: number) => void
  setPlaying: (playing: boolean) => void
  togglePlaying: () => void
  setDuration: (seconds: number) => void
  /** True once after a seek/step, so a paused render loop knows to redraw. */
  consumeSeek: () => boolean
  /** Notified on play/pause changes only. */
  subscribe: (listener: () => void) => () => void
}

export function createClock({ start = 0, duration = 0, playing = true } = {}): ToolClock {
  let t = start
  let len = Math.max(0, duration)
  let on = playing
  let seeked = false
  const listeners = new Set<() => void>()

  const wrap = (v: number) => (len > 0 ? ((v % len) + len) % len : Math.max(0, v))
  const notify = () => listeners.forEach((l) => l())

  const clock: ToolClock = {
    get t() {
      return t
    },
    get playing() {
      return on
    },
    get duration() {
      return len
    },
    advance(dt) {
      if (on) t = wrap(t + dt)
      return t
    },
    seek(v) {
      t = wrap(v)
      seeked = true
    },
    step(frames) {
      clock.setPlaying(false)
      clock.seek(t + frames * FRAME_STEP)
    },
    setPlaying(next) {
      if (next === on) return
      on = next
      notify()
    },
    togglePlaying() {
      clock.setPlaying(!on)
    },
    setDuration(seconds) {
      len = Number.isFinite(seconds) && seconds > 0 ? seconds : 0
      t = wrap(t)
    },
    consumeSeek() {
      const was = seeked
      seeked = false
      return was
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
  return clock
}
