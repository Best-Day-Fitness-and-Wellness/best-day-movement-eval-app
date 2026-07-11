import { useTheme } from '../ThemeContext'

export default function YesNo({ value, onChange, label = 'Answer' }) {
  const { C } = useTheme()
  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {['Y', 'N'].map(v => (
        <button key={v} onClick={() => onChange(v)} aria-label={`${label}: ${v === 'Y' ? 'Yes' : 'No'}`}
          aria-pressed={value === v} style={{
          padding: '10px 18px', borderRadius: 8, cursor: 'pointer',
          fontWeight: 700, fontSize: 15,
          border: value === v ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
          background: value === v ? C.accentDim : 'transparent',
          color: value === v ? C.accent : C.dim,
          minHeight: 44, minWidth: 48,
        }}>
          {v}
        </button>
      ))}
    </div>
  )
}
