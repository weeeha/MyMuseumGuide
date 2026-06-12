import type { ArtifactInfo } from '../../domain/types';
import {
  applyStreamEvent,
  finalizeArtifact,
  initialStreaming,
  type StreamingPhase,
} from './streamingPhase';

const start = (): StreamingPhase =>
  initialStreaming('photo-data-url', 'entry-1');

describe('applyStreamEvent', () => {
  it('records meta, summary, and accumulates deltas', () => {
    let p = start();
    p = applyStreamEvent(p, { type: 'meta', meta: { title: 'Sunrise', artist: 'Monet' } });
    p = applyStreamEvent(p, { type: 'summary', text: 'One sentence.' });
    p = applyStreamEvent(p, { type: 'delta', text: 'Look ' });
    p = applyStreamEvent(p, { type: 'delta', text: 'closer.' });
    expect(p.meta?.title).toBe('Sunrise');
    expect(p.summary).toBe('One sentence.');
    expect(p.story).toBe('Look closer.');
  });

  it('stores extras', () => {
    let p = start();
    p = applyStreamEvent(p, {
      type: 'extras',
      extras: { tags: ['x'], followUps: [{ prompt: 'Q', kind: 'artist' }] },
    });
    expect(p.tags).toEqual(['x']);
    expect(p.followUps).toHaveLength(1);
  });
});

describe('finalizeArtifact', () => {
  it('assembles a complete ArtifactInfo with ids on follow-ups', () => {
    let p = start();
    p = applyStreamEvent(p, { type: 'meta', meta: { title: 'Sunrise' } });
    p = applyStreamEvent(p, { type: 'summary', text: 'S.' });
    p = applyStreamEvent(p, { type: 'delta', text: 'Story.' });
    p = applyStreamEvent(p, {
      type: 'extras',
      extras: { tags: ['t'], followUps: [{ prompt: 'Q', kind: 'artist' }] },
    });
    const artifact: ArtifactInfo = finalizeArtifact(p, 'narr-1');
    expect(artifact.title).toBe('Sunrise');
    expect(artifact.summary).toBe('S.');
    expect(artifact.story).toBe('Story.');
    expect(artifact.narrativeId).toBe('narr-1');
    expect(artifact.followUps[0].id).toBeTruthy();
    expect(artifact.followUps[0].prompt).toBe('Q');
  });
});
