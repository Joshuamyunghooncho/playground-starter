// Shared by verify.ts and ship.ts.
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"

export const root = path.resolve(__dirname, "..")
export const verifyDir = path.join(root, ".verify")

/** Runs a command and returns its output; throws with stderr when it fails. */
export function out(cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: "utf8" })
  if (r.error) throw new Error(`${cmd}: ${r.error.message}`)
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed\n${r.stderr || r.stdout}`)
  return r.stdout.trim()
}

/** Runs a command with live output. */
export function run(cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit" })
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed`)
}

/** Paths that belong to one prototype, relative to the repo root. Only existing ones. */
export function prototypePaths(slug: string) {
  return [
    `app/prototypes/${slug}`,
    `app/api/${slug}`,
    `public/prototypes/${slug}`,
    ...["light", "dark"].map((t) => `public/thumbnails/${slug}-${t}.jpg`),
    ...["png", "mp4", "webm"].map((e) => `public/og/${slug}.${e}`),
  ].filter((p) => fs.existsSync(path.join(root, p)))
}

/** Checks that a slug names a prototype, and returns its metadata. */
export function readMetadata(slug: string): { title: string; description: string; public: boolean } {
  const file = path.join(root, "app", "prototypes", slug, "metadata.json")
  if (!/^[a-z0-9-]+$/.test(slug) || !fs.existsSync(file)) throw new Error(`Unknown prototype: ${slug}`)
  return JSON.parse(fs.readFileSync(file, "utf8"))
}

/** Fingerprint of every file verify looked at, so ship can tell whether anything changed since. */
export function fingerprint(slug: string) {
  const files = out("git", ["ls-files", "-co", "--exclude-standard", "--", ...prototypePaths(slug), "components", "hooks", "lib", "app/globals.css", "package.json"])
    .split("\n")
    .filter((f) => f && fs.existsSync(path.join(root, f)))
    .sort()
  const hash = createHash("sha256")
  for (const f of new Set(files)) hash.update(f).update("\0").update(fs.readFileSync(path.join(root, f)))
  return hash.digest("hex")
}

export const stampFile = (slug: string) => path.join(verifyDir, `${slug}.json`)

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
