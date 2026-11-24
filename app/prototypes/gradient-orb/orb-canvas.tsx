"use client"

import { useEffect, useRef, useState, type RefObject } from "react"

import { useFitSize, type ToolClock } from "@/components/playground/tool"
import { createRenderer, type Renderer } from "./renderer"
import type { Clock, OrbParams, UploadedImage } from "./types"

type Props = {
  params: OrbParams
  colors: string[]
  image: UploadedImage | null
  clock: ToolClock
  canvasRef: RefObject<HTMLCanvasElement | null>
}

export function OrbCanvas({ params, colors, image, clock: playback, canvasRef }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const paramsRef = useRef(params)
  const dirty = useRef(true)
  const [unsupported, setUnsupported] = useState(false)
  const aspect = Number(params.aspect) || 0.8
  const size = useFitSize(wrapRef, aspect)

  // Create the renderer and run one RAF loop for the component's lifetime.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let renderer: Renderer | null = null
    try {
      renderer = createRenderer(canvas)
    } catch {
      renderer = null
    }
    if (!renderer) {
      // WebGL missing or shader failed: show a message instead of a blank box.
      queueMicrotask(() => setUnsupported(true))
      return
    }
    rendererRef.current = renderer
    const clock: Clock = { t: 0, flow: 0, hue: 0 }
    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const p = paramsRef.current
      if (playback.playing) {
        // Flow and hue integrate their speeds, so slider changes never jump.
        clock.t = playback.advance(dt)
        clock.flow += dt * p.speed
        clock.hue += dt * p.cycle
      }
      // Paused: only redraw when something changed (saves battery on phones).
      if (playback.playing || dirty.current) {
        renderer!.draw(p, clock, Math.min(window.devicePixelRatio || 1, 2))
        dirty.current = false
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      renderer!.dispose()
      rendererRef.current = null
    }
  }, [canvasRef, playback])

  useEffect(() => {
    if (!size || !rendererRef.current) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    rendererRef.current.resize(Math.round(size.w * dpr), Math.round(size.h * dpr))
    dirty.current = true
  }, [size])

  useEffect(() => {
    paramsRef.current = params
    dirty.current = true
  }, [params])

  useEffect(() => {
    rendererRef.current?.setColors(colors)
    dirty.current = true
  }, [colors])

  useEffect(() => {
    rendererRef.current?.setImage(image?.element ?? null)
    dirty.current = true
  }, [image])

  return (
    <div ref={wrapRef} className="flex size-full min-h-0 min-w-0 items-center justify-center">
      {unsupported ? (
        <p className="text-sm text-muted-foreground">
          WebGL을 사용할 수 없는 환경입니다.
        </p>
      ) : (
        <canvas
          ref={canvasRef}
          style={size ? { width: size.w, height: size.h } : undefined}
          className="block"
        />
      )}
    </div>
  )
}
