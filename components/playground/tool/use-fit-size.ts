"use client"

import { createContext, useContext, useEffect, useState, type RefObject } from "react"

export type FitSize = { w: number; h: number }

/** True on phones with the settings closed: the subject covers the stage instead of fitting inside it. */
export const StageFillContext = createContext(false)

/** Largest box of the given aspect (w/h) inside an available area. */
export function fitAspect(availW: number, availH: number, aspect: number): FitSize {
  let w = availW
  let h = w / aspect
  if (h > availH) {
    h = availH
    w = h * aspect
  }
  return { w: Math.max(1, Math.floor(w)), h: Math.max(1, Math.floor(h)) }
}

/** Smallest box of the given aspect that covers an area. */
export function coverAspect(availW: number, availH: number, aspect: number): FitSize {
  const w = Math.max(availW, availH * aspect)
  return { w: Math.ceil(w), h: Math.ceil(w / aspect) }
}

/**
 * Size (CSS px) for a canvas of the given aspect that fills its wrapper.
 * Inside `ToolShell` give the wrapper `size-full`: it then spans the stage
 * area left free by the panel, timeline and toolbar. Null until measured.
 */
export function useFitSize(ref: RefObject<HTMLElement | null>, aspect: number, widthFit = false): FitSize | null {
  const fill = useContext(StageFillContext)
  const [size, setSize] = useState<FitSize | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const next = widthFit && (fill || !window.matchMedia("(max-width: 767px)").matches)
        ? { w: el.clientWidth, h: Math.round(el.clientWidth / aspect) }
        : (fill ? coverAspect : fitAspect)(el.clientWidth, el.clientHeight, aspect)
      setSize((prev) => (prev && prev.w === next.w && prev.h === next.h ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, aspect, fill, widthFit])
  return size
}
