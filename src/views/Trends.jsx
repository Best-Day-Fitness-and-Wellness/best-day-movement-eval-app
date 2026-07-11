import { useTheme } from '../ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function numberOrNull(value) {
  const number = parseFloat(value)
  return Number.isFinite(number) ? number : null
}

function bestOneLeg(results) {
  const values = [numberOrNull(results?.oR), numberOrNull(results?.oL)].filter(value => value !== null)
  return values.length > 0 ? Math.max(...values) : null
}

export default function Trends({ trendClient, trendSessions, onBack, onNewAssessment }) {
  const { C } = useTheme()
  const btn = (background, color) => ({
    padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontWeight: 800, fontSize: 14, background, color, minHeight: 48,
  })
  const charts = [
    {
      title: 'TUG (seconds)', key: 'tug', color: C.accent,
      data: trendSessions.map(s => ({ date: s.date || '', value: numberOrNull(s.results?.tug) })).filter(d => d.value !== null),
    },
    {
      title: '2-Min Steps', key: 'st', color: C.green,
      data: trendSessions.map(s => ({ date: s.date || '', value: numberOrNull(s.results?.st) })).filter(d => d.value !== null),
    },
    {
      title: 'Sit to Stand (30s)', key: 'sts', color: '#eab308',
      data: trendSessions.map(s => ({ date: s.date || '', value: numberOrNull(s.results?.sts) })).filter(d => d.value !== null),
    },
    {
      title: 'One Leg Stand (best)', key: 'oL', color: '#f97316',
      data: trendSessions.map(s => ({ date: s.date || '', value: bestOneLeg(s.results) })).filter(d => d.value !== null),
    },
    {
      title: 'Total Points', key: 'points', color: C.accent,
      data: trendSessions.map(s => ({ date: s.date || '', value: numberOrNull(s.points) })).filter(d => d.value !== null),
    },
  ]

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', padding: '20px 12px 80px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: C.accent, letterSpacing: 2, margin: 0 }}>
              TRENDS
            </h1>
            <div style={{ fontSize: 13, color: C.dim, marginTop: 2 }}>
              {trendClient} &mdash; {trendSessions.length} session{trendSessions.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ThemeToggle />
            <button onClick={onBack} style={{ ...btn('transparent', C.accent), border: `1px solid ${C.accent}`, padding: '8px 14px', fontSize: 12 }}>
              Back
            </button>
          </div>
        </div>

        {charts.map(chart => (
          <div key={chart.key} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: 16, marginBottom: 14,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>
              {chart.title}
            </div>
            {chart.data.length < 2 ? (
              <div style={{ fontSize: 12, color: C.muted, padding: '20px 0', textAlign: 'center' }}>
                Need at least 2 data points to show trend
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chart.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted }} stroke={C.border} />
                  <YAxis tick={{ fontSize: 10, fill: C.muted }} stroke={C.border} width={40} />
                  <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text }} />
                  <Line type="monotone" dataKey="value" stroke={chart.color} strokeWidth={2} dot={{ r: 4, fill: chart.color }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        ))}

        <button onClick={onNewAssessment} style={{ ...btn(C.green, '#fff'), width: '100%', marginTop: 8 }}>
          + New Assessment
        </button>
      </div>
    </div>
  )
}
