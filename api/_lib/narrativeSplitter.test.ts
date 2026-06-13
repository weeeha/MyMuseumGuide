import { describe, expect, it, vi } from 'vitest';
import { createNarrativeSplitter } from './narrativeSplitter';

const EXTRAS =
  '{"tags":["impressionism"],"followUps":[{"prompt":"Why hated?","kind":"movement"}]}';

describe('createNarrativeSplitter', () => {
  it('splits summary, streams story deltas, and parses extras', () => {
    const onSummary = vi.fn();
    const onDelta = vi.fn();
    const s = createNarrativeSplitter({ onSummary, onDelta });
    s.push('A dawn that named a movement.\n###\nLook at the orange disc. ');
    s.push('It barely exists.\n###\n');
    s.push(EXTRAS);
    const result = s.end();

    expect(onSummary).toHaveBeenCalledWith('A dawn that named a movement.');
    expect(onDelta.mock.calls.map((c) => c[0]).join('')).toBe(
      'Look at the orange disc. It barely exists.',
    );
    expect(result.summary).toBe('A dawn that named a movement.');
    expect(result.story).toBe('Look at the orange disc. It barely exists.');
    expect(result.tags).toEqual(['impressionism']);
    expect(result.followUps).toEqual([{ prompt: 'Why hated?', kind: 'movement' }]);
  });

  it('handles the ### delimiter split across pushes', () => {
    const onSummary = vi.fn();
    const onDelta = vi.fn();
    const s = createNarrativeSplitter({ onSummary, onDelta });
    s.push('Summary.\n#');
    s.push('##\nStory body.\n##');
    s.push('#\n' + EXTRAS);
    const result = s.end();
    expect(result.summary).toBe('Summary.');
    expect(result.story).toBe('Story body.');
    expect(result.tags).toEqual(['impressionism']);
  });

  it('survives a model that forgets the extras section', () => {
    const s = createNarrativeSplitter({ onSummary: vi.fn(), onDelta: vi.fn() });
    s.push('Summary.\n###\nJust a story, no extras.');
    const result = s.end();
    expect(result.story).toBe('Just a story, no extras.');
    expect(result.tags).toEqual([]);
    expect(result.followUps).toEqual([]);
  });
});
