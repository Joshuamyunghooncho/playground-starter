// Pure colour helpers: no React, no DOM.

import { MAX_COLORS } from "./shader"
import type { ColorStop } from "./types"

const HEX_RE = /^#[0-9a-f]{6}$/i

export function isHex(v: unknown): v is string {
  return typeof v === "string" && HEX_RE.test(v)
}

export function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number]
}

export function hslToHex(h: number, s: number, l: number) {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0")
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`
}

let nextId = 0
/**
 * Builds stops for `hexes`, reusing ids from `current` by position so existing
 * rows recolour in place (only extra rows animate in or out).
 */
export function makeStops(hexes: readonly string[], current: readonly ColorStop[] = []): ColorStop[] {
  return hexes.slice(0, MAX_COLORS).map((hex, i) => ({ id: current[i]?.id ?? `c${nextId++}`, hex }))
}

/** n evenly spread hues with jitter, like the original "랜덤" button. */
export function randomPalette(n: number, rand: () => number = Math.random): string[] {
  const base = rand() * 360
  return Array.from({ length: n }, (_, i) => {
    const h = (base + i * (360 / n) + (rand() * 30 - 15) + 360) % 360
    return hslToHex(h, 62 + rand() * 30, 42 + rand() * 22)
  })
}

export function randomColor(rand: () => number = Math.random) {
  return hslToHex(Math.floor(rand() * 360), 78, 55)
}

/** Flattens up to MAX_COLORS stops into the vec3[8] uniform layout. */
export function toUniformColors(hexes: readonly string[]): Float32Array {
  const flat = new Float32Array(MAX_COLORS * 3)
  hexes.slice(0, MAX_COLORS).forEach((hex, i) => flat.set(hexToRgb(hex), i * 3))
  return flat
}
