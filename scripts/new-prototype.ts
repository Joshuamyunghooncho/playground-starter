// Scaffolds app/prototypes/<slug>/ with every required file.
//
//   npm run new -- <slug> "Title" ["One sentence description"] [--motion]
//
// --motion starts from a working loop: renderer.ts, timeline, PNG and MP4 export.
// Creates: page.tsx, <slug>-app.tsx, types.ts, data.ts, metadata.json, HOW_IT_WORKS.md

import fs from "node:fs"
import path from "node:path"

const root = path.resolve(__dirname, "..")
const argv = process.argv.slice(2)
const motion = argv.includes("--motion")
const [slug, title, description = ""] = argv.filter((a) => !a.startsWith("--"))

function fail(msg: string): never {
  console.error(msg)
  console.error('Usage: npm run new -- <kebab-slug> "Title" ["Description"] [--motion]')
  process.exit(1)
}

if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail("Slug must be kebab-case (a-z, 0-9, -).")
if (!title) fail("Title is required.")
if (slug === "p" || slug.startsWith("__")) fail("Reserved slug.")

const dir = path.join(root, "app", "prototypes", slug)
if (fs.existsSync(dir)) fail(`app/prototypes/${slug} already exists.`)

const pascal = slug.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase())
const App = /^[0-9]/.test(pascal) ? `P${pascal}App` : `${pascal}App`
const now = new Date()

const files: Record<string, string> = {
  "metadata.json":
    JSON.stringify(
      {
        title,
        description,
        tags: [],
        createdAt: now.toISOString().slice(0, 10),
        updatedAt: now.toISOString(),
        hidden: false,
        public: false,
      },
      null,
      2
    ) + "\n",

  "page.tsx": `import type { Metadata } from "next"

import { ${App} } from "./${slug}-app"

export const metadata: Metadata = { title: ${JSON.stringify(title)} }

export default function Page() {
  return <${App} />
}
`,

  [`${slug}-app.tsx`]: `"use client"

import { useControls } from "@/components/playground/controls"
import { ToolControls, ToolShell } from "@/components/playground/tool"
import { CONTROLS, SLUG } from "./data"

export function ${App}() {
  const controls = useControls(SLUG, CONTROLS)
  return (
    <ToolShell
      title=${JSON.stringify(title)}
      slug={SLUG}
      history={controls}
      onRandomize={controls.randomize}
      onReset={controls.reset}
      panel={<ToolControls controls={controls} />}
    >
      {/* The subject: size it to this area (see useFitSize). */}
      <p className="text-muted-foreground">{controls.values.example.toFixed(2)}</p>
    </ToolShell>
  )
}
`,

  "types.ts": `// Shared types for ${slug}.\n\nexport {}\n`,

  "data.ts": `// Constants, mock data and config for ${slug}.
import { defineControls } from "@/components/playground/controls"

export const SLUG = ${JSON.stringify(slug)}

// Placeholder: replace with the prototype's real parameters.
export const CONTROLS = defineControls({
  example: { type: "number", label: "Example", min: 0, max: 1, step: 0.01, default: 0.5, group: "Settings" },
})
`,

  "HOW_IT_WORKS.md": `# ${title} — How It Works

## What It Does
${description || "TODO: 1–2 sentences."}

## Architecture
\`\`\`
TODO: ASCII data-flow diagram
\`\`\`

## Frontend
- TODO: state, shortcuts, responsive behavior

## API
None.

## Key Dependencies
- None

## Component Tree
\`\`\`
Page (page.tsx)
└── ${App}
\`\`\`

## Error Handling
- TODO

## File Structure
\`\`\`
${slug}/
├── page.tsx
├── ${slug}-app.tsx
├── data.ts
├── types.ts
├── metadata.json
└── HOW_IT_WORKS.md
\`\`\`
`,
}

if (motion) {
  files["types.ts"] = `import type { ControlValues } from "@/components/playground/controls"
import type { CONTROLS } from "./data"

export type Params = ControlValues<typeof CONTROLS>
`
  files["data.ts"] = `// Control schema and export settings for ${slug}.
import { defineControls } from "@/components/playground/controls"

export const SLUG = ${JSON.stringify(slug)}
export const SIZE = { width: 1080, height: 1920 }
export const FPS = 60
export const START_TIME = 0

// Placeholder: replace with the prototype's real parameters. Keep \`loop\`.
export const CONTROLS = defineControls({
  radius: { type: "number", label: "크기", min: 0.05, max: 0.4, step: 0.01, default: 0.2, group: "모양" },
  loop: { type: "number", label: "길이 (초)", min: 2, max: 24, step: 1, default: 6, group: "움직임", randomize: false },
  ink: { type: "color", label: "잉크", default: "#f0ece3", group: "색", randomize: false },
  bg: { type: "color", label: "배경", default: "#101010", group: "색", randomize: false },
})
`
  files["renderer.ts"] = `// Draws one frame. Must depend only on (params, t) and the canvas size, so previews and exports match.
import type { Params } from "./types"

export function drawFrame(canvas: HTMLCanvasElement, p: Params, t: number) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const { width, height } = canvas
  const phase = (t / p.loop) * Math.PI * 2
  ctx.fillStyle = p.bg
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = p.ink
  ctx.beginPath()
  ctx.arc(width / 2, height / 2 + Math.sin(phase) * height * 0.2, p.radius * width, 0, Math.PI * 2)
  ctx.fill()
}
`
  files[`${slug}-app.tsx`] = `"use client"

import { useCallback } from "react"

import { useControls } from "@/components/playground/controls"
import { MotionCanvas, MotionExportButtons, ToolControls, ToolShell, useMotionExport, useToolClock } from "@/components/playground/tool"
import { CONTROLS, FPS, SIZE, SLUG, START_TIME } from "./data"
import { drawFrame } from "./renderer"

export function ${App}() {
  const controls = useControls(SLUG, CONTROLS)
  const params = controls.values
  const clock = useToolClock({ start: START_TIME })
  const draw = useCallback((canvas: HTMLCanvasElement, t: number) => drawFrame(canvas, params, t), [params])
  const motion = useMotionExport({ name: SLUG, draw, size: SIZE, fps: FPS, duration: params.loop, clock })

  return (
    <ToolShell
      title=${JSON.stringify(title)}
      slug={SLUG}
      clock={clock}
      history={controls}
      onRandomize={controls.randomize}
      onReset={controls.reset}
      panel={<ToolControls controls={controls} />}
      footer={<MotionExportButtons motion={motion} />}
    >
      <MotionCanvas label=${JSON.stringify(title)} draw={draw} size={SIZE} duration={params.loop} clock={clock} frozen={motion.progress !== null} />
    </ToolShell>
  )
}
`
}

fs.mkdirSync(dir, { recursive: true })
for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content)
console.log(`Created app/prototypes/${slug}/ (${Object.keys(files).join(", ")})`)
console.log(`Open http://localhost:3000/prototypes/${slug}`)
