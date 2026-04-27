import { create } from 'zustand';
import type { JourneyEntry } from '../domain/types';
import {
  clearPhotoDir,
  deletePhoto,
  journeyPhotoPath,
  savePhoto,
} from '../services/storage/photos';
import { getJSON, KEYS, setJSON } from '../services/storage/preferences';

interface JourneyState {
  entries: JourneyEntry[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (entry: JourneyEntry) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

type StoredEntry = JourneyEntry & { photoDataUrl?: string };

async function migrateLegacyEntries(
  raw: StoredEntry[],
): Promise<{ entries: JourneyEntry[]; changed: boolean }> {
  let changed = false;
  const migrated: JourneyEntry[] = [];
  for (const entry of raw) {
    let photoPath = entry.photoPath;
    if (!photoPath && entry.photoDataUrl) {
      try {
        photoPath = journeyPhotoPath(entry.id);
        await savePhoto(photoPath, entry.photoDataUrl);
        changed = true;
      } catch {
        // Couldn't migrate the photo — drop the entry rather than carry a
        // dangling reference that would render a broken thumbnail.
        changed = true;
        continue;
      }
    }
    if (!photoPath) {
      changed = true;
      continue;
    }
    if (entry.photoDataUrl) {
      changed = true;
    }
    migrated.push({
      id: entry.id,
      museumId: entry.museumId,
      museumName: entry.museumName,
      capturedAt: entry.capturedAt,
      photoPath,
      artifact: entry.artifact,
      audioUrl: entry.audioUrl,
      notes: entry.notes,
    });
  }
  return { entries: migrated, changed };
}

export const useJourney = create<JourneyState>((set, get) => ({
  entries: [],
  hydrated: false,
  hydrate: async () => {
    const stored = await getJSON<StoredEntry[]>(KEYS.journeyIndex);
    if (!stored || stored.length === 0) {
      set({ entries: [], hydrated: true });
      return;
    }
    const { entries, changed } = await migrateLegacyEntries(stored);
    if (changed) {
      await setJSON(KEYS.journeyIndex, entries);
    }
    set({ entries, hydrated: true });
  },
  add: async (entry) => {
    const next = [entry, ...get().entries];
    await setJSON(KEYS.journeyIndex, next);
    set({ entries: next });
  },
  remove: async (id) => {
    const target = get().entries.find((e) => e.id === id);
    if (target) {
      await deletePhoto(target.photoPath);
    }
    const next = get().entries.filter((e) => e.id !== id);
    await setJSON(KEYS.journeyIndex, next);
    set({ entries: next });
  },
  clear: async () => {
    await clearPhotoDir('journey');
    await setJSON(KEYS.journeyIndex, []);
    set({ entries: [] });
  },
}));
