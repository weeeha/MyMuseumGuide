import { createAudioCache } from './_lib/audioCache';
import { synthElevenLabs } from './_lib/elevenlabs';
import { createNarrativesRepo } from './_lib/narrativesRepo';
import { getSupabase } from './_lib/supabase';
import { createTtsHandler } from './_lib/ttsCore';

const db = getSupabase();
const repo = createNarrativesRepo(db);
const audio = createAudioCache(db);

const handler = createTtsHandler({
  findNarrative: (id) => repo.findById(id),
  cachedUrl: (path) => audio.cachedUrl(path),
  uploadAudio: (path, bytes) => audio.uploadAudio(path, bytes),
  synth: synthElevenLabs,
});

export default handler;
