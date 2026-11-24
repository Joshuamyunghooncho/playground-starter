import { defineControls } from "@/components/playground/controls"

export const SLUG = "gradient-orb"

export const DEFAULT_COLORS = ["#f6d93f", "#f2652d", "#e43bdd", "#ee2c1b"] as const
export const MIN_COLORS = 2

/** Numeric value the shader expects for each texture mode. */
export const TEXTURE_MODE: Record<string, number> = { none: 0, dots: 1, squares: 2, digits: 3, letters: 4 }

/** Glyph atlas rows, ordered roughly by stroke density (light → heavy). */
export const GLYPH_DIGITS = "1743256980"
export const GLYPH_LETTERS = "ILJCZSEAMW"


export const STORAGE_KEYS = { colors: "colors", presets: "presets" } as const

export const CONTROLS = defineControls({
  imgScale: { group: "이미지", type: "number", label: "이미지 크기", min: 0.1, max: 1.2, step: 0.01, default: 0.43 },
  imgY: { group: "이미지", type: "number", label: "상하 위치", min: -0.8, max: 0.8, step: 0.01, default: 0 },
  imgRad: { group: "이미지", type: "number", label: "모서리 라운드", min: 0, max: 0.3, step: 0.005, default: 0.05 },
  auraInt: { group: "이미지", type: "number", label: "아우라 강도", min: 0, max: 1.5, step: 0.01, default: 0.35 },
  auraSp: { group: "이미지", type: "number", label: "아우라 확산", min: 0.05, max: 0.7, step: 0.01, default: 0.15 },
  auraTerm: { group: "이미지", type: "number", label: "색상 텀 (간격)", min: 0.1, max: 2, step: 0.01, default: 0.5 },
  auraHue: { group: "이미지", type: "number", label: "시작 색 위상", min: 0, max: 1, step: 0.01, default: 0.3 },
  auraFlow: { group: "이미지", type: "number", label: "아우라 발산 배율", min: 0, max: 3, step: 0.05, default: 1 },
  auraRing: { group: "이미지", type: "number", label: "링 대비", min: 0, max: 1, step: 0.01, default: 0 },

  texMode: {
    group: "텍스처",
    type: "select",
    label: "텍스처",
    options: [
      { value: "none", label: "없음" },
      { value: "dots", label: "도트" },
      { value: "squares", label: "사각형" },
      { value: "digits", label: "숫자" },
      { value: "letters", label: "문자" },
    ],
    default: "none",
  },
  cell: { group: "텍스처", type: "number", label: "셀 크기", min: 6, max: 40, step: 1, default: 6 },
  texInt: { group: "텍스처", type: "number", label: "텍스처 강도", min: 0, max: 1, step: 0.01, default: 1 },

  speed: { group: "모션", type: "number", label: "발산 속도", min: 0, max: 1, step: 0.01, default: 0.88 },
  cycle: { group: "모션", type: "number", label: "팔레트 순환", min: 0, max: 0.5, step: 0.005, default: 0 },
  breath: { group: "모션", type: "number", label: "호흡 (형태 맥동)", min: 0, max: 1, step: 0.01, default: 0.34 },

  angle: { group: "형태", type: "number", label: "회전 각도", min: 0, max: 360, step: 1, default: 0 },
  topR: { group: "형태", type: "number", label: "돔 크기 (위)", min: 0.4, max: 1.3, step: 0.01, default: 1.26 },
  botR: { group: "형태", type: "number", label: "아치 크기 (아래)", min: 0.35, max: 1, step: 0.01, default: 1 },
  thick: { group: "형태", type: "number", label: "림 두께", min: 0.06, max: 0.3, step: 0.005, default: 0.24 },
  gap: { group: "형태", type: "number", label: "상하 간격", min: 0, max: 0.35, step: 0.01, default: 0 },
  stretch: { group: "형태", type: "number", label: "가로 퍼짐", min: 0.55, max: 1.6, step: 0.01, default: 1.26 },
  gloss: { group: "형태", type: "number", label: "림 광택", min: 0, max: 1.5, step: 0.01, default: 1.5 },
  soft: { group: "형태", type: "number", label: "색 경계 부드러움", min: 0, max: 1, step: 0.01, default: 0.42 },

  aspect: {
    group: "캔버스",
    type: "select",
    label: "비율",
    options: [
      { value: "0.8", label: "4:5" },
      { value: "1", label: "1:1" },
      { value: "0.5625", label: "9:16" },
      { value: "1.7778", label: "16:9" },
    ],
    default: "0.8",
    randomize: false,
  },
})
