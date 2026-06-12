import type { ArtifactMeta, StreamDone, StreamExtras } from '../../domain/aiEvents';
import type { CaptureRequest } from '../../domain/types';
import { downscaleDataUrl } from '../camera/resize';
import { getDeviceId } from '../identity/deviceId';
import { readSse } from './sse';

/**
 * Empty for same-origin (vercel dev / production). On a device pointed at a
 * remote backend, set VITE_API_BASE_URL to the deployment URL.
 */
const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? '';

export const ttsUrlFor = (narrativeId: string): string =>
  `/api/tts?nid=${narrativeId}`;

export const resolveApiUrl = (path: string): string =>
  path.startsWith('http') ? path : `${API_BASE}${path}`;

export interface IdentifyEvents {
  onMeta(meta: ArtifactMeta): void;
  onSummary(text: string): void;
  onDelta(text: string): void;
  onExtras(extras: StreamExtras): void;
  onDone(done: StreamDone): void;
  onError(message: string): void;
}

/**
 * POST the capture to /api/identify and dispatch SSE events as they arrive.
 * Resolves when the stream closes; transport failures surface via onError
 * (never thrown) so the UI has a single error path.
 */
export async function identifyArtifactStream(
  req: CaptureRequest,
  events: IdentifyEvents,
): Promise<void> {
  try {
    const photoDataUrl = await downscaleDataUrl(req.photoDataUrl);
    const res = await fetch(resolveApiUrl('/api/identify'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': await getDeviceId(),
      },
      body: JSON.stringify({
        photoDataUrl,
        museumId: req.museum?.id,
        museumName: req.museum?.name,
        language: req.language,
        level: req.level,
      }),
    });
    if (!res.ok || !res.body) {
      events.onError(`Identify failed (${res.status})`);
      return;
    }
    await readSse(res.body, (event, data) => {
      const payload = data ? (JSON.parse(data) as never) : ({} as never);
      switch (event) {
        case 'meta':
          events.onMeta(payload);
          break;
        case 'summary':
          events.onSummary((payload as { text: string }).text);
          break;
        case 'delta':
          events.onDelta((payload as { text: string }).text);
          break;
        case 'extras':
          events.onExtras(payload);
          break;
        case 'done':
          events.onDone(payload);
          break;
        case 'error':
          events.onError((payload as { message: string }).message);
          break;
      }
    });
  } catch (err) {
    events.onError(
      err instanceof Error ? err.message : 'Could not reach the guide',
    );
  }
}
