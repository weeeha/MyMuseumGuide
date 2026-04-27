import { create } from 'zustand';
import type { Interest, Language, Level, UserProfile } from '../domain/types';
import { getJSON, KEYS, setJSON } from '../services/storage/preferences';

interface UserProfileState {
  profile: UserProfile | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  save: (profile: UserProfile) => Promise<void>;
  patch: (patch: Partial<UserProfile>) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  setLevel: (level: Level) => Promise<void>;
  setInterests: (interests: Interest[]) => Promise<void>;
  reset: () => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  language: 'en',
  level: 'curious',
  interests: [],
  credits: 0,
  plan: 'free',
};

export const useUserProfile = create<UserProfileState>((set, get) => ({
  profile: null,
  hydrated: false,
  hydrate: async () => {
    const profile = await getJSON<UserProfile>(KEYS.profile);
    set({ profile, hydrated: true });
  },
  save: async (profile) => {
    await setJSON(KEYS.profile, profile);
    set({ profile });
  },
  patch: async (patch) => {
    const next = { ...(get().profile ?? DEFAULT_PROFILE), ...patch };
    await setJSON(KEYS.profile, next);
    set({ profile: next });
  },
  setLanguage: async (language) => get().patch({ language }),
  setLevel: async (level) => get().patch({ level }),
  setInterests: async (interests) => get().patch({ interests }),
  reset: async () => {
    await setJSON(KEYS.profile, DEFAULT_PROFILE);
    set({ profile: null });
  },
}));

export const buildInitialProfile = (
  language: Language,
  level: Level,
  interests: Interest[],
): UserProfile => ({
  ...DEFAULT_PROFILE,
  language,
  level,
  interests,
});
