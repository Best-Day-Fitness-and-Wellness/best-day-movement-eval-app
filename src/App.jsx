import { lazy, Suspense, useState, useEffect, useMemo } from 'react'
import { ThemeProvider, useTheme } from './ThemeContext'
import Timer from './components/Timer'
import InfoBubble from './components/InfoBubble'
import NumberInput from './components/NumberInput'
import YesNo from './components/YesNo'
import Badge from './components/Badge'
import Section from './components/Section'
import Row from './components/Row'
import BarChart from './components/BarChart'
import ThemeToggle from './components/ThemeToggle'
import { calculatePoints, getRisks, getBarData } from './utils/scoring.js'
import { saveSession, getAllSessions, saveClient } from './db/store.js'
import { validateAssessment } from './utils/validation.js'
import { syncAssessment } from './utils/ghl.js'
import TrainerTips from './views/TrainerTips'

const Trends = lazy(() => import('./views/Trends.jsx'))

const emptyClient = {
  name: '', age: '', sex: 'M', email: '', trainer: '', date: '', notes: '',
}

const emptyResults = {
  na: '', sR: '', sL: '', aV: '', aD: '',
  oR: '', oL: '', vT: '', vN: '',
  tug: '', tE: '', tEC: '', st: '',
  gR: '', gL: '', cR: '', cL: '',
  sts: '', plk: '', cu: '', be: '',
  jmp: '', gnd: '',
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function localDate() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().split('T')[0]
}

/* ───────────────────────── INNER APP ───────────────────────── */

