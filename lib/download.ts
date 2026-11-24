// Browser downloads for prototype exports.

export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

/** Downloads what the canvas shows right now as `<name>-<timestamp>.png`. */
export async function saveCanvasPng(canvas: HTMLCanvasElement, name: string) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
  if (!blob) throw new Error("PNG를 만들 수 없습니다.")
  downloadBlob(blob, `${name}-${Date.now()}.png`)
}
