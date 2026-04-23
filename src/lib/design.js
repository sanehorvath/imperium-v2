// ── THEMES ────────────────────────────────────────────────────────────────────
export const THEMES = {
  dark: {
    bg:          '#0a0a12',
    surface:     '#12121e',
    surface2:    '#1a1a2e',
    border:      '#1e1e3a',
    borderLight: '#2a2a4a',
    text:        '#f0f0f8',
    sub:         '#8888aa',
    muted:       '#444466',
    accent:      '#C8A96E',
    accentDim:   'rgba(200,169,110,0.12)',
    accentGlow:  'rgba(200,169,110,0.3)',
    blue:        '#5B8DEF',
    blueDim:     'rgba(91,141,239,0.12)',
    green:       '#4CAF7D',
    greenDim:    'rgba(76,175,125,0.12)',
    red:         '#E05555',
    redDim:      'rgba(224,85,85,0.12)',
    purple:      '#9B7FE8',
    purpleDim:   'rgba(155,127,232,0.12)',
    orange:      '#F4A261',
  },
  light: {
    bg:          '#f4f4f8',
    surface:     '#ffffff',
    surface2:    '#f0f0f6',
    border:      '#e0e0ec',
    borderLight: '#d0d0e0',
    text:        '#1a1a2e',
    sub:         '#666688',
    muted:       '#aaaacc',
    accent:      '#b8893e',
    accentDim:   'rgba(184,137,62,0.1)',
    accentGlow:  'rgba(184,137,62,0.25)',
    blue:        '#3b6fd4',
    blueDim:     'rgba(59,111,212,0.1)',
    green:       '#2e8a5a',
    greenDim:    'rgba(46,138,90,0.1)',
    red:         '#cc3333',
    redDim:      'rgba(204,51,51,0.1)',
    purple:      '#7b5fc8',
    purpleDim:   'rgba(123,95,200,0.1)',
    orange:      '#d4782e',
  }
}

// Active theme — default dark, overridden by ThemeContext
export let C = THEMES.dark

export function setTheme(theme) {
  Object.assign(C, THEMES[theme] || THEMES.dark)
}

// ── SHARED STYLES (functions so they re-read C at call time) ──────────────────
export const st = {
  card: (p = 16) => ({
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: p,
  }),
  card2: (p = 16) => ({
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: p,
  }),
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 5,
    display: 'block',
  },
  input: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '8px 12px',
    color: C.text,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  textarea: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '8px 12px',
    color: C.text,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    width: '100%',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  btn: (variant = 'primary', size = 'md') => {
    const base = {
      border: 'none',
      borderRadius: size === 'xs' ? 5 : size === 'sm' ? 7 : 9,
      cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      transition: 'all 0.15s',
      padding: size === 'xs' ? '3px 8px' : size === 'sm' ? '5px 11px' : '9px 18px',
      fontSize: size === 'xs' ? 11 : size === 'sm' ? 12 : 13,
    }
    const variants = {
      primary: { background: C.accent,    color: '#0a0a12' },
      ghost:   { background: 'transparent', color: C.sub, border: `1px solid ${C.border}` },
      danger:  { background: C.redDim,    color: C.red,    border: `1px solid ${C.red}44` },
      green:   { background: C.greenDim,  color: C.green,  border: `1px solid ${C.green}44` },
      blue:    { background: C.blueDim,   color: C.blue,   border: `1px solid ${C.blue}44` },
    }
    return { ...base, ...(variants[variant] || variants.primary) }
  },
  badge: (role) => {
    const colors = {
      owner:  { background: C.accentDim, color: C.accent, border: `1px solid ${C.accent}44` },
      admin:  { background: C.blueDim,   color: C.blue,   border: `1px solid ${C.blue}44` },
      tl:     { background: C.purpleDim, color: C.purple, border: `1px solid ${C.purple}44` },
      va:     { background: C.greenDim,  color: C.green,  border: `1px solid ${C.green}44` },
    }
    return {
      ...(colors[role] || colors.va),
      borderRadius: 6,
      padding: '3px 9px',
      fontSize: 11,
      fontWeight: 700,
    }
  },
  cTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 10,
  },
  sub: { fontSize: 12, color: C.sub },
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  g2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  g3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  g4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 },
  avatar: (color = C.accent) => ({
    width: 32, height: 32,
    borderRadius: 8,
    background: `${color}22`,
    border: `1px solid ${color}44`,
    color: color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
  }),
}

export const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: 'IG', color: '#E1306C' },
  { id: 'tiktok',    label: 'TikTok',    icon: 'TK', color: '#000000' },
  { id: 'twitter',   label: 'Twitter/X', icon: 'X',  color: '#1DA1F2' },
  { id: 'reddit',    label: 'Reddit',    icon: 'RD', color: '#FF4500' },
  { id: 'snapchat',  label: 'Snapchat',  icon: 'SC', color: '#FFFC00' },
  { id: 'other',     label: 'Autre',     icon: '?',  color: '#888888' },
]

export const ACCOUNT_STATUSES = [
  { id: 'warmup',  label: 'Warmup',  color: '#5B8DEF' },
  { id: 'actif',   label: 'Actif',   color: '#4CAF7D' },
  { id: 'banni',   label: 'Banni',   color: '#E05555' },
  { id: 'archive', label: 'Archivé', color: '#666688' },
]

export const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export const INV_CATS = [
  { id: 'va',          label: 'VA',          color: '#5B8DEF' },
  { id: 'modele',      label: 'Modèle',      color: '#C8A96E' },
  { id: 'outil',       label: 'Outil',       color: '#9B7FE8' },
  { id: 'prestataire', label: 'Prestataire', color: '#F4A261' },
  { id: 'autre',       label: 'Autre',       color: '#666688' },
]

export const ROLE_LABELS = {
  owner: 'Owner', admin: 'Admin', tl: 'Team Leader', va: 'VA'
}
