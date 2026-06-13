import { identifyPrompt, narrativePrompt } from './prompts';

describe('identifyPrompt', () => {
  it('demands strict JSON and mentions the wall label', () => {
    const p = identifyPrompt('CONTEXT PACK TEXT');
    expect(p).toContain('JSON');
    expect(p).toContain('wall label');
    expect(p).toContain('CONTEXT PACK TEXT');
  });
});

describe('narrativePrompt', () => {
  const base = {
    meta: { title: 'Impression, soleil levant', artist: 'Claude Monet' },
    context: 'PACK',
    language: 'fr',
    level: 'curious',
    museumName: 'Montreal Museum of Fine Arts',
  };

  it('names the output language and the level', () => {
    const p = narrativePrompt(base);
    expect(p).toContain('French');
    expect(p).toContain('curious');
  });

  it('specifies the three-section ### format and the spoken invitation', () => {
    const p = narrativePrompt(base);
    expect(p.match(/###/g)?.length).toBeGreaterThanOrEqual(2);
    expect(p).toContain('invitation');
    expect(p).toContain('followUps');
  });

  it('does not mention interests (cache-bucket rule, spec §5.3)', () => {
    expect(narrativePrompt(base)).not.toContain('interest');
  });
});
