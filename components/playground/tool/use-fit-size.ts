"use client"

import { useEffect, useState, type RefObject } from "react"

export type FitSize = { w: number; h: number }

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

/**
 * Size (CSS px) for a canvas of the given aspect that fills its wrapper.
 * Inside `ToolShell` give the wrapper `size-full`: it then spans the stage
 * area left free by the panel, timeline and toolbar. Null until measured.
 */
export function useFitSize(ref: RefObject<HTMLElement | null>, aspect: number): FitSize | null {
  const [size, setSize] = useState<FitSize | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const next = fitAspect(el.clientWidth, el.clientHeight, aspect)
      setSize((prev) => (prev && prev.w === next.w && prev.h === next.h ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, aspect])
  return size
}
