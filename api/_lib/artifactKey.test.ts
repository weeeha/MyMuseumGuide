import { artifactKey } from './artifactKey';

describe('artifactKey', () => {
  it('slugs title and artist, stripping diacritics and punctuation', () => {
    expect(artifactKey('Impression, soleil levant', 'Claude Monet')).toBe(
      'impression-soleil-levant--claude-monet',
    );
  });

  it('uses "unknown" when artist is missing', () => {
    expect(artifactKey('Amphore romaine')).toBe('amphore-romaine--unknown');
  });

  it('collapses repeated separators', () => {
    expect(artifactKey('Sans titre — nº 7', 'C. Tousignant')).toBe(
      'sans-titre-no-7--c-tousignant',
    );
  });
});
