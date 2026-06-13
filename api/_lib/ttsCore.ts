import type { NarrativeRecord } from './narrativesRepo';
import { voiceFor } from './voices';

export interface TtsDeps {
  findNarrative(id: string): Promise<NarrativeRecord | null>;
  /** Public URL when the MP3 already exists in storage, else null. */
  cachedUrl(path: string): Promise<string | null>;
  uploadAudio(path: string, bytes: Uint8Array): Promise<void>;
  synth(text: string, voiceId: string, lang: string): Promise<ReadableStream<Uint8Array>>;
}

/**
 * GET /api/tts?nid=<narrativeId> — 302 to the cached MP3, or synthesize via
 * ElevenLabs, stream to the caller, and persist to the cache (spec §5.3).
 */
export function createTtsHandler(deps: TtsDeps) {
  return async function handler(req: Request): Promise<Response> {
    const nid = new URL(req.url).searchParams.get('nid');
    if (!nid) return new Response('Missing nid', { status: 400 });

    const path = `tts/${nid}.mp3`;
    const cached = await deps.cachedUrl(path);
    if (cached) {
      return new Response(null, { status: 302, headers: { Location: cached } });
    }

    const record = await deps.findNarrative(nid);
    if (!record) return new Response('Unknown narrative', { status: 404 });

    const text = `${record.summary}\n\n${record.story}`;
    const upstream = await deps.synth(text, voiceFor(record.lang), record.lang);

    const chunks: Uint8Array[] = [];
    const tee = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        chunks.push(chunk);
        controller.enqueue(chunk);
      },
      async flush() {
        const total = chunks.reduce((n, c) => n + c.length, 0);
        const all = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
          all.set(c, offset);
          offset += c.length;
        }
        try {
          await deps.uploadAudio(path, all);
        } catch {
          // Cache write is best-effort; the listener already has the audio.
        }
      },
    });

    return new Response(upstream.pipeThrough(tee), {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-cache' },
    });
  };
}
