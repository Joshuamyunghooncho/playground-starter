// First-time Vercel setup, run once before the first deploy (AGENTS.md → Deploying):
//
//   npm run deploy:setup
//
// Needs `npx vercel login` first. Links this folder to a Vercel project, connects the GitHub repo
// when there is one, and applies the settings that keep Vercel quiet and small:
//   - production only: pushes to other branches build nothing (no preview deployments)
//   - no comments from Vercel's bot on GitHub (they arrive as email)
//   - old deployments are deleted after 1 day (the free plan's storage fills up otherwise)
// Safe to run again.

import fs from "node:fs"
import path from "node:path"

import { api, gitConnected, linked, project, productionUrl, vercel } from "./vercel"
import { out, root } from "./workflow"

const ONLY_PRODUCTION = 'if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi'

function step(label: string, fn: () => void) {
  try {
    fn()
    console.log(`✓ ${label}`)
  } catch (e) {
    console.log(`✗ ${label}: ${(e instanceof Error ? e.message : String(e)).split("\n").slice(-3).join(" ")}`)
  }
}

function main() {
  try {
    console.log(`✓ Vercel login: ${vercel(["whoami"]).split("\n").pop()}`)
  } catch {
    throw new Error("Not logged in to Vercel. Run `npx vercel login` first.")
  }

  if (!linked()) vercel(["link", "--yes"])
  const link = linked()
  if (!link) throw new Error("`vercel link` did not create .vercel/project.json.")

  let hasGitHub = false
  try {
    hasGitHub = out("git", ["remote", "get-url", "origin"]).includes("github.com")
  } catch {}
  if (hasGitHub && !gitConnected(project(link))) {
    step("connected the GitHub repo (pushes to main deploy)", () => vercel(["git", "connect", "--yes"]))
  }

  step("production only, no bot comments", () =>
    api(link, `/v9/projects/${link.projectId}`, "PATCH", {
      commandForIgnoringBuildStep: ONLY_PRODUCTION,
      gitComments: { onCommit: false, onPullRequest: false },
    })
  )
  step("old deployments deleted after 1 day", () =>
    api(link, `/v1/projects/${link.projectId}/deployment-expiration`, "PATCH", {
      expiration: "1d",
      expirationProduction: "1d",
      expirationCanceled: "1d",
      expirationErrored: "1d",
    })
  )

  const p = project(link)
  console.log(gitConnected(p)
    ? `✓ deploys: on every push to main (GitHub ${p.link?.org}/${p.link?.repo})`
    : "✓ deploys: uploaded from this folder by `npm run ship` (no GitHub connection)")

  const url = productionUrl(p)
  if (url) {
    const config = path.join(root, "lib", "site-config.ts")
    const text = fs.readFileSync(config, "utf8")
    const next = text.replace(/export const PRODUCTION_URL = ".*"/, `export const PRODUCTION_URL = "${url}"`)
    if (next !== text) {
      fs.writeFileSync(config, next)
      console.log(`✓ PRODUCTION_URL = ${url} (lib/site-config.ts, commit it)`)
    }
  }
}

try {
  main()
} catch (e) {
  console.error(e instanceof Error ? e.message : e)
  process.exitCode = 1
}
