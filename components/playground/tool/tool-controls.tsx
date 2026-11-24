"use client"

import { Fragment, type ReactNode } from "react"

import type { ControlsApi } from "@/components/playground/controls/use-controls"
import type { Control, ControlSchema } from "@/components/playground/controls/schema"
import { ToolChoice, ToolColor, ToolSwitch } from "./tool-inputs"
import { ToolPair, ToolSection } from "./tool-primitives"
import { ToolNumberField } from "./tool-slider"

type Props<S extends ControlSchema> = {
  controls: ControlsApi<S>
  /** Extra sections above the schema's (wrap content in `ToolSection`). */
  before?: ReactNode
  /** Extra sections below the schema's (presets, export options…). */
  after?: ReactNode
  /** Extra content at the top of a group's section, keyed by group name. */
  slots?: Record<string, ReactNode>
  /** Groups collapsed on the first visit. */
  closed?: readonly string[]
  /** Section title for controls without a `group`. */
  defaultGroup?: string
}

/**
 * Renders a control schema as the tool panel's sections: one collapsible
 * section per `group`, each with its own reset. Consecutive colours pair up
 * in two columns.
 */
export function ToolControls<S extends ControlSchema>({ controls, before, after, slots, closed = [], defaultGroup = "Settings" }: Props<S>) {
  const { schema, values, set, replace } = controls
  const entries = Object.entries(schema) as [keyof S & string, Control][]
  const groups = [...new Set(entries.map(([, c]) => c.group ?? defaultGroup))]

  const field = (key: keyof S & string, c: Control) => {
    const v = values[key]
    const onChange = (next: unknown) => set(key, next as never)
    switch (c.type) {
      case "number":
        return (
          <ToolNumberField
            key={key}
            label={c.label}
            value={v as number}
            min={c.min}
            max={c.max}
            step={c.step}
            defaultValue={c.default}
            onChange={onChange}
          />
        )
      case "boolean":
        return <ToolSwitch key={key} label={c.label} checked={v as boolean} onChange={onChange} />
      case "select":
        return <ToolChoice key={key} label={c.label} options={c.options} value={v as string} onChange={onChange} />
      case "color":
        return <ToolColor key={key} label={c.label} value={v as string} onChange={onChange} />
    }
  }

  return (
    <>
      {before}
      {groups.map((group) => {
        const members = entries.filter(([, c]) => (c.group ?? defaultGroup) === group)
        const keys = members.map(([k]) => k)
        const changed = keys.some((k) => !Object.is(values[k], schema[k].default))
        const rows: ReactNode[] = []
        for (let i = 0; i < members.length; i++) {
          const [key, c] = members[i]
          const next = members[i + 1]
          if (c.type === "color") {
            const pairWith = next?.[1].type === "color" ? next : undefined
            if (pairWith) i++
            rows.push(
              <ToolPair key={key}>
                {field(key, c)}
                {pairWith && field(pairWith[0], pairWith[1])}
              </ToolPair>
            )
          } else rows.push(field(key, c))
        }
        return (
          <ToolSection
            key={group}
            id={`group:${group}`}
            title={group}
            defaultOpen={!closed.includes(group)}
            changed={changed}
            onReset={() => replace(Object.fromEntries(keys.map((k) => [k, schema[k].default])) as never)}
          >
            {slots?.[group] && <Fragment>{slots[group]}</Fragment>}
            {rows}
          </ToolSection>
        )
      })}
      {after}
    </>
  )
}
