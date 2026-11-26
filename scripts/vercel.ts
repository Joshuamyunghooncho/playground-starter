// Vercel helpers shared by deploy-setup.ts and ship.ts. Everything goes through the Vercel CLI
// (`npx vercel`), so the owner never opens the Vercel dashboard.

import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { out, root } from "./workflow"

export type Linked = { projectId: string; orgId: string }
type Project = {
  name: string
  link?: { type?: string; org?: string; repo?: string }
  targets?: { production?: { alias?: string[] } }
}

const linkFile = path.join(root, ".vercel", "project.json")

export const vercel = (args: string[]) => out("npx", ["--yes", "vercel@latest", ...args])

/** The linked project, or undefined before the first `vercel link`. */
export function linked(): Linked | undefined {
  try {
    const json = JSON.parse(fs.readFileSync(linkFile, "utf8")) as Partial<Linked>
    return json.projectId && json.orgId ? { projectId: json.projectId, orgId: json.orgId } : undefined
  } catch {
    return undefined
  }
}

/** Calls the Vercel REST API as the logged-in CLI user. */
export function api<T>(link: Linked, endpoint: string, method = "GET", body?: unknown): T {
  const url = `${endpoint}${endpoint.includes("?") ? "&" : "?"}teamId=${link.orgId}`
  if (body === undefined) return JSON.parse(vercel(["api", url, "-X", method, "--raw"])) as T
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "vercel-")), "body.json")
  fs.writeFileSync(file, JSON.stringify(body))
  return JSON.parse(vercel(["api", url, "-X", method, "--raw", "--input", file])) as T
}

export const project = (link: Linked) => api<Project>(link, `/v9/projects/${link.projectId}`)

/** Builds come from GitHub pushes when the project is connected to the repo. */
export const gitConnected = (p: Project) => p.link?.type === "github"

/** The short production domain (https://<name>.vercel.app), not a per-deployment URL. */
export function productionUrl(p: Project) {
  const aliases = (p.targets?.production?.alias ?? []).filter((a) => !a.includes("-git-"))
  const best = aliases.sort((a, b) => a.length - b.length)[0]
  return best ? `https://${best}` : undefined
}
