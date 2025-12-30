export const theme = {
  colors: {
    bgBase: '#070712',
    bgDeep: '#080814',
    bgOverlay: 'radial-gradient(circle at 20% 20%, rgba(185,166,255,0.12), transparent 45%), radial-gradient(circle at 80% 10%, rgba(124,92,255,0.16), transparent 40%)',
    card: 'rgba(255,255,255,0.035)',
    cardHover: 'rgba(255,255,255,0.055)',
    border: 'rgba(255,255,255,0.10)',
    text: 'rgba(255,255,255,0.92)',
    muted: 'rgba(255,255,255,0.65)',
    lavender: '#B9A6FF',
    lavenderDeep: '#7C5CFF',
    successTint: 'rgba(34,197,94,0.14)',
    warningTint: 'rgba(251,191,36,0.14)',
    dangerTint: 'rgba(248,113,113,0.14)',
    infoTint: 'rgba(59,130,246,0.14)',
  },
  radii: {
    sm: '10px',
    md: '14px',
    lg: '18px',
    xl: '22px',
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
    panelHover: 'rgba(255,255,255,0.055)',
    row: 'rgba(255,255,255,0.02)',
  },
} as const

export type Theme = typeof theme

