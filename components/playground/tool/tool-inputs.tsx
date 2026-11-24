"use client"

// Segmented control, dropdown, colour and switch rows for the tool panel,
// adapted from Toolcraft (MIT, Pixel Point).

import { useId, useState } from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { inputClass, ToolField } from "./tool-primitives"

type Option = { value: string; label: string }

/** Few short options: segmented buttons. */
export function ToolSegmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly Option[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <ToolField label={label}>
      <div role="radiogroup" aria-label={label} className="flex">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
            className="h-7 min-w-0 flex-1 truncate border border-l-0 border-foreground/12 bg-foreground/5 px-2 font-medium whitespace-nowrap text-foreground/72 transition-colors duration-150 outline-none first:rounded-l-[6px] first:border-l last:rounded-r-[6px] hover:text-foreground focus-visible:border-foreground/40 aria-checked:bg-tool-link/12 aria-checked:text-foreground max-md:h-11"
          >
            {o.label}
          </button>
        ))}
      </div>
    </ToolField>
  )
}

/** Many or long options: a dropdown. */
export function ToolSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly Option[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <ToolField label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-label={label}
          className={cn(
            inputClass,
            "h-7 w-full justify-between gap-1.5 rounded-[8px] px-2 text-[12px] font-medium shadow-none data-[state=open]:border-foreground/20 dark:bg-foreground/5 dark:hover:bg-foreground/5 [&_svg]:size-3.5"
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={4}
          className="max-h-[280px] w-(--radix-select-trigger-width) min-w-0 rounded-[8px] bg-popover/98 p-1 ring-foreground/12"
        >
          {options.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              className="min-h-7 rounded-[6px] px-2 text-[12px] font-medium tracking-[-0.01em] focus:bg-foreground/5 max-md:min-h-11"
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ToolField>
  )
}

/** Picks segmented buttons or a dropdown the way the original tool does. */
export function ToolChoice(props: { label: string; options: readonly Option[]; value: string; onChange: (value: string) => void }) {
  const short = props.options.length <= 4 && props.options.map((o) => o.label).join("").length <= 24
  return short ? <ToolSegmented {...props} /> : <ToolSelect {...props} />
}

const HEX = /^#[0-9a-f]{6}$/i

function normalizeHex(raw: string) {
  let h = raw.trim().replace(/^#?/, "#").toLowerCase()
  if (/^#[0-9a-f]{3}$/.test(h)) h = "#" + [...h.slice(1)].map((c) => c + c).join("")
  return HEX.test(h) ? h : null
}

/** Swatch (opens the system picker) plus a hex field. `bare` drops the label row (the label stays as aria-label). */
export function ToolColor({
  label,
  value,
  onChange,
  bare,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  bare?: boolean
  className?: string
}) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const h = normalizeHex(draft)
    if (h) onChange(h)
    setDraft(null)
  }

  const control = (
      <div className={cn("flex min-w-0", className)}>
        <label className="relative grid size-7 shrink-0 cursor-pointer place-items-center rounded-l-[8px] border border-r-0 border-foreground/12 bg-foreground/5 transition-colors hover:bg-foreground/10 max-md:size-11">
          {/* Data colour: the swatch shows the value being edited. */}
          <i className="block size-4 rounded-[3px] border border-foreground/10" style={{ background: value }} />
          <input
            type="color"
            value={value}
            aria-label={label}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
        <input
          id={id}
          spellCheck={false}
          maxLength={7}
          aria-label={`${label} hex`}
          value={draft ?? value}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur()
            else if (e.key === "Escape") setDraft(null)
          }}
          className={cn(inputClass, "rounded-l-none rounded-r-[6px] font-mono uppercase")}
        />
      </div>
  )
  if (bare) return control
  return (
    <ToolField label={label} htmlFor={id}>
      {control}
    </ToolField>
  )
}

/** Pill switch with its label on the right. */
export function ToolSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group/switch flex min-h-5 cursor-pointer items-center gap-2 text-left outline-none max-md:min-h-11"
    >
      <span
        className={cn(
          "relative h-4 w-7 shrink-0 rounded-full transition-colors duration-150 group-focus-visible/switch:ring-[3px] group-focus-visible/switch:ring-foreground/20",
          checked ? "bg-tool-accent" : "bg-foreground/20"
        )}
      >
        <span
          className={cn(
            "absolute top-px left-px size-3.5 rounded-full bg-tool-knob transition-transform duration-150",
            checked && "translate-x-3"
          )}
        />
      </span>
      <span className="truncate text-xs leading-4 font-medium text-foreground/60">{label}</span>
    </button>
  )
}
