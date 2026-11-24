// Pure preset helpers: validation of stored/imported JSON, snapshots.

import { sanitizeValues } from "@/components/playground/controls"
import { CONTROLS, MIN_COLORS } from "./data"
import { isHex } from "./palette"
import type { OrbParams, Preset } from "./types"

export function snapshot(name: string, colors: string[], values: OrbParams): Preset {
  return { name, colors: [...colors], values: { ...values } }
}

/** Drops UI-only fields (like list ids) before storing or exporting. */
export function toStored(p: Preset): Preset {
  return { name: p.name, colors: p.colors, values: p.values }
}

/** Accepts unknown JSON (a preset or an array of them) and keeps only valid presets. */
export function parsePresets(raw: unknown): Preset[] {
  const list = Array.isArray(raw) ? raw : [raw]
  const out: Preset[] = []
  for (const p of list) {
    if (!p || typeof p !== "object") continue
    const obj = p as Record<string, unknown>
    const colors = Array.isArray(obj.colors) ? obj.colors.filter(isHex) : []
    if (colors.length < MIN_COLORS) continue
    // Presets from the original HTML tool stored values flat; ours nest them under `values`.
    const source = obj.values && typeof obj.values === "object" ? obj.values : obj
    out.push({
      name: typeof obj.name === "string" && obj.name.trim() ? obj.name.slice(0, 40) : `프리셋 ${out.length + 1}`,
      colors,
      values: fromLegacy(source as Record<string, unknown>),
    })
  }
  return out
}

/** Maps original-tool keys (breathAmt, cellPx, numeric texMode/aspect) onto ours, then sanitizes. */
function fromLegacy(v: Record<string, unknown>): Partial<OrbParams> {
  const modes = ["none", "dots", "squares", "digits", "letters"]
  const mapped: Record<string, unknown> = { ...v }
  if (v.breathAmt !== undefined) mapped.breath = v.breathAmt
  if (v.cellPx !== undefined) mapped.cell = v.cellPx
  if (typeof v.texMode === "number") mapped.texMode = modes[v.texMode]
  if (typeof v.aspect === "number") mapped.aspect = String(v.aspect)
  const clean = sanitizeValues(CONTROLS, mapped)
  // Only keep keys the preset actually had, so applying it doesn't reset the rest.
  return Object.fromEntries(Object.keys(clean).filter((k) => k in mapped).map((k) => [k, clean[k as keyof OrbParams]]))
}
