// Thin WebGL wrapper around the shader. No React. One instance per <canvas>.

import { GLYPH_DIGITS, GLYPH_LETTERS, TEXTURE_MODE } from "./data"
import { toUniformColors } from "./palette"
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader"
import type { Clock, OrbParams } from "./types"

const UNIFORMS = [
  "res", "flow", "hue", "stretch", "angle", "gloss", "gap", "topR", "botR", "thick", "soft", "breath",
  "colors", "count", "img", "glyphs", "hasImg", "imgAspect", "imgScale", "imgY", "imgRad",
  "auraInt", "auraSp", "auraTerm", "auraHue", "auraFlow", "auraRing", "texMode", "cell", "texInt",
] as const

export type Renderer = {
  draw: (params: OrbParams, clock: Clock, dpr: number) => void
  setColors: (hexes: readonly string[]) => void
  setImage: (img: HTMLImageElement | null) => void
  resize: (width: number, height: number) => void
  dispose: () => void
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader error")
  return s
}

function makeTexture(gl: WebGLRenderingContext, unit: number) {
  const t = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, t)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  return t
}

/** 2 rows × 10 columns of glyphs; bottom row letters, top row digits after the Y flip. */
function glyphAtlas() {
  const c = document.createElement("canvas")
  c.width = 640
  c.height = 128
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#fff" // alpha mask only; colour is ignored by the shader
  ctx.font = '700 50px "Courier New", monospace'
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  for (let i = 0; i < 10; i++) {
    ctx.fillText(GLYPH_DIGITS[i], i * 64 + 32, 34)
    ctx.fillText(GLYPH_LETTERS[i], i * 64 + 32, 98)
  }
  return c
}

/** Returns null when WebGL is unavailable. */
export function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, antialias: true })
  if (!gl) return null

  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER))
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER))
  gl.linkProgram(prog)
  gl.useProgram(prog)

  // One oversized triangle covers the viewport.
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, "a")
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(prog, `u_${n}`)])) as Record<
    (typeof UNIFORMS)[number],
    WebGLUniformLocation | null
  >

  const imgTex = makeTexture(gl, 0)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]))
  gl.uniform1i(u.img, 0)

  const glyphTex = makeTexture(gl, 1)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, glyphAtlas())
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
  gl.uniform1i(u.glyphs, 1)

  let image: { aspect: number } | null = null

  return {
    setColors(hexes) {
      gl.uniform3fv(u.colors, toUniformColors(hexes))
      gl.uniform1i(u.count, Math.max(1, hexes.length))
    },
    setImage(img) {
      if (!img) {
        image = null
        return
      }
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, imgTex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      image = { aspect: img.naturalWidth / img.naturalHeight }
    },
    resize(width, height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    },
    draw(p, clock, dpr) {
      gl.uniform2f(u.res, canvas.width, canvas.height)
      gl.uniform1f(u.flow, clock.flow)
      gl.uniform1f(u.hue, clock.hue)
      gl.uniform1f(u.stretch, 1 / p.stretch)
      gl.uniform1f(u.angle, (p.angle * Math.PI) / 180)
      gl.uniform1f(u.gloss, p.gloss)
      gl.uniform1f(u.gap, p.gap)
      gl.uniform1f(u.topR, p.topR)
      gl.uniform1f(u.botR, p.botR)
      gl.uniform1f(u.thick, p.thick)
      gl.uniform1f(u.soft, p.soft)
      gl.uniform1f(u.breath, Math.sin(clock.t * 0.7) * p.breath)
      gl.uniform1f(u.hasImg, image ? 1 : 0)
      gl.uniform1f(u.imgAspect, image?.aspect ?? 1)
      gl.uniform1f(u.imgScale, p.imgScale)
      gl.uniform1f(u.imgY, p.imgY)
      gl.uniform1f(u.imgRad, p.imgRad)
      gl.uniform1f(u.auraInt, p.auraInt)
      gl.uniform1f(u.auraSp, p.auraSp)
      gl.uniform1f(u.auraTerm, p.auraTerm)
      gl.uniform1f(u.auraHue, p.auraHue)
      gl.uniform1f(u.auraFlow, p.auraFlow)
      gl.uniform1f(u.auraRing, p.auraRing)
      gl.uniform1f(u.texMode, TEXTURE_MODE[p.texMode] ?? 0)
      gl.uniform1f(u.cell, p.cell * dpr)
      gl.uniform1f(u.texInt, p.texInt)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      gl.deleteTexture(imgTex)
      gl.deleteTexture(glyphTex)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
    },
  }
}
