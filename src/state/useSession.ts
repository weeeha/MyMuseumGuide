import { create } from 'zustand';
import type { FloorPlan, Museum } from '../domain/types';
import {
  deletePhoto,
  floorPlanPhotoPath,
  savePhoto,
} from '../services/storage/photos';
import { getJSON, KEYS, remove, setJSON } from '../services/storage/preferences';

const TTL_MS = 1000 * 60 * 60 * 2; // 2h

interface PersistedSession {
  museum: Museum | null;
  floorPlan: FloorPlan | null;
  lastActiveAt: number;
}

type StoredFloorPlan = Partial<FloorPlan> & {
  id: string;
  museumId: string;
  capturedAt: string;
  imagePath?: string;
  imageDataUrl?: string;
};

interface StoredPersistedSession {
  museum: Museum | null;
  floorPlan: StoredFloorPlan | null;
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

async function migrateLegacyFloorPlan(
  raw: StoredFloorPlan,
): Promise<FloorPlan | null> {
  if (raw.imagePath) {
    return {
      id: raw.id,
      museumId: raw.museumId,
      imagePath: raw.imagePath,
      detectedTopics: raw.detectedTopics,
      capturedAt: raw.capturedAt,
    };
  }
  if (raw.imageDataUrl) {
    try {
      const imagePath = floorPlanPhotoPath(raw.id);
      await savePhoto(imagePath, raw.imageDataUrl);
      return {
        id: raw.id,
        museumId: raw.museumId,
        imagePath,
        detectedTopics: raw.detectedTopics,
        capturedAt: raw.capturedAt,
      };
    } catch {
      return null;
    }
  }
  return null;
}

export const useSession = create<SessionState>((set, get) => ({
  museum: null,
  floorPlan: null,
  hydrated: false,
  hydrate: async () => {
    const raw = await getJSON<StoredPersistedSession>(KEYS.session);
    if (!raw) {
      set({ hydrated: true });
      return;
    }
    if (Date.now() - raw.lastActiveAt > TTL_MS) {
      if (raw.floorPlan?.imagePath) {
        await deletePhoto(raw.floorPlan.imagePath);
      }
      await remove(KEYS.session);
      set({ hydrated: true });
      return;
    }
    let floorPlan: FloorPlan | null = null;
    if (raw.floorPlan) {
      floorPlan = await migrateLegacyFloorPlan(raw.floorPlan);
      if (!floorPlan || raw.floorPlan.imageDataUrl) {
        await writeSession(raw.museum, floorPlan);
      }
    }
    set({
      museum: raw.museum,
      floorPlan,
      hydrated: true,
    });
  },
  setMuseum: async (museum) => {
    const previous = get().floorPlan;
    if (previous) {
      await deletePhoto(previous.imagePath);
    }
    set({ museum, floorPlan: null });
    await writeSession(museum, null);
  },
  setFloorPlan: async (plan) => {
    const previous = get().floorPlan;
    if (previous && previous.imagePath !== plan.imagePath) {
      await deletePhoto(previous.imagePath);
    }
    set({ floorPlan: plan });
    await writeSession(get().museum, plan);
  },
  clear: async () => {
    const previous = get().floorPlan;
    if (previous) {
      await deletePhoto(previous.imagePath);
    }
    set({ museum: null, floorPlan: null });
    await remove(KEYS.session);
  },
}));
