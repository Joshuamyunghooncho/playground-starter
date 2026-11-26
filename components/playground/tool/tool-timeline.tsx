"use client"

import { Pause, Play, StepBack, StepForward } from "lucide-react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import type { ToolClock } from "./clock"
import { surfaceClass, ToolIconButton } from "./tool-primitives"
import { ToolSlider } from "./tool-slider"
import { useClockPlaying } from "./use-tool-clock"

/** Polls the clock once per frame; re-renders only when the shown time changes. */
function useClockTime(clock: ToolClock) {
  const [time, setTime] = useState({ t: clock.t, d: clock.duration })
  useEffect(() => {
    let raf = 0
    const tick = () => {
      setTime((prev) =>
        Math.abs(prev.t - clock.t) < 0.005 && prev.d === clock.duration ? prev : { t: clock.t, d: clock.duration }
      )
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clock])
  return time
}

/**
 * Floating playback bar above the stage (desktop): play/pause, frame steps and a
 * scrubber (loops only). Open-ended animations show play/pause and elapsed time.
 */
export function ToolTimeline({ clock, scrub }: { clock: ToolClock; scrub: boolean }) {
  const playing = useClockPlaying(clock)
  const { t, d } = useClockTime(clock)
  const canScrub = scrub && d > 0
  const label = t.toFixed(2) + (d > 0 ? ` / ${d.toFixed(2)}s` : "s")

  return (
    <div
      data-playground-chrome
      className={cn(
        surfaceClass,
        "fixed top-2.5 left-[calc((100vw-310px)/2)] z-40 flex -translate-x-1/2 items-center gap-1.5 overflow-hidden p-1 select-none max-md:hidden",
        canScrub && "w-[min(420px,calc(100vw-350px))]"
      )}
    >
      <ToolIconButton onClick={clock.togglePlaying} aria-label={playing ? "일시정지 (Space)" : "재생 (Space)"} title={playing ? "일시정지 (Space)" : "재생 (Space)"}>
        {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
      </ToolIconButton>
      {canScrub && (
        <>
          <ToolIconButton onClick={() => clock.step(-1)} aria-label="이전 프레임 (←)" title="이전 프레임 (←)">
            <StepBack />
          </ToolIconButton>
          <ToolIconButton onClick={() => clock.step(1)} aria-label="다음 프레임 (→)" title="다음 프레임 (→)">
            <StepForward />
          </ToolIconButton>
          <span className="h-5 w-px shrink-0 bg-foreground/8" />
          <ToolSlider
            label="시간"
            className="mx-2 flex-1"
            value={t}
            min={0}
            max={d}
            step={0.001}
            valueText={label}
            onChange={(v) => {
              clock.setPlaying(false)
              clock.seek(v)
            }}
          />
        </>
      )}
      <span className="px-2 whitespace-nowrap text-muted-foreground tabular-nums">{label}</span>
      {canScrub && <i className="absolute bottom-0 left-0 block h-px bg-tool-link/90" style={{ width: `${(t / d) * 100}%` }} />}
    </div>
  )
}

/** The same playback as a row in the phone sheet; the scrubber gets the width frame steps would take. */
export function ToolPlayback({ clock, scrub }: { clock: ToolClock; scrub: boolean }) {
  const playing = useClockPlaying(clock)
  const { t, d } = useClockTime(clock)
  const canScrub = scrub && d > 0
  const label = canScrub ? `${t.toFixed(1)} / ${d.toFixed(1)}s` : `${t.toFixed(1)}s`

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 pr-4 pl-1 md:hidden">
      <ToolIconButton onClick={clock.togglePlaying} aria-label={playing ? "일시정지" : "재생"} className="text-foreground [&_svg]:size-[18px]">
        {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
      </ToolIconButton>
      {canScrub && (
        <ToolSlider
          label="시간"
          className="flex-1"
          value={t}
          min={0}
          max={d}
          step={0.001}
          valueText={label}
          onChange={(v) => {
            clock.setPlaying(false)
            clock.seek(v)
          }}
        />
      )}
      <span className="text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">{label}</span>
    </div>
  )
}
