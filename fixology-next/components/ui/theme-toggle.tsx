'use client'

import { useTheme } from '@/contexts/theme-context'
import { Moon, Sun, Monitor, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

// ============================================
// THEME TOGGLE COMPONENTS
// Multiple variants for different use cases
// ============================================

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// ============================================
// SIMPLE TOGGLE (Icon Button)
// ============================================

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative p-2 rounded-xl transition-all",
        "bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]",
        "border border-[var(--border-default)]",
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        className
      )}
      title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun className={cn(
        "w-5 h-5 transition-all",
        resolvedTheme === 'dark' 
          ? "rotate-0 scale-100" 
          : "rotate-90 scale-0 absolute"
      )} />
      <Moon className={cn(
        "w-5 h-5 transition-all",
        resolvedTheme === 'light' 
          ? "rotate-0 scale-100" 
          : "-rotate-90 scale-0 absolute"
      )} />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

// ============================================
// ANIMATED SWITCH
// ============================================

export function ThemeSwitch({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative w-14 h-8 rounded-full p-1 transition-colors duration-200",
        isDark 
          ? "bg-violet-500/20 border border-violet-500/30" 
          : "bg-amber-500/20 border border-amber-500/30",
        className
      )}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Track Icons */}
      <Moon className={cn(
        "absolute left-1.5 top-1.5 w-4 h-4 transition-opacity",
        isDark ? "opacity-100 text-violet-400" : "opacity-30 text-[var(--text-faint)]"
      )} />
      <Sun className={cn(
        "absolute right-1.5 top-1.5 w-4 h-4 transition-opacity",
        !isDark ? "opacity-100 text-amber-500" : "opacity-30 text-[var(--text-faint)]"
      )} />
      
      {/* Thumb */}
      <span
        className={cn(
          "block w-6 h-6 rounded-full shadow-md transition-transform duration-200",
          isDark 
            ? "translate-x-0 bg-violet-500" 
            : "translate-x-6 bg-amber-500"
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

// ============================================
// DROPDOWN SELECTOR (Dark/Light/System)
// ============================================

export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  const currentIcon = theme === 'system' 
    ? Monitor 
    : resolvedTheme === 'dark' 
      ? Moon 
      : Sun

  const CurrentIcon = currentIcon

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
          "bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]",
          "border border-[var(--border-default)]",
          "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
          "text-sm"
        )}
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="capitalize">{theme}</span>
      </button>

      {open && (
        <div className={cn(
          "absolute right-0 mt-2 w-40 py-1 rounded-xl z-50",
          "bg-[var(--dropdown-bg)] border border-[var(--border-default)]",
          "shadow-[var(--shadow-lg)]"
        )}>
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value)
                setOpen(false)
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                "hover:bg-[var(--bg-card-hover)]",
                theme === value 
                  ? "text-[var(--accent-primary)]" 
                  : "text-[var(--text-secondary)]"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{label}</span>
              {theme === value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// SEGMENTED CONTROL
// ============================================

export function ThemeSegmented({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const options = [
    { value: 'light', icon: Sun },
    { value: 'system', icon: Monitor },
    { value: 'dark', icon: Moon },
  ] as const

  return (
    <div className={cn(
      "flex p-1 rounded-xl",
      "bg-[var(--bg-card)] border border-[var(--border-default)]",
      className
    )}>
      {options.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg transition-all",
            theme === value
              ? "bg-[var(--accent-primary)] text-white shadow-[var(--shadow-glow)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
          )}
          title={`${value.charAt(0).toUpperCase() + value.slice(1)} mode`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}

// ============================================
// SETTINGS ROW (For Settings Page)
// ============================================

export function ThemeSettingsRow() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const options = [
    { value: 'light', label: 'Light', description: 'Light background', icon: Sun },
    { value: 'dark', label: 'Dark', description: 'Dark background', icon: Moon },
    { value: 'system', label: 'System', description: 'Device settings', icon: Monitor },
  ] as const

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Theme</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Currently using {resolvedTheme} mode
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {options.map(({ value, label, description, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
              theme === value
                ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30"
                : "bg-[var(--bg-card)] border-[var(--border-default)] hover:bg-[var(--bg-card-hover)]"
            )}
          >
            <Icon className={cn(
              "w-6 h-6",
              theme === value ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"
            )} />
            <div>
              <div className={cn(
                "text-sm font-medium",
                theme === value ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"
              )}>{label}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{description}</div>
            </div>
            {theme === value && (
              <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// TOPBAR DROPDOWN ITEM (For User Menu)
// ============================================

export function ThemeDropdownItem() {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleTheme()
      }}
      className={cn(
        "w-full outline-none cursor-pointer rounded-xl px-3 py-2.5 text-sm",
        "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]",
        "flex items-center justify-between transition-colors"
      )}
    >
      <div className="flex items-center gap-2">
        {resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-400" aria-hidden="true" />
        )}
        {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </div>
      <div className={cn(
        "w-10 h-5 rounded-full relative transition-colors",
        resolvedTheme === 'light' ? "bg-purple-500" : "bg-white/20"
      )}>
        <div className={cn(
          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
          resolvedTheme === 'light' ? "translate-x-5" : "translate-x-0.5"
        )} />
      </div>
    </button>
  )
}
