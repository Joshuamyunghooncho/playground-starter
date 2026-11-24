"use client"

import { useEffect, useRef, type ReactNode } from "react"

import { cn } from "@/lib/utils"

export type StageView = { k: number; x: number; y: number }

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 8

export function zoomView(view: StageView, factor: number): StageView {
  const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.k * factor))
  const q = k / view.k
  return { k, x: view.x * q, y: view.y * q }
}

type Props = {
  view: StageView
  onViewChange: (view: StageView) => void
  /** The prototype handles pointer input on its canvas: no panning there. */
  canvasInput?: boolean
  hasTimeline: boolean
  children: ReactNode
}

/**
 * Full-window workspace with a dot grid. Drag to pan, scroll to pan,
 * ⌘/Ctrl + scroll to zoom. The subject is centred in the space left free by
 * the timeline, toolbar and panel.
 */
export function ToolStage({ view, onViewChange, canvasInput, hasTimeline, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const live = useRef({ view, onViewChange, canvasInput })
  useEffect(() => {
    live.current = { view, onViewChange, canvasInput }
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ownsInput = (target: EventTarget | null) => live.current.canvasInput && target instanceof HTMLCanvasElement
    let drag: [number, number] | null = null

    const onWheel = (e: WheelEvent) => {
      if (ownsInput(e.target)) return
      e.preventDefault()
      const { view: v, onViewChange: set } = live.current
      if (e.ctrlKey || e.metaKey) set(zoomView(v, Math.exp(-e.deltaY * 0.01)))
      else set({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY })
    }
    const onDown = (e: PointerEvent) => {
      if (e.button || ownsInput(e.target)) return
      ;(document.activeElement as HTMLElement | null)?.blur?.()
      const v = live.current.view
      drag = [e.clientX - v.x, e.clientY - v.y]
      el.setPointerCapture(e.pointerId)
      el.dataset.panning = "true"
    }
    const onMove = (e: PointerEvent) => {
      if (!drag) return
      const { view: v, onViewChange: set } = live.current
      set({ ...v, x: e.clientX - drag[0], y: e.clientY - drag[1] })
    }
    const onUp = () => {
      drag = null
      delete el.dataset.panning
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    el.addEventListener("pointerdown", onDown)
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerup", onUp)
    el.addEventListener("pointercancel", onUp)
    return () => {
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("pointerdown", onDown)
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerup", onUp)
      el.removeEventListener("pointercancel", onUp)
    }
  }, [])

  return (
    <div
      ref={ref}
      data-tool-stage
      className={cn(
        "fixed inset-0 grid cursor-grab touch-none place-items-center overflow-hidden pr-[320px] pb-[60px] pl-5 data-panning:cursor-grabbing",
        "[background-image:radial-gradient(circle,color-mix(in_oklab,var(--foreground)_8%,transparent)_1px,transparent_1px)] [background-size:22px_22px]",
        "max-md:bottom-[46dvh] max-md:px-2.5 max-md:pt-[54px] max-md:pb-[54px]",
        hasTimeline ? "pt-14" : "pt-5"
      )}
    >
      <div
        className="grid size-full min-h-0 [grid-template:minmax(0,1fr)/minmax(0,1fr)] place-items-center"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
      >
        {children}
      </div>
    </div>
  )
}
