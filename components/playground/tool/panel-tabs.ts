"use client"

// Which panel section phones show: sections register, the sheet's tab row picks one.

import { createContext, useCallback, useMemo, useState } from "react"

/** Id of the pinned tab holding exports, reset and theme. */
export const SAVE_TAB = "__save"

/** Sheet heights: controls closed, half (the stage stays visible above) and tall (covers the stage). */
export type SheetSnap = 0 | 1 | 2
export const SNAP_DVH = [0, 34, 64] as const

export type PanelTab = { id: string; title: string; el: HTMLElement }

/** Sections register here so phones can show one at a time behind a tab. */
export const PanelTabsContext = createContext<{ active: string | null; register: (tab: PanelTab) => () => void } | null>(null)

export function usePanelTabs() {
  const [tabs, setTabs] = useState<PanelTab[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  const register = useCallback((tab: PanelTab) => {
    const inOrder = (a: PanelTab, b: PanelTab) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
    setTabs((cur) => [...cur.filter((t) => t.id !== tab.id), tab].sort(inOrder))
    return () => setTabs((cur) => cur.filter((t) => t !== tab))
  }, [])
  const exists = picked === SAVE_TAB || tabs.some((t) => t.id === picked)
  const active = exists ? picked : (tabs[0]?.id ?? null)
  const context = useMemo(() => ({ active, register }), [active, register])
  return { tabs, active, pick: setPicked, context }
}
