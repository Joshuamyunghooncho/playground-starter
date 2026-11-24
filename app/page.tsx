import { Gallery } from "@/components/gallery/gallery"
import { toolFont } from "@/components/playground/tool/tool-font"
import { ThemeToggle } from "@/components/playground/theme-toggle"
import { getAllPrototypes } from "@/lib/prototypes"
import { SITE_NAME } from "@/lib/site-config"
import { cn } from "@/lib/utils"

export default function Home() {
  const entries = getAllPrototypes()
  return (
    <div
      className={cn(
        toolFont.className,
        "flex min-h-dvh flex-1 flex-col text-[12px] leading-[1.625]",
        "[background-image:radial-gradient(circle,color-mix(in_oklab,var(--foreground)_8%,transparent)_1px,transparent_1px)] [background-size:22px_22px] [background-attachment:fixed]"
      )}
    >
      <main className="mx-auto flex w-full max-w-[1908px] flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-3xl leading-none font-black tracking-[-0.03em] sm:text-5xl">{SITE_NAME}</h1>
          <ThemeToggle />
        </header>
        <Gallery entries={entries} />
      </main>
    </div>
  )
}
