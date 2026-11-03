// ─────────────────────────────────────────────────────────────────────────────
// Theme tokens — the configurable values that drive the whole MUI theme.
// These come from the backend (General.ThemeSettings) and can be edited in
// Settings → Appearance. Defaults below match the original brand theme.
// ─────────────────────────────────────────────────────────────────────────────

export interface ThemeTokens {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  paper_color: string;
  text_primary_color: string;
  text_secondary_color: string;
  success_color: string;
  error_color: string;
  warning_color: string;
  info_color: string;
  heading_font: string;
  body_font: string;
  border_radius: number;
}

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  primary_color: '#4F46E5',
  secondary_color: '#10B981',
  background_color: '#F8FAFC',
  paper_color: '#FFFFFF',
  text_primary_color: '#0F172A',
  text_secondary_color: '#475569',
  success_color: '#10B981',
  error_color: '#EF4444',
  warning_color: '#F59E0B',
  info_color: '#06B6D4',
  heading_font: 'Outfit',
  body_font: 'Plus Jakarta Sans',
  border_radius: 10,
};

// Curated Google Fonts available in the picker (must match backend FONT_CHOICES).
export const AVAILABLE_FONTS: string[] = [
  'Plus Jakarta Sans',
  'Outfit',
  'Inter',
  'Poppins',
  'Roboto',
  'Montserrat',
  'Open Sans',
  'Lato',
  'Nunito',
  'Work Sans',
  'DM Sans',
  'Manrope',
];

/** localStorage key used to cache the theme so it applies instantly on next load. */
export const THEME_CACHE_KEY = 'rrg_theme_tokens';

// ── small color helpers ─────────────────────────────────────────────────────

/** Convert a hex color + alpha (0-1) to an rgba() string. */
export function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Darken a hex color by a percentage (0-1). Used for hover states. */
export function darken(hex: string, amount = 0.12): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.round(r * (1 - amount)));
  g = Math.max(0, Math.round(g * (1 - amount)));
  b = Math.max(0, Math.round(b * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Lighten a hex color by a percentage (0-1). */
export function lighten(hex: string, amount = 0.15): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.min(255, Math.round(r + (255 - r) * amount));
  g = Math.min(255, Math.round(g + (255 - g) * amount));
  b = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Dynamically load a Google Font by family name (idempotent). */
export function loadGoogleFont(family: string): void {
  if (!family) return;
  const id = `gfont-${family.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  const spec = family.replace(/\s+/g, '+');
  link.href = `https://fonts.googleapis.com/css2?family=${spec}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}
