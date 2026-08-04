#!/usr/bin/env node
/**
 * Provisioning smoke check — proves the four server env vars actually work
 * before anyone waits on a real capture to find out they don't.
 *
 *   npm run preflight
 *
 * Checks, in order of how annoying they are to debug later:
 *   1. narratives table reachable with the service-role key
 *   2. `audio` storage bucket exists and is public
 *   3. AI Gateway answers for both models the app uses
 *   4. ElevenLabs key is live and the Turbo voice id resolves
 *
 * Costs a fraction of a cent (two ~5-token completions, no TTS synthesis).
 */
import { generateText } from 'ai';

const IDENTIFY_MODEL = 'anthropic/claude-haiku-4.5';
const NARRATIVE_MODEL = 'anthropic/claude-fable-5';

let failed = 0;

function report(name, ok, detail) {
  const mark = ok ? '[32m✓[0m' : '[31m✗[0m';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed += 1;
}

async function check(name, fn) {
  try {
    report(name, true, await fn());
  } catch (err) {
    report(name, false, err instanceof Error ? err.message : String(err));
  }
}

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`missing — add it to .env`);
  return value;
}

await check('env vars present', () => {
  const names = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'AI_GATEWAY_API_KEY',
    'ELEVENLABS_API_KEY',
  ];
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) throw new Error(`missing ${missing.join(', ')}`);
  return `all ${names.length} set`;
});

await check('supabase: narratives table', async () => {
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(`${url}/rest/v1/narratives?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} — run supabase/migrations/0001_narratives.sql`);
  const rows = await res.json();
  return `reachable, ${rows.length} row(s) sampled`;
});

await check('supabase: audio bucket', async () => {
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(`${url}/storage/v1/bucket/audio`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} — run supabase/migrations/0002_audio_bucket.sql`);
  const bucket = await res.json();
  if (!bucket.public) throw new Error('bucket exists but is not public — cached audio URLs will 400');
  return 'exists, public';
});

for (const model of [IDENTIFY_MODEL, NARRATIVE_MODEL]) {
  await check(`ai gateway: ${model}`, async () => {
    env('AI_GATEWAY_API_KEY');
    const started = Date.now();
    const { text } = await generateText({
      model,
      prompt: 'Reply with the single word: ok',
    });
    return `${text.trim().slice(0, 12)} (${Date.now() - started} ms)`;
  });
}

await check('elevenlabs: key + turbo model', async () => {
  const res = await fetch('https://api.elevenlabs.io/v1/models', {
    headers: { 'xi-api-key': env('ELEVENLABS_API_KEY') },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const models = await res.json();
  const turbo = models.find((m) => m.model_id === 'eleven_turbo_v2_5');
  if (!turbo) throw new Error('eleven_turbo_v2_5 not available on this plan');
  return 'key valid, eleven_turbo_v2_5 available';
});

console.log('');
if (failed) {
  console.log(`[31m${failed} check(s) failed.[0m Fix the above, then re-run.`);
  process.exit(1);
}
console.log('[32mAll checks passed.[0m Backend is provisioned correctly.');
