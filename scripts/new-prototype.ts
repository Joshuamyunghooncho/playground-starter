// Scaffolds app/prototypes/<slug>/ with every required file.
//
//   npm run new -- <slug> "Title" ["One sentence description"]
//
// Creates: page.tsx, <slug>-app.tsx, types.ts, data.ts, metadata.json, HOW_IT_WORKS.md

import fs from "node:fs"
import path from "node:path"

const root = path.resolve(__dirname, "..")
const [slug, title, description = ""] = process.argv.slice(2)

function fail(msg: string): never {
  console.error(msg)
  console.error('Usage: npm run new -- <kebab-slug> "Title" ["Description"]')
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

fs.mkdirSync(dir, { recursive: true })
for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content)
console.log(`Created app/prototypes/${slug}/ (${Object.keys(files).join(", ")})`)
console.log(`Open http://localhost:3000/prototypes/${slug}`)
