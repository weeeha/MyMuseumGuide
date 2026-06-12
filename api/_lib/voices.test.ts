import { DEFAULT_VOICE_ID, voiceFor } from './voices';

describe('voiceFor', () => {
  it('falls back to the default voice for unmapped languages', () => {
    expect(voiceFor('uk')).toBe(DEFAULT_VOICE_ID);
  });

  it('returns the default voice for English', () => {
    expect(voiceFor('en')).toBe(DEFAULT_VOICE_ID);
  });
});
