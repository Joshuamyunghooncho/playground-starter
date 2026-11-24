"use client"

import { ChevronUp, Dices, RotateCcw } from "lucide-react"
import { useRef, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import { surfaceClass, ToolIconButton } from "./tool-primitives"

type Props = {
  title: string
  onRandomize?: () => void
  onReset?: () => void
  /** Sticky actions at the bottom (exports). */
  footer?: ReactNode
  children: ReactNode
}

const EDGE = 10
/** Released this close to the right edge, the panel snaps back to it. */
const SNAP = 40
const WIDTH = 300

/**
 * Floating 300px panel, top right. Drag the header to move it (desktop);
 * on phones it docks to the bottom half of the screen.
 */
export function ToolPanel({ title, onRandomize, onReset, footer, children }: Props) {
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
        "max-md:top-auto! max-md:right-2! max-md:bottom-[max(8px,env(safe-area-inset-bottom))] max-md:left-2! max-md:w-auto",
        collapsed ? "max-md:max-h-none!" : "max-md:max-h-[calc(46dvh-12px)]!"
      )}
    >
      <div
        className="flex h-9 shrink-0 cursor-grab touch-none items-center justify-between gap-3 pr-1 pl-3 select-none active:cursor-grabbing max-md:h-12 max-md:cursor-default"
        onPointerDown={(e) => {
          if ((e.target as Element).closest("button") || window.matchMedia("(max-width: 767px)").matches) return
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
      {!collapsed && (
        <>
          <div className="min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain border-t border-foreground/8 [scrollbar-color:color-mix(in_oklab,var(--foreground)_10%,transparent)_transparent] [scrollbar-width:thin]">
            {children}
          </div>
          {footer && (
            <div className="grid shrink-0 auto-cols-fr grid-flow-col gap-2 border-t border-foreground/8 p-3">{footer}</div>
          )}
        </>
      )}
    </aside>
  )
}
