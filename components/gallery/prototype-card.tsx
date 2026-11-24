import Link from "next/link"

import { surfaceClass } from "@/components/playground/tool/tool-primitives"
import type { PrototypeEntry } from "@/lib/prototype-types"
import { cn } from "@/lib/utils"
import { Thumbnail } from "./thumbnail"

function Tag({ children }: { children: string }) {
  return (
    <span className="shrink-0 rounded-[4px] border border-foreground/12 px-1.5 text-[11px] leading-4 font-semibold text-foreground/75 uppercase">
      {children}
    </span>
  )
}

export function PrototypeCard({ entry }: { entry: PrototypeEntry }) {
  const { slug, metadata: m, assets } = entry
  return (
    <Link
      href={`/prototypes/${slug}`}
      className={cn(
        surfaceClass,
        "group flex h-full flex-col overflow-hidden transition-colors duration-150 outline-none hover:border-foreground/20 focus-visible:border-foreground/40 active:border-foreground/30"
      )}
    >
      <div className="overflow-hidden border-b border-foreground/8">
        <Thumbnail assets={assets} title={m.title} />
      </div>
      <div className="flex flex-col gap-1 px-3 pt-2.5 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-[13px] leading-[18px] font-medium">{m.title}</h2>
          {m.public && <Tag>Public</Tag>}
          {m.hidden && <Tag>Hidden</Tag>}
        </div>
        {m.description && <p className="line-clamp-2 text-foreground/60">{m.description}</p>}
      </div>
    </Link>
  )
}
