// Captures static light + dark thumbnails for prototypes from a production
// build, plus og:image / og:video for public prototypes.
//
//   npm run thumbnails -- gradient-orb        one prototype
//   npm run thumbnails -- gradient-orb other  several
//   npm run thumbnails -- --missing           only those without both thumbnails
//   npm run thumbnails -- --all               every prototype
//
// Flags:
//   --no-build   reuse the existing .next build (faster when nothing changed)
//   --og         also capture OG image/video for the targets even if not public
//   --no-og      skip OG capture
//   --port=3311  port for the temporary `next start` server
//
// Output: public/thumbnails/<slug>-{light,dark}.jpg (960×600)
//         public/og/<slug>.png (1200×630) and public/og/<slug>.mp4 (or .webm without ffmpeg)

import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { randomBytes } from "node:crypto"
import fs from "node:fs"
import path from "node:path"

import { chromium, type Browser, type BrowserContext } from "playwright"

import { AUTH_COOKIE, tokenFor } from "../lib/auth"

const root = path.resolve(__dirname, "..")
const prototypesDir = path.join(root, "app", "prototypes")
const thumbsDir = path.join(root, "public", "thumbnails")
const ogDir = path.join(root, "public", "og")
const tmpDir = path.join(root, ".thumbnail-tmp")

const THUMB = { width: 960, height: 600 }
const OG = { width: 1200, height: 630 }
const SETTLE_MS = 2500
const VIDEO_SECONDS = 6

type Proto = { slug: string; isPublic: boolean }

function parseArgs(argv: string[]) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")).map((a) => a.split("=")[0]))
  const portArg = argv.find((a) => a.startsWith("--port="))
  return {
    slugs: argv.filter((a) => !a.startsWith("--")),
    all: flags.has("--all"),
    missing: flags.has("--missing"),
    build: !flags.has("--no-build"),
    forceOg: flags.has("--og"),
    skipOg: flags.has("--no-og"),
    port: portArg ? Number(portArg.split("=")[1]) : 3311,
  }
}

