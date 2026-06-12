import { applyTheme, DEFAULT_THEME, themeForMuseum } from './museumThemes';

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

describe('applyTheme', () => {
  it('sets the --ml-* variables on the document root', () => {
    applyTheme(themeForMuseum('mmfa'));
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--ml-accent')).toBe('#D64541');
    expect(root.style.getPropertyValue('--ml-on-accent')).toBe('#3B0D09');
    expect(root.dataset.mlCanvas).toBe('warm');
  });
});
