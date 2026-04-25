import { create } from 'zustand';
import type { FloorPlan, Museum } from '../domain/types';
import { getJSON, KEYS, remove, setJSON } from '../services/storage/preferences';

const TTL_MS = 1000 * 60 * 60 * 2; // 2h

interface PersistedSession {
  museum: Museum | null;
  floorPlan: FloorPlan | null;
  lastActiveAt: number;
}

interface SessionState {
  museum: Museum | null;
  floorPlan: FloorPlan | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setMuseum: (museum: Museum) => Promise<void>;
  setFloorPlan: (plan: FloorPlan) => Promise<void>;
  clear: () => Promise<void>;
}

const writeSession = async (
  museum: Museum | null,
  floorPlan: FloorPlan | null,
) => {
  const value: PersistedSession = {
    museum,
    floorPlan,
    lastActiveAt: Date.now(),
  };
  if (!museum && !floorPlan) {
    await remove(KEYS.session);
  } else {
    await setJSON(KEYS.session, value);
  }
};

export const useSession = create<SessionState>((set, get) => ({
  museum: null,
  floorPlan: null,
  hydrated: false,
  hydrate: async () => {
    const raw = await getJSON<PersistedSession>(KEYS.session);
    if (!raw) {
      set({ hydrated: true });
      return;
    }
    if (Date.now() - raw.lastActiveAt > TTL_MS) {
      await remove(KEYS.session);
      set({ hydrated: true });
      return;
    }
    set({
      museum: raw.museum,
      floorPlan: raw.floorPlan,
      hydrated: true,
    });
  },
  setMuseum: async (museum) => {
    set({ museum, floorPlan: null });
    await writeSession(museum, null);
  },
  setFloorPlan: async (plan) => {
    set({ floorPlan: plan });
    await writeSession(get().museum, plan);
  },
  clear: async () => {
    set({ museum: null, floorPlan: null });
    await remove(KEYS.session);
  },
}));
