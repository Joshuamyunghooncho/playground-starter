import { Inter } from "next/font/google"

/** The tool shell's UI font (Inter, as in Toolcraft). Hangul falls back to the system font. */
export const toolFont = Inter({ subsets: ["latin"], display: "swap" })
