"use client"

import { useEffect, useRef } from "react"

import type { ToolClock } from "./clock"
import { useFitSize } from "./use-fit-size"

/** Draws the frame at time `t` (seconds) at whatever size the canvas has. Memoize it on its params. */
export type DrawFrame = (canvas: HTMLCanvasElement, t: number) => void
export type MotionSize = { width: number; height: number }

type Props = {
  label: string
  draw: DrawFrame
  /** Export size; the preview keeps its aspect ratio. */
  size: MotionSize
  /** Loop length in seconds; 0 is open-ended. */
  duration: number
  clock: ToolClock
  /** Holds time still (e.g. while an MP4 is being written). */
  frozen?: boolean
  /** Fit the preview to the stage width at 100% zoom. */
  widthFit?: boolean
}

/** Preview canvas for a piece whose frames are a pure function of (params, t). */
export function MotionCanvas({ label, draw, size, duration, clock, frozen = false, widthFit = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const fit = useFitSize(wrapRef, size.width / size.height, widthFit)
  const live = useRef({ draw, duration, frozen })
  const dirty = useRef(true)

  useEffect(() => {
    live.current = { draw, duration, frozen }
    dirty.current = true
  }, [draw, duration, frozen])

  // One loop for the component's lifetime; it reads live values through a ref.
  useEffect(() => {
    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const dt = Math.min(Math.max(now - last, 0) / 1000, 0.1)
      last = now
      const { draw: drawNow, duration: seconds, frozen: hold } = live.current
      clock.setDuration(seconds)
      const t = clock.advance(hold ? 0 : dt)
      const seeked = clock.consumeSeek()
      const canvas = canvasRef.current
      if (canvas && canvas.width > 1 && ((clock.playing && !hold) || seeked || dirty.current)) {
        dirty.current = false
        drawNow(canvas, t)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [clock])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !fit) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(fit.w * dpr)
    canvas.height = Math.round(fit.h * dpr)
    dirty.current = true
  }, [fit])

  return (
    <div ref={wrapRef} className="flex size-full min-h-0 min-w-0 items-center justify-center">
      <canvas ref={canvasRef} role="img" aria-label={label} style={fit ? { width: fit.w, height: fit.h } : undefined} className="block shrink-0" />
    </div>
  )
}
