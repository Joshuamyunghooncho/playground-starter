"use client"

import { ImageDown } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { useControls } from "@/components/playground/controls"
import { ToolButton, ToolControls, ToolSection, ToolShell, useToolClock } from "@/components/playground/tool"
import { saveCanvasPng } from "@/lib/download"
import { ColorStops } from "./color-stops"
import { CONTROLS, SLUG } from "./data"
import { ImageUpload } from "./image-upload"
import { OrbCanvas } from "./orb-canvas"
import { PresetManager } from "./preset-manager"
import { snapshot } from "./presets"
import type { UploadedImage } from "./types"
import { useColorStops } from "./use-color-stops"
import { usePresets } from "./use-presets"

export function GradientOrbApp() {
  const controls = useControls(SLUG, CONTROLS)
  const colors = useColorStops()
  const presets = usePresets()
  const [image, setImage] = useState<UploadedImage | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Flow and hue integrate their speed sliders, so time is not scrubbable.
  const clock = useToolClock()

  return (
    <ToolShell
      title="Gradient Orb"
      slug={SLUG}
      clock={clock}
      scrub={false}
      history={controls}
      onRandomize={() => {
        controls.randomize()
        colors.randomize()
      }}
      onReset={() => {
        controls.reset()
        colors.reset()
      }}
      panel={
        <ToolControls
          controls={controls}
          before={
            <ToolSection id="colors" title="그라데이션 색상">
              <ColorStops api={colors} />
            </ToolSection>
          }
          slots={{ 이미지: <ImageUpload image={image} onChange={setImage} onError={toast.error} /> }}
          after={
            <ToolSection id="presets" title="프리셋">
              <PresetManager
                api={presets}
                capture={(name) => snapshot(name, colors.hexes, controls.values)}
                onApply={(p) => {
                  colors.replaceAll(p.colors)
                  controls.replace(p.values)
                }}
                onMessage={(m) => toast(m)}
              />
            </ToolSection>
          }
        />
      }
      footer={
        <ToolButton
          variant="primary"
          onClick={() => canvasRef.current && saveCanvasPng(canvasRef.current, SLUG).catch((e) => toast.error(String(e.message ?? e)))}
        >
          <ImageDown /> PNG 저장
        </ToolButton>
      }
    >
      <OrbCanvas params={controls.values} colors={colors.hexes} image={image} clock={clock} canvasRef={canvasRef} />
    </ToolShell>
  )
}
