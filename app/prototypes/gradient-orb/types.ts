import type { ControlValues } from "@/components/playground/controls"
import type { CONTROLS } from "./data"

export type OrbParams = ControlValues<typeof CONTROLS>

/** One gradient colour. `id` is a stable key for animated add/remove. */
export type ColorStop = { id: string; hex: string }

export type Preset = {
  name: string
  colors: string[]
  values: Partial<OrbParams>
}

export type UploadedImage = { element: HTMLImageElement; name: string }

/** Time-varying values advanced by the animation loop. */
export type Clock = { t: number; flow: number; hue: number }
