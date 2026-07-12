import { useTheme } from '../ThemeContext'

export default function YesNo({ value, onChange, label = 'Answer', large = false }) {
  const { C } = useTheme()
  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {['Y', 'N'].map(v => (
        <button key={v} onClick={() => onChange(v)} aria-label={`${label}: ${v === 'Y' ? 'Yes' : 'No'}`}
          aria-pressed={value === v} style={{
          padding: large ? '14px 28px' : '10px 18px', borderRadius: 8, cursor: 'pointer',
          fontWeight: 700, fontSize: large ? 18 : 15,
          border: value === v ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
          background: value === v ? C.accentDim : 'transparent',
          color: value === v ? C.accent : C.dim,
          minHeight: large ? 56 : 44, minWidth: large ? 88 : 48,
        }}>
          {v}
        </button>
      ))}
    </div>
  )
}
