"use client"

// Full-window tool layout adapted from Toolcraft (MIT, Pixel Point —
// https://github.com/pixel-point/toolcraft) via the creative-reference-engine
// skill's shell: dot-grid stage with pan/zoom, timeline on top, floating
// control panel on the right, toolbar at the bottom.

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { readStorage, writeStorage } from "@/lib/storage"
import { cn } from "@/lib/utils"
import type { ToolClock } from "./clock"
import { toolFont } from "./tool-font"
import { ToolPanel } from "./tool-panel"
import { SectionMemoryContext, type SectionMemory } from "./tool-primitives"
import { ToolStage, zoomView, type StageView } from "./tool-stage"
import { ToolTimeline } from "./tool-timeline"
import { ToolToolbar } from "./tool-toolbar"

type History = { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }

type Props = {
  /** Panel title. */
  title: string
  /** Prototype slug: namespaces remembered UI state (open sections). */
  slug: string
  /** Panel content: usually `<ToolControls />`. */
  panel: ReactNode
  /** Sticky panel footer: export buttons. */
  footer?: ReactNode
  /** Playback clock; adds the timeline. */
  clock?: ToolClock
  /** Show frame steps and the scrubber (needs a looping clock). Default true. */
  scrub?: boolean
  /** Undo/redo (pass the `useControls` result). */
  history?: History
  onRandomize?: () => void
  onReset?: () => void
  /** The prototype uses pointer input on its canvas (no panning over it). */
  canvasInput?: boolean
  /** The subject: fills the free stage area (size canvases to their parent). */
  children: ReactNode
}

const isTyping = (el: Element | null) =>
  el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el as HTMLElement | null)?.isContentEditable

function useSectionMemory(slug: string): SectionMemory {
  const [open, setOpenMap] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const stored = readStorage<Record<string, unknown>>(slug, "sections")
    if (!stored || typeof stored !== "object") return
    const clean = Object.fromEntries(Object.entries(stored).filter(([, v]) => typeof v === "boolean")) as Record<string, boolean>
    // Loading remembered UI state after mount is intentional (no SSR mismatch).
    queueMicrotask(() => setOpenMap(clean))
  }, [slug])
  return useMemo(
    () => ({
      isOpen: (id) => open[id],
      setOpen: (id, value) => {
        const next = { ...open, [id]: value }
        setOpenMap(next)
        writeStorage(slug, "sections", next)
      },
    }),
    [open, slug]
  )
}

export function ToolShell({ title, slug, panel, footer, clock, scrub = true, history, onRandomize, onReset, canvasInput, children }: Props) {
  const [view, setView] = useState<StageView>({ k: 1, x: 0, y: 0 })
  const sections = useSectionMemory(slug)
  const showBack = !usePathname().startsWith("/p/")

  const live = useRef({ clock, history })
  useEffect(() => {
    live.current = { clock, history }
  })

  // Space: play/pause · ←/→: frame step · ⌘Z / ⇧⌘Z: undo/redo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(document.activeElement)) return
      const { clock: c, history: h } = live.current
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === "z" && h) {
        if (e.shiftKey) h.redo()
        else h.undo()
      } else if (mod && e.key.toLowerCase() === "y" && h) h.redo()
      else if (mod || e.altKey) return
      else if (e.key === " " && c && !(document.activeElement instanceof HTMLButtonElement)) c.togglePlaying()
      else if (e.key === "ArrowLeft" && c && scrub && c.duration > 0 && document.activeElement?.getAttribute("role") !== "slider") c.step(-1)
      else if (e.key === "ArrowRight" && c && scrub && c.duration > 0 && document.activeElement?.getAttribute("role") !== "slider") c.step(1)
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [scrub])

  const zoomBy = useCallback((f: number) => setView((v) => zoomView(v, f)), [])

  return (
    <SectionMemoryContext.Provider value={sections}>
      <div className={cn(toolFont.className, "text-[12px] leading-[1.625] text-foreground")}>
        <ToolStage view={view} onViewChange={setView} canvasInput={canvasInput} hasTimeline={Boolean(clock)}>
          {children}
        </ToolStage>
        {clock && <ToolTimeline clock={clock} scrub={scrub} />}
        <ToolPanel title={title} onRandomize={onRandomize} onReset={onReset} footer={footer}>
          {panel}
        </ToolPanel>
        <ToolToolbar
          showBack={showBack}
          zoom={view.k}
          onZoomIn={() => zoomBy(1.25)}
          onZoomOut={() => zoomBy(0.8)}
          onZoomReset={() => zoomBy(1 / view.k)}
          onCenter={() => setView((v) => ({ ...v, x: 0, y: 0 }))}
          history={history}
        />
      </div>
    </SectionMemoryContext.Provider>
  )
}
