import { applyTheme, DEFAULT_THEME, rgbTriplet, themeForMuseum } from './museumThemes';

describe('themeForMuseum', () => {
  it('returns curated themes for known museums', () => {
    expect(themeForMuseum('mmfa').accent).toBe('#D64541');
    expect(themeForMuseum('moma').titleFont).toBe('sans');
  });

  it('falls back to the default gallery-red brand theme', () => {
    expect(themeForMuseum('some-scanned-museum')).toEqual(DEFAULT_THEME);
    expect(themeForMuseum(undefined)).toEqual(DEFAULT_THEME);
  });
});

describe('rgbTriplet', () => {
  it('decomposes six-digit hex', () => {
    expect(rgbTriplet('#D64541')).toBe('214, 69, 65');
    expect(rgbTriplet('#000000')).toBe('0, 0, 0');
    expect(rgbTriplet('#FFFFFF')).toBe('255, 255, 255');
  });

  it('expands shorthand hex and tolerates a missing hash', () => {
    expect(rgbTriplet('#abc')).toBe('170, 187, 204');
    expect(rgbTriplet('D64541')).toBe('214, 69, 65');
  });

  it('produces a triplet for every curated accent', () => {
    // Ionic builds rgba() tints from --ion-color-primary-rgb; a malformed
    // triplet silently kills every translucent accent surface.
    for (const id of ['mmfa', 'moma', 'met', 'louvre', 'rijksmuseum']) {
      const theme = themeForMuseum(id);
      expect(rgbTriplet(theme.accent)).toMatch(/^\d{1,3}, \d{1,3}, \d{1,3}$/);
      expect(rgbTriplet(theme.onAccent)).toMatch(/^\d{1,3}, \d{1,3}, \d{1,3}$/);
    }
  });
});

describe('applyTheme', () => {
  it('sets the --ml-* variables on the document root', () => {
    applyTheme(themeForMuseum('mmfa'));
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--ml-accent')).toBe('#D64541');
    expect(root.style.getPropertyValue('--ml-on-accent')).toBe('#3B0D09');
    expect(root.dataset.mlCanvas).toBe('warm');
  });

  it('sets the rgb triplets Ionic needs alongside the hex values', () => {
    applyTheme(themeForMuseum('moma'));
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--ml-accent-rgb')).toBe('167, 139, 250');
    expect(root.style.getPropertyValue('--ml-on-accent-rgb')).toBe('20, 9, 46');
    expect(root.dataset.mlCanvas).toBe('cool');
  });
});
