import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'audio';

export function createAudioCache(db: SupabaseClient) {
  return {
    async cachedUrl(path: string): Promise<string | null> {
      const dir = path.split('/').slice(0, -1).join('/');
      const name = path.split('/').pop() ?? path;
      const { data, error } = await db.storage.from(BUCKET).list(dir, { search: name });
      if (error || !data?.some((f) => f.name === name)) return null;
      return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    },
    async uploadAudio(path: string, bytes: Uint8Array): Promise<void> {
      const { error } = await db.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: 'audio/mpeg', upsert: true });
      if (error) throw new Error(`audio cache upload failed: ${error.message}`);
    },
  };
}
