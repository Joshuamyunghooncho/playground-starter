<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Prototype Playground — Rules for Agents

This repo is one Next.js app holding many small, self-contained prototypes. The owner may be new to code: they describe what they want in plain words, often in Korean, and expect a working, consistent prototype they can see in the browser, without hand-holding or jargon. Reply in the owner's language. **Read this whole file before working. The rules are non-negotiable.**

## Stack at a glance

- Next.js 16 (App Router, Turbopack, **Cache Components on**), React 19, TypeScript, Tailwind CSS v4.
- shadcn/ui (Radix base, "nova" preset): **every component is already installed** in `components/ui/`. Never run `shadcn add`; never wait on setup.
- `next-themes`: dark by default, system preference available, toggle in the tool shell's toolbar.
- **Tool shell** (`components/playground/tool/`): every prototype's UI, adapted from [Toolcraft](https://github.com/pixel-point/toolcraft) (MIT, Pixel Point) via the creative-reference-engine skill's shell. Control schema + state in `components/playground/controls/`; `AnimateHeight`, `AnimatedList` and the gallery theme toggle in `components/playground/`.
- Site name and production URL live in `lib/site-config.ts`.
- Hosting: Vercel, deployed from this folder with the Vercel CLI (`npx vercel`). No GitHub needed. See **Deploying**.

```
app/
├── prototypes/
│   ├── layout.tsx          passthrough (the tool shell's toolbar has back + theme)
│   ├── [slug]/page.tsx     unknown slugs → 404
│   └── <slug>/             ONE FOLDER PER PROTOTYPE
├── p/[slug]/page.tsx       public route, only for "public": true
├── api/auth/route.ts       password login
├── api/<slug>/...          API routes for a prototype (namespaced by slug)
├── login/                  password page
├── page.tsx                gallery
└── layout.tsx              root layout + providers
components/ui/              shadcn/ui (vendored, read before use)
components/playground/      shared playground components
lib/prototypes.ts           prototype queries (reads the generated registry)
lib/generated/              AUTO-GENERATED registry, git-ignored
lib/storage.ts              safe namespaced localStorage
proxy.ts                    password gate (Next 16 name for middleware)
public/thumbnails/          <slug>-light.jpg, <slug>-dark.jpg
public/og/                  <slug>.png, <slug>.mp4 (public prototypes only)
scripts/                    registry generator, scaffolder, thumbnail capture
```

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (regenerates the registry first) |
| `npm run new -- <slug> "Title" "Description"` | Scaffold a new prototype folder |
| `npm run thumbnails -- <slug> [<slug>...]` | Build, then capture light/dark thumbnails (+ OG for public ones) |
| `npm run thumbnails -- --missing` / `--all` | Only prototypes without thumbnails / every prototype |
| `npm run thumbnails -- <slug> --no-build` | Reuse the current `.next` build |
| `npm run check` | Lint + type-check + production build. Must pass before finishing or deploying |
| `npm run registry` | Regenerate `lib/generated/*` (runs automatically before dev/build/lint/typecheck) |

The thumbnail script needs Playwright's Chromium (`npx playwright install chromium`) and uses `ffmpeg` for the OG mp4 if available.

---

## Creating a prototype

Never build a "new prototype" button, form, or API inside the app. Prototypes are created only by agents, like this:

1. **Dev server**: make sure `npm run dev` is running (start it in the background if not) and tell the owner to open http://localhost:3000.
2. **Scaffold**: `npm run new -- <slug> "Title" "One sentence description"`. Slugs are kebab-case and become the URL `/prototypes/<slug>`. This creates `page.tsx`, `<slug>-app.tsx`, `types.ts`, `data.ts`, `metadata.json`, `HOW_IT_WORKS.md`.
3. **Build it** following every rule below. Run `npm run dev` and open `/prototypes/<slug>`.
4. **Fill in `metadata.json`** (tags!) and **`HOW_IT_WORKS.md`** (every section).
5. **Verify** in a browser at ~375px and desktop widths, in light and dark mode (see "Verify before you finish").
6. **Thumbnails**: `npm run thumbnails -- <slug>`. Open both images and look at them. (First time: `npx playwright install chromium`. If that fails, skip thumbnails; the gallery shows "No preview yet".)
7. **Check**: `npm run check`. Fix everything; no warnings left behind in your files.
8. **Save a checkpoint** if git is available (on macOS only when `xcode-select -p` succeeds; otherwise `git` opens an install dialog): `git add -A && git commit -m "Add <Title> prototype"`.
9. **Show it**: give the local link `http://localhost:3000/prototypes/<slug>`. Deploy only when the owner asks (see Deploying).

