// Frame-exact H.264 MP4 export with WebCodecs and a small self-contained muxer (no audio).

type Sample = { data: Uint8Array<ArrayBuffer>; key: boolean; timestamp: number }
type Options = {
  canvas: HTMLCanvasElement
  seconds: number
  fps: number
  draw: (t: number) => void | Promise<void>
  onProgress: (ratio: number) => void
}

const CODECS = ["avc1.64002a", "avc1.640033", "avc1.4d0034", "avc1.420034"]
const text = new TextEncoder()

function cat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

function ints(bytes: 2 | 4, values: number[]) {
  const view = new DataView(new ArrayBuffer(values.length * bytes))
  values.forEach((x, i) => (bytes === 2 ? view.setUint16(i * 2, x) : view.setUint32(i * 4, x)))
  return new Uint8Array(view.buffer)
}
const u16 = (...v: number[]) => ints(2, v)
const u32 = (...v: number[]) => ints(4, v)

function box(type: string, ...parts: Uint8Array[]) {
  const body = cat(parts)
  return cat([u32(body.length + 8), text.encode(type), body])
}

const MATRIX = u32(0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000)
const PRIMARIES: Record<string, number> = { bt709: 1, bt470bg: 5, smpte170m: 6, bt2020: 9, smpte432: 12 }
const TRANSFER: Record<string, number> = { bt709: 1, smpte170m: 6, linear: 8, "iec61966-2-1": 13 }
const MATRICES: Record<string, number> = { rgb: 0, bt709: 1, bt470bg: 5, smpte170m: 6, "bt2020-ncl": 9 }

function colorBox(c: VideoColorSpaceInit | undefined) {
  const p = PRIMARIES[c?.primaries ?? ""]
  const t = TRANSFER[c?.transfer ?? ""]
  const m = MATRICES[c?.matrix ?? ""]
  if (p === undefined || t === undefined || m === undefined) return []
  return [box("colr", text.encode("nclx"), u16(p, t, m), new Uint8Array([c?.fullRange ? 0x80 : 0]))]
}

function mux(samples: Sample[], config: Uint8Array, width: number, height: number, fps: number, color?: VideoColorSpaceInit) {
  const scale = Math.round(fps * 1000)
  const dur = 1000
  const n = samples.length
  const total = n * dur
  // Encoders may reorder frames: decode order = array order, display order = timestamp.
  const raw = samples.map((s, i) => Math.round((s.timestamp * fps) / 1e6) - i)
  const shift = -Math.min(0, ...raw)
  const offsets = raw.map((o) => (o + shift) * dur)
  const keys = samples.map((s, i) => (s.key ? i + 1 : 0)).filter(Boolean)
  const avc1 = box(
    "avc1", new Uint8Array(6), u16(1), new Uint8Array(16), u16(width, height), u32(0x480000, 0x480000, 0), u16(1),
    new Uint8Array(32), u16(0x18, 0xffff), box("avcC", config), ...colorBox(color)
  )
  const ftyp = box("ftyp", text.encode("isom"), u32(0x200), text.encode("isomiso2avc1mp41"))
  const tables = (at: number) =>
    box(
      "stbl",
      box("stsd", u32(0, 1), avc1),
      box("stts", u32(0, 1, n, dur)),
      box("stss", u32(0, keys.length, ...keys)),
      ...(offsets.some(Boolean) ? [box("ctts", u32(0, n), u32(...offsets.flatMap((o) => [1, o])))] : []),
      box("stsc", u32(0, 1, 1, n, 1)),
      box("stsz", u32(0, 0, n), u32(...samples.map((s) => s.data.length))),
      box("stco", u32(0, 1, at))
    )
  const moov = (at: number) =>
    box(
      "moov",
      box("mvhd", u32(0, 0, 0, scale, total, 0x10000), u16(0x100, 0), u32(0, 0), MATRIX, new Uint8Array(24), u32(2)),
      box(
        "trak",
        box("tkhd", u32(3, 0, 0, 1, 0, total, 0, 0), u16(0, 0, 0, 0), MATRIX, u32(width * 65536, height * 65536)),
        box("edts", box("elst", u32(0, 1, total, shift * dur, 0x10000))),
        box(
          "mdia",
          box("mdhd", u32(0, 0, 0, scale, total), u16(0x55c4, 0)),
          box("hdlr", u32(0, 0), text.encode("vide"), u32(0, 0, 0), text.encode("VideoHandler\0")),
          box("minf", box("vmhd", u32(1), u16(0, 0, 0, 0)), box("dinf", box("dref", u32(0, 1), box("url ", u32(1)))), tables(at))
        )
      )
    )
  const at = ftyp.length + moov(0).length + 8
  const size = samples.reduce((a, s) => a + s.data.length, 8)
  return new Blob([ftyp, moov(at), u32(size), text.encode("mdat"), ...samples.map((s) => s.data)], { type: "video/mp4" })
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function pickConfig(width: number, height: number, fps: number): Promise<VideoEncoderConfig | null> {
  const bitrate = Math.round(Math.min(80e6, Math.max(8e6, width * height * fps * 0.25)))
  for (const codec of CODECS) {
    const c: VideoEncoderConfig = { codec, width, height, bitrate, framerate: fps, latencyMode: "quality", avc: { format: "avc" } }
    if ((await VideoEncoder.isConfigSupported(c)).supported) return c
  }
  return null
}

/** Renders every frame at its exact time. Throws when the browser can't encode H.264. */
export async function recordMp4({ canvas, seconds, fps, draw, onProgress }: Options): Promise<Blob> {
  const config = typeof VideoEncoder === "undefined" ? null : await pickConfig(canvas.width, canvas.height, fps)
  if (!config) throw new Error("이 브라우저는 MP4 저장을 지원하지 않습니다.")
  const frames = Math.max(1, Math.round(seconds * fps))
  const samples: Sample[] = []
  const state: { meta?: VideoDecoderConfig; error?: Error } = {}
  const encoder = new VideoEncoder({
    output(chunk, m) {
      if (m?.decoderConfig?.description) state.meta = m.decoderConfig
      const data = new Uint8Array(chunk.byteLength)
      chunk.copyTo(data)
      samples.push({ data, key: chunk.type === "key", timestamp: chunk.timestamp })
    },
    error: (e) => (state.error = e),
  })
  try {
    encoder.configure(config)
    for (let i = 0; i < frames && !state.error; i++) {
      await draw(i / fps)
      const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps), alpha: "discard" })
      encoder.encode(frame, { keyFrame: i % Math.round(fps * 2) === 0 })
      frame.close()
      if (i % 10 === 0) {
        onProgress(i / frames)
        await wait(0)
      }
      while (encoder.encodeQueueSize > 8 && !state.error) await wait(4)
    }
    if (!state.error) await encoder.flush()
    const d = state.meta?.description
    if (state.error || !d || samples.length !== frames) throw state.error ?? new Error("MP4를 만들지 못했습니다.")
    const bytes = ArrayBuffer.isView(d) ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength) : new Uint8Array(d)
    return mux(samples, bytes.slice(), config.width, config.height, fps, state.meta?.colorSpace)
  } finally {
    if (encoder.state !== "closed") encoder.close()
  }
}
