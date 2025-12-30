export const theme = {
  colors: {
    // Base
    bgBase: '#0A0B14',
    bgDeep: '#0F1020',
    bgOverlay: 'radial-gradient(circle at 18% 12%, rgba(183,148,255,0.12), transparent 45%), radial-gradient(circle at 82% 8%, rgba(183,148,255,0.10), transparent 40%)',
    // Surfaces
    card: 'rgba(255,255,255,0.035)',
    cardHover: 'rgba(255,255,255,0.055)',
    // Borders
    border: 'rgba(255,255,255,0.08)',
    // Text
    text: '#EDEBFF',
    muted: '#8A88B5',
    secondary: '#B6B3D6',
    // Accent (desaturated lavender)
    lavender: '#B794FF',
    lavenderDeep: '#C9B6FF',
    // Status tones (soft)
    successTint: 'rgba(120,220,180,0.25)',
    warningTint: 'rgba(255,200,120,0.22)',
    dangerTint: 'rgba(255,120,140,0.22)',
    infoTint: 'rgba(183,148,255,0.18)',
  },
  radii: {
    sm: '8px',   // rows
    md: '12px',  // panels
    lg: '16px',  // drawers/major
    xl: '20px',
  },
  shadows: {
    sm: '0 10px 26px rgba(0,0,0,0.22)',
    md: '0 18px 48px rgba(0,0,0,0.26)',
  },
  spacing: [4, 8, 12, 16, 20, 24, 28, 32, 36, 40],
  blur: {
    sm: '8px',
    md: '14px',
    lg: '20px',
  },
  borders: {
    hairline: 'rgba(255,255,255,0.08)',
    subtle: 'rgba(255,255,255,0.10)',
    focus: 'rgba(183,148,255,0.35)',
  },
  surfaces: {
    panel: 'rgba(255,255,255,0.035)',
    panelHover: 'rgba(255,255,255,0.055)',
    row: 'rgba(255,255,255,0.02)',
    payment: 'rgba(255,255,255,0.08)',
  },
} as const

export type Theme = typeof theme