Editing an existing prototype is the same loop minus scaffolding: bump `updatedAt`, update `HOW_IT_WORKS.md`, recapture thumbnails if anything visual changed.

---

## Rules for every prototype

### Metadata
Every prototype has `app/prototypes/<slug>/metadata.json`:

```json
{
  "title": "My Prototype",
  "description": "What it does",
  "tags": ["tag1"],
  "createdAt": "YYYY-MM-DD",
  "updatedAt": "ISO timestamp",
  "hidden": false,
  "public": false
}
```

- **Bump `updatedAt` on every edit** (`date -u +%Y-%m-%dT%H:%M:%S.000Z`). The gallery sorts by it.
- All seven fields are required; the registry generator fails the build on missing or mistyped fields.
- `hidden: true` removes it from the gallery unless "Hidden" is toggled on. It stays reachable by URL.
- `public` stays `false` unless the owner explicitly asks to make **that specific** prototype public. See Privacy.

### Documentation
Every prototype has a `HOW_IT_WORKS.md`, kept current on every change, with these sections:
- **What It Does**: 1–2 sentences
- **Architecture**: ASCII data-flow diagram
- **Frontend** / **API**: bullets on state, shortcuts, responsive behavior, request/response shapes
- **AI Usage** (only if a model is called): model ID, why that model, how it's called, key parameters, system prompt summary, user prompt shape
- **Key Dependencies**, **Component Tree**, **Error Handling**, **File Structure**

`app/prototypes/gradient-orb/HOW_IT_WORKS.md` is the reference example.

### Self-contained and decomposed
- A prototype lives entirely in its own folder and never imports from another prototype. Shared code goes in `components/playground/`, `lib/` or `hooks/` only when at least two prototypes need it.
- API routes live under `app/api/<slug>/`.
- **Never write one giant file.** Keep `page.tsx` thin (~60 lines max; ideally it just renders `<SlugApp />` and exports `metadata`). Split out:
  - `types.ts`: shared types
  - `data.ts`: mock data, constants, control schema, config
  - pure logic files (`simulation.ts`, `search.ts`, `utils.ts`): no React, no DOM, testable alone
  - one file per meaningful UI component, kebab-case and descriptive (`orb-canvas.tsx`, not `Canvas2.tsx`)
- `page.tsx` must render without props: the public route renders the same default export as `<Component />` with no `params`/`searchParams`. Read URL state with `useSearchParams` in a client component if needed (wrap it in `<Suspense>`).

### Design system
- **Prototype UI uses the tool shell, not shadcn.** Panels, controls, buttons and inputs inside a prototype come from `@/components/playground/tool` (`ToolShell`, `ToolControls`, `ToolSection`, `ToolField`, `ToolButton`, `ToolIconButton`, `ToolInput`, `ToolTextarea`, `ToolNumberField`, `ToolSlider`, `ToolChoice`, `ToolColor`, `ToolSwitch`). Its look (hairline sliders with 9px square thumbs, 28px controls, uppercase section titles, translucent surfaces, Inter) is the house style; don't restyle it per prototype and don't mix in `components/ui/` buttons/inputs. Something the shell lacks → add it to `components/playground/tool/` in the same style.
- The gallery and login page use the same tool primitives. `components/ui/` (shadcn) is only for menus, dialogs and toasts outside the tool set.
- Always use design tokens: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `bg-muted`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `border-border`, `ring-ring`, `text-destructive`, `bg-accent`, `chart-1`…`chart-5`.
- **Never hardcode colors**: no `bg-black`, `text-white`, `bg-zinc-900`, hex/rgb/oklch in classes, or inline color styles. Exception: generated *data* colors drawn on a canvas/SVG (e.g. a hue spectrum) may be computed, and should be tuned per theme.
- **Read the component source in `components/ui/` before using a prop.** This is the Radix "nova" variant; it differs from the docs you remember. Known specifics:
  - `cn` is imported from `@/lib/utils` (which re-exports the `cn` package).
  - `Button` sizes are `default` (h-8), `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`. They are smaller than 44px, so add mobile sizing yourself (see Mobile first).
  - `Toggle`/`ToggleGroup` use Radix (`pressed`/`onPressedChange`, `type="single"`).
  - `Sheet` takes `side`; it needs a `SheetTitle` (use `className="sr-only"` if hidden).

