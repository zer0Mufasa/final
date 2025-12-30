export const theme = {
  colors: {
    // Base
    bgBase: '#0A0B14',
    bgDeep: '#0F1020',
    bgOverlay:
      'radial-gradient(circle at 18% 18%, rgba(183,148,255,0.10), transparent 42%), radial-gradient(circle at 82% 8%, rgba(183,148,255,0.08), transparent 40%)',
    // Surfaces
    surface: 'rgba(255,255,255,0.035)',
    surfaceAlt: 'rgba(255,255,255,0.055)',
    row: 'rgba(255,255,255,0.02)',
    // Borders
    border: 'rgba(255,255,255,0.08)',
    borderFocus: 'rgba(183,148,255,0.35)',
    // Text
    text: '#EDEBFF',
    secondary: '#B6B3D6',
    muted: '#8A88B5',
    // Accent (desaturated lavender)
    lavender: '#B794FF',
    lavenderDeep: '#9F86FF',
    accentSoft: 'rgba(183,148,255,0.18)',
    accentHover: '#C9B6FF',
    // Status (soft)
    successTint: 'rgba(120,220,180,0.25)',
    warningTint: 'rgba(255,200,120,0.22)',
    dangerTint: 'rgba(255,120,140,0.22)',
    infoTint: 'rgba(140,180,255,0.20)',
  },
  radii: {
    row: '8px',
    panel: '12px',
    drawer: '16px',
  },
  shadows: {
    sm: '0 10px 30px rgba(0,0,0,0.25)',
    md: '0 20px 60px rgba(0,0,0,0.28)',
  },
  spacing: [4, 8, 12, 16, 20, 24, 28, 32, 36, 40],
  blur: {
    sm: '8px',
    md: '14px',
    lg: '20px',
  },
  borders: {
    hairline: 'rgba(255,255,255,0.08)',
    subtle: 'rgba(255,255,255,0.12)',
  },
  surfaces: {
    panel: 'rgba(255,255,255,0.035)',
    panelAlt: 'rgba(255,255,255,0.055)',
    row: 'rgba(255,255,255,0.02)',
    payment: 'rgba(255,255,255,0.08)',
  },
} as const

export type Theme = typeof theme

