import { describe, expect, it } from 'vitest';
import { createIdentifyHandler, type IdentifyDeps } from './identifyCore';
import type { NarrativeRecord } from './narrativesRepo';

const META = { title: 'Impression, soleil levant', artist: 'Claude Monet' };

const CACHED: NarrativeRecord = {
  id: 'cached-id',
  museumId: 'mmfa',
  artifactKey: 'impression-soleil-levant--claude-monet',
  lang: 'en',
  level: 'curious',
  title: META.title,
  artist: META.artist,
  summary: 'Cached summary.',
  story: 'Cached story.',
  tags: ['impressionism'],
  followUps: [{ prompt: 'Why hated?', kind: 'movement' }],
};

function makeDeps(overrides: Partial<IdentifyDeps> = {}): IdentifyDeps {
  return {
    stageOne: async () => META,
    narrativeStream: async function* () {
      yield 'Fresh summary.\n###\nFresh ';
      yield 'story.\n###\n{"tags":["a"],"followUps":[]}';
    },
    repo: {
      findByBucket: async () => null,
      findById: async () => null,
      insert: async () => undefined,
    },
    contextFor: () => '',
    newId: () => 'new-id',
    ...overrides,
  };
}

function makeRequest(body: unknown = validBody()): Request {
  return new Request('http://test/api/identify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function validBody() {
  return {
    photoDataUrl: 'data:image/jpeg;base64,AAAA',
    museumId: 'mmfa',
    museumName: 'Montreal Museum of Fine Arts',
    language: 'en',
    level: 'curious',
  };
}

describe('createIdentifyHandler', () => {
  it('rejects non-POST', async () => {
    const handler = createIdentifyHandler(makeDeps());
    const res = await handler(new Request('http://test/api/identify'));
    expect(res.status).toBe(405);
  });

  it('rejects bodies without a data-URL photo', async () => {
    const handler = createIdentifyHandler(makeDeps());
    const res = await handler(makeRequest({ ...validBody(), photoDataUrl: 'nope' }));
    expect(res.status).toBe(400);
  });

  it('streams meta then cached narrative on a cache hit', async () => {
    const handler = createIdentifyHandler(
      makeDeps({
        repo: {
          findByBucket: async () => CACHED,
          findById: async () => CACHED,
          insert: async () => undefined,
        },
      }),
    );
    const res = await handler(makeRequest());
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    const text = await res.text();
    const order = ['event: meta', 'event: summary', 'event: delta', 'event: extras', 'event: done'];
    let last = -1;
    for (const marker of order) {
      const at = text.indexOf(marker);
      expect(at, marker).toBeGreaterThan(last);
      last = at;
    }
    expect(text).toContain('"cached":true');
    expect(text).toContain('"narrativeId":"cached-id"');
  });

  it('generates, streams, and stores on a cache miss', async () => {
    const inserted: NarrativeRecord[] = [];
    const handler = createIdentifyHandler(
      makeDeps({
        repo: {
          findByBucket: async () => null,
          findById: async () => null,
          insert: async (r) => {
            inserted.push(r);
          },
        },
      }),
    );
    const text = await (await handler(makeRequest())).text();
    await new Promise((r) => setTimeout(r, 0));
    expect(text).toContain('"cached":false');
    expect(text).toContain('Fresh summary.');
    expect(inserted).toHaveLength(1);
    expect(inserted[0].story).toBe('Fresh story.');
    expect(inserted[0].id).toBe('new-id');
    expect(inserted[0].artist).toBe('Claude Monet');
    expect(inserted[0].tags).toEqual(['a']);
    const order = ['event: meta', 'event: summary', 'event: delta', 'event: extras', 'event: done'];
    let last = -1;
    for (const marker of order) {
      const at = text.indexOf(marker);
      expect(at, marker).toBeGreaterThan(last);
      last = at;
    }
  });

  it('still sends done when the cache insert fails after streaming', async () => {
    const handler = createIdentifyHandler(
      makeDeps({
        repo: {
          findByBucket: async () => null,
          findById: async () => null,
          insert: async () => {
            throw new Error('db down');
          },
        },
      }),
    );
    const text = await (await handler(makeRequest())).text();
    await new Promise((r) => setTimeout(r, 0));
    expect(text).toContain('event: done');
    expect(text).toContain('"cached":false');
    expect(text).not.toContain('event: error');
  });

  it('rejects oversized photos with 400', async () => {
    const huge = 'data:image/jpeg;base64,' + 'A'.repeat(2_000_001);
    const handler = createIdentifyHandler(makeDeps());
    const res = await handler(makeRequest({ ...validBody(), photoDataUrl: huge }));
    expect(res.status).toBe(400);
  });

  it('emits an error event when stage one throws', async () => {
    const handler = createIdentifyHandler(
      makeDeps({
        stageOne: async () => {
          throw new Error('vision unavailable');
        },
      }),
    );
    const text = await (await handler(makeRequest())).text();
    expect(text).toContain('event: error');
    expect(text).toContain('vision unavailable');
  });
});