function listPrototypes(): Proto[] {
  return fs
    .readdirSync(prototypesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !/^[[(_]/.test(d.name))
    .map((d) => {
      const meta = JSON.parse(fs.readFileSync(path.join(prototypesDir, d.name, "metadata.json"), "utf8"))
      return { slug: d.name, isPublic: meta.public === true }
    })
}

const hasThumbs = (slug: string) =>
  ["light", "dark"].every((t) => fs.existsSync(path.join(thumbsDir, `${slug}-${t}.jpg`)))

function run(cmd: string, args: string[], env: Record<string, string> = {}) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", env: { ...process.env, ...env } })
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed`)
}

async function waitForServer(url: string, timeoutMs = 60_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.status < 500) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`Server did not start at ${url}`)
}

async function newContext(
  browser: Browser,
  base: string,
  token: string,
  theme: "light" | "dark",
  size: { width: number; height: number },
  video?: boolean
) {
  const ctx = await browser.newContext({
    viewport: size,
    deviceScaleFactor: 1,
    colorScheme: theme,
    reducedMotion: "no-preference",
    ...(video ? { recordVideo: { dir: tmpDir, size } } : {}),
  })
  await ctx.addCookies([{ name: AUTH_COOKIE, value: token, url: base }])
  // next-themes reads localStorage("theme") before paint.
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t)
    } catch {}
  }, theme)
  return ctx
}

async function openSettled(ctx: BrowserContext, url: string) {
  const page = await ctx.newPage()
  const res = await page.goto(url, { waitUntil: "networkidle" })
  if (!res || res.status() >= 400) throw new Error(`${url} returned ${res?.status()}`)
  await page.locator("[data-prototype-loading]").waitFor({ state: "detached", timeout: 120_000 })
  // Hide the tool shell's chrome and let the subject use the whole frame.
  await page.addStyleTag({
    content: "[data-playground-chrome], nextjs-portal { display: none !important; } [data-tool-stage] { padding: 24px !important; }",
  })
  await page.waitForTimeout(SETTLE_MS)
  return page
}

function hasFfmpeg() {
  return spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const all = listPrototypes()
  const bySlug = new Map(all.map((p) => [p.slug, p]))

  let targets: Proto[]
  if (args.slugs.length) {
    const unknown = args.slugs.filter((s) => !bySlug.has(s))
    if (unknown.length) throw new Error(`Unknown prototype(s): ${unknown.join(", ")}`)
    targets = args.slugs.map((s) => bySlug.get(s)!)
  } else if (args.missing) {
    targets = all.filter((p) => !hasThumbs(p.slug))
  } else if (args.all) {
    targets = all
  } else {
    console.log("Usage: npm run thumbnails -- <slug...> | --missing | --all  [--no-build] [--og|--no-og]")
    process.exit(1)
  }
  if (!targets.length) {
    console.log("Nothing to capture.")
    return
  }
  console.log(`Capturing: ${targets.map((t) => t.slug).join(", ")}`)

  fs.mkdirSync(thumbsDir, { recursive: true })
  fs.mkdirSync(ogDir, { recursive: true })
  fs.rmSync(tmpDir, { recursive: true, force: true })
  fs.mkdirSync(tmpDir, { recursive: true })

  if (args.build) run("npm", ["run", "build"])

  // Throwaway password for this local server only.
  const password = randomBytes(16).toString("hex")
  const token = await tokenFor(password)
  const base = `http://localhost:${args.port}`
  let server: ChildProcess | undefined
  let browser: Browser | undefined

  try {
    server = spawn("npx", ["next", "start", "-p", String(args.port)], {
      cwd: root,
      env: { ...process.env, SITE_PASSWORD: password },
      stdio: "ignore",
      detached: true,
    })
    await waitForServer(`${base}/login`)
    // Full Chromium in new headless mode: the default headless shell has no WebGPU adapter.
    browser = await chromium.launch({ channel: "chromium", args: ["--enable-unsafe-webgpu"] })

    for (const proto of targets) {
      for (const theme of ["light", "dark"] as const) {
        const ctx = await newContext(browser, base, token, theme, THUMB)
        const page = await openSettled(ctx, `${base}/prototypes/${proto.slug}`)
        const out = path.join(thumbsDir, `${proto.slug}-${theme}.jpg`)
        await page.screenshot({ path: out, type: "jpeg", quality: 82 })
        await ctx.close()
        console.log(`  ✓ ${path.relative(root, out)}`)
      }

      if ((proto.isPublic || args.forceOg) && !args.skipOg) {
        const url = `${base}/p/${proto.slug}`
        const ctx = await newContext(browser, base, token, "dark", OG)
        const page = await openSettled(ctx, url)
        const png = path.join(ogDir, `${proto.slug}.png`)
        await page.screenshot({ path: png, type: "png" })
        await ctx.close()
        console.log(`  ✓ ${path.relative(root, png)}`)

        const vctx = await newContext(browser, base, token, "dark", OG, true)
        const vpage = await openSettled(vctx, url)
        await vpage.waitForTimeout(VIDEO_SECONDS * 1000)
        const video = vpage.video()
        await vctx.close()
        const webm = video ? await video.path() : undefined
        if (!webm) throw new Error("No video recorded")

        const mp4 = path.join(ogDir, `${proto.slug}.mp4`)
        const webmOut = path.join(ogDir, `${proto.slug}.webm`)
        fs.rmSync(mp4, { force: true })
        fs.rmSync(webmOut, { force: true })
        if (hasFfmpeg()) {
          // Skip the load + settle time, H.264 for widest preview support.
          const skip = (SETTLE_MS / 1000 + 0.5).toFixed(1)
          run("ffmpeg", ["-y", "-loglevel", "error", "-ss", skip, "-i", webm, "-t", String(VIDEO_SECONDS - 1),
            "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "26", "-movflags", "+faststart", mp4])
          console.log(`  ✓ ${path.relative(root, mp4)}`)
        } else {
          fs.copyFileSync(webm, webmOut)
          console.log(`  ✓ ${path.relative(root, webmOut)} (install ffmpeg for mp4)`)
        }
      }
    }
  } finally {
    await browser?.close()
    if (server?.pid) {
      try {
        process.kill(-server.pid, "SIGTERM")
      } catch {}
    }
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  // Refresh asset flags/versions in the generated registry.
  run("node", ["scripts/generate-registry.mjs"])
  console.log("\nDone. Open the images and check them before committing.")
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
