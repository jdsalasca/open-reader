import type { ReactNode } from 'react'

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="seg" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={option.value === value ? 'is-on' : ''}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix: string
  onChange: (value: number) => void
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        <b>{`${value}${suffix}`}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  hint?: ReactNode
}) {
  return (
    <>
      <label className="field field--row">
        <span className="field__label">{label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          className={`switch${checked ? ' is-on' : ''}`}
          onClick={() => onChange(!checked)}
        >
          <span />
        </button>
      </label>
      {hint && <p className="panel__hint">{hint}</p>}
    </>
  )
}
