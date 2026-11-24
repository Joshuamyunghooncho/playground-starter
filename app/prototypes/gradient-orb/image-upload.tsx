"use client"

import { ImageUp, X } from "lucide-react"
import { useRef } from "react"

import { ToolButton, ToolIconButton } from "@/components/playground/tool"
import type { UploadedImage } from "./types"

type Props = {
  image: UploadedImage | null
  onChange: (image: UploadedImage | null) => void
  onError: (message: string) => void
}

/** Image is kept in memory only (never uploaded or stored). */
export function ImageUpload({ image, onChange, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function load(file: File) {
    const url = URL.createObjectURL(file)
    const el = new Image()
    el.onload = () => {
      URL.revokeObjectURL(url)
      onChange({ element: el, name: file.name })
    }
    el.onerror = () => {
      URL.revokeObjectURL(url)
      onError("이미지를 읽을 수 없습니다.")
    }
    el.src = url
  }

  return (
    <div className="flex gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) load(file)
          e.target.value = ""
        }}
      />
      <ToolButton onClick={() => inputRef.current?.click()} className="flex-1" title={image?.name}>
        <ImageUp /> <span className="truncate">{image ? image.name : "이미지 업로드"}</span>
      </ToolButton>
      {image && (
        <ToolIconButton onClick={() => onChange(null)} aria-label="이미지 제거" title="이미지 제거">
          <X />
        </ToolIconButton>
      )}
    </div>
  )
}
