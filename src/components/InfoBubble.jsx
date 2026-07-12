import { useState } from 'react'
import { useTheme } from '../ThemeContext'
import { PROTOCOLS } from '../data/protocols'

export default function InfoBubble({ id }) {
  const { C } = useTheme()
  const [open, setOpen] = useState(false)
  const d = PROTOCOLS[id]
  if (!d) return null

  const fields = [
    { label: 'HOW TO TEST', value: d.howToTest, color: C.accent },
    { label: 'EQUIPMENT', value: d.equipment, color: C.dim },
    { label: 'REFERENCE STANDARD', value: d.standard, color: C.yellow },
    { label: 'COMMON ERRORS', value: d.errors, color: '#fb923c' },
    { label: 'CLINICAL SIGNIFICANCE', value: d.significance, color: C.red },
  ]

  return (
    <div style={{ marginTop: 6 }}>
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={`info-${id}`} style={{
        background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6,
        color: C.accent, cursor: 'pointer', fontSize: 12, padding: '4px 12px',
        display: 'flex', alignItems: 'center', gap: 4, opacity: 0.8,
         minHeight: 44,
       }}>
        {open ? '▾ Hide' : '▸ Protocol & Info'}
      </button>
      {open && (
        <div id={`info-${id}`} style={{
          marginTop: 8, padding: 16, borderRadius: 12,
          background: C.cardAlt, border: `1px solid ${C.border}`,
          fontSize: 13, lineHeight: 1.7,
        }}>
          <h4 style={{ margin: '0 0 10px', color: C.accent, fontSize: 14 }}>{d.title}</h4>
          {fields.map((f, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
                color: f.color, marginBottom: 2,
              }}>{f.label}</div>
              <div style={{ color: C.text, whiteSpace: 'pre-line' }}>{f.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
