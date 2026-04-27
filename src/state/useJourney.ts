import { create } from 'zustand';
import type { JourneyEntry } from '../domain/types';
import { getJSON, KEYS, setJSON } from '../services/storage/preferences';

interface JourneyState {
  entries: JourneyEntry[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (entry: JourneyEntry) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useJourney = create<JourneyState>((set, get) => ({
  entries: [],
  hydrated: false,
  hydrate: async () => {
    const stored = await getJSON<JourneyEntry[]>(KEYS.journeyIndex);
    set({ entries: stored ?? [], hydrated: true });
  },
  add: async (entry) => {
    const next = [entry, ...get().entries];
    await setJSON(KEYS.journeyIndex, next);
    set({ entries: next });
  },
  remove: async (id) => {
    const next = get().entries.filter((e) => e.id !== id);
    await setJSON(KEYS.journeyIndex, next);
    set({ entries: next });
  },
  clear: async () => {
    await setJSON(KEYS.journeyIndex, []);
    set({ entries: [] });
  },
}));
