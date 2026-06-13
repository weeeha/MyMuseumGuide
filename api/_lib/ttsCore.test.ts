import { describe, expect, it, vi } from 'vitest';
import { createTtsHandler, type TtsDeps } from './ttsCore';
import type { NarrativeRecord } from './narrativesRepo';

const RECORD: NarrativeRecord = {
  id: 'nid-1',
  museumId: 'mmfa',
  artifactKey: 'k',
  lang: 'fr',
  level: 'curious',
  title: 'Impression, soleil levant',
  summary: 'Résumé.',
  story: 'Histoire.',
  tags: [],
  followUps: [],
};

function streamOf(...parts: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(c) {
      for (const p of parts) c.enqueue(encoder.encode(p));
      c.close();
    },
  });
}

function makeDeps(overrides: Partial<TtsDeps> = {}): TtsDeps {
  return {
    findNarrative: async () => RECORD,
    cachedUrl: async () => null,
    uploadAudio: async () => undefined,
    synth: async () => streamOf('MP3', 'DATA'),
    ...overrides,
  };
}

describe('createTtsHandler', () => {
  it('400s without nid', async () => {
    const res = await createTtsHandler(makeDeps())(new Request('http://t/api/tts'));
    expect(res.status).toBe(400);
  });

  it('redirects to the cached file when present', async () => {
    const res = await createTtsHandler(
      makeDeps({ cachedUrl: async () => 'https://cdn/audio/tts/nid-1.mp3' }),
    )(new Request('http://t/api/tts?nid=nid-1'));
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('https://cdn/audio/tts/nid-1.mp3');
  });

  it('404s for unknown narratives', async () => {
    const res = await createTtsHandler(makeDeps({ findNarrative: async () => null }))(
      new Request('http://t/api/tts?nid=missing'),
    );
    expect(res.status).toBe(404);
  });

  it('streams synthesized audio and uploads it to the cache', async () => {
    const uploadAudio = vi.fn(async () => undefined);
    const synth = vi.fn(async () => streamOf('MP3', 'DATA'));
    const res = await createTtsHandler(makeDeps({ uploadAudio, synth }))(
      new Request('http://t/api/tts?nid=nid-1'),
    );
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(new TextDecoder().decode(bytes)).toBe('MP3DATA');
    expect(synth).toHaveBeenCalledWith(
      expect.stringContaining('Résumé.'),
      expect.any(String),
      'fr',
    );
    expect(uploadAudio).toHaveBeenCalledWith('tts/nid-1.mp3', expect.any(Uint8Array));
  });
});
