export const theme = {
  colors: {
    // Dark Lavender (premium, calm)
    bgRoot: '#08080c', // page
    bgCanvas: '#0a0a0f', // elevated (sidebar/modals)
    bgAlt: '#0d0d14', // inputs/alt surfaces
    // Back-compat keys
    bgBase: '#08080c',
    bgDeep: '#0a0a0f',
    bgOverlay:
      'radial-gradient(ellipse 80% 50% at 18% 10%, rgba(139,92,246,0.15), transparent 55%), radial-gradient(ellipse 70% 40% at 80% 85%, rgba(167,139,250,0.12), transparent 55%), linear-gradient(180deg, #08080c 0%, #0a0a10 100%)',

    // Surfaces
    surface: 'rgba(255,255,255,0.02)',
    surfaceAlt: 'rgba(255,255,255,0.04)',
    row: 'rgba(255,255,255,0.02)',

    // Borders
    border: 'rgba(255,255,255,0.06)',
    borderFocus: 'rgba(139,92,246,0.50)',

    // Text (white hierarchy)
    text: 'rgba(255,255,255,0.95)',
    secondary: 'rgba(255,255,255,0.70)',
    muted: 'rgba(255,255,255,0.50)',
    hint: 'rgba(255,255,255,0.30)',

    // Accent (soft lavender)
    lavender: '#8b5cf6',
    lavenderHover: '#a78bfa',
    lavenderTint: 'rgba(139,92,246,0.20)',
    lavenderGlass: 'rgba(255,255,255,0.02)',
    // Back-compat accent
    lavenderDeep: '#7c3aed',

    // Status (dark-safe)
    successTint: 'rgba(16,185,129,0.12)',
    warningTint: 'rgba(245,158,11,0.12)',
    dangerTint: 'rgba(239,68,68,0.12)',
    infoTint: 'rgba(59,130,246,0.12)',
  },
  radii: {
    input: '8px',
    row: '10px',
    panel: '14px',
    drawer: '18px',
  },
  type: {
    h1: 'text-3xl sm:text-4xl font-semibold text-white/95',
    h2: 'text-2xl font-semibold text-white/90',
    body: 'text-sm text-white/70',
    meta: 'text-xs uppercase tracking-[0.08em] text-white/50',
  },
  spacingScale: [8, 12, 16, 20, 24, 32],
  shadows: {
    sm: '0 12px 28px rgba(0,0,0,0.45)',
    md: '0 24px 60px rgba(0,0,0,0.55)',
  },
  spacing: [4, 8, 12, 16, 20, 24, 28, 32, 36, 40],
  blur: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  borders: {
    hairline: 'rgba(255,255,255,0.06)',
    subtle: 'rgba(255,255,255,0.10)',
  },
  surfaces: {
    panel: 'rgba(255,255,255,0.02)',
    panelAlt: 'rgba(255,255,255,0.03)',
    row: 'rgba(255,255,255,0.02)',
    payment: 'rgba(139,92,246,0.10)',
  },
} as const

export type Theme = typeof theme

