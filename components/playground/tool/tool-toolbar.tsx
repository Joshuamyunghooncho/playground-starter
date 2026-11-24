"use client"

import { ArrowLeft, Locate, Redo2, Sun, Undo2, ZoomIn, ZoomOut } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { surfaceClass, ToolIconButton } from "./tool-primitives"

type Props = {
  /** Hidden on the public route, where the gallery is off-limits. */
  showBack: boolean
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onCenter: () => void
  history?: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }
}

const Divider = () => <span className="h-5 w-px shrink-0 bg-foreground/8" />

/** Floating bar under the stage: back, undo/redo, zoom, theme, centre. */
export function ToolToolbar({ showBack, zoom, onZoomIn, onZoomOut, onZoomReset, onCenter, history }: Props) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <div
      data-playground-chrome
      className={cn(
        surfaceClass,
        "fixed bottom-2.5 left-[calc((100vw-310px)/2)] z-40 flex -translate-x-1/2 items-center gap-1.5 p-1 select-none",
        "max-md:bottom-[calc(46dvh+6px)] max-md:left-1/2 max-md:gap-0.5"
      )}
    >
      {showBack && (
        <>
          <ToolIconButton asChild>
            <Link href="/" aria-label="모든 프로토타입" title="모든 프로토타입">
              <ArrowLeft />
            </Link>
          </ToolIconButton>
          <Divider />
        </>
      )}
      {history && (
        <>
          <ToolIconButton onClick={history.undo} disabled={!history.canUndo} aria-label="실행 취소 (⌘Z)" title="실행 취소 (⌘Z)">
            <Undo2 />
          </ToolIconButton>
          <ToolIconButton onClick={history.redo} disabled={!history.canRedo} aria-label="다시 실행 (⇧⌘Z)" title="다시 실행 (⇧⌘Z)">
            <Redo2 />
          </ToolIconButton>
          <Divider />
        </>
      )}
      <ToolIconButton onClick={onZoomOut} aria-label="축소" title="축소" className="max-md:hidden">
        <ZoomOut />
      </ToolIconButton>
      <button
        type="button"
        onClick={onZoomReset}
        title="100%로"
        className="box-content w-[4ch] border-0 bg-transparent p-0 text-center font-mono text-[12px] text-foreground/90 tabular-nums outline-none max-md:h-11 max-md:px-1"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolIconButton onClick={onZoomIn} aria-label="확대" title="확대" className="max-md:hidden">
        <ZoomIn />
      </ToolIconButton>
      <Divider />
      <ToolIconButton
        onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
        aria-label="라이트 / 다크 테마"
        title="라이트 / 다크 테마"
      >
        <Sun />
      </ToolIconButton>
      <ToolIconButton onClick={onCenter} aria-label="가운데로" title="가운데로">
        <Locate />
      </ToolIconButton>
    </div>
  )
}
