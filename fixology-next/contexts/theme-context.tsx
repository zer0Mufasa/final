'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

// ============================================
// FIXOLOGY THEME SYSTEM v2.0
// Dark/Light mode with system preference support
// ============================================

type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  isDark: boolean
  isLight: boolean
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const STORAGE_KEY = 'fixology-theme'

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Get system preference
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Resolve theme to actual value
function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    
    if (saved && ['dark', 'light', 'system'].includes(saved)) {
      setThemeState(saved)
      setResolvedTheme(resolveTheme(saved))
    } else {
      // Default to dark (do NOT auto-switch to light based on OS/browser preference)
      setThemeState('dark')
      setResolvedTheme('dark')
    }
    
    setMounted(true)
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    
    // Remove old theme classes
    root.classList.remove('dark', 'light')
    root.removeAttribute('data-theme')
    
    // Apply new theme
    root.classList.add(resolvedTheme)
    root.setAttribute('data-theme', resolvedTheme)
    
    // Update color-scheme for native elements
    root.style.colorScheme = resolvedTheme
    
    // Save preference
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme, resolvedTheme, mounted])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    setResolvedTheme(resolveTheme(newTheme))
  }, [])

  const toggleTheme = useCallback(() => {
    // If on system, switch to opposite of current
    // Otherwise toggle between dark and light
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }, [theme, resolvedTheme, setTheme])

  // Prevent flash by not rendering until mounted
  // The script in layout.tsx handles initial theme
  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// ============================================
// THEME SCRIPT (prevents flash on load)
// Add to layout.tsx <head> or before body
// ============================================

export const themeScript = `
(function() {
  try {
    var path = (window.location && window.location.pathname) ? window.location.pathname : '';
    var forceDarkAuth =
      path === '/login' ||
      path === '/signup' ||
      path === '/forgot-password' ||
      path === '/reset-password';

    var theme = localStorage.getItem('${STORAGE_KEY}');
    var resolved = theme;
    
    if (forceDarkAuth) {
      resolved = 'dark';
    } else if (theme === 'system' || !theme) {
      // Default to dark regardless of OS/browser preference
      resolved = 'dark';
    }
    
    document.documentElement.classList.add(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`

// Component to inject script
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
      suppressHydrationWarning
    />
  )
}
