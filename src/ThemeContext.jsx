import { createContext, useContext, useState, useEffect } from 'react'

const dark = {
  bg: '#05058a', card: '#07076f', cardAlt: '#0c148f',
  border: '#27378f', accent: '#53d6ff', accentDim: '#153b8e',
  orange: '#ff9d00', orangeDim: '#4a2d00', orangeBdr: '#d97706',
  green: '#22c55e', greenDim: '#052e16', greenBdr: '#15803d',
  red: '#ef4444', redDim: '#2a0a0a', redBdr: '#b91c1c',
  yellow: '#eab308', yellowDim: '#1a1500',
  text: '#f8fafc', dim: '#cbd5e1', muted: '#91a4cf', white: '#ffffff',
  stickyBg: 'rgba(3,3,95,0.96)',
}

const light = {
  bg: '#f8fbff', card: '#ffffff', cardAlt: '#eef5ff',
  border: '#cbd5e1', accent: '#05058a', accentDim: '#dbeafe',
  orange: '#f59e0b', orangeDim: '#fff4d6', orangeBdr: '#d97706',
  green: '#16a34a', greenDim: '#dcfce7', greenBdr: '#86efac',
  red: '#dc2626', redDim: '#fef2f2', redBdr: '#fca5a5',
  yellow: '#ca8a04', yellowDim: '#fefce8',
  text: '#1e293b', dim: '#64748b', muted: '#94a3b8', white: '#ffffff',
  stickyBg: 'rgba(255,255,255,0.96)',
}

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('bd-theme') || 'dark' } catch { return 'dark' }
  })

  useEffect(() => {
    try { localStorage.setItem('bd-theme', mode) } catch {}
  }, [mode])

  const toggle = () => setMode(m => m === 'dark' ? 'light' : 'dark')
  const C = mode === 'dark' ? dark : light

  return (
    <ThemeContext.Provider value={{ C, mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
