import React, { createContext, useContext, useState, useEffect } from 'react'
import { THEMES, setTheme } from './design'

const ThemeContext = createContext(null)
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('imperium-theme') || 'dark')

  useEffect(() => {
    setTheme(mode)
    localStorage.setItem('imperium-theme', mode)
    const root = document.documentElement
    const t = THEMES[mode]
    Object.entries({
      '--bg':t.bg,'--surface':t.surface,'--surface2':t.surface2,
      '--border':t.border,'--text':t.text,'--sub':t.sub,
      '--accent':t.accent,'--accent-dim':t.accentDim,
    }).forEach(([k,v]) => root.style.setProperty(k,v))
  }, [mode])

  const toggle = () => setMode(p => p === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ mode, toggle, isDark: mode === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}
