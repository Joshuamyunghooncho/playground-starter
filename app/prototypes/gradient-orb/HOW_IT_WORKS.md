# Gradient Orb — How It Works

## What It Does
A full-screen WebGL fragment shader draws a glossy "dome over arch" gradient orb whose colours flow outward over time. You tune shape, motion, colours and a halftone/glyph texture, can drop in an image that gets a radiating aura, save presets, and export a PNG. Ported from the standalone "Gradient Orb Studio" HTML tool.

## Architecture
```
useControls("gradient-orb", CONTROLS) ─┐  (25 sliders/selects, grouped, persisted, undoable)
useColorStops() ───────────────────────┤  (2–8 colours, persisted)
useState<UploadedImage>  ──────────────┤  (in memory only)
useToolClock() ────────────────────────┤  (play/pause + elapsed time, shared with the timeline)
                                       ▼
                               GradientOrbApp
          ┌────────────────────────────┴───────────────────────────┐
   ToolShell.panel                                             OrbCanvas (useFitSize)
   ToolControls                                                 │ RAF loop: advances ToolClock, flow / hue
    ├ before: ToolSection "그라데이션 색상" → ColorStops          │ draws when playing or "dirty"
    ├ slot "이미지": ImageUpload                                  ▼
    ├ group sections (이미지/텍스처/모션/형태/캔버스)            renderer.ts (WebGL)
    └ after: ToolSection "프리셋" → PresetManager                 ├ setColors → u_colors[8], u_count
   ToolShell.footer: PNG 저장 → saveCanvasPng ◀── canvasRef ───── ├ setImage  → texture unit 0
                                                                  ├ glyph atlas → texture unit 1
                                                                  └ draw(params, clock, dpr) → shader.ts
```

## Frontend
- **Shell**: `ToolShell` from `@/components/playground/tool` (UI adapted from Toolcraft, MIT, Pixel Point): full-window dot-grid stage, timeline bar on top, floating control panel, toolbar at the bottom (back to gallery, undo/redo, zoom, theme, centre; back is hidden on `/p/gradient-orb`).
- **State**: control values via `useControls` (`playground:gradient-orb:controls`); colours via `useColorStops` (`…:colors`); presets via `usePresets` (`…:presets`); which panel sections are open (`…:sections`). All are written in change handlers, loaded after mount, and sanitized on load.
- **Undo/redo**: control values only (`useControls` history; toolbar or ⌘Z / ⇧⌘Z). Colours, the image and presets are not in the history.
- **Render loop**: one `requestAnimationFrame` loop for the component's life. Params, colours, image and size go in through refs/effects and set a `dirty` flag. While paused it only redraws when dirty, so a paused orb costs nothing.
- **Clock**: the loop advances the shared `ToolClock` (`useToolClock`) while playing; `flow += dt × speed`, `hue += dt × cycle`, `breath = sin(t × 0.7) × breath`. `dt` is capped at 100ms. Flow and hue integrate their speed sliders, so time isn't scrubbable: `scrub={false}` gives a timeline with play/pause and elapsed time only.
- **Sizing**: canvas is the largest box of the chosen aspect (4:5, 1:1, 9:16, 16:9) that fits the free stage area (`useFitSize`); backing store is CSS size × min(devicePixelRatio, 2). Drag or scroll the stage to pan, ⌘/Ctrl + scroll or the toolbar to zoom.
- **Randomize** (dice in the panel header) randomizes every control except aspect, and also the colour palette (keeping the same number of colours). **Reset all** restores defaults for controls and colours; presets are kept. Each section also has its own reset for its group.
- **Presets** capture colours + all control values. Import accepts this tool's JSON and the original HTML tool's format (`breathAmt`, `cellPx`, numeric `texMode`/`aspect` are mapped).
- **Shortcuts**: Space play/pause, ⌘Z / ⇧⌘Z undo/redo (ignored while typing in a field).
- **Motion**: colour and preset rows animate height in/out (`AnimatedList`). Starts paused under `prefers-reduced-motion`.
- **Responsive**: 300px panel floats top-right (drag its header to move it); below 768px it docks to the bottom 46dvh and the stage fills the space above. Tap targets grow to 44px below `md`.
- **Theme**: UI uses tokens; theme toggle in the toolbar. The orb's colours are user data and don't change with theme.

## API
None. The uploaded image never leaves the browser.

## Key Dependencies
- WebGL 1 (no library)
- `@/components/playground/controls` (grouped schema, `replace`, randomize/reset, undo/redo)
- `@/components/playground/tool` (`ToolShell`, `ToolControls`, `ToolSection`, `ToolButton`, `useToolClock`, `useFitSize`)
- `@/lib/download` (`saveCanvasPng`)
- `@/components/playground/animated-list`
- `sonner` (toasts for import/export/image errors)

## Component Tree
```
Page (page.tsx)
└── GradientOrbApp
    └── ToolShell
        ├── ToolStage
        │   └── OrbCanvas
        ├── ToolTimeline (play/pause + elapsed time)
        ├── ToolPanel
        │   ├── ToolControls
        │   │   ├── ToolSection "그라데이션 색상" → ColorStops
        │   │   ├── group sections (ImageUpload slot under "이미지")
        │   │   └── ToolSection "프리셋" → PresetManager
        │   └── footer: PNG 저장
        └── ToolToolbar
```

## Error Handling
- No WebGL or a shader compile error: the canvas is replaced by a message.
- Image that can't be decoded: toast, nothing changes.
- Preset import: invalid JSON or no valid presets → toast; individual invalid presets are skipped; values are clamped to each control's range.
- PNG export (`saveCanvasPng`) failing, e.g. `canvas.toBlob` returning null: toast.
- localStorage goes through `lib/storage.ts` (try/catch).

## File Structure
```
gradient-orb/
├── page.tsx              thin route entry + <title>
├── gradient-orb-app.tsx  ToolShell, panel sections, clock, PNG export
├── orb-canvas.tsx        fit sizing, RAF loop (advances the clock), renderer lifecycle
├── color-stops.tsx       colour list UI
├── image-upload.tsx      image picker (memory only)
├── preset-manager.tsx    preset list, save, JSON import/export
├── use-color-stops.ts    colour state + persistence
├── use-presets.ts        preset state + persistence
├── renderer.ts           WebGL program, textures, uniforms (no React)
├── shader.ts             GLSL sources
├── palette.ts            pure colour helpers
├── presets.ts            pure preset parsing/snapshots
├── data.ts               control schema + constants
├── types.ts              shared types
├── metadata.json
└── HOW_IT_WORKS.md
```
