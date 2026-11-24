"use client"

// Building blocks of the tool shell's panel, adapted from Toolcraft
// (MIT, Pixel Point — https://github.com/pixel-point/toolcraft) via the
// creative-reference-engine skill's shell. Sizes follow the original on
// desktop; below `md` every target grows to 44px for touch.

import { ChevronUp, RotateCcw } from "lucide-react"
import { Slot } from "radix-ui"
import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Translucent floating surface used by the panel, timeline and toolbar. */
export const surfaceClass =
  "rounded-[8px] border border-foreground/12 bg-popover/75 backdrop-blur-[40px] backdrop-saturate-150"

const focusRing = "outline-none focus-visible:border-foreground/40"

export function ToolIconButton({
  size = "default",
  asChild = false,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { size?: "default" | "sm"; asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      type={asChild ? undefined : type}
      className={cn(
        "inline-grid shrink-0 place-items-center border border-transparent p-0 text-muted-foreground transition-colors duration-150 hover:text-foreground disabled:pointer-events-none disabled:opacity-35 max-md:size-11 [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-smooth",
        size === "sm" ? "size-6 rounded-[6px] [&_svg]:size-3" : "size-7 rounded-[8px] [&_svg]:size-3.5",
        focusRing,
        className
      )}
      {...props}
    />
  )
}

export function ToolButton({
  variant = "default",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: "default" | "primary" }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-7 min-w-0 items-center justify-center gap-1 overflow-hidden rounded-[8px] border pr-2 pl-1.5 text-[13px] leading-[18px] font-medium whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 max-md:h-11 [&_svg]:size-3.5 [&_svg]:shrink-0",
        variant === "primary"
          ? "border-transparent bg-primary text-primary-foreground hover:bg-foreground/80"
          : "border-foreground/12 bg-foreground/10 hover:border-foreground/20 hover:bg-foreground/15",
        focusRing,
        className
      )}
      {...props}
    />
  )
}

export const inputClass = cn(
  "h-7 w-full min-w-0 rounded-[8px] border border-foreground/12 bg-foreground/5 px-2 py-0.5 transition-colors duration-150 hover:border-foreground/20 focus:border-foreground/30 max-md:h-11",
  "outline-none placeholder:text-muted-foreground"
)

export function ToolInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...props} />
}

export function ToolTextarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClass, "block h-auto min-h-16 resize-y p-2 max-md:h-auto", className)} {...props} />
}

/** Muted label text used above (or beside) every control. */
export function ToolLabel({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("truncate text-xs leading-4 font-medium whitespace-nowrap text-foreground/60", className)}
      {...props}
    />
  )
}

/** A label row (with optional right-hand content) above a control. */
export function ToolField({
  label,
  htmlFor,
  right,
  tight,
  className,
  children,
}: {
  label: ReactNode
  htmlFor?: string
  right?: ReactNode
  /** Smaller gap, used by sliders. */
  tight?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("flex min-w-0 flex-col", tight ? "gap-1" : "gap-2", className)}>
      <div className="flex min-h-5 items-center justify-between gap-3">
        <ToolLabel htmlFor={htmlFor} title={typeof label === "string" ? label : undefined}>
          {label}
        </ToolLabel>
        {right}
      </div>
      {children}
    </div>
  )
}

/** Two controls side by side (used to pair colours). */
export function ToolPair({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-2.5 gap-y-3.5">{children}</div>
}

/** Vertical stack of controls with the panel's standard spacing. */
export function ToolList({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-col gap-3.5 px-3 pt-2 pb-6", className)}>{children}</div>
}

/** Remembers which sections are open, per tool (provided by `ToolShell`). */
export type SectionMemory = {
  isOpen: (id: string) => boolean | undefined
  setOpen: (id: string, open: boolean) => void
}
export const SectionMemoryContext = createContext<SectionMemory | null>(null)

type SectionProps = {
  title: string
  /** Stable id: the open/closed choice is remembered under it. Defaults to the title. */
  id?: string
  /** Open state on first visit; the user's choice is remembered per tool. */
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Shows a reset button; highlighted when `changed`. */
  onReset?: () => void
  changed?: boolean
  children: ReactNode
}

/** Collapsible panel section with an uppercase title, like the original tool. */
export function ToolSection({ title, id = title, defaultOpen = true, open: openProp, onOpenChange, onReset, changed, children }: SectionProps) {
  const memory = useContext(SectionMemoryContext)
  const [openState, setOpenState] = useState(defaultOpen)
  const open = openProp ?? memory?.isOpen(id) ?? openState
  const toggle = () => {
    setOpenState(!open)
    memory?.setOpen(id, !open)
    onOpenChange?.(!open)
  }

  return (
    <section className="border-t border-foreground/8 first:border-t-0">
      <div
        className="flex h-9 cursor-pointer items-center justify-between gap-2 pr-1.5 pl-3 transition-colors duration-150 select-none hover:bg-foreground/3 max-md:h-12"
        onClick={toggle}
      >
        <h3 className="truncate text-[11px] leading-[11px] font-semibold text-foreground/75 uppercase">{title}</h3>
        <div className="inline-flex shrink-0 items-center gap-1">
          {onReset && (
            <ToolIconButton
              size="sm"
              aria-label={`${title} 초기화`}
              title={`${title} 초기화`}
              className={cn(changed && "text-foreground")}
              onClick={(e) => {
                e.stopPropagation()
                onReset()
              }}
            >
              <RotateCcw />
            </ToolIconButton>
          )}
          <ToolIconButton
            size="sm"
            aria-label={open ? `${title} 접기` : `${title} 펼치기`}
            aria-expanded={open}
            className="bg-foreground/8"
            onClick={(e) => {
              e.stopPropagation()
              toggle()
            }}
          >
            <ChevronUp className={cn(!open && "rotate-180")} />
          </ToolIconButton>
        </div>
      </div>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-[240ms] ease-smooth",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className={cn("min-h-0 overflow-hidden transition-[visibility] duration-[240ms]", !open && "invisible")}>
          <ToolList>{children}</ToolList>
        </div>
      </div>
    </section>
  )
}
