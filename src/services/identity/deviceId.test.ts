import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({
      value: store.get(key) ?? null,
    })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      store.set(key, value);
    }),
    remove: vi.fn(async ({ key }: { key: string }) => {
      store.delete(key);
    }),
  },
}));

import { getDeviceId } from './deviceId';

describe('getDeviceId', () => {
  beforeEach(() => {
    store.clear();
    vi.resetModules();
  });

  it('generates an id on first call and persists it', async () => {
    const id = await getDeviceId();
    expect(id).toMatch(/^[A-Za-z0-9_-]{21}$/);
    expect(await getDeviceId()).toBe(id);
    expect(store.get('device.id.v1')).toBe(JSON.stringify(id));
  });

  it('returns a previously persisted id on cold boot (storage path, not cache)', async () => {
    store.set('device.id.v1', JSON.stringify('seeded-device-id-abc1'));
    const { getDeviceId: coldBoot } = await import('./deviceId');
    expect(await coldBoot()).toBe('seeded-device-id-abc1');
  });
});
