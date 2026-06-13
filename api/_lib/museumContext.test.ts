import { contextForMuseum } from './museumContext';

describe('contextForMuseum', () => {
  it('returns the curated MMFA pack', () => {
    expect(contextForMuseum('mmfa')).toContain('Montreal Museum of Fine Arts');
  });

  it('returns empty string for unknown museums', () => {
    expect(contextForMuseum('some-scanned-museum')).toBe('');
    expect(contextForMuseum(undefined)).toBe('');
  });
});
