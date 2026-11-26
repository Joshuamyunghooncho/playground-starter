// One command that checks a prototype before it ships.
//
//   npm run verify -- <slug>
//
// Lint + type-check, then in a real browser (dev server, no production build):
// desktop dark and phone light, console errors, horizontal scroll, animation,
// Randomize, persistence, Reset. Captures both thumbnails on the way.
//
// Flags:
//   --no-static      skip lint and type-check
//   --no-thumbs      keep the existing thumbnails
//   --still          the default state is meant to rest (motion off, pointer-driven)
//   --export         also press every PNG/MP4 button and check that a file arrives
//   --port=3322      port for the temporary dev server
//   --url=http://…   use a dev server that is already running
//
// Output: .verify/<slug>-desktop.png, -phone.png, -random.png (git-ignored) and the
// thumbnails. LOOK AT THEM: this script can't tell a good picture from a bad one.

import { spawn, type ChildProcess } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

import { chromium, type Browser, type Locator, type Page } from "playwright"

import { fingerprint, readMetadata, root, run, sleep, stampFile, verifyDir } from "./workflow"

const SETTLE_MS = 2500
const DESKTOP = { width: 1280, height: 800 }
const PHONE = { width: 375, height: 812 }
const THUMB = { width: 960, height: 600 }

const argv = process.argv.slice(2)
const flag = (name: string) => argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`))
const value = (name: string) => flag(name)?.split("=").slice(1).join("=")
const slug = argv.find((a) => !a.startsWith("--")) ?? ""

const problems: string[] = []
function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${!ok && detail ? `: ${detail}` : ""}`)
  if (!ok) problems.push(detail ? `${label}: ${detail}` : label)
}

async function up(url: string) {
  try {
    return (await fetch(url, { redirect: "manual" })).status < 500
  } catch {
    return false
  }
}

async function startServer(port: number): Promise<{ base: string; server: ChildProcess }> {
  const base = `http://localhost:${port}`
  if (await up(base)) throw new Error(`Port ${port} is in use. Pass --port=<free port> or --url=${base}`)
  let log = ""
  const server = spawn("npx", ["next", "dev", "-p", String(port)], { cwd: root, detached: true, stdio: ["ignore", "pipe", "pipe"] })
  server.stdout?.on("data", (d) => (log += d))
  server.stderr?.on("data", (d) => (log += d))
  for (let i = 0; i < 200 && server.exitCode === null; i++) {
    if (await up(base)) return { base, server }
    await sleep(300)
  }
  stopServer(server)
  throw new Error(`The dev server did not start.\n${log.slice(-800)}`)
}

function stopServer(server?: ChildProcess) {
  if (!server?.pid) return
  try {
    process.kill(-server.pid, "SIGTERM")
  } catch {}
}

async function open(browser: Browser, url: string, theme: "light" | "dark", viewport: typeof DESKTOP, errors: string[]) {
  const ctx = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: "no-preference", hasTouch: viewport === PHONE })
  // next-themes reads localStorage("theme") before paint.
  await ctx.addInitScript(`try { localStorage.setItem("theme", "${theme}") } catch {}`)
  const page = await ctx.newPage()
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 300)))
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)))
  const res = await page.goto(url, { waitUntil: "load" })
  check("page opens", !!res && res.status() < 400, `status ${res?.status()}`)
  await page.locator("[data-prototype-loading]").waitFor({ state: "detached", timeout: 120_000 })
  await page.waitForTimeout(SETTLE_MS)
  return page
}

const shot = (name: string) => path.join(verifyDir, `${slug}-${name}.png`)
const noScroll = (page: Page) => page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
const stored = (page: Page) => page.evaluate(`localStorage.getItem("playground:${slug}:controls")`)
/** Whether the subject's pixels change. The chrome is hidden: the timeline's clock would always count as movement. */
async function moves(stage: Locator, wait: number) {
  const take = () => stage.screenshot({ style: "[data-playground-chrome], nextjs-portal { visibility: hidden !important; }" })
  const before = await take()
  await sleep(wait)
  return !before.equals(await take())
}

