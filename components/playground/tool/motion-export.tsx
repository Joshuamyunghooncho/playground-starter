"use client"

import { Film, ImageDown } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { downloadBlob, saveCanvasPng } from "@/lib/download"
import { recordMp4 } from "@/lib/mp4"
import type { ToolClock } from "./clock"
import type { DrawFrame, MotionSize } from "./motion-canvas"
import { ToolButton } from "./tool-primitives"

type Options = {
  /** File name without extension; use the slug. */
  name: string
  draw: DrawFrame
  size: MotionSize
  fps: number
  /** Seconds in the MP4. */
  duration: number
  clock: ToolClock
  /** PNG size relative to `size`. */
  pngScale?: number
}

const showError = (e: unknown) => toast.error(e instanceof Error ? e.message : String(e))

function makeCanvas({ width, height }: MotionSize, scale: number) {
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  return canvas
}

/** PNG and MP4 export rendered off screen. `progress` is null when idle, 0..1 while an MP4 is written. */
export function useMotionExport({ name, draw, size, fps, duration, clock, pngScale = 2 }: Options) {
  const [progress, setProgress] = useState<number | null>(null)

  async function savePng() {
    try {
      const canvas = makeCanvas(size, pngScale)
      draw(canvas, clock.t)
      await saveCanvasPng(canvas, name)
    } catch (e) {
      showError(e)
    }
  }

  async function saveMp4() {
    setProgress(0)
    try {
      const canvas = makeCanvas(size, 1)
      const blob = await recordMp4({ canvas, seconds: duration, fps, draw: (t) => draw(canvas, t), onProgress: setProgress })
      downloadBlob(blob, `${name}-${Date.now()}.mp4`)
    } catch (e) {
      showError(e)
    } finally {
      setProgress(null)
    }
  }

  return { progress, savePng, saveMp4 }
}

/** Footer buttons for `useMotionExport`. */
export function MotionExportButtons({ motion }: { motion: ReturnType<typeof useMotionExport> }) {
  const busy = motion.progress !== null
  return (
    <>
      <ToolButton onClick={motion.savePng} disabled={busy}>
        <ImageDown /> PNG 저장
      </ToolButton>
      <ToolButton variant="primary" onClick={motion.saveMp4} disabled={busy}>
        <Film /> {motion.progress === null ? "MP4 저장" : `MP4 ${Math.round(motion.progress * 100)}%`}
      </ToolButton>
    </>
  )
}