### Clean and minimal by default
- The subject sits alone on the tool shell's stage. No sidebars, split panels, or tab-heavy layouts unless asked: the floating control panel is the one sanctioned side element.
- Build only what was asked. No extra dashboards, charts, stats, settings or "about" views.
- Fewer elements is better; every element must justify its existence. Plain `Badge variant="outline"` over colorful ones. No decorative icons; icons only where they *are* the control.
- Minimal interface copy. Cut captions that restate labels, helper text nobody needed, and marketing tone. No "Welcome to…" headers.

### Tool shell and control panel
Every prototype renders inside `ToolShell`: a full-window dot-grid stage (drag/scroll to pan, ⌘+scroll or toolbar to zoom), a floating 300px control panel (top right; docked to the bottom half on phones), a timeline on top for animations, and a toolbar at the bottom (back to gallery, undo/redo, zoom, theme, centre). Tunable parameters (speed, color, size, count…) always go in the panel, never scattered inputs. You get the panel, persistence, Randomize, Reset and undo/redo for free:

```tsx
// data.ts
import { defineControls } from "@/components/playground/controls"
export const CONTROLS = defineControls({
  speed: { type: "number", label: "Speed", min: 0.1, max: 3, step: 0.1, default: 1 },
  trails: { type: "boolean", label: "Trails", default: true },
  palette: { type: "select", label: "Palette", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }], default: "a" },
  tint: { type: "color", label: "Tint", default: "#7c3aed" },          // data color, not UI color
  count: { type: "number", label: "Count", min: 1, max: 5000, default: 100, randomize: false },
})

// <slug>-app.tsx  ("use client")
const controls = useControls(SLUG, CONTROLS)          // typed values, persisted, undoable
const clock = useToolClock({ start: 0 })              // only for animations
return (
  <ToolShell
    title="My Prototype" slug={SLUG} clock={clock} history={controls}
    onRandomize={controls.randomize} onReset={controls.reset}
    panel={<ToolControls controls={controls} />}
    footer={<ToolButton variant="primary" onClick={savePng}><ImageDown /> PNG 저장</ToolButton>}
  >
    <ThingCanvas params={controls.values} clock={clock} />
  </ToolShell>
)
```

- The panel header has **Randomize** (dice) and **Reset**; pass `onRandomize`/`onReset` that also cover state outside the schema. Mark controls that shouldn't be randomized with `randomize: false`.
- Each `group: "Shape"` becomes a collapsible section with its own reset; `ToolControls closed={["Shape"]}` starts one collapsed. Open/closed choices are remembered per prototype.
- Numbers render as label + typeable value + slider (double-click resets); ≤4 short options as segmented buttons, otherwise a dropdown; consecutive colours pair up in two columns.
- State outside the schema (a colour list, an uploaded image, text) still belongs in the panel:
  - `before` / `after`: extra sections above/below the schema's. Wrap content in `<ToolSection id="…" title="…">`.
  - `slots={{ Shape: <Thing /> }}`: content at the top of a group's section.
  - `controls.replace(partialValues)`: set many values at once (e.g. applying a preset). Undo covers schema values only.
