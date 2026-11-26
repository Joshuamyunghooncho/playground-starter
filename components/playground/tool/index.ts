// Tool shell: the playground's prototype UI, adapted from Toolcraft
// (MIT, Pixel Point — https://github.com/pixel-point/toolcraft).
export { createClock, FRAME_STEP, type ToolClock } from "./clock"
export { useClockPlaying, useToolClock } from "./use-tool-clock"
export { ToolShell } from "./tool-shell"
export { ToolControls } from "./tool-controls"
export { useFitSize } from "./use-fit-size"
export {
  inputClass,
  surfaceClass,
  ToolButton,
  ToolField,
  ToolIconButton,
  ToolInput,
  ToolLabel,
  ToolList,
  ToolPair,
  ToolSection,
  ToolTextarea,
} from "./tool-primitives"
export { formatToolValue, ToolNumberField, ToolSlider, ToolValueBox } from "./tool-slider"
export { ToolChoice, ToolColor, ToolSegmented, ToolSelect, ToolSwitch } from "./tool-inputs"
export { MotionCanvas, type DrawFrame, type MotionSize } from "./motion-canvas"
export { MotionExportButtons, useMotionExport } from "./motion-export"
