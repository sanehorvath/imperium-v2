import React, { createContext, useContext, useState, useEffect } from 'react'
import { THEMES, setTheme, C } from './design'

const ThemeContext = createContext(null)
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('imperium-theme') || 'dark')

  useEffect(() => {
    setTheme(mode)
    localStorage.setItem('imperium-theme', mode)
    // Apply CSS vars to document root for inputs etc
    const root = document.documentElement
    const t = THEMES[mode]
    root.style.setProperty('--bg', t.bg)
    root.style.setProperty('--surface', t.surface)
    root.style.setProperty('--surface2', t.surface2)
    root.style.setProperty('--border', t.border)
    root.style.setProperty('--text', t.text)
    root.style.setProperty('--sub', t.sub)
    root.style.setProperty('--accent', t.accent)
    root.style.setProperty('--accent-dim', t.accentDim)
  }, [mode])

  function toggle() {
    setMode(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ mode, toggle, isDark: mode === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}