- Exports (PNG, MP4…) go in `footer`; the main one is `variant="primary"`. `saveCanvasPng` from `@/lib/download`.
- **Animations**: create one `useToolClock({ start, duration })` and have the render loop call `clock.advance(dt)` for the time, `clock.setDuration(loopSeconds)` for loops, and redraw when `clock.playing || clock.consumeSeek() || dirty`. The timeline then plays, pauses, steps and scrubs it (Space, ←/→). If time isn't a pure function of `t` (speeds integrated over time) or the piece is pointer-driven, pass `scrub={false}`. It starts paused under reduced motion.
- **Sizing**: the subject fills the stage area left free by the chrome. Give the canvas wrapper `size-full` and size the canvas with `useFitSize(wrapRef, aspect)`. No borders or rounded corners on the canvas.
- Prototypes that take pointer input on their canvas pass `canvasInput` so dragging there doesn't pan the stage.
- `app/prototypes/gradient-orb/` is the reference for all of this. Don't build your own shell.
- In animation loops, read params through a ref so slider changes apply without restarting the loop (see `app/prototypes/gradient-orb/orb-canvas.tsx`).

### Mobile first
- Everything must work at **375px** wide. Check it.
- **Tap targets ≥ 44×44px** on mobile. Tool shell components already grow to 44px below `md`. Elsewhere shadcn defaults are 32px, so size up: `className="size-11 sm:size-9"` for icon buttons, `h-11 sm:h-8` for buttons/inputs.
- Icon-only buttons on mobile, labels from `sm:` up: `<Icon /><span className="hidden sm:inline">Label</span>` plus `aria-label`.
- No hover-only interactions. Anything revealed on hover must also be reachable by tap (and visible state uses `active:`/`data-[state]` too).
- Code blocks wrap (global CSS already sets `pre, code { white-space: pre-wrap }`); never cause horizontal page scroll.
- Modals/lightboxes need visible prev/next buttons or swipe on mobile, not only keyboard shortcuts.
- Use `dvh` not `vh` for full-height layouts; respect `env(safe-area-inset-bottom)` for bottom-fixed UI.

### Light and dark mode
- Design dark-first; light mode must also work, purely through tokens.
- Never put a `dark` class on a page or element. The theme is global (`next-themes`, class strategy).
- Use `useTheme().resolvedTheme` only when **behavior** must change by theme (canvas/WebGL colors). For canvas, read token values with `getComputedStyle(document.documentElement).getPropertyValue("--foreground")` and redraw when `resolvedTheme` changes.
- For images that differ by theme, render both and switch with `dark:hidden` / `hidden dark:block`, not JS.

### Motion
- Rows or sections the user adds or removes **animate their height** open and closed. Nothing pops in and makes the page jump.
  - Lists: `<AnimatedList items getKey render />` from `components/playground/animated-list.tsx` animates rows in and out (removed rows stay mounted while they collapse). Items need **stable ids**; put row spacing inside `render` (`pb-2`), not as a flex `gap`.
  - A single section: `<AnimateHeight open={…}>` from `components/playground/animate-height.tsx`.
- Smooth deceleration, no bouncy overshoot: use `ease-smooth` (cubic-bezier(0.22,1,0.36,1)) or `ease-out`, 150–300ms. No spring overshoot.
- Respect `prefers-reduced-motion`: global CSS shortens CSS animations; for JS/canvas animation use `usePrefersReducedMotion()` from `hooks/` (e.g. start paused).
- **Verify animations actually run**: in the browser check `getComputedStyle(el).transitionDuration` / `animationName` while it plays. `animate-in`/`fade-in` classes come from `tw-animate-css` (imported in `globals.css`); utility classes silently do nothing when their CSS isn't imported.

### AI-backed prototypes
- Call models **server-side** in `app/api/<slug>/route.ts`; never expose keys to the client or prefix them `NEXT_PUBLIC_`. Read keys from `process.env` (owner sets them in Vercel).
- Use the Anthropic SDK (`@anthropic-ai/sdk`) and default to the latest capable Claude model unless there's a reason; document the choice under **AI Usage**.
- If a model generates UI or layout, put explicit layout constraints in the system prompt (max columns, no wide tables, mobile width). Defensive CSS is a backup, not the fix.
- Parse JSON from model output defensively: extract the first `{…}` block, `JSON.parse` in try/catch, validate the shape.
- Always wrap API routes in try/catch and return proper status codes (400 bad input, 401/403, 429, 500, 502 upstream failure) with `{ error }` JSON. Show errors in the UI.
- API routes are behind the password gate. A **public** prototype's routes under `/api/<slug>/` are automatically opened by `proxy.ts`; consider abuse (rate limits, input caps) before asking the owner to make one public.

