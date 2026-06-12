import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../identity/deviceId', () => ({
  getDeviceId: async () => 'test-device',
}));
vi.mock('../camera/resize', () => ({
  downscaleDataUrl: async (d: string) => d,
}));

import { identifyArtifactStream, resolveApiUrl, ttsUrlFor } from './identify';

function sseResponse(frames: string): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(encoder.encode(frames));
      c.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

const REQ = {
  photoDataUrl: 'data:image/jpeg;base64,AAAA',
  language: 'en' as const,
  level: 'curious' as const,
  interests: [],
};

describe('identifyArtifactStream', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('dispatches parsed events in order', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        sseResponse(
          'event: meta\ndata: {"title":"Sunrise"}\n\n' +
            'event: summary\ndata: {"text":"S."}\n\n' +
            'event: delta\ndata: {"text":"Once"}\n\n' +
            'event: extras\ndata: {"tags":["t"],"followUps":[{"prompt":"Q","kind":"artist"}]}\n\n' +
            'event: done\ndata: {"narrativeId":"n1","cached":false}\n\n',
        ),
      ),
    );
    const calls: string[] = [];
    await identifyArtifactStream(REQ, {
      onMeta: (m) => calls.push(`meta:${m.title}`),
      onSummary: (t) => calls.push(`summary:${t}`),
      onDelta: (t) => calls.push(`delta:${t}`),
      onExtras: (x) => calls.push(`extras:${x.tags[0]}`),
      onDone: (d) => calls.push(`done:${d.narrativeId}`),
      onError: (m) => calls.push(`error:${m}`),
    });
    expect(calls).toEqual([
      'meta:Sunrise',
      'summary:S.',
      'delta:Once',
      'extras:t',
      'done:n1',
    ]);
  });

  it('reports HTTP failures through onError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    const errors: string[] = [];
    await identifyArtifactStream(REQ, {
      onMeta: () => undefined,
      onSummary: () => undefined,
      onDelta: () => undefined,
      onExtras: () => undefined,
      onDone: () => undefined,
      onError: (m) => errors.push(m),
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('500');
  });

  it('surfaces the server-provided error body on 400', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: 'Photo is too large — please retake or pick a smaller image' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );
    const errors: string[] = [];
    await identifyArtifactStream(REQ, {
      onMeta: () => undefined,
      onSummary: () => undefined,
      onDelta: () => undefined,
      onExtras: () => undefined,
      onDone: () => undefined,
      onError: (m) => errors.push(m),
    });
    expect(errors).toEqual(['Photo is too large — please retake or pick a smaller image']);
  });
});

describe('url helpers', () => {
  it('builds a relative tts url from a narrative id', () => {
    expect(ttsUrlFor('abc')).toBe('/api/tts?nid=abc');
  });

  it('passes absolute urls through resolveApiUrl unchanged', () => {
    expect(resolveApiUrl('https://x.example/audio.mp3')).toBe(
      'https://x.example/audio.mp3',
    );
  });
});
