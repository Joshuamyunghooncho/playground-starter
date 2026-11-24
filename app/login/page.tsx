import type { Metadata } from "next"

import { surfaceClass } from "@/components/playground/tool/tool-primitives"
import { toolFont } from "@/components/playground/tool/tool-font"
import { SITE_NAME } from "@/lib/site-config"
import { cn } from "@/lib/utils"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Login" }

export default function LoginPage() {
  return (
    <div
      className={cn(
        toolFont.className,
        "flex min-h-dvh flex-1 items-center justify-center px-4 text-[12px] leading-[1.625]",
        "[background-image:radial-gradient(circle,color-mix(in_oklab,var(--foreground)_8%,transparent)_1px,transparent_1px)] [background-size:22px_22px]"
      )}
    >
      <main className={cn(surfaceClass, "flex w-full max-w-[300px] flex-col")}>
        <h1 className="flex h-9 items-center px-3 text-[13px] leading-[18px] font-medium">{SITE_NAME}</h1>
        <div className="border-t border-foreground/8 p-3">
          <LoginForm />
        </div>
      </main>
    </div>
  )
}