### Storage
- Use `lib/storage.ts` (`readStorage`/`writeStorage`), which wraps every `localStorage` call in try/catch and namespaces keys as `playground:<namespace>:<key>`. Use the prototype slug as the namespace.
- Load on mount (`useEffect`), never during render or server render. Sanitize what you load; stored data may be stale or malformed.

### Thumbnails
- New prototype or any visual change → run `npm run thumbnails -- <slug>` and commit the images **in the same commit**.
- Global style change (tokens, fonts, shell, layout) → `npm run thumbnails -- --all`.
- **Open and look at the captured images before committing.** A stale or broken thumbnail (blank canvas, error page, login page, loading spinner) is worse than none. If the prototype needs time to settle or interaction to look like anything, adjust it so the default state looks good.
- Thumbnails are 960×600 JPEG, captured at desktop width with the tool shell's chrome (panel, timeline, toolbar) hidden. Missing thumbnails show "No preview yet"; they never break the build.

---

## Privacy

- The whole site is behind a password in production (`proxy.ts` + `/login` + `/api/auth`). The password is the `SITE_PASSWORD` env var. Locally (`npm run dev`) there's no gate.
- Every prototype is **private by default**.
- Only make a prototype public when the owner explicitly asks for that specific prototype. Then:
  1. Set `"public": true` and bump `updatedAt`.
  2. Run `npm run thumbnails -- <slug>`. For public prototypes it also captures `public/og/<slug>.png` (1200×630) and `public/og/<slug>.mp4` (5s loop). **Always** commit both, and look at them: they are what people see when the link is shared.
  3. The shareable link is `/p/<slug>` (no back-to-gallery button, no login, proper `og:image` and `og:video`).
- `/p/<unknown-or-private>` returns a real 404 (enforced in `proxy.ts`), never a login redirect, so private names don't leak. Don't weaken this.
- Making a prototype private again: set `"public": false` and delete its `public/og/<slug>.*` files.

---

## Workflow

- Work locally. Keep `npm run dev` running so the owner sees every change at http://localhost:3000 right away.
- Before finishing, run `npm run check` (lint, type-check, production build). All must pass.
- If git is available, commit a checkpoint after each finished change, so mistakes can be undone. On macOS check `xcode-select -p` before calling `git`: on a Mac without developer tools, any `git` command pops up an install dialog. If the owner wants git, they can accept that dialog. Never force anything that loses the owner's work.
- End every task with the link to what changed: local `http://localhost:3000/prototypes/<slug>`, plus `<PRODUCTION_URL>/prototypes/<slug>` once it has been deployed.
- **When something goes wrong and gets fixed, add the lesson to "Lessons learned" below**, so it never happens again. This file should grow.

## Deploying (when the owner says "배포해줘" / "deploy")

Vercel CLI, straight from this folder. Free Hobby plan is enough. Run every command non-interactively and explain each browser step to the owner in plain words.

1. **Password**: the site is private behind `SITE_PASSWORD`. On the first deploy ask the owner for a password (the one visitors will type). Never write it into any file.
2. **Log in** (first time only): run `npx vercel login` in the background. It prints a link (and maybe a code); show it to the owner, ask them to open it and sign up / log in with their email, then wait for the command to finish. `npx vercel whoami` confirms it.
3. **Link the project** (first time only): `npx vercel link --yes` (creates a Vercel project named after the folder).
4. **Set the password** (first time, or when the owner wants a new one): `printf '%s' "<password>" | npx vercel env add SITE_PASSWORD production`. To change it later: `npx vercel env rm SITE_PASSWORD production --yes` first.
5. **Deploy**: `npm run check`, then `npx vercel deploy --prod --yes`. Share the **production domain** (`https://<project>.vercel.app`, the "Aliased" line, or from `npx vercel project ls`), not the long per-deployment URL: Vercel's Deployment Protection puts its own login on those.
6. First deploy: write the production domain into `PRODUCTION_URL` in `lib/site-config.ts` and commit.
7. Tell the owner the link and that it asks for the password they chose. Later deploys are just step 5.

"GitHub에도 올려줘" (optional, later): install `gh` if missing, `gh auth login`, `gh repo create <name> --private --source . --push`. Before the first commit pushed to GitHub, set `git config user.email` to the GitHub noreply address (`gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"'`), or Vercel's Git integration blocks those deploys.

