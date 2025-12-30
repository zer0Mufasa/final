export const theme = {
  colors: {
    // Base light palette
    bgRoot: '#F7F6FB',
    bgCanvas: '#FFFFFF',
    bgAlt: '#F2F1F8',
    // Back-compat keys
    bgBase: '#F7F6FB',
    bgDeep: '#FFFFFF',
    bgOverlay: 'radial-gradient(circle at 18% 18%, rgba(139,124,246,0.10), transparent 40%), radial-gradient(circle at 82% 8%, rgba(139,124,246,0.06), transparent 38%), linear-gradient(180deg, #F7F6FB 0%, #FFFFFF 100%)',

    // Surfaces
    surface: '#FFFFFF',
    surfaceAlt: '#F7F6FB',
    row: '#FFFFFF',

    // Borders
    border: 'rgba(30,30,60,0.08)',
    borderFocus: 'rgba(139,124,246,0.35)',

    // Text
    text: '#1F1E2E',
    secondary: '#5E5B7A',
    muted: '#8C8AA3',

    // Accent (soft lavender)
    lavender: '#8B7CF6',
    lavenderHover: '#7A6AF0',
    lavenderTint: 'rgba(139,124,246,0.12)',
    lavenderGlass: 'rgba(139,124,246,0.08)',
    // Back-compat accent
    lavenderDeep: '#7A6AF0',

    // Status (pastel)
    successTint: '#CFEDE0',
    warningTint: '#FFF0C2',
    dangerTint: '#FFD6D9',
    infoTint: '#E6E3FF',
  },
  radii: {
    input: '8px',
    row: '10px',
    panel: '14px',
    drawer: '18px',
  },
  shadows: {
    sm: '0 8px 18px rgba(15,16,32,0.06)',
    md: '0 16px 34px rgba(15,16,32,0.10)',
  },
  spacing: [4, 8, 12, 16, 20, 24, 28, 32, 36, 40],
  blur: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  borders: {
    hairline: 'rgba(30,30,60,0.08)',
    subtle: 'rgba(30,30,60,0.12)',
  },
  surfaces: {
    panel: '#FFFFFF',
    panelAlt: '#F7F6FB',
    row: '#FFFFFF',
    payment: 'rgba(139,124,246,0.08)',
  },
} as const

export type Theme = typeof theme

