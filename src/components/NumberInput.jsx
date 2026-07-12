import { useTheme } from '../ThemeContext'

export default function NumberInput({ value, onChange, unit, w, min = 0, max, step = 'any', ariaLabel }) {
  const { C } = useTheme()
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="—"
        style={{
          width: w || 75, padding: '10px 8px', borderRadius: 8,
          border: `1px solid ${C.border}`, background: C.bg, color: C.text,
          fontSize: 16, fontWeight: 600, fontFamily: 'monospace', textAlign: 'center',
          minHeight: 44,
        }}
      />
      {unit && <span style={{ fontSize: 12, color: C.muted }}>{unit}</span>}
    </div>
  )
}
