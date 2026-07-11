import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../ThemeContext'

export default function Timer({ onCapture, countFrom }) {
  const { C } = useTheme()
  const [ms, setMs] = useState(countFrom ? countFrom * 1000 : 0)
  const [running, setRunning] = useState(false)
  const iv = useRef(null)
  const t0 = useRef(null)
  const isCountdown = !!countFrom

  useEffect(() => {
    if (running) {
      t0.current = Date.now() - (isCountdown ? countFrom * 1000 - ms : ms)
      iv.current = setInterval(() => {
        const elapsed = Date.now() - t0.current
        if (isCountdown) {
          const remaining = Math.max(0, countFrom * 1000 - elapsed)
          setMs(remaining)
          if (remaining <= 0) { clearInterval(iv.current); setRunning(false) }
        } else {
          setMs(elapsed)
        }
      }, 50)
    }
    return () => clearInterval(iv.current)
  }, [running])

  const sec = (ms / 1000).toFixed(1)
  const capturedSec = (isCountdown ? (countFrom * 1000 - ms) / 1000 : ms / 1000).toFixed(1)
  const hasElapsed = isCountdown ? ms < countFrom * 1000 : ms > 0
  const min = Math.floor(ms / 60000)
  const remSec = ((ms % 60000) / 1000).toFixed(1)
  const display = ms >= 60000 ? `${min}:${remSec.padStart(4, '0')}` : sec

  const reset = () => {
    clearInterval(iv.current)
    setRunning(false)
    setMs(isCountdown ? countFrom * 1000 : 0)
  }

  const toggleRun = () => {
    if (running) {
      clearInterval(iv.current)
      setRunning(false)
    } else {
      if (!isCountdown || ms > 0) {
        if (!isCountdown) { setMs(0); t0.current = Date.now() }
        else { t0.current = Date.now() - (countFrom * 1000 - ms) }
        setRunning(true)
      }
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
      <div aria-live="off" style={{
        fontFamily: 'monospace', fontSize: 28, fontWeight: 800, minWidth: 110,
        textAlign: 'center', color: running ? C.accent : C.dim,
        textShadow: running ? `0 0 16px ${C.accentDim}` : 'none',
      }}>
        {display}<span style={{ fontSize: 13, fontWeight: 400 }}>s</span>
      </div>
      <button onClick={toggleRun} style={{
        padding: '10px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
        fontWeight: 800, fontSize: 13,
        background: running ? C.red : C.green, color: '#fff',
        minHeight: 44, minWidth: 88,
      }}>
        {running ? '■ STOP' : '▶ START'}
      </button>
      {!running && hasElapsed && onCapture && (
        <button onClick={() => onCapture(capturedSec)} style={{
          padding: '10px 14px', borderRadius: 8,
          border: `1px solid ${C.accent}`,
          background: 'transparent', color: C.accent,
          cursor: 'pointer', fontWeight: 700, fontSize: 13,
          minHeight: 44,
        }}>
          Use {capturedSec}s
        </button>
      )}
      <button onClick={reset} style={{
        padding: '8px 12px', borderRadius: 8,
        border: `1px solid ${C.border}`,
        background: 'transparent', color: C.muted,
        cursor: 'pointer', fontSize: 16, minHeight: 44, minWidth: 44,
      }}>
        ↺
      </button>
    </div>
  )
}
