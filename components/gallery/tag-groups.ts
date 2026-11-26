// The gallery's filter buttons. Prototypes keep their own free-form tags (all searchable);
// tags listed here are folded into one filter, and any other tag gets no button.
const TAG_GROUPS: Record<string, readonly string[]> = {
  motion: ["모션", "kinetic", "loop", "루프"],
  typography: ["type", "타이포그래피"],
  pattern: ["패턴", "grid", "격자", "moire", "knit"],
  image: ["이미지", "photo", "사진"],
  shader: ["webgl", "webgpu", "셰이더"],
  generative: ["recursion", "제너러티브"],
  "3d": ["입체"],
  dots: ["particles", "pixel", "픽셀", "도트"],
  color: ["컬러", "gradient", "그라디언트"],
  interactive: ["인터랙션", "interaction"],
  distortion: ["디스토션", "water", "물결"],
  video: ["비디오", "computer-vision", "hand-tracking", "optical flow"],
}

const groupOf = new Map(
  Object.entries(TAG_GROUPS).flatMap(([group, aliases]) => [group, ...aliases].map((tag) => [tag, group] as const))
)

/** The filters a prototype belongs to, without duplicates. */
export function tagGroups(tags: string[]): string[] {
  const groups = tags.map((t) => groupOf.get(t.trim().toLowerCase())).filter((g) => g !== undefined)
  return [...new Set(groups)]
}
