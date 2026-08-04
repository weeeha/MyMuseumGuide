#!/usr/bin/env node
/**
 * R1 acceptance gate (spec §8): real artifact photo → first words < 5 s,
 * audio start < 10 s. Measures the whole capture path end to end and prints
 * where the time actually goes.
 *
 *   npm run measure -- ./photo.jpg
 *   npm run measure -- ./photo.jpg --base https://museumlover.vercel.app
 *   npm run measure -- ./photo.jpg --museum mmfa --lang fr --level curious
 *
 * Note the phase breakdown: `done` must arrive before /api/tts can be called
 * at all, because the narrative id is minted at persist time. Audio therefore
 * starts after the *whole* narrative is generated, not alongside it.
 */
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const FIRST_WORDS_BUDGET_MS = 5_000;
const AUDIO_BUDGET_MS = 10_000;
const MAX_PAYLOAD = 2_000_000; // identifyCore rejects data URLs above this

const args = process.argv.slice(2);
const photoPath = args.find((a) => !a.startsWith('--'));
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

if (!photoPath) {
  console.error('Usage: npm run measure -- <photo.jpg> [--base URL] [--museum id] [--lang en] [--level curious]');
  process.exit(1);
}

const base = flag('base', 'http://localhost:3000').replace(/\/$/, '');
const mime = extname(photoPath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
const bytes = await readFile(photoPath);
const photoDataUrl = `data:${mime};base64,${bytes.toString('base64')}`;

if (photoDataUrl.length > MAX_PAYLOAD) {
  console.error(
    `Photo is ${(photoDataUrl.length / 1e6).toFixed(2)} MB as a data URL — the server rejects\n` +
      `anything over 2 MB. The app downscales to ~1280 px before upload; do the same here:\n` +
      `  sips -Z 1280 ${photoPath} --out /tmp/measure.jpg`,
  );
  process.exit(1);
}

const ms = (from, to) => (to == null ? null : Math.round(to - from));
const fmt = (v) => (v == null ? '  —  ' : `${String(v).padStart(5)} ms`);

console.log(`photo   ${photoPath} (${(photoDataUrl.length / 1e6).toFixed(2)} MB data URL)`);
console.log(`target  ${base}\n`);

const t0 = performance.now();
let res;
try {
  res = await fetch(`${base}/api/identify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      photoDataUrl,
      museumId: flag('museum', undefined),
      museumName: flag('museumName', undefined),
      language: flag('lang', 'en'),
      level: flag('level', 'curious'),
    }),
  });
} catch (err) {
  console.error(
    `Could not reach ${base} — ${err instanceof Error ? err.message : err}\n` +
      'Is the backend running? `npm run dev:full` serves the api/ functions;\n' +
      '`npm run dev` is Vite only and has no /api at all.',
  );
  process.exit(1);
}

if (!res.ok || !res.body) {
  console.error(`identify failed: HTTP ${res.status} — ${await res.text()}`);
  process.exit(1);
}

const marks = {};
let narrativeId = null;
let cached = null;
let story = '';
let summary = '';
let streamError = null;

const decoder = new TextDecoder();
let buffer = '';
for await (const chunk of res.body) {
  buffer += decoder.decode(chunk, { stream: true });
  const frames = buffer.split('\n\n');
  buffer = frames.pop() ?? '';
  for (const frame of frames) {
    const event = /^event:\s*(.+)$/m.exec(frame)?.[1]?.trim();
    const raw = /^data:\s*(.+)$/m.exec(frame)?.[1];
    if (!event || !raw) continue;
    const data = JSON.parse(raw);
    marks[event] ??= performance.now();
    if (event === 'summary') summary = data.text ?? '';
    if (event === 'delta') story += data.text ?? '';
    if (event === 'done') {
      narrativeId = data.narrativeId;
      cached = data.cached;
    }
    if (event === 'error') streamError = data.message;
  }
}

if (streamError) {
  console.error(`identify streamed an error: ${streamError}`);
  process.exit(1);
}

// Audio can only be requested once `done` has minted the narrative id.
let audioFirstByte = null;
let audioBytes = 0;
let audioError = null;
if (narrativeId) {
  const audioRes = await fetch(`${base}/api/tts?nid=${narrativeId}`);
  if (!audioRes.ok || !audioRes.body) {
    audioError = `HTTP ${audioRes.status}`;
  } else {
    // Drain to completion rather than cancelling on the first chunk: the
    // cache write lives in ttsCore's TransformStream flush(), so an early
    // cancel would leave the MP3 uncached and make a second run measure
    // another miss.
    const reader = audioRes.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      audioFirstByte ??= performance.now();
      audioBytes += value.length;
    }
  }
}

const firstWords = ms(t0, marks.summary);
const audioStart = ms(t0, audioFirstByte);

console.log('phase                        elapsed from capture');
console.log('─────────────────────────────────────────────────');
console.log(`meta (vision identify)       ${fmt(ms(t0, marks.meta))}`);
console.log(`summary (full paragraph)     ${fmt(firstWords)}`);
console.log(`extras (tags, follow-ups)    ${fmt(ms(t0, marks.extras))}`);
console.log(`done (narrative persisted)   ${fmt(ms(t0, marks.done))}`);
console.log(`audio first byte             ${fmt(audioStart)}${audioError ? ` (${audioError})` : ''}`);
console.log('');
console.log(`cache          ${cached === null ? 'unknown' : cached ? 'HIT (narrative already generated)' : 'MISS (fresh generation)'}`);
console.log(`narrative id   ${narrativeId ?? '—'}`);
console.log(`story length   ${story.length} chars`);
console.log(`audio size     ${audioBytes ? `${(audioBytes / 1024).toFixed(0)} KB` : '—'}`);
console.log('');
// The splitter emits `summary` only on the \n###\n delimiter, so this marks
// the *complete* summary paragraph, not the literal first word on screen.
console.log('note: "summary" fires when the whole paragraph is ready (narrativeSplitter');
console.log('      holds it until the delimiter), which is what the card renders.');
console.log('');

const verdict = (label, actual, budget) => {
  if (actual == null) return `[31m✗[0m ${label}: never arrived`;
  const ok = actual <= budget;
  return `${ok ? '[32m✓[0m' : '[31m✗[0m'} ${label}: ${actual} ms (budget ${budget} ms)`;
};

console.log(verdict('first words', firstWords, FIRST_WORDS_BUDGET_MS));
console.log(verdict('audio start', audioStart, AUDIO_BUDGET_MS));

if (summary) console.log(`\nsummary: ${summary.slice(0, 200)}${summary.length > 200 ? '…' : ''}`);

const passed =
  firstWords != null &&
  firstWords <= FIRST_WORDS_BUDGET_MS &&
  audioStart != null &&
  audioStart <= AUDIO_BUDGET_MS;
process.exit(passed ? 0 : 1);
