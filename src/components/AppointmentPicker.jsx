import { useTheme } from '../ThemeContext'
import Section from './Section'

function formatTime(value) {
  if (!value) return 'Time not provided'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function AppointmentPicker({
  date,
  appointments,
  loading,
  status,
  onDateChange,
  onRefresh,
  onSelect,
  onManualEntry,
  draftAvailable,
  onResumeDraft,
}) {
  const { C } = useTheme()
  const button = {
    minHeight: 48,
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.cardAlt,
    color: C.text,
    cursor: 'pointer',
  }

  return (
    <Section icon="📅" title="Today’s Movement Evaluations">
      <div style={{ color: C.dim, fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
        Choose the scheduled client to prefill their information. You will enter age, sex, and any notes on the next screen.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <input aria-label="Appointment date" type="date" value={date} onChange={e => onDateChange(e.target.value)}
          style={{ ...button, padding: '8px 10px', fontSize: 14 }} />
        <button type="button" onClick={onRefresh} disabled={loading} style={{ ...button, padding: '8px 14px', fontWeight: 800 }}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {status && <div role="status" style={{ color: C.dim, fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>{status}</div>}
      {!loading && appointments.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {appointments.map(appointment => (
            <button key={appointment.eventId} type="button" onClick={() => onSelect(appointment)} style={{ ...button, padding: '12px 14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                <strong style={{ color: C.accent, fontSize: 15 }}>{formatTime(appointment.startTime)}</strong>
                <span style={{ fontWeight: 800 }}>{appointment.clientName || 'Client name unavailable'}</span>
              </div>
              <div style={{ color: C.dim, fontSize: 12, marginTop: 5 }}>
                {appointment.trainerName || 'Trainer not provided'}
                {appointment.email ? ` · ${appointment.email}` : ''}
              </div>
            </button>
          ))}
        </div>
      )}
      {!loading && appointments.length === 0 && !status && (
        <div style={{ color: C.dim, fontSize: 13, padding: '12px 0' }}>
          No Movement Evaluation appointments were found for this date.
        </div>
      )}
      <button type="button" onClick={onManualEntry} style={{ ...button, width: '100%', marginTop: 14, padding: '10px 14px', fontWeight: 800 }}>
        Enter client manually
      </button>
      {draftAvailable && <button type="button" onClick={onResumeDraft} style={{ ...button, width: '100%', marginTop: 8, padding: '10px 14px', fontWeight: 800 }}>
        Resume saved draft
      </button>}
    </Section>
  )
}
