"use client"

// Phone chrome of the tool shell: the top bar and the bottom sheet's tab row.
// Hidden from `md` up, where the floating panel, timeline and toolbar take over.

import { ChevronLeft, Dices, Maximize, Minimize, Redo2, Save, SlidersHorizontal, Undo2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"
import { SAVE_TAB, type PanelTab } from "./panel-tabs"
import { ToolIconButton } from "./tool-primitives"

type TopBarProps = {
  title: string
  /** Hidden on the public route, where the gallery is off-limits. */
  showBack: boolean
  history?: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }
  onRandomize?: () => void
  /** Whether the subject covers the screen; the button toggles it, or undoes a zoom. */
  filled: boolean
  onFit: () => void
}

export function ToolTopBar({ title, showBack, history, onRandomize, filled, onFit }: TopBarProps) {
  return (
    <header
      data-playground-chrome
      className="fixed inset-x-0 top-0 z-40 flex h-[calc(48px+env(safe-area-inset-top))] items-center gap-1 border-b border-foreground/12 bg-popover/75 px-1 pt-[env(safe-area-inset-top)] backdrop-blur-[40px] backdrop-saturate-150 select-none md:hidden"
    >
      {showBack && (
        <Link
          href="/"
          aria-label="목록으로 돌아가기"
          className="inline-flex h-11 shrink-0 items-center gap-0.5 rounded-[8px] pr-2 pl-1 text-[15px] font-medium outline-none focus-visible:bg-foreground/8 active:bg-foreground/8"
        >
          <ChevronLeft className="size-5" />
          목록
        </Link>
      )}
      <p className={cn("m-0 min-w-0 flex-1 truncate text-[13px] font-medium text-muted-foreground", !showBack && "pl-3")}>{title}</p>
      {history && (
        <>
          <ToolIconButton onClick={history.undo} disabled={!history.canUndo} aria-label="실행 취소" className="[&_svg]:size-[18px]">
            <Undo2 />
          </ToolIconButton>
          <ToolIconButton onClick={history.redo} disabled={!history.canRedo} aria-label="다시 실행" className="[&_svg]:size-[18px]">
            <Redo2 />
          </ToolIconButton>
        </>
      )}
      {onRandomize && (
        <ToolIconButton onClick={onRandomize} aria-label="랜덤" className="[&_svg]:size-[18px]">
          <Dices />
        </ToolIconButton>
      )}
      <ToolIconButton onClick={onFit} aria-label={filled ? "전체 보기" : "화면 채우기"} className="[&_svg]:size-[18px]">
        {filled ? <Minimize /> : <Maximize />}
      </ToolIconButton>
    </header>
  )
}

/** The only control on the stage while the settings sheet is closed. */
export function ToolSettingsButton({ hidden, onClick }: { hidden: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      data-playground-chrome
      onClick={onClick}
      className={cn(
        "fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-1/2 z-30 inline-flex h-12 -translate-x-1/2 items-center gap-2 rounded-full border border-foreground/12 bg-popover/85 px-5 text-[15px] font-medium backdrop-blur-[40px] transition-opacity duration-150 outline-none focus-visible:border-foreground/40 active:bg-popover md:hidden",
        hidden && "pointer-events-none opacity-0 invisible"
      )}
    >
      <SlidersHorizontal className="size-[18px]" />
      설정
    </button>
  )
}

/** One scrolling row of section tabs; the save tab stays pinned on the right. */
export function ToolTabs({ tabs, active, onPick }: { tabs: PanelTab[]; active: string | null; onPick: (id: string) => void }) {
  const rowRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const row = rowRef.current
    const el = row?.querySelector<HTMLElement>("[aria-pressed=true]")
    if (row && el) row.scrollTo({ left: el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2, behavior: "smooth" })
  }, [active])

  const tabClass =
    "h-11 shrink-0 px-3 text-[14px] font-medium whitespace-nowrap text-foreground/60 outline-none transition-colors duration-150 focus-visible:text-foreground aria-pressed:text-foreground aria-pressed:shadow-[inset_0_-2px_0_var(--foreground)]"
  return (
    <div className="flex shrink-0 border-b border-foreground/8 md:hidden">
      <div ref={rowRef} className="relative flex min-w-0 flex-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button key={t.id} type="button" aria-pressed={t.id === active} onClick={() => onPick(t.id)} className={tabClass}>
            {t.title}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-pressed={active === SAVE_TAB}
        onClick={() => onPick(SAVE_TAB)}
        className={cn(tabClass, "inline-flex items-center gap-1.5 border-l border-foreground/8")}
      >
        <Save className="size-4" />
        저장
      </button>
    </div>
  )
}
