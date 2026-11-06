/**
 * "Aurora" palette for Elora's assistant surfaces: a near-black violet base
 * with luminous purple accents and frosted-glass panels. These surfaces are
 * always dark, whatever the app's light/dark preference.
 */
export const aurora = {
  /** Brand violet: splash screen and icon background. */
  brand: '#5B21B6',

  background: '#07050E',
  backgroundRaised: '#0F0B1C',

  glass: 'rgba(255,255,255,0.05)',
  glassPressed: 'rgba(255,255,255,0.09)',
  glassBorder: 'rgba(255,255,255,0.09)',

  violet: '#8B5CF6',
  violetDeep: '#4C1D95',
  violetBright: '#A855F7',
  lilac: '#D8B4FE',
  orchid: '#E879F9',
  ice: '#67E8F9',
  accentTint: 'rgba(139,92,246,0.18)',
  accentBorder: 'rgba(216,180,254,0.28)',

  text: '#F5F3FF',
  textMuted: 'rgba(237,233,254,0.66)',
  textSubtle: 'rgba(237,233,254,0.40)',

  danger: '#F87171',
  dangerTint: 'rgba(248,113,113,0.14)',
  dangerBorder: 'rgba(248,113,113,0.32)',

  online: '#34D399',
  offline: '#A1A1AA',
} as const;
