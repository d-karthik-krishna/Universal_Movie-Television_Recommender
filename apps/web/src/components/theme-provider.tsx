'use client'

import * as React from 'react'

const ThemeContext = React.createContext<{ theme: string; setTheme: (t: string) => void }>({
  theme: 'dark',
  setTheme: () => {}
})

export const useTheme = () => React.useContext(ThemeContext)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState('dark')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const root = window.document.documentElement
    const saved = localStorage.getItem('theme') || 'dark'
    setTheme(saved)
    root.classList.remove('light', 'dark')
    root.classList.add(saved)
  }, [])

  const handleSetTheme = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : 'dark', setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
