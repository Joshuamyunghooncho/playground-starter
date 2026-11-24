import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Animates height open/closed with the CSS grid-rows trick, so added or removed
 * rows never pop in. Keep it mounted and toggle `open`; unmount after close if
 * needed. Respects prefers-reduced-motion.
 */
export function AnimateHeight({
  open,
  children,
  className,
}: {
  open: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-smooth motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}
