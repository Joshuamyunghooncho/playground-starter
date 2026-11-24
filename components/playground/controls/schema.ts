// Pure control-schema logic (no React). Define controls once, get typed values,
// defaults, sanitising of stored values and randomisation.

/** Fields every control shares. */
type ControlBase = {
  label: string
  /** Optional section heading. Consecutive controls with the same group render under one heading. */
  group?: string
  /** Exclude from Randomize. */
  randomize?: false
}

export type NumberControl = ControlBase & {
  type: "number"
  min: number
  max: number
  step?: number
  default: number
}
export type BooleanControl = ControlBase & { type: "boolean"; default: boolean }
export type SelectControl<V extends string = string> = ControlBase & {
  type: "select"
  options: readonly { value: V; label: string }[]
  default: V
}
/** A data colour (e.g. for canvas drawing), not a UI colour. Stored as #rrggbb. */
export type ColorControl = ControlBase & { type: "color"; default: string }

export type Control = NumberControl | BooleanControl | SelectControl | ColorControl
export type ControlSchema = Record<string, Control>

export type ControlValue<C extends Control> = C extends NumberControl
  ? number
  : C extends BooleanControl
    ? boolean
    : C extends SelectControl<infer V>
      ? V
      : string

export type ControlValues<S extends ControlSchema> = { [K in keyof S]: ControlValue<S[K]> }

/** Identity helper that keeps literal option values for typing. */
export function defineControls<const S extends ControlSchema>(schema: S): S {
  return schema
}

export function defaultValues<S extends ControlSchema>(schema: S): ControlValues<S> {
  const out: Record<string, unknown> = {}
  for (const [k, c] of Object.entries(schema)) out[k] = c.default
  return out as ControlValues<S>
}

/** Rounds to the control's step and clamps to its range. */
export function snapNumber(value: number, c: NumberControl) {
  const step = c.step ?? (c.max - c.min) / 100
  const snapped = Math.round((value - c.min) / step) * step + c.min
  const decimals = (String(step).split(".")[1] ?? "").length
  return Math.min(c.max, Math.max(c.min, Number(snapped.toFixed(decimals))))
}

const HEX_RE = /^#[0-9a-f]{6}$/i

/** Accepts unknown (e.g. from localStorage) and returns a valid value or the default. */
export function sanitizeValue(c: Control, v: unknown): unknown {
  switch (c.type) {
    case "number":
      return typeof v === "number" && Number.isFinite(v) ? snapNumber(v, c) : c.default
    case "boolean":
      return typeof v === "boolean" ? v : c.default
    case "select":
      return c.options.some((o) => o.value === v) ? v : c.default
    case "color":
      return typeof v === "string" && HEX_RE.test(v) ? v : c.default
  }
}

export function sanitizeValues<S extends ControlSchema>(schema: S, raw: unknown): ControlValues<S> {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [k, c] of Object.entries(schema)) out[k] = sanitizeValue(c, src[k])
  return out as ControlValues<S>
}

function hslToHex(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255).toString(16).padStart(2, "0")
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function randomValue(c: Control, rand: () => number = Math.random): unknown {
  switch (c.type) {
    case "number":
      return snapNumber(c.min + rand() * (c.max - c.min), c)
    case "boolean":
      return rand() < 0.5
    case "select":
      return c.options[Math.floor(rand() * c.options.length)].value
    case "color":
      return hslToHex(rand() * 360, 0.55 + rand() * 0.35, 0.45 + rand() * 0.2)
  }
}

/** Randomizes every control except those marked `randomize: false`. */
export function randomValues<S extends ControlSchema>(
  schema: S,
  current: ControlValues<S>,
  rand: () => number = Math.random
): ControlValues<S> {
  const out: Record<string, unknown> = { ...current }
  for (const [k, c] of Object.entries(schema)) {
    if (c.randomize !== false) out[k] = randomValue(c, rand)
  }
  return out as ControlValues<S>
}
