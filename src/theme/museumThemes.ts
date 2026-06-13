import type { MuseumTheme } from '../domain/types';

/**
 * Per-museum design tokens (spec §6.2). The ink spine never changes; the
 * active museum owns the accent. Default = the gallery-red brand theme
 * (spec §6.3) for museum-less surfaces and unknown museums.
 */
export const DEFAULT_THEME: MuseumTheme = {
  accent: '#D64541',
  onAccent: '#3B0D09',
  surfaceTint: '#2A1D17',
  canvas: 'warm',
  titleFont: 'serif',
};

export const MUSEUM_THEMES: Record<string, MuseumTheme> = {
  mmfa: DEFAULT_THEME,
  moma: {
    accent: '#A78BFA',
    onAccent: '#14092E',
    surfaceTint: '#1C1830',
    canvas: 'cool',
    titleFont: 'sans',
  },
  'tate-modern': {
    accent: '#A78BFA',
    onAccent: '#14092E',
    surfaceTint: '#1C1830',
    canvas: 'cool',
    titleFont: 'sans',
  },
  met: {
    accent: '#D9A441',
    onAccent: '#3A2A05',
    surfaceTint: '#241B10',
    canvas: 'warm',
    titleFont: 'serif',
  },
  louvre: {
    accent: '#D9A441',
    onAccent: '#3A2A05',
    surfaceTint: '#241B10',
    canvas: 'warm',
    titleFont: 'serif',
  },
  rijksmuseum: {
    accent: '#5B9BD5',
    onAccent: '#0A2238',
    surfaceTint: '#16202B',
    canvas: 'cool',
    titleFont: 'serif',
  },
};

export function themeForMuseum(museumId?: string): MuseumTheme {
  if (!museumId) return DEFAULT_THEME;
  return MUSEUM_THEMES[museumId] ?? DEFAULT_THEME;
}

const SERIF_STACK = 'Georgia, "Times New Roman", serif';
const SANS_STACK =
  '-apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, sans-serif';

export function applyTheme(theme: MuseumTheme): void {
  const root = document.documentElement;
  root.style.setProperty('--ml-accent', theme.accent);
  root.style.setProperty('--ml-on-accent', theme.onAccent);
  root.style.setProperty('--ml-surface-tint', theme.surfaceTint);
  root.style.setProperty(
    '--ml-title-font',
    theme.titleFont === 'serif' ? SERIF_STACK : SANS_STACK,
  );
  root.dataset.mlCanvas = theme.canvas;
}
