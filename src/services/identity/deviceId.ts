import { nanoid } from 'nanoid';
import { getJSON, KEYS, setJSON } from '../storage/preferences';

let cached: string | null = null;

/**
 * Anonymous, persisted device id. Sent as `x-device-id` on every AI call —
 * used server-side for logs now and quota metering in R4. Never PII.
 */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  const stored = await getJSON<string>(KEYS.deviceId);
  if (stored) {
    cached = stored;
    return stored;
  }
  const fresh = nanoid(21);
  await setJSON(KEYS.deviceId, fresh);
  cached = fresh;
  return fresh;
}