### Verify before you finish
- Open the prototype in a browser at 375px and ≥1280px, in light and dark mode.
- Exercise every control, including Randomize and Reset, and reload to confirm persistence.
- No console errors. No horizontal scroll at 375px.
- Look at the thumbnails.

---

## Lessons learned

Add an entry whenever something broke and was fixed. Newest first.

- **Porting a skill-made tool must keep its UI.** Tools from the creative-reference-engine skill ship with a Toolcraft-style shell; porting them into a generic shadcn panel loses that design. The playground now *is* that shell (`ToolShell`): port only the engine/renderer and map its params to `defineControls`, keeping groups, order and export buttons. Map skill features: `params[].group` → `group`, timeline/`duration` → `useToolClock` + `setDuration`, `canvasInput` → `canvasInput`, export buttons → `footer`.
- **Changing `app/prototypes/layout.tsx` may need a dev-server restart.** After the header was removed, Turbopack kept serving the old layout until `npm run dev` was restarted.

- **Deleting a prototype while `npm run dev` runs leaves stale route types.** `npm run typecheck` then fails with "Cannot find module '…/app/prototypes/<deleted>/page.js'" from `.next/dev/types/validator.ts`. It's a local artifact, not a repo problem: `rm -rf .next/dev/types` and re-run. Also check the exit code of `npm run check` itself; piping it through `grep`/`tail` hides a failure.

- **Reuse row ids when replacing list data.** Loading saved colours gave every row a new id, so `AnimatedList` collapsed the old rows and expanded new ones on every page load. When data is reloaded, randomized or replaced (presets), keep existing ids by position so rows update in place; only genuinely added/removed rows should animate.
- **The browser pane throttles `requestAnimationFrame`** (~1 frame/s when not focused). Animations that wait a frame (like `AnimatedList` opening a new row) look stuck when you measure right away; wait a couple of seconds before concluding something is broken.
- **Preview links asking for a Vercel login is Vercel's Deployment Protection, not our password gate.** Previews have "Vercel Authentication" on by default, so only logged-in team members can open them. The site already has its own `SITE_PASSWORD` gate; share the production domain instead, or turn it off in Vercel → <project> → Settings → Deployment Protection. Nothing in the repo controls this.
- **Don't persist state from an effect that also runs on mount.** A "save whenever values change" effect raced the "load on mount" effect and wrote defaults over the stored values (Strict Mode made it reliable). Write storage in the change handlers instead (see `use-controls.ts`).
- **setState updaters must be pure.** Strict Mode calls them twice; `Math.random()` inside one made Randomize show one result and store another. Compute the next value first, then `setState(next)`.

- **Next 16 renamed `middleware.ts` to `proxy.ts`** (export `proxy`). Don't create `middleware.ts`.
- **Cache Components is on.** Dynamic routes with `generateStaticParams` must return at least one param (use a `__none__` placeholder that 404s). `dynamicParams` and `runtime` segment exports fail the build. Server components can't read uncached async data outside `<Suspense>`; keep prototype pages client-side (`"use client"` app component) unless you need otherwise, and read `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md` before writing server data fetching.
- **`notFound()` after awaiting params streams a 200** under Partial Prerendering. Status-code-sensitive 404s (like `/p/<slug>`) are enforced in `proxy.ts` instead.
- **`PageProps<"/route">` / `LayoutProps` types come from `next typegen`.** `npm run typecheck` runs it; plain `tsc` before a build fails with "does not satisfy the constraint".
- **The prototype registry is generated** (`lib/generated/`, git-ignored, rebuilt before dev/build/lint/typecheck). A new folder doesn't show up in a running dev server until you rerun `npm run registry` (or restart dev). Never commit generated files: parallel PRs would conflict.
- **Next resolves OG image URLs against `metadataBase` but not OG video URLs**; pass videos through `absoluteUrl()` from `lib/site.ts`.
- **shadcn nova components are 32px tall**: always add mobile tap-target sizing.
- **Canvas trails** made by painting the background at low alpha leave a faint ghost in light mode (8-bit rounding). Acceptable for sketches; for clean trails, periodically clear fully or use an offscreen buffer.
