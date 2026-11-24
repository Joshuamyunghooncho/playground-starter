"use client"

import { Plus, Shuffle, X } from "lucide-react"

import { AnimatedList } from "@/components/playground/animated-list"
import { ToolButton, ToolColor, ToolIconButton } from "@/components/playground/tool"
import { MIN_COLORS } from "./data"
import { MAX_COLORS } from "./shader"
import type { ColorStopsApi } from "./use-color-stops"

export function ColorStops({ api }: { api: ColorStopsApi }) {
  const { stops, update, add, remove, randomize } = api
  const canRemove = stops.length > MIN_COLORS

  return (
    <div className="flex flex-col">
      <AnimatedList
        items={stops}
        getKey={(s) => s.id}
        render={(s) => (
          <div className="flex items-center gap-1 pb-2">
            <ToolColor bare className="flex-1" label={`색상 ${stops.indexOf(s) + 1}`} value={s.hex} onChange={(hex) => update(s.id, hex)} />
            <ToolIconButton onClick={() => remove(s.id)} disabled={!canRemove} aria-label="색상 삭제" title="색상 삭제">
              <X />
            </ToolIconButton>
          </div>
        )}
      />
      <div className="grid grid-cols-2 gap-2 pt-1">
        <ToolButton onClick={add} disabled={stops.length >= MAX_COLORS}>
          <Plus /> 색상 추가
        </ToolButton>
        <ToolButton onClick={randomize}>
          <Shuffle /> 색상만 랜덤
        </ToolButton>
      </div>
    </div>
  )
}
