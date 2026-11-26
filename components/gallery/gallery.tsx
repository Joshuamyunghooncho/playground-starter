"use client"

import { Search } from "lucide-react"
import { useMemo, useState } from "react"

import { inputClass, ToolSwitch } from "@/components/playground/tool"
import type { PrototypeEntry } from "@/lib/prototype-types"
import { cn } from "@/lib/utils"
import { collectTags, filterPrototypes } from "./filter"
import { PrototypeCard } from "./prototype-card"

export function Gallery({ entries }: { entries: PrototypeEntry[] }) {
  const [query, setQuery] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [showHidden, setShowHidden] = useState(false)

  const allTags = useMemo(() => collectTags(entries, showHidden), [entries, showHidden])
  const visible = useMemo(
    () => filterPrototypes(entries, { query, tags, showHidden }),
    [entries, query, tags, showHidden]
  )
  const hasHidden = entries.some((e) => e.metadata.hidden)

  const toggleTag = (t: string) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search prototypes"
          className={cn(inputClass, "bg-popover/75 pl-7 backdrop-blur-[40px]")}
        />
      </div>

      {(allTags.length > 0 || hasHidden) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tags.includes(t)}
              onClick={() => toggleTag(t)}
              className="h-7 rounded-[6px] border border-foreground/12 bg-foreground/5 px-2 font-medium text-foreground/72 transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:text-primary-foreground max-md:h-11 max-md:px-3"
            >
              {t}
            </button>
          ))}
          {hasHidden && (
            <div className="ml-auto">
              <ToolSwitch label="Hidden" checked={showHidden} onChange={setShowHidden} />
            </div>
          )}
        </div>
      )}

      {visible.length ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((e) => (
            <li key={e.slug}>
              <PrototypeCard entry={e} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-12 text-center text-muted-foreground">{entries.length ? "No matches" : "No prototypes yet"}</p>
      )}
    </div>
  )
}
