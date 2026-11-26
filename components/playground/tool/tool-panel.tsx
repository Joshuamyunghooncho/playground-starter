"use client"

import { ChevronUp, Dices, RotateCcw, SunMoon } from "lucide-react"
import { useTheme } from "next-themes"
import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import { PanelTabsContext, SAVE_TAB, SNAP_DVH, usePanelTabs, type SheetSnap } from "./panel-tabs"
import { ToolTabs } from "./tool-mobile"
import { surfaceClass, ToolButton, ToolIconButton } from "./tool-primitives"

type Props = {
  title: string
  onRandomize?: () => void
  onReset?: () => void
  /** Sticky actions at the bottom (exports). */
  footer?: ReactNode
  /** Phone sheet height. */
  snap: SheetSnap
  onSnap: (snap: SheetSnap) => void
  /** Phone sheet: the playback row. */
  playback?: ReactNode
  children: ReactNode
}

const EDGE = 10
/** Released this close to the right edge, the panel snaps back to it. */
const SNAP = 40
const WIDTH = 300

/**
 * Floating 300px panel, top right. Drag the header to move it (desktop);
 * on phones it is a bottom sheet with one section per tab. Drag the sheet's
 * handle (or tap it) to change its height.
 */
export function ToolPanel({ title, onRandomize, onReset, footer, snap, onSnap, playback, children }: Props) {
  const { tabs, active, pick, context } = usePanelTabs()
  const { resolvedTheme, setTheme } = useTheme()
  const [dragHeight, setDragHeight] = useState<number | null>(null)
  const sheetDrag = useRef<{ y: number; height: number; moved: boolean } | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const saving = active === SAVE_TAB

  const heightOf = (s: SheetSnap) => (SNAP_DVH[s] / 100) * window.innerHeight
  const onSheetDown = (e: PointerEvent) => {
    if (e.button) return
    e.currentTarget.setPointerCapture(e.pointerId)
    sheetDrag.current = { y: e.clientY, height: bodyRef.current!.offsetHeight, moved: false }
  }
  const onSheetMove = (e: PointerEvent) => {
    const d = sheetDrag.current
    if (!d) return
    if (Math.abs(e.clientY - d.y) > 5) d.moved = true
    if (d.moved) setDragHeight(Math.min(heightOf(2), Math.max(0, d.height + d.y - e.clientY)))
  }
  const onSheetEnd = () => {
    if (sheetDrag.current?.moved && dragHeight !== null) {
      const distance = (s: SheetSnap) => Math.abs(heightOf(s) - dragHeight)
      onSnap(([0, 1, 2] as const).reduce((best, s) => (distance(s) < distance(best) ? s : best)))
    }
    setDragHeight(null)
  }
  // After a drag the browser still sends a click: only a real tap toggles.
  const onSheetClick = () => {
    if (!sheetDrag.current?.moved) onSnap(0)
    sheetDrag.current = null
  }

  const [collapsed, setCollapsed] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const grab = useRef<[number, number] | null>(null)
  const panelRef = useRef<HTMLElement>(null)

  return (
    <aside
      ref={panelRef}
      aria-label="컨트롤"
      data-playground-chrome
      style={pos ? { left: pos.left, top: pos.top, right: "auto", maxHeight: `calc(100dvh - ${pos.top + EDGE}px)` } : undefined}
      className={cn(
        surfaceClass,
        "fixed top-2.5 right-2.5 z-30 flex max-h-[calc(100dvh-20px)] w-[300px] flex-col overflow-hidden",
        "max-md:inset-x-0! max-md:top-auto! max-md:bottom-0 max-md:max-h-none! max-md:w-auto max-md:overflow-visible max-md:rounded-b-none max-md:rounded-t-[14px] max-md:border-x-0 max-md:border-b-0 max-md:bg-popover/90 max-md:pb-[env(safe-area-inset-bottom)]",
        "max-md:transition-[translate,visibility] max-md:duration-[240ms] max-md:ease-smooth",
        snap === 0 && "max-md:invisible max-md:translate-y-full",
        // iOS zooms the page into any field under 16px.
        "max-md:[&_input]:text-base max-md:[&_textarea]:text-base"
      )}
    >
      <button
        type="button"
        aria-label="설정 닫기"
        className="relative grid h-6 shrink-0 touch-none place-items-center outline-none before:absolute before:inset-x-0 before:-top-5 before:bottom-0 md:hidden"
        onPointerDown={onSheetDown}
        onPointerMove={onSheetMove}
        onPointerUp={onSheetEnd}
        onPointerCancel={() => {
          onSheetEnd()
          sheetDrag.current = null
        }}
        onClick={onSheetClick}
      >
        <i className="block h-1 w-9 rounded-full bg-foreground/25" />
      </button>
      {playback}
      <ToolTabs tabs={tabs} active={active} onPick={pick} />
      <div
        className="flex h-9 shrink-0 cursor-grab touch-none items-center justify-between gap-3 pr-1 pl-3 select-none active:cursor-grabbing max-md:hidden"
        onPointerDown={(e) => {
          if ((e.target as Element).closest("button")) return
          const r = panelRef.current!.getBoundingClientRect()
          grab.current = [e.clientX - r.left, e.clientY - r.top]
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!grab.current) return
          const left = Math.min(Math.max(EDGE, e.clientX - grab.current[0]), Math.max(EDGE, window.innerWidth - WIDTH - EDGE))
          const top = Math.min(Math.max(EDGE, e.clientY - grab.current[1]), Math.max(EDGE, window.innerHeight - 46))
          setPos({ left, top })
        }}
        onPointerUp={() => {
          if (!grab.current) return
          grab.current = null
          if (pos && window.innerWidth - pos.left - WIDTH < SNAP) setPos(null)
        }}
      >
        <p className="m-0 truncate text-[13px] leading-[18px] font-medium">{title}</p>
        <div className="inline-flex shrink-0 items-center gap-1">
          {!collapsed && onRandomize && (
            <ToolIconButton onClick={onRandomize} aria-label="랜덤" title="랜덤">
              <Dices />
            </ToolIconButton>
          )}
          {!collapsed && onReset && (
            <ToolIconButton onClick={onReset} aria-label="모두 초기화" title="모두 초기화">
              <RotateCcw />
            </ToolIconButton>
          )}
          <ToolIconButton
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "컨트롤 펼치기" : "컨트롤 접기"}
            title={collapsed ? "컨트롤 펼치기" : "컨트롤 접기"}
            aria-expanded={!collapsed}
          >
            <ChevronUp className={cn(collapsed && "rotate-180")} />
          </ToolIconButton>
        </div>
      </div>
      <div
        ref={bodyRef}
        style={{ "--tool-sheet-live": dragHeight === null ? `${SNAP_DVH[snap || 1]}dvh` : `${dragHeight}px` } as CSSProperties}
        className={cn(
          "flex min-h-0 flex-col max-md:h-(--tool-sheet-live) max-md:overflow-hidden",
          dragHeight === null && "max-md:transition-[height,visibility] max-md:duration-[240ms] max-md:ease-smooth",
          collapsed && "md:hidden"
        )}
      >
        <div
          className={cn(
            "min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain border-t border-foreground/8 [scrollbar-color:color-mix(in_oklab,var(--foreground)_10%,transparent)_transparent] [scrollbar-width:thin] max-md:border-t-0",
            saving && "max-md:hidden"
          )}
        >
          <PanelTabsContext.Provider value={context}>{children}</PanelTabsContext.Provider>
        </div>
        <div className={cn("min-h-0 shrink-0 overflow-y-auto max-md:shrink", !saving && "max-md:hidden")}>
          {footer && (
            <div className="grid auto-cols-fr grid-flow-col gap-2 border-t border-foreground/8 p-3 max-md:border-t-0 max-md:px-4 max-md:pb-2">{footer}</div>
          )}
          <div className="grid grid-cols-2 gap-2 px-4 pb-4 first:pt-3 md:hidden">
            {onReset && (
              <ToolButton onClick={onReset}>
                <RotateCcw /> 모두 초기화
              </ToolButton>
            )}
            <ToolButton onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}>
              <SunMoon /> 라이트 / 다크
            </ToolButton>
          </div>
        </div>
      </div>
    </aside>
  )
}