function AppInner() {
  const { C } = useTheme()

  // views: form | results | history | trends
  const [view, setView] = useState('form')
  const [client, setClient] = useState({ ...emptyClient, date: localDate() })
  const [results, setResults] = useState({ ...emptyResults })
  const [sessions, setSessions] = useState([])
  const [consent, setConsent] = useState(false)
  const [trendClient, setTrendClient] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  const [saving, setSaving] = useState(false)

  // Load saved sessions on mount
  useEffect(() => {
    getAllSessions().then(s => setSessions(s || []))
  }, [])

  const setC = (k, v) => {
    setClient(p => ({ ...p, [k]: v }))
    if (formErrors[k]) setFormErrors(p => { const next = { ...p }; delete next[k]; return next })
  }
  const setR = (k, v) => setResults(p => ({ ...p, [k]: v }))

  const pts = useMemo(() => calculatePoints(results, client.age, client.sex), [results, client.age, client.sex])

  /* ──── SAVE ──── */
  async function handleSave() {
    const validation = validateAssessment(client, consent)
    if (!validation.valid) {
      setFormErrors(validation.errors)
      setSaveError('Please fix the highlighted items before saving.')
      return
    }

    setFormErrors({})
    setSaveError('')
    setSaving(true)
    try {
      const clientId = client.id || uid()
      const sessionId = uid()
      const clientData = { ...client, id: clientId }
      const session = {
        id: sessionId,
        clientId,
        clientName: client.name.trim(),
        date: client.date || localDate(),
        client: clientData,
        results: { ...results },
        points: pts,
        consent,
        createdAt: Date.now(),
      }
      await saveClient(clientData)
      await saveSession(session)
      const all = await getAllSessions()
      setSessions(all || [])
      setClient(prev => ({ ...prev, id: clientId }))
      try {
        const sync = await syncAssessment(session)
        setSyncMessage(sync.status === 'synced' ? 'Saved locally and synced to GoHighLevel.' : sync.message || '')
      } catch {
        setSyncMessage('Saved locally, but GoHighLevel sync failed. Check the server setup and try again.')
      }
      setView('results')
    } catch {
      setSaveError('Could not save this assessment. Your data is still on screen; please try again.')
    } finally {
      setSaving(false)
    }
  }

  /* ──── LOAD SESSION ──── */
  function loadSession(s) {
    setClient(s.client || { ...emptyClient })
    setResults(s.results || { ...emptyResults })
    setConsent(Boolean(s.consent))
    setFormErrors({})
    setSaveError('')
    setSyncMessage('')
    setView('form')
  }

  /* ──── NEW ASSESSMENT ──── */
  function newAssessment() {
    setClient({ ...emptyClient, date: localDate() })
    setResults({ ...emptyResults })
    setConsent(false)
    setFormErrors({})
    setSaveError('')
    setSyncMessage('')
    setView('form')
  }

  /* ──── TREND DATA ──── */
  function showTrends(clientName) {
    setTrendClient(clientName)
    setView('trends')
  }

  const trendSessions = useMemo(() => {
    if (!trendClient) return []
    return sessions
      .filter(s => s.clientName === trendClient)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }, [sessions, trendClient])

  // ─── Shared styles ───
  const input = (w) => ({
    width: w || 120, padding: '10px 8px', borderRadius: 8,
    border: `1px solid ${C.border}`, background: C.bg, color: C.text,
    fontSize: 14, minHeight: 44,
  })
  const select = {
    ...input(90), cursor: 'pointer', appearance: 'auto',
  }
  const label = { color: C.dim, fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }
  const btn = (bg, color) => ({
    padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontWeight: 800, fontSize: 14, background: bg, color, minHeight: 48,
  })
  const gridCell = { display: 'flex', flexDirection: 'column' }
  const textarea = {
    ...input('100%'), minHeight: 70, resize: 'vertical', fontFamily: 'inherit',
  }

  /* ══════════════════════════════════════════════════════════════
     FORM VIEW
     ══════════════════════════════════════════════════════════════ */
  if (view === 'form') {
    return (
      <div style={{ background: C.bg, color: C.text, minHeight: '100vh', paddingBottom: 80 }}>
        {/* ──── HEADER ──── */}
        <div style={{ textAlign: 'center', padding: '32px 20px 16px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: 3, color: C.accent, margin: 0 }}>
            BEST DAY FITNESS
          </h1>
          <div style={{ fontSize: 14, color: C.dim, marginTop: 4, fontWeight: 600 }}>
            Senior Movement Assessment
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
            6619 1st Ave South, St. Petersburg, FL
          </div>
        </div>

        {/* ──── STICKY HEADER ──── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: C.stickyBg, backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${C.border}`,
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: C.accent,
              textShadow: `0 0 20px ${C.accentDim}`,
            }}>
              {pts}
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, letterSpacing: 1 }}>POINTS</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { getAllSessions().then(s => { setSessions(s || []); setView('history') }) }}
              style={{ ...btn('transparent', C.accent), border: `1px solid ${C.accent}`, padding: '8px 14px', fontSize: 12 }}>
              History
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ ...btn(C.green, '#fff'), padding: '8px 14px', fontSize: 12 }}>
              {saving ? 'Saving…' : 'Save & Results'}
            </button>
            <ThemeToggle />
          </div>
          </div>

          {saveError && (
            <div role="alert" style={{
              margin: '12px auto 0', maxWidth: 700, padding: '10px 14px',
              borderRadius: 10, background: C.redDim, border: `1px solid ${C.redBdr}`,
              color: C.red, fontSize: 13, lineHeight: 1.5,
            }}>
              <strong>{saveError}</strong>
              {Object.values(formErrors).length > 0 && (
                <ul style={{ margin: '6px 0 0 18px' }}>
                  {Object.values(formErrors).map(error => <li key={error}>{error}</li>)}
                </ul>
              )}
            </div>
          )}

          <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 12px' }}>

          {/* ──── 1. CLIENT INFO ──── */}
          <Section icon="📋" title="Client Information">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              <div style={gridCell}>
                <label htmlFor="client-name" style={label}>Name</label>
                <input id="client-name" value={client.name} onChange={e => setC('name', e.target.value)}
                  style={input('100%')} placeholder="Full name" aria-invalid={Boolean(formErrors.name)} />
              </div>
              <div style={gridCell}>
                <label htmlFor="client-age" style={label}>Age</label>
                <input type="number" inputMode="numeric" value={client.age}
                  id="client-age" min="60" max="120" step="1"
                  onChange={e => setC('age', e.target.value)} style={input('100%')} placeholder="65"
                  aria-invalid={Boolean(formErrors.age)} />
              </div>
              <div style={gridCell}>
                <label htmlFor="client-sex" style={label}>Sex</label>
                <select id="client-sex" value={client.sex} onChange={e => setC('sex', e.target.value)} style={select}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div style={gridCell}>
                <label htmlFor="client-trainer" style={label}>Trainer</label>
                <input id="client-trainer" value={client.trainer} onChange={e => setC('trainer', e.target.value)}
                  style={input('100%')} placeholder="Trainer" />
              </div>
              <div style={gridCell}>
                <label htmlFor="client-date" style={label}>Date</label>
                <input id="client-date" type="date" value={client.date} onChange={e => setC('date', e.target.value)}
                  style={input('100%')} />
              </div>
              <div style={gridCell}>
                <label htmlFor="client-email" style={label}>Email</label>
                <input id="client-email" type="email" value={client.email} onChange={e => setC('email', e.target.value)}
                  style={input('100%')} placeholder="email@example.com" />
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <label htmlFor="client-notes" style={label}>Notes</label>
              <textarea id="client-notes" value={client.notes} onChange={e => setC('notes', e.target.value)}
                style={textarea} placeholder="Observations, medical history, medications..." />
            </div>
          </Section>

          {/* ──── 2. POSTURE ──── */}
          <Section icon="🦻" title="Posture">
            <Row label="Neck Angle (cm)" info="posture">
              <NumberInput value={results.na} onChange={v => setR('na', v)} unit="cm" max={50} step={0.1} ariaLabel="Neck angle in centimeters" />
              <Badge
                level={results.na === '' ? 'none' : parseFloat(results.na) <= 4 ? 'safe' : 'risk'}
                label={results.na !== '' ? (parseFloat(results.na) <= 4 ? 'NORMAL' : 'AT RISK') : undefined}
              />
            </Row>
          </Section>

          {/* ──── 3. FLEXIBILITY ──── */}
          <Section icon="🤸" title="Flexibility">
            <Row label="Back Scratch R" info="backScratch">
              <NumberInput value={results.sR} onChange={v => setR('sR', v)} unit="in" max={20} step={0.1} ariaLabel="Back scratch right gap in inches" />
            </Row>
            <Row label="Back Scratch L">
              <NumberInput value={results.sL} onChange={v => setR('sL', v)} unit="in" max={20} step={0.1} ariaLabel="Back scratch left gap in inches" />
            </Row>
            <Row label="Ankle Dorsi Vertical?" info="ankleDorsi">
              <YesNo value={results.aV} onChange={v => setR('aV', v)} label="Ankle dorsiflexion vertical" />
            </Row>
            {results.aV === 'N' && (
              <Row label="Dorsi Degrees">
                <NumberInput value={results.aD} onChange={v => setR('aD', v)} unit="°" max={90} step={1} ariaLabel="Ankle dorsiflexion degrees" />
                <Badge
                  level={results.aD === '' ? 'none' : parseFloat(results.aD) >= 8 ? 'safe' : 'risk'}
                />
              </Row>
            )}
          </Section>

          {/* ──── 4. STATIC BALANCE ──── */}
          <Section icon="🧘" title="Static Balance">
            <Row label="One Leg Stand R" info="oneLeg">
              <NumberInput value={results.oR} onChange={v => setR('oR', v)} unit="s" max={600} step={0.1} ariaLabel="Right one-leg stand seconds" />
              <Timer onCapture={v => setR('oR', v)} />
            </Row>
            <Row label="One Leg Stand L">
              <NumberInput value={results.oL} onChange={v => setR('oL', v)} unit="s" max={600} step={0.1} ariaLabel="Left one-leg stand seconds" />
              <Timer onCapture={v => setR('oL', v)} />
            </Row>
            <Row label="Vestibular Turns Dizzy?" info="vestibular">
              <YesNo value={results.vT} onChange={v => setR('vT', v)} label="Vestibular turns dizziness" />
              <Badge level={results.vT === 'Y' ? 'risk' : results.vT === 'N' ? 'safe' : 'none'} />
            </Row>
            <Row label="Vestibular Nods Dizzy?">
              <YesNo value={results.vN} onChange={v => setR('vN', v)} label="Vestibular nods dizziness" />
              <Badge level={results.vN === 'Y' ? 'risk' : results.vN === 'N' ? 'safe' : 'none'} />
            </Row>
          </Section>

          {/* ──── 5. DYNAMIC BALANCE ──── */}
          <Section icon="🚶" title="Dynamic Balance">
            <Row label="TUG (seconds)" info="tug">
              <NumberInput value={results.tug} onChange={v => setR('tug', v)} unit="s" max={600} step={0.1} ariaLabel="Timed Up and Go seconds" />
              <Timer onCapture={v => setR('tug', v)} />
            </Row>
            {results.tug && (
              <div style={{ marginLeft: 152, marginBottom: 12 }}>
                <Badge
                  level={parseFloat(results.tug) >= 14 ? 'risk' : 'safe'}
                  label={parseFloat(results.tug) >= 14 ? 'FALL RISK 14s+' : parseFloat(results.tug) > 9 ? 'DISABILITY RISK >9s' : 'NORMAL'}
                />
              </div>
            )}
            <Row label="Tandem Walk Errors" info="tandem">
              <NumberInput value={results.tE} onChange={v => setR('tE', v)} unit="errors" max={100} step={1} ariaLabel="Tandem walk errors" />
              {results.tE !== '' && (
                <Badge level={parseFloat(results.tE) > 2 ? 'risk' : 'safe'} />
              )}
            </Row>
            <Row label="Eyes Closed 5+ steps?">
              <YesNo value={results.tEC} onChange={v => setR('tEC', v)} label="Eyes closed five or more steps" />
            </Row>
          </Section>

          {/* ──── 6. ENDURANCE ──── */}
          <Section icon="❤️" title="Endurance">
            <Row label="2-Min Step Test" info="step">
              <NumberInput value={results.st} onChange={v => setR('st', v)} unit="steps" w={90} max={500} step={1} ariaLabel="Two-minute step count" />
            </Row>
            <div style={{ marginTop: 8 }}>
              <Timer countFrom={120} />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                 Use the timer for 120 seconds, then enter the total step count.
              </div>
            </div>
          </Section>

          {/* ──── 7. STRENGTH ──── */}
          <Section icon="💪" title="Strength">
            <Row label="Grip R (lbs)" info="grip">
              <NumberInput value={results.gR} onChange={v => setR('gR', v)} unit="lbs" max={200} step={0.1} ariaLabel="Right grip strength in pounds" />
            </Row>
            <Row label="Grip L (lbs)">
              <NumberInput value={results.gL} onChange={v => setR('gL', v)} unit="lbs" max={200} step={0.1} ariaLabel="Left grip strength in pounds" />
            </Row>
            <Row label="Calf Raises R" info="calf">
              <NumberInput value={results.cR} onChange={v => setR('cR', v)} unit="reps" max={100} step={1} ariaLabel="Right calf raise repetitions" />
              {results.cR !== '' && (
                <Badge level={parseFloat(results.cR) >= 25 ? 'safe' : 'risk'} />
              )}
            </Row>
            <Row label="Calf Raises L">
              <NumberInput value={results.cL} onChange={v => setR('cL', v)} unit="reps" max={100} step={1} ariaLabel="Left calf raise repetitions" />
              {results.cL !== '' && (
                <Badge level={parseFloat(results.cL) >= 25 ? 'safe' : 'risk'} />
              )}
            </Row>
          </Section>

          {/* ──── 8. FUNCTION ──── */}
          <Section icon="🪑" title="Function">
            <Row label="Sit to Stand (30s)" info="sts">
              <NumberInput value={results.sts} onChange={v => setR('sts', v)} unit="reps" max={100} step={1} ariaLabel="Thirty-second sit-to-stand repetitions" />
            </Row>
            <div style={{ marginTop: 8 }}>
              <Timer countFrom={30} />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                 Use the timer for 30 seconds, then enter the total repetition count.
              </div>
            </div>
          </Section>

          {/* ──── 9. CORE ──── */}
          <Section icon="🏋️" title="Core">
            <Row label="Plank (pass 73s?)" info="plank">
              <YesNo value={results.plk} onChange={v => setR('plk', v)} label="Plank passed" />
              <Timer />
            </Row>
            <Row label="Curl Up (seconds)">
              <NumberInput value={results.cu} onChange={v => setR('cu', v)} unit="s" max={600} step={0.1} ariaLabel="Curl-up seconds" />
              <Timer onCapture={v => setR('cu', v)} />
            </Row>
            <Row label="Back Extension (seconds)" info="backExt">
              <NumberInput value={results.be} onChange={v => setR('be', v)} unit="s" max={600} step={0.1} ariaLabel="Back extension seconds" />
              <Timer onCapture={v => setR('be', v)} />
            </Row>
          </Section>

          {/* ──── 10. BONUS ──── */}
          <Section icon="⭐" title="Bonus">
            <Row label="Can Jump?" info="jump">
              <YesNo value={results.jmp} onChange={v => setR('jmp', v)} label="Can jump" />
            </Row>
            <Row label="Get on Ground & Up?" info="ground">
              <YesNo value={results.gnd} onChange={v => setR('gnd', v)} label="Can get on ground and up" />
            </Row>
          </Section>

          {/* ──── 11. CONSENT ──── */}
          <Section icon="✍️" title="Consent">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
              <input id="consent" type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); if (e.target.checked) setFormErrors(p => { const next = { ...p }; delete next.consent; return next }) }}
                style={{ marginTop: 4, width: 20, height: 20, cursor: 'pointer' }} aria-invalid={Boolean(formErrors.consent)} />
              <label htmlFor="consent" style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                I consent to this assessment and understand the results will be used to create
                a personalized training program. I acknowledge that this is a fitness assessment,
                not a medical evaluation.
              </label>
            </div>
          </Section>

          {/* ──── BIG SAVE BUTTON ──── */}
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '18px 0', borderRadius: 14,
            border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 18,
            letterSpacing: 1, background: `linear-gradient(135deg, ${C.accent}, ${C.green})`,
            color: '#fff', marginTop: 8, minHeight: 56,
            boxShadow: `0 4px 24px ${C.accentDim}`,
          }}>
            {saving ? 'SAVING…' : 'SAVE ASSESSMENT & VIEW RESULTS'}
          </button>
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════════════
     RESULTS VIEW
     ══════════════════════════════════════════════════════════════ */
  if (view === 'results') {
    const risks = getRisks(results, client.age, client.sex)
    const bars = getBarData(results, client.age, client.sex)
    const riskCount = risks.filter(r => r.level === 'risk').length
    const safeCount = risks.filter(r => r.level === 'safe').length

    return (
      <div style={{ background: C.bg, color: C.text, minHeight: '100vh', padding: '20px 12px 80px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* Score Summary */}
          <div style={{
            textAlign: 'center', padding: 32, borderRadius: 20,
            background: C.card, border: `1px solid ${C.border}`, marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: C.dim, fontWeight: 700, marginBottom: 8 }}>
              ASSESSMENT RESULTS
            </div>
            <div style={{ fontSize: 13, color: C.dim, marginBottom: 4 }}>
              {client.name || 'Client'} {client.age ? `| Age ${client.age}` : ''} | {client.date}
            </div>
            <div style={{
              fontSize: 72, fontWeight: 900, fontFamily: 'monospace', color: C.accent,
              textShadow: `0 0 40px ${C.accentDim}`,
              lineHeight: 1, margin: '16px 0 4px',
            }}>
              {pts}
            </div>
            <div style={{ fontSize: 14, color: C.dim, fontWeight: 600 }}>
              points earned
            </div>
          </div>

          {syncMessage && (
            <div role="status" style={{
              marginBottom: 20, padding: '10px 14px', borderRadius: 10,
              background: C.card, border: `1px solid ${C.border}`,
              color: C.dim, fontSize: 13,
            }}>
              {syncMessage}
            </div>
          )}

          {/* Performance Bars */}
          <Section icon="📊" title="Performance Summary">
            <BarChart items={bars} />
          </Section>

          {/* Risk Summary */}
          <Section icon="⚠️" title="Risk Assessment">
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{
                flex: 1, textAlign: 'center', padding: 12, borderRadius: 12,
                background: C.redDim, border: `1px solid ${C.redBdr}`,
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.red }}>{riskCount}</div>
                <div style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>RISK FLAGS</div>
              </div>
              <div style={{
                flex: 1, textAlign: 'center', padding: 12, borderRadius: 12,
                background: C.greenDim, border: `1px solid ${C.greenBdr}`,
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.green }}>{safeCount}</div>
                <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>PASSED</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {risks.map((r, i) => (
                <Badge key={i} level={r.level} label={r.label} />
              ))}
            </div>
          </Section>

          {/* Trainer Tips */}
          <Section icon="💡" title="Trainer Tips">
            <TrainerTips />
          </Section>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={() => setView('form')}
              style={{ ...btn('transparent', C.accent), flex: 1, border: `1px solid ${C.accent}` }}>
              Edit Assessment
            </button>
            <button onClick={() => { getAllSessions().then(s => { setSessions(s || []); setView('history') }) }}
              style={{ ...btn(C.accent, '#fff'), flex: 1 }}>
              View History
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════════════
     HISTORY VIEW
     ══════════════════════════════════════════════════════════════ */
  if (view === 'history') {
    const sorted = [...sessions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    const clientNames = [...new Set(sessions.map(s => s.clientName).filter(Boolean))]

    return (
      <div style={{ background: C.bg, color: C.text, minHeight: '100vh', padding: '20px 12px 80px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: C.accent, letterSpacing: 2 }}>
              ASSESSMENT HISTORY
            </h1>
            <div style={{ display: 'flex', gap: 8 }}>
              <ThemeToggle />
              <button onClick={newAssessment} style={btn(C.green, '#fff')}>
                + New Assessment
              </button>
            </div>
          </div>

          {/* Trend buttons per client */}
          {clientNames.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.dim, fontWeight: 600, marginBottom: 6 }}>
                VIEW TRENDS
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {clientNames.map(name => (
                  <button key={name} onClick={() => showTrends(name)}
                    style={{
                      padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${C.accent}`, background: 'transparent',
                      color: C.accent, fontSize: 12, fontWeight: 600,
                    }}>
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sorted.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 40, color: C.muted,
              borderRadius: 16, background: C.card, border: `1px solid ${C.border}`,
            }}>
              No saved assessments yet. Start a new assessment above.
            </div>
          ) : (
            sorted.map(s => (
              <div key={s.id} onClick={() => loadSession(s)} style={{
                padding: 16, borderRadius: 14, marginBottom: 10, cursor: 'pointer',
                background: C.card, border: `1px solid ${C.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'border-color 0.2s',
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                    {s.clientName || 'Unknown'}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {s.date || 'No date'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 24, fontWeight: 900, fontFamily: 'monospace', color: C.accent,
                  }}>
                    {s.points ?? '?'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  if (view === 'trends') {
    return (
      <Suspense fallback={<div style={{ padding: 24, color: C.dim }}>Loading trends…</div>}>
        <Trends
          trendClient={trendClient}
          trendSessions={trendSessions}
          onBack={() => setView('history')}
          onNewAssessment={newAssessment}
        />
      </Suspense>
    )
  }

  return null
}

/* ───────────────────────── ROOT WRAPPER ───────────────────────── */

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
