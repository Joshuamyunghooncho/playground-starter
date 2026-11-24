"use client"

// Hairline slider with a 9px square thumb and an editable value, adapted
// from Toolcraft (MIT, Pixel Point). Double-click the slider to reset it.

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react"

import { cn } from "@/lib/utils"
import { ToolField } from "./tool-primitives"

const THUMB = 9

function decimalsOf(step: number) {
  return step < 1 ? Math.min(3, (String(step).split(".")[1] ?? "").length || 2) : 0
}

export function formatToolValue(v: number, step: number, unit?: string) {
  return v.toFixed(decimalsOf(step)) + (unit ? (unit === "°" ? "°" : ` ${unit}`) : "")
}

function snapTo(v: number, min: number, max: number, step: number) {
  const s = Math.round((v - min) / step) * step + min
  return Math.min(max, Math.max(min, Number(s.toFixed(Math.max(decimalsOf(step), 6)))))
}

const pos = (f: number) => `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${Math.min(1, Math.max(0, f))})`

type SliderProps = {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  /** Double-click target. */
  defaultValue?: number
  label: string
  valueText?: string
  className?: string
}

export function ToolSlider({ value, min, max, step = (max - min) / 100, onChange, defaultValue, label, valueText, className }: SliderProps) {
  const [dragging, setDragging] = useState(false)
  const f = (value - min) / (max - min || 1)
  const ticks = Math.round((max - min) / step)

  const fromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const u = (e.clientX - r.left - THUMB / 2) / Math.max(1, r.width - THUMB)
    onChange(snapTo(min + Math.min(1, Math.max(0, u)) * (max - min), min, max, step))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const big = (max - min) / 20
    const d = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: big, PageDown: -big }[e.key]
    if (d !== undefined) onChange(snapTo(value + (e.shiftKey ? d * 10 : d), min, max, step))
    else if (e.key === "Home") onChange(min)
    else if (e.key === "End") onChange(max)
    else return
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      data-dragging={dragging || undefined}
      className={cn("group/slider relative h-[18px] cursor-pointer touch-none outline-none max-md:h-11", className)}
      onPointerDown={(e) => {
        if (e.button) return
        e.preventDefault()
        e.currentTarget.focus()
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragging(true)
        fromPointer(e)
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e)
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onDoubleClick={() => defaultValue !== undefined && onChange(defaultValue)}
      onKeyDown={onKeyDown}
    >
      <i className="absolute inset-x-0 top-1/2 block h-px -translate-y-1/2 bg-muted-foreground/38" />
      <i className="absolute top-1/2 left-0 block h-px -translate-y-1/2 bg-foreground" style={{ width: pos(f) }} />
      {ticks > 1 &&
        ticks <= 12 &&
        Array.from({ length: ticks - 1 }, (_, i) => (
          <i
            key={i}
            className="absolute top-1/2 block h-1.5 w-px -translate-y-1/2 bg-foreground opacity-0 transition-opacity duration-150 group-hover/slider:opacity-100 group-data-dragging/slider:opacity-100"
            style={{ left: pos((i + 1) / ticks) }}
          />
        ))}
      <i
        className="absolute top-1/2 -mt-[4.5px] -ml-[4.5px] block size-[9px] rounded-[2px] bg-foreground transition-[scale,box-shadow] duration-200 ease-out group-hover/slider:scale-140 group-focus-visible/slider:ring-[3px] group-focus-visible/slider:ring-foreground/20 group-data-dragging/slider:scale-140"
        style={{ left: pos(f) }}
      />
    </div>
  )
}

/** Inline number that can be typed into; ↑/↓ step it (⇧ for ×10). */
export function ToolValueBox({
  value,
  step,
  unit,
  label,
  onCommit,
  className,
}: {
  value: number
  step: number
  unit?: string
  label: string
  onCommit: (value: number) => void
  className?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  const shown = draft ?? formatToolValue(value, step, unit)

  const commit = () => {
    if (draft === null) return
    const n = parseFloat(draft)
    if (Number.isFinite(n)) onCommit(n)
    setDraft(null)
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      spellCheck={false}
      aria-label={`${label} 값`}
      value={shown}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") ref.current?.blur()
        else if (e.key === "Escape") {
          setDraft(null)
          requestAnimationFrame(() => ref.current?.blur())
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault()
          setDraft(null)
          onCommit(value + (e.key === "ArrowUp" ? 1 : -1) * step * (e.shiftKey ? 10 : 1))
        }
      }}
      className={cn(
        "-mr-1 h-5 w-[9ch] cursor-text rounded-[4px] border-0 bg-transparent px-1 text-right leading-5 text-muted-foreground tabular-nums outline-none hover:text-foreground focus:bg-foreground/8 focus:text-foreground",
        className
      )}
    />
  )
}

type NumberFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  defaultValue?: number
  onChange: (value: number) => void
}

/** Label, editable value and slider: the panel's most common row. */
export function ToolNumberField({ label, value, min, max, step = (max - min) / 100, unit, defaultValue, onChange }: NumberFieldProps) {
  const commit = (v: number) => onChange(snapTo(v, min, max, step))
  return (
    <ToolField tight label={label} right={<ToolValueBox value={value} step={step} unit={unit} label={label} onCommit={commit} />}>
      <ToolSlider
        value={value}
        min={min}
        max={max}
        step={step}
        label={label}
        valueText={formatToolValue(value, step, unit)}
        defaultValue={defaultValue}
        onChange={onChange}
      />
    </ToolField>
  )
}
