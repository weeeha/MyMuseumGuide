import { nanoid } from 'nanoid';
import type {
  ArtifactInfo,
  CaptureRequest,
  Museum,
} from '../../domain/types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Pretend to call Claude vision on a floor-plan photo. Returns the museum's
 * canonical topic list (when available) plus a "Visitor services" catch-all
 * to look like detection. Latency 800-1500ms to feel real.
 */
export async function mockParseFloorPlan(
  _photoDataUrl: string,
  museum: Museum,
): Promise<{ topics: string[] }> {
  await sleep(900 + Math.random() * 600);
  const base = museum.topics ?? [];
  const detected = base.length
    ? [...base, 'Visitor services']
    : ['Galleries', 'Special exhibition', 'Visitor services'];
  return { topics: detected };
}

/**
 * Pretend to identify an artifact. Returns a generic placeholder so Phase 2
 * UIs can render. Phase 3 replaces this with a Claude vision call.
 */
export async function mockIdentifyArtifact(
  req: CaptureRequest,
): Promise<ArtifactInfo> {
  await sleep(1200 + Math.random() * 800);
  return {
    id: nanoid(),
    title: 'Untitled (mock identification)',
    artist: 'Unknown',
    period: 'c. 1900',
    origin: req.museum?.country ?? 'Unknown',
    medium: 'Oil on canvas',
    summary:
      'A placeholder identification while the backend is mocked. The real Claude vision call lands in Phase 3.',
    story:
      'Imagine here a few paragraphs tailored to your language and depth — ' +
      `a ${req.level}-level narration about who made this, when, why it ` +
      'matters, and the small story that makes it stick.',
    tags: ['mock', 'placeholder'],
    followUps: [
      { id: nanoid(), prompt: 'Tell me about a similar artist', kind: 'artist' },
      { id: nanoid(), prompt: 'What movement is this?', kind: 'movement' },
    ],
  };
}
