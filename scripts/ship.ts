// "배포해줘" / "올려줘": commit, push to GitHub, put it on the live site. No pull requests.
//
//   npm run ship -- <slug>     one prototype; needs a fresh `npm run verify -- <slug>`
//   npm run ship               work that is already committed (fixes, shared code)
//
// Flags: --title="…" (commit message), --trailer="…" (e.g. Co-Authored-By)
//
// First deploy: `npx vercel login`, then `npm run deploy:setup` (AGENTS.md → Deploying).
// When Vercel is connected to the GitHub repo, the push to main is the deploy and this waits for it.
// Without GitHub, the committed files are uploaded with `vercel deploy --prod`.
// Untracked files are never included.

import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { api, gitConnected, linked, project, productionUrl } from "./vercel"
import { fingerprint, out, prototypePaths, readMetadata, root, run, sleep, stampFile } from "./workflow"

const TIMEOUT_MS = 10 * 60_000

const argv = process.argv.slice(2)
const value = (name: string) => argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=")
const slug = argv.find((a) => !a.startsWith("--"))

function commitPrototype(id: string, base: string) {
  const stamp = fs.existsSync(stampFile(id)) ? JSON.parse(fs.readFileSync(stampFile(id), "utf8")).fingerprint : ""
  if (stamp !== fingerprint(id)) throw new Error(`Not verified since the last change. Run: npm run verify -- ${id}`)
  const meta = readMetadata(id)
  const isNew = !base || out("git", ["ls-tree", "--name-only", base, `app/prototypes/${id}/`]) === ""
  const title = value("title") ?? `${isNew ? "Add" : "Update"} ${meta.title} prototype`
  out("git", ["add", "-A", "--", ...prototypePaths(id)])
  if (out("git", ["diff", "--cached", "--name-only"])) {
    const trailer = value("trailer")
    out("git", ["commit", "-m", title, ...(trailer ? ["-m", trailer] : [])])
    console.log(`✓ committed: ${title}`)
  }
}

async function waitForVercel(sha: string) {
  const end = Date.now() + TIMEOUT_MS
  while (Date.now() < end) {
    const status = JSON.parse(out("gh", ["api", `repos/{owner}/{repo}/commits/${sha}/status`])) as {
      statuses: { context: string; state: string }[]
    }
    const vercelStatus = status.statuses.find((s) => s.context === "Vercel")
    if (vercelStatus?.state === "success") return
    if (vercelStatus && vercelStatus.state !== "pending") {
      throw new Error(`The Vercel build is "${vercelStatus.state}". The previous version is still live; fix it and ship again.`)
    }
    await sleep(5000)
  }
  throw new Error("Vercel did not finish in time. Run `npx vercel ls` to see the deployment.")
}

/** Uploads exactly the committed files, never stray files in the folder. */
function uploadCommitted() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ship-"))
  out("sh", ["-c", `git archive HEAD | tar -x -C "${dir}"`])
  fs.cpSync(path.join(root, ".vercel"), path.join(dir, ".vercel"), { recursive: true })
  run("npx", ["--yes", "vercel@latest", "deploy", "--prod", "--yes", "--cwd", dir])
}

function rememberProductionUrl(url: string) {
  const config = path.join(root, "lib", "site-config.ts")
  const text = fs.readFileSync(config, "utf8")
  if (!/export const PRODUCTION_URL = ""/.test(text)) return
  fs.writeFileSync(config, text.replace(/export const PRODUCTION_URL = ""/, `export const PRODUCTION_URL = "${url}"`))
  out("git", ["commit", "-m", "Remember the production URL", "--", "lib/site-config.ts"])
  console.log(`✓ PRODUCTION_URL = ${url} (committed; goes online with the next ship)`)
}

async function main() {
  const link = linked()
  if (!link) throw new Error("Not set up for Vercel yet. Run `npx vercel login`, then `npm run deploy:setup`.")
  if (!out("git", ["branch", "--show-current"])) throw new Error("Check out a branch first (detached HEAD).")
  // The site must never go online without its password (without one it stays locked to everyone).
  const { envs } = api<{ envs: { key: string; target?: string[] }[] }>(link, `/v9/projects/${link.projectId}/env`)
  if (!envs.some((e) => e.key === "SITE_PASSWORD" && e.target?.includes("production"))) {
    throw new Error("No site password yet. Ask the owner for one, then: printf '%s' \"<password>\" | npx vercel env add SITE_PASSWORD production")
  }

  let remote = false
  try {
    remote = !!out("git", ["remote", "get-url", "origin"])
  } catch {}
  if (remote) out("git", ["fetch", "origin", "main"])
  const base = remote ? "origin/main" : ""

  if (slug) commitPrototype(slug, base)
  const changed = out("git", ["status", "--porcelain", "--untracked-files=no"])
  if (changed && !slug) throw new Error(`Commit these first:\n${changed}`)
  if (changed) console.log(`Not included (outside ${slug}):\n${changed}`)

  const p = project(link)
  const viaGit = remote && gitConnected(p)
  if (remote) {
    if (out("git", ["rev-list", "--count", "origin/main..HEAD"]) !== "0") {
      try {
        out("git", ["rebase", "--autostash", "origin/main"])
      } catch (e) {
        try { out("git", ["rebase", "--abort"]) } catch {}
        throw new Error(`Rebasing onto origin/main conflicted; nothing was pushed.\n${e instanceof Error ? e.message : e}`)
      }
      run("git", ["push", "origin", "HEAD:main"])
      console.log("✓ pushed to GitHub")
    } else if (viaGit) {
      throw new Error("Nothing new to ship.")
    }
  }

  const sha = out("git", ["rev-parse", "HEAD"])
  if (viaGit) {
    console.log("Waiting for Vercel…")
    await waitForVercel(sha)
  } else {
    console.log("Uploading to Vercel…")
    uploadCommitted()
  }

  const url = productionUrl(project(link))
  if (!url) {
    console.log("✓ live (run `npx vercel project ls` for the address)")
    return
  }
  console.log(`✓ live: ${url}${slug ? `/prototypes/${slug}` : ""}`)
  rememberProductionUrl(url)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exitCode = 1
})
