import { Preferences } from '@capacitor/preferences';

export async function getJSON<T>(key: string): Promise<T | null> {
  const { value } = await Preferences.get({ key });
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(value) });
}

export async function remove(key: string): Promise<void> {
  await Preferences.remove({ key });
}

export const KEYS = {
  profile: 'profile.v1',
  journeyIndex: 'journey.index.v1',
  session: 'session.v1',
} as const;
