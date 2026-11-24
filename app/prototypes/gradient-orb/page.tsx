import type { Metadata } from "next"

import { GradientOrbApp } from "./gradient-orb-app"

export const metadata: Metadata = { title: "Gradient Orb" }

export default function Page() {
  return <GradientOrbApp />
}
