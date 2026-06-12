import { artifactKey } from './artifactKey';
import type { ArtifactMeta, IdentifyRequestBody } from './identifyTypes';
import { createNarrativeSplitter } from './narrativeSplitter';
import type { NarrativesRepo } from './narrativesRepo';
import type { NarrativeInput } from './prompts';
import { sseEvent } from './sse';

export interface IdentifyDeps {
  stageOne(input: { photoDataUrl: string; context: string }): Promise<ArtifactMeta>;
  narrativeStream(input: NarrativeInput): AsyncIterable<string>;
  repo: NarrativesRepo;
  contextFor(museumId?: string): string;
  newId(): string;
}

function validate(raw: unknown): IdentifyRequestBody {
  const b = raw as Record<string, unknown> | null;
  if (!b || typeof b.photoDataUrl !== 'string' || !b.photoDataUrl.startsWith('data:image/')) {
    throw new Error('photoDataUrl must be an image data URL');
  }
  if (b.photoDataUrl.length > 2_000_000) {
    throw new Error('Photo is too large — please retake or pick a smaller image');
  }
  if (typeof b.language !== 'string' || typeof b.level !== 'string') {
    throw new Error('language and level are required');
  }
  return {
    photoDataUrl: b.photoDataUrl,
    museumId: typeof b.museumId === 'string' ? b.museumId : undefined,
    museumName: typeof b.museumName === 'string' ? b.museumName : undefined,
    language: b.language,
    level: b.level,
  };
}

/**
 * The identify pipeline (spec §5.2): stage 1 vision facts → cache lookup →
 * stream cached or freshly generated narrative as SSE. Dependency-injected
 * so the whole sequence is unit-testable without network.
 */
export function createIdentifyHandler(deps: IdentifyDeps) {
  return async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    let body: IdentifyRequestBody;
    try {
      body = validate(await req.json());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) =>
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        try {
          const context = deps.contextFor(body.museumId);
          const meta = await deps.stageOne({
            photoDataUrl: body.photoDataUrl,
            context,
          });
          send('meta', meta);

          const museumId = body.museumId ?? 'generic';
          const key = artifactKey(meta.title, meta.artist);
          const cached = await deps.repo.findByBucket(
            museumId,
            key,
            body.language,
            body.level,
          );
          if (cached) {
            send('summary', { text: cached.summary });
            send('delta', { text: cached.story });
            send('extras', { tags: cached.tags, followUps: cached.followUps });
            send('done', { narrativeId: cached.id, cached: true });
            return;
          }

          const splitter = createNarrativeSplitter({
            onSummary: (text) => send('summary', { text }),
            onDelta: (text) => send('delta', { text }),
          });
          for await (const chunk of deps.narrativeStream({
            meta,
            context,
            language: body.language,
            level: body.level,
            museumName: body.museumName,
          })) {
            splitter.push(chunk);
          }
          const result = splitter.end();
          send('extras', { tags: result.tags, followUps: result.followUps });

          const id = deps.newId();
          let narrativeId = id;
          try {
            await deps.repo.insert({
              id,
              museumId,
              artifactKey: key,
              lang: body.language,
              level: body.level,
              title: meta.title,
              artist: meta.artist,
              period: meta.period,
              origin: meta.origin,
              medium: meta.medium,
              summary: result.summary,
              story: result.story,
              tags: result.tags,
              followUps: result.followUps,
            });
            // A concurrent identical generation may have won the unique
            // constraint (insert swallows 23505) — re-read so the id we
            // hand out is the row that actually exists. /api/tts and R2
            // conversation both dereference it.
            const canonical = await deps.repo.findByBucket(
              museumId,
              key,
              body.language,
              body.level,
            );
            if (canonical) narrativeId = canonical.id;
          } catch (err) {
            // The story is already delivered — never convert a persistence
            // failure into a user-facing error. Worst case this id dangles
            // and Listen regenerates nothing; log and move on.
            console.error('narrative persist failed (non-fatal)', err);
          }
          send('done', { narrativeId, cached: false });
        } catch (err) {
          send('error', {
            message: err instanceof Error ? err.message : 'Identification failed',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  };
}
