export const theme = {
  colors: {
    // Base light palette (higher contrast)
    bgRoot: '#f9fafb',
    bgCanvas: '#ffffff',
    bgAlt: '#f5f5f7',
    // Back-compat keys
    bgBase: '#f8f9fa',
    bgDeep: '#ffffff',
    bgOverlay: 'radial-gradient(circle at 18% 18%, rgba(139,124,246,0.08), transparent 42%), radial-gradient(circle at 82% 8%, rgba(139,124,246,0.05), transparent 40%), linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',

    // Surfaces
    surface: '#ffffff',
    surfaceAlt: '#f8f9fa',
    row: '#ffffff',

    // Borders
    border: '#e5e7eb',
    borderFocus: 'rgba(139,124,246,0.35)',

    // Text (dark for light mode)
    text: '#111827',
    secondary: '#374151',
    muted: '#6b7280',
    hint: '#9ca3af',

    // Accent (soft lavender)
    lavender: '#8b5cf6',
    lavenderHover: '#7c3aed',
    lavenderTint: 'rgba(139,124,246,0.12)',
    lavenderGlass: 'rgba(139,124,246,0.08)',
    // Back-compat accent
    lavenderDeep: '#7c3aed',

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
    sm: '0 8px 18px rgba(17,24,39,0.06)',
    md: '0 16px 34px rgba(17,24,39,0.10)',
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