async function checkDesktop(browser: Browser, url: string, errors: string[]) {
  console.log("Desktop, dark")
  const page = await open(browser, url, "dark", DESKTOP, errors)
  await page.screenshot({ path: shot("desktop") })
  check("no horizontal scroll", !!(await noScroll(page)))

  const stage = page.locator("[data-tool-stage]").first()
  const pause = page.getByRole("button", { name: /^일시정지/ })
  if ((await stage.count()) && (await pause.count())) {
    if (!flag("still")) check("animation runs", await moves(stage, 500), "nothing moves; pass --still if the default state is meant to rest")
    await pause.first().click()
    await page.waitForTimeout(400)
    check("pause holds the frame", !(await moves(stage, 400)))
  }

  const random = page.getByRole("button", { name: "랜덤", exact: true })
  const reset = page.getByRole("button", { name: "모두 초기화", exact: true })
  if (await random.count()) {
    const before = await stored(page)
    await random.click()
    await page.waitForTimeout(600)
    const after = await stored(page)
    check("Randomize changes values", after !== before)
    await page.screenshot({ path: shot("random") })
    await page.reload({ waitUntil: "load" })
    await page.waitForTimeout(1200)
    check("values survive a reload", after !== null && after === (await stored(page)))
  }
  if (await reset.count()) {
    await reset.click()
    await page.waitForTimeout(400)
    check("Reset clears stored values", (await stored(page)) === null)
  }

  if (flag("export")) {
    for (const button of await page.getByRole("button", { name: /PNG|MP4/ }).all()) {
      const label = (await button.innerText()).trim()
      const download = page.waitForEvent("download", { timeout: 180_000 })
      download.catch(() => {})
      await button.click()
      try {
        const file = await (await download).path()
        check(`export: ${label}`, fs.statSync(file).size > 1000)
      } catch {
        const toasts = await page.locator("[data-sonner-toast]").allInnerTexts()
        check(`export: ${label}`, false, toasts.join(" ") || "no file")
      }
    }
  }
  await page.context().close()
}

async function checkPhone(browser: Browser, url: string, errors: string[]) {
  console.log("Phone, light")
  const page = await open(browser, url, "light", PHONE, errors)
  await page.screenshot({ path: shot("phone") })
  check("no horizontal scroll", !!(await noScroll(page)))
  await page.context().close()
}

async function thumbnails(browser: Browser, url: string) {
  console.log("Thumbnails")
  for (const theme of ["light", "dark"] as const) {
    const page = await open(browser, url, theme, THUMB, [])
    // Same framing as scripts/capture-thumbnails.ts: hide the chrome, let the subject use the frame.
    await page.addStyleTag({
      content: "[data-playground-chrome], nextjs-portal { display: none !important; } [data-tool-stage] { padding: 24px !important; }",
    })
    await page.waitForTimeout(SETTLE_MS)
    await page.screenshot({ path: path.join(root, "public", "thumbnails", `${slug}-${theme}.jpg`), type: "jpeg", quality: 82 })
    await page.context().close()
  }
}

async function main() {
  if (!slug) throw new Error("Usage: npm run verify -- <slug> [--no-static] [--no-thumbs] [--still] [--export] [--port=3322 | --url=http://localhost:3000]")
  const meta = readMetadata(slug)
  fs.mkdirSync(verifyDir, { recursive: true })
  fs.rmSync(stampFile(slug), { force: true })
  run("node", ["scripts/generate-registry.mjs"])
  if (!flag("no-static")) {
    run("npx", ["eslint", "app", "components", "hooks", "lib", "scripts"])
    run("npm", ["run", "typecheck", "--silent"])
  }

  let server: ChildProcess | undefined
  let browser: Browser | undefined
  const errors: string[] = []
  try {
    let base = value("url")?.replace(/\/$/, "")
    if (!base) ({ base, server } = await startServer(Number(value("port") ?? 3322)))
    const url = `${base}/prototypes/${slug}`
    // Full Chromium in new headless mode: the default headless shell has no WebGPU adapter.
    browser = await chromium.launch({ channel: "chromium", args: ["--enable-unsafe-webgpu"] })
    await fetch(url) // compile first, so timings below are about the page
    await checkDesktop(browser, url, errors)
    await checkPhone(browser, url, errors)
    check("no console errors", errors.length === 0, [...new Set(errors)].join(" | "))
    if (!flag("no-thumbs")) await thumbnails(browser, url)
  } finally {
    await browser?.close()
    stopServer(server)
  }

  for (const t of ["light", "dark"]) check(`${t} thumbnail exists`, fs.existsSync(path.join(root, "public", "thumbnails", `${slug}-${t}.jpg`)))
  if (meta.public) console.log(`\n${slug} is public: run \`npm run thumbnails -- ${slug}\` for og:image and og:video, then verify with --no-thumbs.`)
  if (problems.length) throw new Error(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`)
  fs.writeFileSync(stampFile(slug), JSON.stringify({ fingerprint: fingerprint(slug) }))
  console.log(`\nVerified. Look at .verify/${slug}-*.png and public/thumbnails/${slug}-*.jpg, then: npm run ship -- ${slug}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exitCode = 1
})
