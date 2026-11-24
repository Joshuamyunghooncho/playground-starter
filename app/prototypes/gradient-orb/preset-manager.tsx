"use client"

import { Download, Upload, X } from "lucide-react"
import { useRef, useState } from "react"

import { AnimatedList } from "@/components/playground/animated-list"
import { ToolButton, ToolIconButton, ToolInput } from "@/components/playground/tool"
import { parsePresets, toStored } from "./presets"
import type { Preset } from "./types"
import type { PresetsApi } from "./use-presets"

type Props = {
  api: PresetsApi
  /** Builds a preset from the current settings. */
  capture: (name: string) => Preset
  onApply: (preset: Preset) => void
  onMessage: (message: string) => void
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export function PresetManager({ api, capture, onApply, onMessage }: Props) {
  const { presets, add, addMany, remove } = api
  const [name, setName] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  function save() {
    add(capture(name.trim() || `프리셋 ${presets.length + 1}`))
    setName("")
  }

  function importFile(file: File) {
    file
      .text()
      .then((text) => {
        const list = parsePresets(JSON.parse(text))
        if (!list.length) return onMessage("프리셋 형식이 아닌 파일입니다.")
        addMany(list)
        onMessage(`프리셋 ${list.length}개를 불러왔습니다.`)
      })
      .catch(() => onMessage("파일을 읽을 수 없습니다. JSON 형식을 확인해 주세요."))
  }

  return (
    <div className="flex flex-col">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <ToolInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="프리셋 이름"
          maxLength={40}
          aria-label="프리셋 이름"
          className="flex-1"
        />
        <ToolButton type="submit" variant="primary" className="px-3">
          저장
        </ToolButton>
      </form>

      <AnimatedList
        className="mt-2"
        items={presets}
        getKey={(p) => p.id}
        render={(p) => (
          <div className="flex gap-1 pb-2">
            <ToolButton onClick={() => onApply(p)} className="flex-1 justify-start px-2">
              <span className="truncate">{p.name}</span>
            </ToolButton>
            <ToolIconButton onClick={() => remove(p.id)} aria-label="프리셋 삭제" title="프리셋 삭제">
              <X />
            </ToolIconButton>
          </div>
        )}
      />

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) importFile(file)
          e.target.value = ""
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <ToolButton
          onClick={() =>
            presets.length
              ? downloadJson(presets.map(toStored), "gradient-orb-presets.json")
              : onMessage("내보낼 프리셋이 없습니다. 먼저 저장해 주세요.")
          }
        >
          <Download /> 내보내기
        </ToolButton>
        <ToolButton onClick={() => fileRef.current?.click()}>
          <Upload /> 불러오기
        </ToolButton>
      </div>
    </div>
  )
}
