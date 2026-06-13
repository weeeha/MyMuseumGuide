# R1 "Real Heart" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock AI loop with a real streaming backend — capture a photo, get a Fable 5 narrative streaming onto the card in < 5 s, ElevenLabs audio in < 10 s — plus the design-token foundation and refreshed repo docs.

**Architecture:** Vercel Functions (`api/`) in this same repo serve two endpoints: `POST /api/identify` (two-stage: Haiku 4.5 vision identification → Supabase narrative-cache lookup → Fable 5 streamed narrative, all relayed to the client as SSE) and `GET /api/tts?nid=…` (ElevenLabs streamed MP3, cached in Supabase Storage). The client's existing `aiClient` seam is swapped from mock to a streaming consumer; `CapturePage` gains a streaming phase; a new audio player adds Media Session lock-screen metadata. Museum design tokens (`--ml-*` CSS variables) land via a `MuseumThemeController`.

**Tech Stack:** Vite 5 + React 19 + Ionic 8 + Capacitor 8 (existing) · Vercel Functions (Node, Web `Request`/`Response`) · AI SDK (`ai` package, Vercel AI Gateway model strings) · `@supabase/supabase-js` · ElevenLabs REST · Vitest.

**Spec:** `docs/superpowers/specs/2026-06-11-museumlover-replan-design.md` (R1 row of §8; architecture §5; design language §6).

---

## Context for the implementing engineer

- **Repo state:** Phases 0–3a.5 are done. The capture loop works end-to-end against `src/services/ai/mock.ts`. Photos are filesystem-backed (photo saved *before* AI runs — preserve this invariant).
- **Run things with:** `npm run dev` (Vite only, client mock), `npm run dev:full` (added in Task 1: `vercel dev` = client + functions), `npx vitest run` (all tests once), `npm run lint`, `npm run build`, `npm run typecheck:api` (added in Task 1).
- **Tests:** colocate as `*.test.ts(x)` next to the source file. Vitest is configured in `vite.config.ts` (globals on, jsdom).
- **Conventions:** zustand stores in `src/state/`, services in `src/services/<area>/`, 2-space indent, single quotes, JSDoc block comments on exported functions where non-obvious. Follow the existing style you see in neighboring files.
- **Two manual gates need a human:** Supabase project provisioning (Task 2) and filling `.env` with real keys (Task 2) — flag and pause if credentials are missing rather than inventing them.
- **Cache-bucket rule (spec §5.3):** narratives are cached by museum + artifact + language + level. Therefore `interests` must NOT appear in the narrative prompt (it would fragment the cache). Interests drive the visit plan in R3 instead.
- **Out of R1 scope:** floor-plan parsing stays mocked; conversation (`/api/converse`) is R2; visit dashboard/plan/memory book are R3; quota enforcement is R4 (we *do* send `x-device-id` from day one); native earbud detection is R4 (autoplay stays off in R1 — the Listen button is always shown).

## File map (created → responsibility)

```
api/
  tsconfig.json              TS config for functions (node types, no emit)
  identify.ts                POST /api/identify — wires real deps into identifyCore
  tts.ts                     GET /api/tts — wires real deps into ttsCore
  _lib/
    env.ts                   requireEnv() with clear failure messages
    sse.ts                   sseEvent() encoder for SSE frames
    voices.ts                ElevenLabs voice selection per language
    artifactKey.ts           slug for the cache bucket key
    narrativesRepo.ts        Supabase narratives table repo (injectable client)
    audioCache.ts            Supabase Storage adapter for cached MP3s
    museumContext.ts         per-museum curated context packs (MMFA golden path)
    prompts.ts               identifyPrompt() + narrativePrompt() builders
    narrativeSplitter.ts     parses "summary ### story ### extras-JSON" streams
    identifyCore.ts          createIdentifyHandler(deps) — the SSE pipeline
    ttsCore.ts               createTtsHandler(deps) — cache-or-synthesize pipeline
    ai.ts                    real stageOne()/narrativeStream() via AI SDK gateway
    elevenlabs.ts            synthElevenLabs() streaming fetch
supabase/migrations/0001_narratives.sql   table DDL (applied manually, committed)
src/domain/aiEvents.ts       ArtifactMeta + stream event payload types
src/services/camera/resize.ts             client-side downscale to ≤1280px
src/services/identity/deviceId.ts         anonymous persisted device id
src/services/ai/sse.ts                    SSE parser + readSse()
src/services/ai/identify.ts               identifyArtifactStream() + URL helpers
src/services/audio/player.ts              NarrationPlayer + Media Session
src/features/capture/streamingPhase.ts    pure reducer for streaming capture UI
src/theme/museumThemes.ts                 MuseumTheme data + applyTheme()
src/app/MuseumThemeController.tsx         sets --ml-* vars from session museum
.env.example                              all required env vars, documented
Modified: src/domain/types.ts, src/services/ai/client.ts, src/services/ai/mock.ts,
          src/features/capture/CapturePage.tsx, src/ui/ArtifactCard.tsx,
          src/theme/variables.css, src/index.css, src/App.tsx,
          vercel.json, package.json, CLAUDE.md, PROJECT.md
```

---

### Task 1: Foundation — dependencies, env scaffolding, API workspace

**Files:**
- Modify: `package.json` (deps + scripts)
- Create: `api/tsconfig.json`
- Create: `.env.example`
- Modify: `vercel.json`

- [ ] **Step 1: Install dependencies**

```bash
npm install ai @supabase/supabase-js
npm install -D @types/node
```

Expected: `package.json` gains `ai` and `@supabase/supabase-js` in `dependencies`, `@types/node` in `devDependencies`; install exits 0.

- [ ] **Step 2: Add scripts to `package.json`**

In the `"scripts"` block, add two entries (keep existing ones unchanged):

```json
    "dev:full": "vercel dev",
    "typecheck:api": "tsc -p api/tsconfig.json --noEmit",
```

- [ ] **Step 3: Create `api/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["node"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["."]
}
```

(The root `tsconfig.json` includes only `src`, so `npm run build` ignores `api/`; this config gives functions their own typecheck via `npm run typecheck:api`.)

- [ ] **Step 4: Create `.env.example`**

```bash
# ---- Server (Vercel Functions) — never shipped to the client ----
# Vercel AI Gateway key (local dev; on Vercel deploys OIDC is used automatically)
AI_GATEWAY_API_KEY=
# ElevenLabs TTS
ELEVENLABS_API_KEY=
# Supabase project (Settings → API)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# ---- Client (Vite, baked into the bundle — public) ----
# Leave empty for same-origin (vercel dev / production). Set to the deployed
# backend URL when running the app on a device against a remote backend.
VITE_API_BASE_URL=
# Set to 'true' to run the UI against the in-app mock instead of /api.
VITE_USE_MOCK_AI=
```

- [ ] **Step 5: Make the SPA rewrite API-safe in `vercel.json`**

Replace the whole file with:

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 6: Verify**

```bash
npm run typecheck:api && npm run lint && npx vitest run
```

Expected: all pass (`api/` has no files yet — tsc exits 0 on empty include with `noEmit`; if tsc complains about no inputs, that's fine to see *until* Task 6 adds the first file — in that case skip `typecheck:api` here and run it from Task 6 onward).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json api/tsconfig.json .env.example vercel.json
git commit -m "chore(r1): backend workspace, deps, env scaffolding"
```

---

### Task 2: Supabase project — schema + storage bucket (HUMAN-ASSISTED)

**Files:**
- Create: `supabase/migrations/0001_narratives.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- Narrative cache: one row per museum + artifact + language + level bucket.
-- Spec §5.3 — ten visitors photographing the same Monet pay for one
-- generation per bucket.
create table if not exists narratives (
  id uuid primary key,
  museum_id text not null,
  artifact_key text not null,
  lang text not null,
  level text not null,
  title text not null,
  artist text,
  period text,
  origin text,
  medium text,
  summary text not null,
  story text not null,
  tags jsonb not null default '[]',
  follow_ups jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (museum_id, artifact_key, lang, level)
);

-- Service-role key is the only consumer; lock the table down.
alter table narratives enable row level security;
```

- [ ] **Step 2 (HUMAN): Provision Supabase**

A human must do this once (pause and ask if you are an agent without credentials):
1. Create a Supabase project (region `us-east-1` per spec §5.2).
2. Run the SQL above in the Supabase SQL editor.
3. Storage → create bucket `audio`, **Public bucket: ON**.
4. Copy `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Settings → API) into local `.env`.
5. Also fill `AI_GATEWAY_API_KEY` (Vercel dashboard → AI Gateway) and `ELEVENLABS_API_KEY` in `.env`.
6. `vercel link` the repo and add the same four server vars with `vercel env add <NAME>` (or the dashboard) so `vercel dev` and deploys see them.

- [ ] **Step 3: Verify table exists**

```bash
curl -s "$SUPABASE_URL/rest/v1/narratives?select=id&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Expected: `[]` (empty JSON array, HTTP 200).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_narratives.sql
git commit -m "feat(r1): narratives cache schema"
```

---

### Task 3: Domain types — themes, narrative id, stream events

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/aiEvents.ts`

- [ ] **Step 1: Add `MuseumTheme` and extend `Museum` + `ArtifactInfo` in `src/domain/types.ts`**

Insert after the `Museum` interface (keep everything else as-is):

```ts
/** Per-museum design tokens (spec §6.2). */
export interface MuseumTheme {
  accent: string;
  onAccent: string;
  surfaceTint: string;
  canvas: 'warm' | 'cool' | 'stone';
  titleFont: 'serif' | 'sans';
}
```

Add to the `Museum` interface:

```ts
  theme?: MuseumTheme;
```

Add to the `ArtifactInfo` interface (after `followUps`):

```ts
  /** Server-side narrative cache id — keys TTS and (R2) conversation. */
  narrativeId?: string;
```

- [ ] **Step 2: Create `src/domain/aiEvents.ts`**

```ts
import type { FollowUp } from './types';

/** Stage-1 identification facts, sent as the first SSE event. */
export interface ArtifactMeta {
  title: string;
  artist?: string;
  period?: string;
  origin?: string;
  medium?: string;
}

export interface StreamExtras {
  tags: string[];
  followUps: Omit<FollowUp, 'id'>[];
}

export interface StreamDone {
  narrativeId: string;
  cached: boolean;
}
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/domain/types.ts src/domain/aiEvents.ts
git commit -m "feat(r1): domain types for themes and streaming events"
```

---

### Task 4: Client utils — image downscale + device id

**Files:**
- Create: `src/services/camera/resize.ts`, `src/services/camera/resize.test.ts`
- Create: `src/services/identity/deviceId.ts`, `src/services/identity/deviceId.test.ts`
- Modify: `src/services/storage/preferences.ts` (one new key)

- [ ] **Step 1: Write the failing test `src/services/camera/resize.test.ts`**

```ts
import { computeTargetSize } from './resize';

describe('computeTargetSize', () => {
  it('keeps images already within the limit', () => {
    expect(computeTargetSize(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });

  it('scales the long edge down to the limit, preserving aspect', () => {
    expect(computeTargetSize(4032, 3024, 1280)).toEqual({ width: 1280, height: 960 });
  });

  it('handles portrait orientation', () => {
    expect(computeTargetSize(3024, 4032, 1280)).toEqual({ width: 960, height: 1280 });
  });
});
```

- [ ] **Step 2: Run it — expect failure**

```bash
npx vitest run src/services/camera/resize.test.ts
```

Expected: FAIL — `Cannot find module './resize'`.

- [ ] **Step 3: Implement `src/services/camera/resize.ts`**

```ts
/** Largest edge we send to the backend (spec §5.1 — guardrails). */
export const MAX_UPLOAD_EDGE = 1280;

export function computeTargetSize(
  width: number,
  height: number,
  maxEdge = MAX_UPLOAD_EDGE,
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width, height };
  const scale = maxEdge / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode captured image'));
    img.src = dataUrl;
  });
}

/**
 * Downscale a data-URL photo so its long edge is ≤ maxEdge. Returns the
 * original data URL when it is already small enough or when canvas is
 * unavailable (we never block a capture on resizing).
 */
export async function downscaleDataUrl(
  dataUrl: string,
  maxEdge = MAX_UPLOAD_EDGE,
  quality = 0.82,
): Promise<string> {
  try {
    const img = await loadImage(dataUrl);
    const { width, height } = computeTargetSize(
      img.naturalWidth,
      img.naturalHeight,
      maxEdge,
    );
    if (width === img.naturalWidth && height === img.naturalHeight) {
      return dataUrl;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return dataUrl;
  }
}
```

- [ ] **Step 4: Run the test — expect pass**

```bash
npx vitest run src/services/camera/resize.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Add the device-id preference key**

In `src/services/storage/preferences.ts`, extend `KEYS`:

```ts
export const KEYS = {
  profile: 'profile.v1',
  journeyIndex: 'journey.index.v1',
  session: 'session.v1',
  deviceId: 'device.id.v1',
} as const;
```

- [ ] **Step 6: Write the failing test `src/services/identity/deviceId.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({
      value: store.get(key) ?? null,
    })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      store.set(key, value);
    }),
    remove: vi.fn(async ({ key }: { key: string }) => {
      store.delete(key);
    }),
  },
}));

import { getDeviceId } from './deviceId';

describe('getDeviceId', () => {
  beforeEach(() => store.clear());

  it('generates an id on first call and persists it', async () => {
    const id = await getDeviceId();
    expect(id).toMatch(/^[A-Za-z0-9_-]{16,}$/);
    expect(await getDeviceId()).toBe(id);
  });
});
```

- [ ] **Step 7: Run it — expect failure**

```bash
npx vitest run src/services/identity/deviceId.test.ts
```

Expected: FAIL — `Cannot find module './deviceId'`.

- [ ] **Step 8: Implement `src/services/identity/deviceId.ts`**

```ts
import { nanoid } from 'nanoid';
import { getJSON, KEYS, setJSON } from '../storage/preferences';

let cached: string | null = null;

/**
 * Anonymous, persisted device id. Sent as `x-device-id` on every AI call —
 * used server-side for logs now and quota metering in R4. Never PII.
 */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  const stored = await getJSON<string>(KEYS.deviceId);
  if (stored) {
    cached = stored;
    return stored;
  }
  const fresh = nanoid(21);
  await setJSON(KEYS.deviceId, fresh);
  cached = fresh;
  return fresh;
}
```

- [ ] **Step 9: Run tests — expect pass**

```bash
npx vitest run src/services/identity/deviceId.test.ts src/services/camera/resize.test.ts
```

Expected: 4 passed.

- [ ] **Step 10: Commit**

```bash
git add src/services/camera/resize.ts src/services/camera/resize.test.ts \
  src/services/identity/deviceId.ts src/services/identity/deviceId.test.ts \
  src/services/storage/preferences.ts
git commit -m "feat(r1): client downscale and anonymous device id"
```

---

### Task 5: Client SSE parser

**Files:**
- Create: `src/services/ai/sse.ts`, `src/services/ai/sse.test.ts`

- [ ] **Step 1: Write the failing test `src/services/ai/sse.test.ts`**

```ts
import { createSseParser } from './sse';

describe('createSseParser', () => {
  it('parses a single complete event', () => {
    const events: [string, string][] = [];
    const p = createSseParser((e, d) => events.push([e, d]));
    p.push('event: meta\ndata: {"title":"Sunrise"}\n\n');
    p.end();
    expect(events).toEqual([['meta', '{"title":"Sunrise"}']]);
  });

  it('handles events split across pushes at arbitrary boundaries', () => {
    const events: [string, string][] = [];
    const p = createSseParser((e, d) => events.push([e, d]));
    p.push('event: del');
    p.push('ta\ndata: {"text":"he');
    p.push('llo"}\n');
    p.push('\nevent: done\ndata: {}\n\n');
    p.end();
    expect(events).toEqual([
      ['delta', '{"text":"hello"}'],
      ['done', '{}'],
    ]);
  });

  it('defaults the event name to "message" when absent', () => {
    const events: [string, string][] = [];
    const p = createSseParser((e, d) => events.push([e, d]));
    p.push('data: plain\n\n');
    p.end();
    expect(events).toEqual([['message', 'plain']]);
  });
});
```

- [ ] **Step 2: Run it — expect failure**

```bash
npx vitest run src/services/ai/sse.test.ts
```

Expected: FAIL — `Cannot find module './sse'`.

- [ ] **Step 3: Implement `src/services/ai/sse.ts`**

```ts
export interface SseParser {
  push(chunk: string): void;
  end(): void;
}

/**
 * Minimal SSE parser. Buffers partial frames across pushes; emits
 * (event, data) per complete frame. Multi-line data is joined with \n
 * per the SSE spec.
 */
export function createSseParser(
  onEvent: (event: string, data: string) => void,
): SseParser {
  let buffer = '';

  const flushBlock = (block: string) => {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
    }
    if (dataLines.length > 0) onEvent(event, dataLines.join('\n'));
  };

  return {
    push(chunk) {
      buffer += chunk;
      let idx = buffer.indexOf('\n\n');
      while (idx !== -1) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (block.trim()) flushBlock(block);
        idx = buffer.indexOf('\n\n');
      }
    },
    end() {
      if (buffer.trim()) flushBlock(buffer);
      buffer = '';
    },
  };
}

/** Drain a fetch Response body through the SSE parser. */
export async function readSse(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: string, data: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser(onEvent);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.push(decoder.decode(value, { stream: true }));
  }
  parser.end();
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run src/services/ai/sse.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/services/ai/sse.ts src/services/ai/sse.test.ts
git commit -m "feat(r1): client SSE parser"
```

---

### Task 6: Server lib — env guard, SSE encoder, voices

**Files:**
- Create: `api/_lib/env.ts`, `api/_lib/env.test.ts`
- Create: `api/_lib/sse.ts`, `api/_lib/sse.test.ts`
- Create: `api/_lib/voices.ts`, `api/_lib/voices.test.ts`

- [ ] **Step 1: Write the failing tests**

`api/_lib/env.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { requireEnv } from './env';

describe('requireEnv', () => {
  afterEach(() => {
    delete process.env.R1_TEST_VAR;
  });

  it('returns the value when set', () => {
    process.env.R1_TEST_VAR = 'abc';
    expect(requireEnv('R1_TEST_VAR')).toBe('abc');
  });

  it('throws a clear message when missing', () => {
    expect(() => requireEnv('R1_TEST_VAR')).toThrow(
      'Missing required environment variable: R1_TEST_VAR',
    );
  });
});
```

`api/_lib/sse.test.ts`:

```ts
import { sseEvent } from './sse';

describe('sseEvent', () => {
  it('encodes an event frame with JSON data', () => {
    expect(sseEvent('meta', { title: 'X' })).toBe(
      'event: meta\ndata: {"title":"X"}\n\n',
    );
  });
});
```

`api/_lib/voices.test.ts`:

```ts
import { DEFAULT_VOICE_ID, voiceFor } from './voices';

describe('voiceFor', () => {
  it('falls back to the default voice for unmapped languages', () => {
    expect(voiceFor('uk')).toBe(DEFAULT_VOICE_ID);
  });

  it('returns the default voice for English', () => {
    expect(voiceFor('en')).toBe(DEFAULT_VOICE_ID);
  });
});
```

- [ ] **Step 2: Run them — expect failure**

```bash
npx vitest run api/_lib
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`api/_lib/env.ts`:

```ts
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        'Copy .env.example to .env and fill it (see Task 2 of the R1 plan).',
    );
  }
  return value;
}
```

`api/_lib/sse.ts`:

```ts
/** Encode one SSE frame. Data is always JSON. */
export function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
```

`api/_lib/voices.ts`:

```ts
/**
 * ElevenLabs voice selection. One multilingual default voice in v1
 * ("Rachel", a premade voice); per-language overrides slot in here as the
 * voice direction matures (spec open question — one voice per language).
 */
export const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export const VOICE_BY_LANG: Partial<Record<string, string>> = {};

export function voiceFor(lang: string): string {
  return VOICE_BY_LANG[lang] ?? DEFAULT_VOICE_ID;
}
```

- [ ] **Step 4: Run tests + typecheck — expect pass**

```bash
npx vitest run api/_lib && npm run typecheck:api
```

Expected: 5 passed; tsc exit 0.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/env.ts api/_lib/env.test.ts api/_lib/sse.ts api/_lib/sse.test.ts \
  api/_lib/voices.ts api/_lib/voices.test.ts
git commit -m "feat(r1): server env guard, sse encoder, voice map"
```

---

### Task 7: Server lib — artifact key + narratives repo

**Files:**
- Create: `api/_lib/artifactKey.ts`, `api/_lib/artifactKey.test.ts`
- Create: `api/_lib/narrativesRepo.ts`, `api/_lib/narrativesRepo.test.ts`

- [ ] **Step 1: Write the failing test `api/_lib/artifactKey.test.ts`**

```ts
import { artifactKey } from './artifactKey';

describe('artifactKey', () => {
  it('slugs title and artist, stripping diacritics and punctuation', () => {
    expect(artifactKey('Impression, soleil levant', 'Claude Monet')).toBe(
      'impression-soleil-levant--claude-monet',
    );
  });

  it('uses "unknown" when artist is missing', () => {
    expect(artifactKey('Amphore romaine')).toBe('amphore-romaine--unknown');
  });

  it('collapses repeated separators', () => {
    expect(artifactKey('Sans titre — nº 7', 'C. Tousignant')).toBe(
      'sans-titre-no-7--c-tousignant',
    );
  });
});
```

- [ ] **Step 2: Run it — expect failure**

```bash
npx vitest run api/_lib/artifactKey.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `api/_lib/artifactKey.ts`**

```ts
function slug(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Cache-bucket key for a narrative (spec §5.3). Same artwork ⇒ same key,
 * regardless of how the photo was taken.
 */
export function artifactKey(title: string, artist?: string): string {
  return `${slug(title)}--${slug(artist ?? 'unknown')}`;
}
```

Note: `nº` normalizes via NFKD to `no` (`º` → `o`); that is what the third test asserts.

- [ ] **Step 4: Run it — expect pass**

```bash
npx vitest run api/_lib/artifactKey.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Write the failing test `api/_lib/narrativesRepo.test.ts`**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createNarrativesRepo, type NarrativeRecord } from './narrativesRepo';

const record: NarrativeRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  museumId: 'mmfa',
  artifactKey: 'impression-soleil-levant--claude-monet',
  lang: 'en',
  level: 'curious',
  title: 'Impression, soleil levant',
  artist: 'Claude Monet',
  period: '1872',
  origin: 'France',
  medium: 'Oil on canvas',
  summary: 'The painting that named a movement.',
  story: 'Look at the orange disc…',
  tags: ['impressionism'],
  followUps: [{ prompt: 'What movement is this?', kind: 'movement' }],
};

function fakeSupabase(row: unknown) {
  const maybeSingle = vi.fn(async () => ({ data: row, error: null }));
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    insert: vi.fn(async () => ({ error: null })),
    maybeSingle,
  };
  return { from: vi.fn(() => chain), chain };
}

describe('createNarrativesRepo', () => {
  it('maps a snake_case row to a NarrativeRecord on findByBucket', async () => {
    const db = fakeSupabase({
      id: record.id,
      museum_id: 'mmfa',
      artifact_key: record.artifactKey,
      lang: 'en',
      level: 'curious',
      title: record.title,
      artist: record.artist,
      period: record.period,
      origin: record.origin,
      medium: record.medium,
      summary: record.summary,
      story: record.story,
      tags: record.tags,
      follow_ups: record.followUps,
    });
    const repo = createNarrativesRepo(db as never);
    const found = await repo.findByBucket('mmfa', record.artifactKey, 'en', 'curious');
    expect(found).toEqual(record);
    expect(db.from).toHaveBeenCalledWith('narratives');
  });

  it('returns null when no row matches', async () => {
    const db = fakeSupabase(null);
    const repo = createNarrativesRepo(db as never);
    expect(await repo.findById('missing')).toBeNull();
  });

  it('inserts snake_case columns', async () => {
    const db = fakeSupabase(null);
    const repo = createNarrativesRepo(db as never);
    await repo.insert(record);
    expect(db.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        museum_id: 'mmfa',
        artifact_key: record.artifactKey,
        follow_ups: record.followUps,
      }),
    );
  });
});
```

- [ ] **Step 6: Run it — expect failure**

```bash
npx vitest run api/_lib/narrativesRepo.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 7: Implement `api/_lib/narrativesRepo.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface NarrativeRecord {
  id: string;
  museumId: string;
  artifactKey: string;
  lang: string;
  level: string;
  title: string;
  artist?: string;
  period?: string;
  origin?: string;
  medium?: string;
  summary: string;
  story: string;
  tags: string[];
  followUps: { prompt: string; kind: string }[];
}

export interface NarrativesRepo {
  findByBucket(
    museumId: string,
    artifactKey: string,
    lang: string,
    level: string,
  ): Promise<NarrativeRecord | null>;
  findById(id: string): Promise<NarrativeRecord | null>;
  insert(record: NarrativeRecord): Promise<void>;
}

type Row = {
  id: string;
  museum_id: string;
  artifact_key: string;
  lang: string;
  level: string;
  title: string;
  artist: string | null;
  period: string | null;
  origin: string | null;
  medium: string | null;
  summary: string;
  story: string;
  tags: string[];
  follow_ups: { prompt: string; kind: string }[];
};

function toRecord(row: Row): NarrativeRecord {
  return {
    id: row.id,
    museumId: row.museum_id,
    artifactKey: row.artifact_key,
    lang: row.lang,
    level: row.level,
    title: row.title,
    artist: row.artist ?? undefined,
    period: row.period ?? undefined,
    origin: row.origin ?? undefined,
    medium: row.medium ?? undefined,
    summary: row.summary,
    story: row.story,
    tags: row.tags ?? [],
    followUps: row.follow_ups ?? [],
  };
}

export function createNarrativesRepo(db: SupabaseClient): NarrativesRepo {
  return {
    async findByBucket(museumId, artifactKey, lang, level) {
      const { data, error } = await db
        .from('narratives')
        .select('*')
        .eq('museum_id', museumId)
        .eq('artifact_key', artifactKey)
        .eq('lang', lang)
        .eq('level', level)
        .maybeSingle();
      if (error) throw new Error(`narratives lookup failed: ${error.message}`);
      return data ? toRecord(data as Row) : null;
    },
    async findById(id) {
      const { data, error } = await db
        .from('narratives')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(`narratives lookup failed: ${error.message}`);
      return data ? toRecord(data as Row) : null;
    },
    async insert(record) {
      const { error } = await db.from('narratives').insert({
        id: record.id,
        museum_id: record.museumId,
        artifact_key: record.artifactKey,
        lang: record.lang,
        level: record.level,
        title: record.title,
        artist: record.artist ?? null,
        period: record.period ?? null,
        origin: record.origin ?? null,
        medium: record.medium ?? null,
        summary: record.summary,
        story: record.story,
        tags: record.tags,
        follow_ups: record.followUps,
      });
      // Unique-violation race (two visitors, same Monet, same moment) is
      // benign: the first insert wins and both users already got their
      // stream. Swallow 23505, surface everything else.
      if (error && error.code !== '23505') {
        throw new Error(`narratives insert failed: ${error.message}`);
      }
    },
  };
}
```

- [ ] **Step 8: Run tests — expect pass**

```bash
npx vitest run api/_lib && npm run typecheck:api
```

Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add api/_lib/artifactKey.ts api/_lib/artifactKey.test.ts \
  api/_lib/narrativesRepo.ts api/_lib/narrativesRepo.test.ts
git commit -m "feat(r1): artifact cache key and narratives repo"
```

---

### Task 8: Server lib — museum context packs + prompt builders

**Files:**
- Create: `api/_lib/museumContext.ts`, `api/_lib/museumContext.test.ts`
- Create: `api/_lib/prompts.ts`, `api/_lib/prompts.test.ts`

- [ ] **Step 1: Write the failing tests**

`api/_lib/museumContext.test.ts`:

```ts
import { contextForMuseum } from './museumContext';

describe('contextForMuseum', () => {
  it('returns the curated MMFA pack', () => {
    expect(contextForMuseum('mmfa')).toContain('Montreal Museum of Fine Arts');
  });

  it('returns empty string for unknown museums', () => {
    expect(contextForMuseum('some-scanned-museum')).toBe('');
    expect(contextForMuseum(undefined)).toBe('');
  });
});
```

`api/_lib/prompts.test.ts`:

```ts
import { identifyPrompt, narrativePrompt } from './prompts';

describe('identifyPrompt', () => {
  it('demands strict JSON and mentions the wall label', () => {
    const p = identifyPrompt('CONTEXT PACK TEXT');
    expect(p).toContain('JSON');
    expect(p).toContain('wall label');
    expect(p).toContain('CONTEXT PACK TEXT');
  });
});

describe('narrativePrompt', () => {
  const base = {
    meta: { title: 'Impression, soleil levant', artist: 'Claude Monet' },
    context: 'PACK',
    language: 'fr',
    level: 'curious',
    museumName: 'Montreal Museum of Fine Arts',
  };

  it('names the output language and the level', () => {
    const p = narrativePrompt(base);
    expect(p).toContain('French');
    expect(p).toContain('curious');
  });

  it('specifies the three-section ### format and the spoken invitation', () => {
    const p = narrativePrompt(base);
    expect(p.match(/###/g)?.length).toBeGreaterThanOrEqual(2);
    expect(p).toContain('invitation');
    expect(p).toContain('followUps');
  });

  it('does not mention interests (cache-bucket rule, spec §5.3)', () => {
    expect(narrativePrompt(base)).not.toContain('interest');
  });
});
```

- [ ] **Step 2: Run them — expect failure**

```bash
npx vitest run api/_lib/museumContext.test.ts api/_lib/prompts.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `api/_lib/museumContext.ts`**

```ts
/**
 * Curated per-museum context packs injected into prompts (spec §5.4).
 * MMFA is the launch golden path. Other listed museums get a thin pack;
 * scanned/unknown museums get ''.
 */
const PACKS: Record<string, string> = {
  mmfa: [
    'Museum: Montreal Museum of Fine Arts (Musée des beaux-arts de Montréal), Canada.',
    'Collection strengths: Quebec and Canadian art (including the Quebec Pavilion),',
    'European Old Masters (Rembrandt, El Greco, Veronese circle), Impressionism and',
    'post-Impressionism (Monet, Renoir, Cézanne), decorative arts and design,',
    'Indigenous art, and international contemporary art.',
    'Labels are bilingual French/English. Wall labels usually carry title, artist,',
    'date, medium, and credit line — trust a legible label over visual guessing.',
  ].join(' '),
  moma: 'Museum: Museum of Modern Art, New York. Strengths: modern and contemporary art, photography, design, film.',
  met: 'Museum: The Metropolitan Museum of Art, New York. Encyclopedic: Egyptian art, European paintings, Greek and Roman, the American Wing, Asian art.',
  louvre:
    'Museum: Musée du Louvre, Paris. Strengths: Egyptian antiquities, Greek and Roman sculpture, Italian and French painting. Labels in French.',
  'tate-modern':
    'Museum: Tate Modern, London. Strengths: international modern and contemporary art, performance, photography.',
  rijksmuseum:
    'Museum: Rijksmuseum, Amsterdam. Strengths: Dutch Golden Age painting (Rembrandt, Vermeer), Asian art, decorative arts. Labels in Dutch and English.',
};

export function contextForMuseum(museumId?: string): string {
  if (!museumId) return '';
  return PACKS[museumId] ?? '';
}
```

- [ ] **Step 4: Implement `api/_lib/prompts.ts`**

```ts
import type { ArtifactMeta } from './identifyTypes';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  uk: 'Ukrainian',
  ja: 'Japanese',
  zh: 'Chinese',
};

const LEVEL_NOTES: Record<string, string> = {
  curious: 'a curious first-timer: warm, vivid, zero jargon',
  informed: 'an informed amateur: context, technique, and history welcome',
  scholarly: 'a scholarly visitor: references, debates, and precision welcome',
};

export function identifyPrompt(context: string): string {
  return [
    'You are the identification stage of a museum guide. Look at the photo of',
    'an artwork or museum object. If a wall label is visible, read it and',
    'trust it over visual guessing.',
    context ? `Museum context: ${context}` : '',
    'Reply with STRICT JSON only — no prose, no code fences — exactly:',
    '{"title": string, "artist": string|null, "period": string|null,',
    ' "origin": string|null, "medium": string|null}',
    'If you cannot identify the specific work, give your best honest generic',
    'title (e.g. "Roman marble torso") rather than inventing a famous one.',
  ]
    .filter(Boolean)
    .join('\n');
}

export interface NarrativeInput {
  meta: ArtifactMeta;
  context: string;
  language: string;
  level: string;
  museumName?: string;
}

export function narrativePrompt(input: NarrativeInput): string {
  const language = LANGUAGE_NAMES[input.language] ?? 'English';
  const levelNote = LEVEL_NOTES[input.level] ?? LEVEL_NOTES.curious;
  const facts = [
    `Title: ${input.meta.title}`,
    input.meta.artist && `Artist: ${input.meta.artist}`,
    input.meta.period && `Period: ${input.meta.period}`,
    input.meta.origin && `Origin: ${input.meta.origin}`,
    input.meta.medium && `Medium: ${input.meta.medium}`,
    input.museumName && `Seen at: ${input.museumName}`,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    'You are MuseumLover, an in-ear museum guide. A visitor is standing in',
    'front of this work right now. Write what you would say to them.',
    '',
    `Write entirely in ${language}. Your listener is ${input.level} level —`,
    `${levelNote}.`,
    '',
    facts,
    input.context ? `\nMuseum context: ${input.context}` : '',
    '',
    'OUTPUT FORMAT — exactly three sections separated by a line containing',
    'only ### :',
    '',
    'First section: one vivid sentence that makes them look closer (this is',
    'read aloud first).',
    '###',
    'Second section: the story — 3 to 5 short paragraphs. Who made it, when,',
    'why it matters, and the one human detail that makes it stick. Spoken',
    'register, no headings, no lists. End the final paragraph with one short',
    'spoken invitation to ask a follow-up question (e.g. "If you want to know',
    'why the critics hated it — just ask.").',
    '###',
    'Third section: STRICT JSON, no code fences:',
    '{"tags": [3-5 short topic tags in English],',
    ' "followUps": [{"prompt": question in ' + language + ', "kind": "artist"|"movement"|"technique"|"related"}, …exactly 3]}',
  ].join('\n');
}
```

- [ ] **Step 5: Create the shared meta type `api/_lib/identifyTypes.ts`**

(Server-side mirror of `src/domain/aiEvents.ts` — `api/` stays self-contained so Vercel's per-function bundling never reaches into `src/`.)

```ts
export interface ArtifactMeta {
  title: string;
  artist?: string;
  period?: string;
  origin?: string;
  medium?: string;
}

export interface IdentifyRequestBody {
  photoDataUrl: string;
  museumId?: string;
  museumName?: string;
  language: string;
  level: string;
}
```

- [ ] **Step 6: Run tests — expect pass**

```bash
npx vitest run api/_lib && npm run typecheck:api
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add api/_lib/museumContext.ts api/_lib/museumContext.test.ts \
  api/_lib/prompts.ts api/_lib/prompts.test.ts api/_lib/identifyTypes.ts
git commit -m "feat(r1): museum context packs and prompt builders"
```

---

### Task 9: Server lib — narrative stream splitter

**Files:**
- Create: `api/_lib/narrativeSplitter.ts`, `api/_lib/narrativeSplitter.test.ts`

- [ ] **Step 1: Write the failing test `api/_lib/narrativeSplitter.test.ts`**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createNarrativeSplitter } from './narrativeSplitter';

const EXTRAS =
  '{"tags":["impressionism"],"followUps":[{"prompt":"Why hated?","kind":"movement"}]}';

describe('createNarrativeSplitter', () => {
  it('splits summary, streams story deltas, and parses extras', () => {
    const onSummary = vi.fn();
    const onDelta = vi.fn();
    const s = createNarrativeSplitter({ onSummary, onDelta });
    s.push('A dawn that named a movement.\n###\nLook at the orange disc. ');
    s.push('It barely exists.\n###\n');
    s.push(EXTRAS);
    const result = s.end();

    expect(onSummary).toHaveBeenCalledWith('A dawn that named a movement.');
    expect(onDelta.mock.calls.map((c) => c[0]).join('')).toBe(
      'Look at the orange disc. It barely exists.',
    );
    expect(result.summary).toBe('A dawn that named a movement.');
    expect(result.story).toBe('Look at the orange disc. It barely exists.');
    expect(result.tags).toEqual(['impressionism']);
    expect(result.followUps).toEqual([{ prompt: 'Why hated?', kind: 'movement' }]);
  });

  it('handles the ### delimiter split across pushes', () => {
    const onSummary = vi.fn();
    const onDelta = vi.fn();
    const s = createNarrativeSplitter({ onSummary, onDelta });
    s.push('Summary.\n#');
    s.push('##\nStory body.\n##');
    s.push('#\n' + EXTRAS);
    const result = s.end();
    expect(result.summary).toBe('Summary.');
    expect(result.story).toBe('Story body.');
    expect(result.tags).toEqual(['impressionism']);
  });

  it('survives a model that forgets the extras section', () => {
    const s = createNarrativeSplitter({ onSummary: vi.fn(), onDelta: vi.fn() });
    s.push('Summary.\n###\nJust a story, no extras.');
    const result = s.end();
    expect(result.story).toBe('Just a story, no extras.');
    expect(result.tags).toEqual([]);
    expect(result.followUps).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it — expect failure**

```bash
npx vitest run api/_lib/narrativeSplitter.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `api/_lib/narrativeSplitter.ts`**

```ts
export interface SplitterHandlers {
  onSummary(text: string): void;
  onDelta(text: string): void;
}

export interface SplitResult {
  summary: string;
  story: string;
  tags: string[];
  followUps: { prompt: string; kind: string }[];
}

const DELIM = '\n###\n';

/**
 * Incremental parser for the narrative model's contract:
 *   summary \n###\n story (streamed) \n###\n extras-JSON
 * Story text is forwarded as deltas as it arrives; while inside the story
 * section we hold back the last DELIM.length-1 chars so a delimiter split
 * across chunks is never leaked into the story.
 */
export function createNarrativeSplitter(handlers: SplitterHandlers) {
  let section: 0 | 1 | 2 = 0;
  let buf = '';
  let summary = '';
  let story = '';

  const emitStory = (text: string) => {
    if (!text) return;
    story += text;
    handlers.onDelta(text);
  };

  return {
    push(chunk: string): void {
      buf += chunk;
      for (;;) {
        if (section === 2) return; // extras buffer to end()
        const i = buf.indexOf(DELIM);
        if (i === -1) {
          if (section === 1) {
            const safe = buf.length - (DELIM.length - 1);
            if (safe > 0) {
              emitStory(buf.slice(0, safe));
              buf = buf.slice(safe);
            }
          }
          return;
        }
        const head = buf.slice(0, i);
        buf = buf.slice(i + DELIM.length);
        if (section === 0) {
          summary = head.trim();
          handlers.onSummary(summary);
          section = 1;
        } else {
          emitStory(head);
          section = 2;
        }
      }
    },
    end(): SplitResult {
      let tags: string[] = [];
      let followUps: { prompt: string; kind: string }[] = [];
      if (section === 0) {
        summary = buf.trim();
        if (summary) handlers.onSummary(summary);
      } else if (section === 1) {
        emitStory(buf);
      } else {
        const raw = buf.trim().replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<SplitResult>;
            if (Array.isArray(parsed.tags)) tags = parsed.tags;
            if (Array.isArray(parsed.followUps)) followUps = parsed.followUps;
          } catch {
            // Extras are best-effort decoration; a malformed tail must not
            // sink a narrative the user already heard.
          }
        }
      }
      buf = '';
      return { summary, story: story.trim(), tags, followUps };
    },
  };
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run api/_lib/narrativeSplitter.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/narrativeSplitter.ts api/_lib/narrativeSplitter.test.ts
git commit -m "feat(r1): narrative stream splitter"
```

---

### Task 10: `/api/identify` — core pipeline, AI wrapper, endpoint

**Files:**
- Create: `api/_lib/identifyCore.ts`, `api/_lib/identifyCore.test.ts`
- Create: `api/_lib/ai.ts`
- Create: `api/_lib/supabase.ts`
- Create: `api/identify.ts`

- [ ] **Step 1: Write the failing test `api/_lib/identifyCore.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { createIdentifyHandler, type IdentifyDeps } from './identifyCore';
import type { NarrativeRecord } from './narrativesRepo';

const META = { title: 'Impression, soleil levant', artist: 'Claude Monet' };

const CACHED: NarrativeRecord = {
  id: 'cached-id',
  museumId: 'mmfa',
  artifactKey: 'impression-soleil-levant--claude-monet',
  lang: 'en',
  level: 'curious',
  title: META.title,
  artist: META.artist,
  summary: 'Cached summary.',
  story: 'Cached story.',
  tags: ['impressionism'],
  followUps: [{ prompt: 'Why hated?', kind: 'movement' }],
};

function makeDeps(overrides: Partial<IdentifyDeps> = {}): IdentifyDeps {
  return {
    stageOne: async () => META,
    narrativeStream: async function* () {
      yield 'Fresh summary.\n###\nFresh ';
      yield 'story.\n###\n{"tags":["a"],"followUps":[]}';
    },
    repo: {
      findByBucket: async () => null,
      findById: async () => null,
      insert: async () => undefined,
    },
    contextFor: () => '',
    newId: () => 'new-id',
    ...overrides,
  };
}

function makeRequest(body: unknown = validBody()): Request {
  return new Request('http://test/api/identify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function validBody() {
  return {
    photoDataUrl: 'data:image/jpeg;base64,AAAA',
    museumId: 'mmfa',
    museumName: 'Montreal Museum of Fine Arts',
    language: 'en',
    level: 'curious',
  };
}

describe('createIdentifyHandler', () => {
  it('rejects non-POST', async () => {
    const handler = createIdentifyHandler(makeDeps());
    const res = await handler(new Request('http://test/api/identify'));
    expect(res.status).toBe(405);
  });

  it('rejects bodies without a data-URL photo', async () => {
    const handler = createIdentifyHandler(makeDeps());
    const res = await handler(makeRequest({ ...validBody(), photoDataUrl: 'nope' }));
    expect(res.status).toBe(400);
  });

  it('streams meta then cached narrative on a cache hit', async () => {
    const handler = createIdentifyHandler(
      makeDeps({
        repo: {
          findByBucket: async () => CACHED,
          findById: async () => CACHED,
          insert: async () => undefined,
        },
      }),
    );
    const res = await handler(makeRequest());
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    const text = await res.text();
    const order = ['event: meta', 'event: summary', 'event: delta', 'event: extras', 'event: done'];
    let last = -1;
    for (const marker of order) {
      const at = text.indexOf(marker);
      expect(at, marker).toBeGreaterThan(last);
      last = at;
    }
    expect(text).toContain('"cached":true');
    expect(text).toContain('"narrativeId":"cached-id"');
  });

  it('generates, streams, and stores on a cache miss', async () => {
    const inserted: NarrativeRecord[] = [];
    const handler = createIdentifyHandler(
      makeDeps({
        repo: {
          findByBucket: async () => null,
          findById: async () => null,
          insert: async (r) => {
            inserted.push(r);
          },
        },
      }),
    );
    const text = await (await handler(makeRequest())).text();
    expect(text).toContain('"cached":false');
    expect(text).toContain('Fresh summary.');
    expect(inserted).toHaveLength(1);
    expect(inserted[0].story).toBe('Fresh story.');
    expect(inserted[0].id).toBe('new-id');
  });

  it('emits an error event when stage one throws', async () => {
    const handler = createIdentifyHandler(
      makeDeps({
        stageOne: async () => {
          throw new Error('vision unavailable');
        },
      }),
    );
    const text = await (await handler(makeRequest())).text();
    expect(text).toContain('event: error');
    expect(text).toContain('vision unavailable');
  });
});
```

- [ ] **Step 2: Run it — expect failure**

```bash
npx vitest run api/_lib/identifyCore.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `api/_lib/identifyCore.ts`**

```ts
import { artifactKey } from './artifactKey';
import type { ArtifactMeta, IdentifyRequestBody } from './identifyTypes';
import { createNarrativeSplitter } from './narrativeSplitter';
import type { NarrativesRepo } from './narrativesRepo';
import type { NarrativeInput } from './prompts';
import { sseEvent } from './sse';

export interface IdentifyDeps {
  stageOne(input: { photoDataUrl: string; context: string }): Promise<ArtifactMeta>;
  narrativeStream(input: NarrativeInput): AsyncIterable<string>;
  repo: NarrativesRepo;
  contextFor(museumId?: string): string;
  newId(): string;
}

function validate(raw: unknown): IdentifyRequestBody {
  const b = raw as Record<string, unknown> | null;
  if (!b || typeof b.photoDataUrl !== 'string' || !b.photoDataUrl.startsWith('data:image/')) {
    throw new Error('photoDataUrl must be an image data URL');
  }
  if (typeof b.language !== 'string' || typeof b.level !== 'string') {
    throw new Error('language and level are required');
  }
  return {
    photoDataUrl: b.photoDataUrl,
    museumId: typeof b.museumId === 'string' ? b.museumId : undefined,
    museumName: typeof b.museumName === 'string' ? b.museumName : undefined,
    language: b.language,
    level: b.level,
  };
}

/**
 * The identify pipeline (spec §5.2): stage 1 vision facts → cache lookup →
 * stream cached or freshly generated narrative as SSE. Dependency-injected
 * so the whole sequence is unit-testable without network.
 */
export function createIdentifyHandler(deps: IdentifyDeps) {
  return async function handler(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    let body: IdentifyRequestBody;
    try {
      body = validate(await req.json());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid request';
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) =>
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        try {
          const context = deps.contextFor(body.museumId);
          const meta = await deps.stageOne({
            photoDataUrl: body.photoDataUrl,
            context,
          });
          send('meta', meta);

          const museumId = body.museumId ?? 'generic';
          const key = artifactKey(meta.title, meta.artist);
          const cached = await deps.repo.findByBucket(
            museumId,
            key,
            body.language,
            body.level,
          );
          if (cached) {
            send('summary', { text: cached.summary });
            send('delta', { text: cached.story });
            send('extras', { tags: cached.tags, followUps: cached.followUps });
            send('done', { narrativeId: cached.id, cached: true });
            return;
          }

          const splitter = createNarrativeSplitter({
            onSummary: (text) => send('summary', { text }),
            onDelta: (text) => send('delta', { text }),
          });
          for await (const chunk of deps.narrativeStream({
            meta,
            context,
            language: body.language,
            level: body.level,
            museumName: body.museumName,
          })) {
            splitter.push(chunk);
          }
          const result = splitter.end();
          send('extras', { tags: result.tags, followUps: result.followUps });

          const id = deps.newId();
          await deps.repo.insert({
            id,
            museumId,
            artifactKey: key,
            lang: body.language,
            level: body.level,
            title: meta.title,
            artist: meta.artist,
            period: meta.period,
            origin: meta.origin,
            medium: meta.medium,
            summary: result.summary,
            story: result.story,
            tags: result.tags,
            followUps: result.followUps,
          });
          send('done', { narrativeId: id, cached: false });
        } catch (err) {
          send('error', {
            message: err instanceof Error ? err.message : 'Identification failed',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  };
}
```

- [ ] **Step 4: Run the test — expect pass**

```bash
npx vitest run api/_lib/identifyCore.test.ts
```

Expected: 5 passed.

- [ ] **Step 5: Implement the real AI wrapper `api/_lib/ai.ts`**

```ts
import { generateText, streamText } from 'ai';
import type { ArtifactMeta } from './identifyTypes';
import { identifyPrompt, narrativePrompt, type NarrativeInput } from './prompts';

/**
 * Model strings route through the Vercel AI Gateway (spec §5.2): one key,
 * fallbacks and observability configured in the gateway dashboard.
 */
const IDENTIFY_MODEL = 'anthropic/claude-haiku-4-5';
const NARRATIVE_MODEL = 'anthropic/claude-fable-5';

export async function stageOne(input: {
  photoDataUrl: string;
  context: string;
}): Promise<ArtifactMeta> {
  const { text } = await generateText({
    model: IDENTIFY_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', image: input.photoDataUrl },
          { type: 'text', text: identifyPrompt(input.context) },
        ],
      },
    ],
  });
  const raw = text
    .trim()
    .replace(/^```(?:json)?/, '')
    .replace(/```$/, '')
    .trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error('Could not identify the artwork — try including the wall label');
  }
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  return {
    title: str(parsed.title) ?? 'Unidentified artwork',
    artist: str(parsed.artist),
    period: str(parsed.period),
    origin: str(parsed.origin),
    medium: str(parsed.medium),
  };
}

export async function* narrativeStream(input: NarrativeInput): AsyncIterable<string> {
  const result = streamText({
    model: NARRATIVE_MODEL,
    prompt: narrativePrompt(input),
  });
  for await (const chunk of result.textStream) {
    yield chunk;
  }
}
```

- [ ] **Step 6: Implement the Supabase client factory `api/_lib/supabase.ts`**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnv } from './env';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
  }
  return client;
}
```

- [ ] **Step 7: Wire the endpoint `api/identify.ts`**

```ts
import { randomUUID } from 'node:crypto';
import { narrativeStream, stageOne } from './_lib/ai';
import { createIdentifyHandler } from './_lib/identifyCore';
import { contextForMuseum } from './_lib/museumContext';
import { createNarrativesRepo } from './_lib/narrativesRepo';
import { getSupabase } from './_lib/supabase';

const handler = createIdentifyHandler({
  stageOne,
  narrativeStream,
  repo: createNarrativesRepo(getSupabase()),
  contextFor: contextForMuseum,
  newId: () => randomUUID(),
});

export default handler;
```

Note: `getSupabase()` throws at cold start if env is missing — that is intentional (fail loud, see Task 6's message).

- [ ] **Step 8: Full check**

```bash
npx vitest run api && npm run typecheck:api
```

Expected: all pass.

- [ ] **Step 9 (manual, needs `.env` from Task 2): smoke the endpoint**

```bash
node -e "const fs=require('fs');fs.writeFileSync('/tmp/identify.json',JSON.stringify({photoDataUrl:'data:image/jpeg;base64,'+fs.readFileSync(process.argv[1],'base64'),museumId:'mmfa',museumName:'Montreal Museum of Fine Arts',language:'en',level:'curious'}))" ./some-painting-photo.jpg
npm run dev:full   # in one terminal
curl -N -X POST http://localhost:3000/api/identify -H 'Content-Type: application/json' --data @/tmp/identify.json
```

Expected: `event: meta` within ~3 s, `event: summary` + `delta` frames streaming, final `event: done` with a `narrativeId`. Re-running the same artwork should return `"cached":true` and complete near-instantly after `meta`.

- [ ] **Step 10: Commit**

```bash
git add api/_lib/identifyCore.ts api/_lib/identifyCore.test.ts api/_lib/ai.ts \
  api/_lib/supabase.ts api/identify.ts
git commit -m "feat(r1): /api/identify streaming pipeline"
```

---

### Task 11: `/api/tts` — cache-or-synthesize audio

**Files:**
- Create: `api/_lib/ttsCore.ts`, `api/_lib/ttsCore.test.ts`
- Create: `api/_lib/audioCache.ts`
- Create: `api/_lib/elevenlabs.ts`
- Create: `api/tts.ts`

- [ ] **Step 1: Write the failing test `api/_lib/ttsCore.test.ts`**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createTtsHandler, type TtsDeps } from './ttsCore';
import type { NarrativeRecord } from './narrativesRepo';

const RECORD: NarrativeRecord = {
  id: 'nid-1',
  museumId: 'mmfa',
  artifactKey: 'k',
  lang: 'fr',
  level: 'curious',
  title: 'Impression, soleil levant',
  summary: 'Résumé.',
  story: 'Histoire.',
  tags: [],
  followUps: [],
};

function streamOf(...parts: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(c) {
      for (const p of parts) c.enqueue(encoder.encode(p));
      c.close();
    },
  });
}

function makeDeps(overrides: Partial<TtsDeps> = {}): TtsDeps {
  return {
    findNarrative: async () => RECORD,
    cachedUrl: async () => null,
    uploadAudio: async () => undefined,
    synth: async () => streamOf('MP3', 'DATA'),
    ...overrides,
  };
}

describe('createTtsHandler', () => {
  it('400s without nid', async () => {
    const res = await createTtsHandler(makeDeps())(new Request('http://t/api/tts'));
    expect(res.status).toBe(400);
  });

  it('redirects to the cached file when present', async () => {
    const res = await createTtsHandler(
      makeDeps({ cachedUrl: async () => 'https://cdn/audio/tts/nid-1.mp3' }),
    )(new Request('http://t/api/tts?nid=nid-1'));
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('https://cdn/audio/tts/nid-1.mp3');
  });

  it('404s for unknown narratives', async () => {
    const res = await createTtsHandler(makeDeps({ findNarrative: async () => null }))(
      new Request('http://t/api/tts?nid=missing'),
    );
    expect(res.status).toBe(404);
  });

  it('streams synthesized audio and uploads it to the cache', async () => {
    const uploadAudio = vi.fn(async () => undefined);
    const synth = vi.fn(async () => streamOf('MP3', 'DATA'));
    const res = await createTtsHandler(makeDeps({ uploadAudio, synth }))(
      new Request('http://t/api/tts?nid=nid-1'),
    );
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(new TextDecoder().decode(bytes)).toBe('MP3DATA');
    expect(synth).toHaveBeenCalledWith(
      expect.stringContaining('Résumé.'),
      expect.any(String),
      'fr',
    );
    expect(uploadAudio).toHaveBeenCalledWith('tts/nid-1.mp3', expect.any(Uint8Array));
  });
});
```

- [ ] **Step 2: Run it — expect failure**

```bash
npx vitest run api/_lib/ttsCore.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `api/_lib/ttsCore.ts`**

```ts
import type { NarrativeRecord } from './narrativesRepo';
import { voiceFor } from './voices';

export interface TtsDeps {
  findNarrative(id: string): Promise<NarrativeRecord | null>;
  /** Public URL when the MP3 already exists in storage, else null. */
  cachedUrl(path: string): Promise<string | null>;
  uploadAudio(path: string, bytes: Uint8Array): Promise<void>;
  synth(text: string, voiceId: string, lang: string): Promise<ReadableStream<Uint8Array>>;
}

/**
 * GET /api/tts?nid=<narrativeId> — 302 to the cached MP3, or synthesize via
 * ElevenLabs, stream to the caller, and persist to the cache (spec §5.3).
 */
export function createTtsHandler(deps: TtsDeps) {
  return async function handler(req: Request): Promise<Response> {
    const nid = new URL(req.url).searchParams.get('nid');
    if (!nid) return new Response('Missing nid', { status: 400 });

    const path = `tts/${nid}.mp3`;
    const cached = await deps.cachedUrl(path);
    if (cached) {
      return new Response(null, { status: 302, headers: { Location: cached } });
    }

    const record = await deps.findNarrative(nid);
    if (!record) return new Response('Unknown narrative', { status: 404 });

    const text = `${record.summary}\n\n${record.story}`;
    const upstream = await deps.synth(text, voiceFor(record.lang), record.lang);

    const chunks: Uint8Array[] = [];
    const tee = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        chunks.push(chunk);
        controller.enqueue(chunk);
      },
      async flush() {
        const total = chunks.reduce((n, c) => n + c.length, 0);
        const all = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
          all.set(c, offset);
          offset += c.length;
        }
        try {
          await deps.uploadAudio(path, all);
        } catch {
          // Cache write is best-effort; the listener already has the audio.
        }
      },
    });

    return new Response(upstream.pipeThrough(tee), {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-cache' },
    });
  };
}
```

- [ ] **Step 4: Run the test — expect pass**

```bash
npx vitest run api/_lib/ttsCore.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Implement `api/_lib/audioCache.ts`**

```ts
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
```

- [ ] **Step 6: Implement `api/_lib/elevenlabs.ts`**

```ts
import { requireEnv } from './env';

/** Stream MP3 from ElevenLabs (spec §5.2 — Turbo family, streamed). */
export async function synthElevenLabs(
  text: string,
  voiceId: string,
  lang: string,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': requireEnv('ELEVENLABS_API_KEY'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        language_code: lang,
      }),
    },
  );
  if (!res.ok || !res.body) {
    throw new Error(`ElevenLabs TTS failed: ${res.status}`);
  }
  return res.body;
}
```

- [ ] **Step 7: Wire the endpoint `api/tts.ts`**

```ts
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
```

- [ ] **Step 8: Full check**

```bash
npx vitest run api && npm run typecheck:api
```

Expected: all pass.

- [ ] **Step 9 (manual): smoke**

With `npm run dev:full` running and a `narrativeId` from Task 10's smoke:

```bash
curl -sL "http://localhost:3000/api/tts?nid=<narrativeId>" -o /tmp/narration.mp3 && afplay /tmp/narration.mp3
```

Expected: audible narration; second run is a fast 302 to Supabase storage.

- [ ] **Step 10: Commit**

```bash
git add api/_lib/ttsCore.ts api/_lib/ttsCore.test.ts api/_lib/audioCache.ts \
  api/_lib/elevenlabs.ts api/tts.ts
git commit -m "feat(r1): /api/tts cache-or-synthesize streaming"
```

---

### Task 12: Client — streaming identify service + mock stream + client swap

**Files:**
- Create: `src/services/ai/identify.ts`, `src/services/ai/identify.test.ts`
- Modify: `src/services/ai/mock.ts` (add `mockIdentifyStream`)
- Modify: `src/services/ai/client.ts`

- [ ] **Step 1: Write the failing test `src/services/ai/identify.test.ts`**

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../identity/deviceId', () => ({
  getDeviceId: async () => 'test-device',
}));
vi.mock('../camera/resize', () => ({
  downscaleDataUrl: async (d: string) => d,
}));

import { identifyArtifactStream, resolveApiUrl, ttsUrlFor } from './identify';

function sseResponse(frames: string): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(encoder.encode(frames));
      c.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

const REQ = {
  photoDataUrl: 'data:image/jpeg;base64,AAAA',
  language: 'en' as const,
  level: 'curious' as const,
  interests: [],
};

describe('identifyArtifactStream', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('dispatches parsed events in order', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        sseResponse(
          'event: meta\ndata: {"title":"Sunrise"}\n\n' +
            'event: summary\ndata: {"text":"S."}\n\n' +
            'event: delta\ndata: {"text":"Once"}\n\n' +
            'event: extras\ndata: {"tags":["t"],"followUps":[{"prompt":"Q","kind":"artist"}]}\n\n' +
            'event: done\ndata: {"narrativeId":"n1","cached":false}\n\n',
        ),
      ),
    );
    const calls: string[] = [];
    await identifyArtifactStream(REQ, {
      onMeta: (m) => calls.push(`meta:${m.title}`),
      onSummary: (t) => calls.push(`summary:${t}`),
      onDelta: (t) => calls.push(`delta:${t}`),
      onExtras: (x) => calls.push(`extras:${x.tags[0]}`),
      onDone: (d) => calls.push(`done:${d.narrativeId}`),
      onError: (m) => calls.push(`error:${m}`),
    });
    expect(calls).toEqual([
      'meta:Sunrise',
      'summary:S.',
      'delta:Once',
      'extras:t',
      'done:n1',
    ]);
  });

  it('reports HTTP failures through onError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    const errors: string[] = [];
    await identifyArtifactStream(REQ, {
      onMeta: () => undefined,
      onSummary: () => undefined,
      onDelta: () => undefined,
      onExtras: () => undefined,
      onDone: () => undefined,
      onError: (m) => errors.push(m),
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('500');
  });
});

describe('url helpers', () => {
  it('builds a relative tts url from a narrative id', () => {
    expect(ttsUrlFor('abc')).toBe('/api/tts?nid=abc');
  });

  it('passes absolute urls through resolveApiUrl unchanged', () => {
    expect(resolveApiUrl('https://x.example/audio.mp3')).toBe(
      'https://x.example/audio.mp3',
    );
  });
});
```

- [ ] **Step 2: Run it — expect failure**

```bash
npx vitest run src/services/ai/identify.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/services/ai/identify.ts`**

```ts
import type { ArtifactMeta, StreamDone, StreamExtras } from '../../domain/aiEvents';
import type { CaptureRequest } from '../../domain/types';
import { downscaleDataUrl } from '../camera/resize';
import { getDeviceId } from '../identity/deviceId';
import { readSse } from './sse';

/**
 * Empty for same-origin (vercel dev / production). On a device pointed at a
 * remote backend, set VITE_API_BASE_URL to the deployment URL.
 */
const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? '';

export const ttsUrlFor = (narrativeId: string): string =>
  `/api/tts?nid=${narrativeId}`;

export const resolveApiUrl = (path: string): string =>
  path.startsWith('http') ? path : `${API_BASE}${path}`;

export interface IdentifyEvents {
  onMeta(meta: ArtifactMeta): void;
  onSummary(text: string): void;
  onDelta(text: string): void;
  onExtras(extras: StreamExtras): void;
  onDone(done: StreamDone): void;
  onError(message: string): void;
}

/**
 * POST the capture to /api/identify and dispatch SSE events as they arrive.
 * Resolves when the stream closes; transport failures surface via onError
 * (never thrown) so the UI has a single error path.
 */
export async function identifyArtifactStream(
  req: CaptureRequest,
  events: IdentifyEvents,
): Promise<void> {
  try {
    const photoDataUrl = await downscaleDataUrl(req.photoDataUrl);
    const res = await fetch(resolveApiUrl('/api/identify'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': await getDeviceId(),
      },
      body: JSON.stringify({
        photoDataUrl,
        museumId: req.museum?.id,
        museumName: req.museum?.name,
        language: req.language,
        level: req.level,
      }),
    });
    if (!res.ok || !res.body) {
      events.onError(`Identify failed (${res.status})`);
      return;
    }
    await readSse(res.body, (event, data) => {
      const payload = data ? (JSON.parse(data) as never) : ({} as never);
      switch (event) {
        case 'meta':
          events.onMeta(payload);
          break;
        case 'summary':
          events.onSummary((payload as { text: string }).text);
          break;
        case 'delta':
          events.onDelta((payload as { text: string }).text);
          break;
        case 'extras':
          events.onExtras(payload);
          break;
        case 'done':
          events.onDone(payload);
          break;
        case 'error':
          events.onError((payload as { message: string }).message);
          break;
      }
    });
  } catch (err) {
    events.onError(
      err instanceof Error ? err.message : 'Could not reach the guide',
    );
  }
}
```

- [ ] **Step 4: Run the test — expect pass**

```bash
npx vitest run src/services/ai/identify.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Add a streaming mock to `src/services/ai/mock.ts`**

Append (keep existing exports):

```ts
import type { IdentifyEvents } from './identify';

/**
 * Streaming flavor of the mock for backend-less dev (VITE_USE_MOCK_AI=true):
 * emits the same event sequence as /api/identify with realistic pacing.
 */
export async function mockIdentifyStream(
  req: CaptureRequest,
  events: IdentifyEvents,
): Promise<void> {
  await sleep(1200);
  events.onMeta({
    title: 'Untitled (mock identification)',
    artist: 'Unknown',
    period: 'c. 1900',
    origin: req.museum?.country ?? 'Unknown',
    medium: 'Oil on canvas',
  });
  await sleep(500);
  events.onSummary('A placeholder identification while the backend is mocked.');
  const story =
    'Imagine here a few paragraphs tailored to your language and depth — ' +
    `a ${req.level}-level narration about who made this, when, why it ` +
    'matters, and the small story that makes it stick. If you want to know ' +
    'more — just ask.';
  for (const word of story.split(' ')) {
    await sleep(30);
    events.onDelta(word + ' ');
  }
  events.onExtras({
    tags: ['mock', 'placeholder'],
    followUps: [
      { prompt: 'Tell me about a similar artist', kind: 'artist' },
      { prompt: 'What movement is this?', kind: 'movement' },
    ],
  });
  events.onDone({ narrativeId: 'mock-narrative', cached: false });
}
```

Also add the import of `CaptureRequest` if not already present at top (it is — `CaptureRequest` is already imported).

- [ ] **Step 6: Swap the seam in `src/services/ai/client.ts`**

Replace the whole file with:

```ts
import type { CaptureRequest, Museum } from '../../domain/types';
import { identifyArtifactStream, type IdentifyEvents } from './identify';
import { mockIdentifyStream, mockParseFloorPlan } from './mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_AI === 'true';

/**
 * Client seam for the backend AI API (spec §5.1). identify streams against
 * /api/identify (R1); floor-plan parsing stays mocked until R3's plan-visit.
 * Set VITE_USE_MOCK_AI=true for backend-less UI development.
 */
export const aiClient = {
  parseFloorPlan: async (
    photoDataUrl: string,
    museum: Museum,
  ): Promise<{ topics: string[] }> => {
    return mockParseFloorPlan(photoDataUrl, museum);
  },

  identifyStream: (req: CaptureRequest, events: IdentifyEvents): Promise<void> =>
    USE_MOCK ? mockIdentifyStream(req, events) : identifyArtifactStream(req, events),
};
```

(The old `identifyArtifact` promise API is removed; its only caller is rewired in Task 13 — expect a transient TypeScript error in `CapturePage.tsx` until then. Run only targeted tests this task.)

- [ ] **Step 7: Run the service tests — expect pass**

```bash
npx vitest run src/services/ai
```

Expected: all pass (CapturePage isn't under test yet).

- [ ] **Step 8: Commit**

```bash
git add src/services/ai/identify.ts src/services/ai/identify.test.ts \
  src/services/ai/mock.ts src/services/ai/client.ts
git commit -m "feat(r1): streaming identify client and mock, swap aiClient seam"
```

---

### Task 13: Client — streaming capture phase + ArtifactCard streaming state

**Files:**
- Create: `src/features/capture/streamingPhase.ts`, `src/features/capture/streamingPhase.test.ts`
- Modify: `src/features/capture/CapturePage.tsx`
- Modify: `src/ui/ArtifactCard.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing test `src/features/capture/streamingPhase.test.ts`**

```ts
import type { ArtifactInfo } from '../../domain/types';
import {
  applyStreamEvent,
  finalizeArtifact,
  initialStreaming,
  type StreamingPhase,
} from './streamingPhase';

const start = (): StreamingPhase =>
  initialStreaming('photo-data-url', 'entry-1');

describe('applyStreamEvent', () => {
  it('records meta, summary, and accumulates deltas', () => {
    let p = start();
    p = applyStreamEvent(p, { type: 'meta', meta: { title: 'Sunrise', artist: 'Monet' } });
    p = applyStreamEvent(p, { type: 'summary', text: 'One sentence.' });
    p = applyStreamEvent(p, { type: 'delta', text: 'Look ' });
    p = applyStreamEvent(p, { type: 'delta', text: 'closer.' });
    expect(p.meta?.title).toBe('Sunrise');
    expect(p.summary).toBe('One sentence.');
    expect(p.story).toBe('Look closer.');
  });

  it('stores extras', () => {
    let p = start();
    p = applyStreamEvent(p, {
      type: 'extras',
      extras: { tags: ['x'], followUps: [{ prompt: 'Q', kind: 'artist' }] },
    });
    expect(p.tags).toEqual(['x']);
    expect(p.followUps).toHaveLength(1);
  });
});

describe('finalizeArtifact', () => {
  it('assembles a complete ArtifactInfo with ids on follow-ups', () => {
    let p = start();
    p = applyStreamEvent(p, { type: 'meta', meta: { title: 'Sunrise' } });
    p = applyStreamEvent(p, { type: 'summary', text: 'S.' });
    p = applyStreamEvent(p, { type: 'delta', text: 'Story.' });
    p = applyStreamEvent(p, {
      type: 'extras',
      extras: { tags: ['t'], followUps: [{ prompt: 'Q', kind: 'artist' }] },
    });
    const artifact: ArtifactInfo = finalizeArtifact(p, 'narr-1');
    expect(artifact.title).toBe('Sunrise');
    expect(artifact.summary).toBe('S.');
    expect(artifact.story).toBe('Story.');
    expect(artifact.narrativeId).toBe('narr-1');
    expect(artifact.followUps[0].id).toBeTruthy();
    expect(artifact.followUps[0].prompt).toBe('Q');
  });
});
```

- [ ] **Step 2: Run it — expect failure**

```bash
npx vitest run src/features/capture/streamingPhase.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/features/capture/streamingPhase.ts`**

```ts
import { nanoid } from 'nanoid';
import type { ArtifactMeta, StreamExtras } from '../../domain/aiEvents';
import type { ArtifactInfo, FollowUp } from '../../domain/types';

export interface StreamingPhase {
  photoDataUrl: string;
  entryId: string;
  meta: ArtifactMeta | null;
  summary: string;
  story: string;
  tags: string[];
  followUps: Omit<FollowUp, 'id'>[];
}

export type StreamUiEvent =
  | { type: 'meta'; meta: ArtifactMeta }
  | { type: 'summary'; text: string }
  | { type: 'delta'; text: string }
  | { type: 'extras'; extras: StreamExtras };

export function initialStreaming(
  photoDataUrl: string,
  entryId: string,
): StreamingPhase {
  return {
    photoDataUrl,
    entryId,
    meta: null,
    summary: '',
    story: '',
    tags: [],
    followUps: [],
  };
}

export function applyStreamEvent(
  phase: StreamingPhase,
  event: StreamUiEvent,
): StreamingPhase {
  switch (event.type) {
    case 'meta':
      return { ...phase, meta: event.meta };
    case 'summary':
      return { ...phase, summary: event.text };
    case 'delta':
      return { ...phase, story: phase.story + event.text };
    case 'extras':
      return { ...phase, tags: event.extras.tags, followUps: event.extras.followUps };
  }
}

/** Partial ArtifactInfo for rendering mid-stream. */
export function previewArtifact(phase: StreamingPhase): ArtifactInfo {
  return {
    id: phase.entryId,
    title: phase.meta?.title ?? 'Looking closely…',
    artist: phase.meta?.artist,
    period: phase.meta?.period,
    origin: phase.meta?.origin,
    medium: phase.meta?.medium,
    summary: phase.summary,
    story: phase.story,
    tags: phase.tags,
    followUps: [],
  };
}

export function finalizeArtifact(
  phase: StreamingPhase,
  narrativeId: string,
): ArtifactInfo {
  return {
    ...previewArtifact(phase),
    narrativeId,
    followUps: phase.followUps.map((f) => ({ ...f, id: nanoid() })) as FollowUp[],
  };
}
```

- [ ] **Step 4: Run the test — expect pass**

```bash
npx vitest run src/features/capture/streamingPhase.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Add the streaming prop to `src/ui/ArtifactCard.tsx`**

Change the `Props` interface and signature:

```ts
interface Props {
  photoSrc: string;
  artifact: ArtifactInfo;
  capturedAt?: string;
  museumName?: string;
  onFollowUp?: (followUpId: string) => void;
  /** True while the story is still streaming in — shows a writing cursor. */
  streaming?: boolean;
}

export function ArtifactCard({
  photoSrc,
  artifact,
  capturedAt,
  museumName,
  onFollowUp,
  streaming = false,
}: Props) {
```

Then make the story block streaming-aware — replace the existing
`artifact.story.split(...)` map with:

```tsx
        {artifact.story &&
          artifact.story.split('\n\n').map((para, i, all) => (
            <IonText key={i} color="medium">
              <p
                style={{
                  fontSize: 'var(--ft-body)',
                  marginTop: 'var(--sp-sm)',
                  lineHeight: 1.55,
                }}
              >
                {para}
                {streaming && i === all.length - 1 && (
                  <span className="ml-streaming-cursor" aria-hidden="true" />
                )}
              </p>
            </IonText>
          ))}
        {streaming && !artifact.story && (
          <IonText color="medium">
            <p style={{ fontSize: 'var(--ft-body)', marginTop: 'var(--sp-sm)' }}>
              <span className="ml-streaming-cursor" aria-hidden="true" />
            </p>
          </IonText>
        )}
```

- [ ] **Step 6: Add the cursor style to `src/index.css`** (append at end)

```css
/* R1 — streaming narrative cursor (ArtifactCard) */
.ml-streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: var(--ml-accent, var(--sf-accent));
  animation: ml-blink 1s steps(2, start) infinite;
}
@keyframes ml-blink {
  to {
    visibility: hidden;
  }
}
```

- [ ] **Step 7: Rewire `src/features/capture/CapturePage.tsx`**

Replace the whole file with:

```tsx
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonRouter,
  useIonToast,
} from '@ionic/react';
import {
  cameraOutline,
  checkmarkCircle,
  imageOutline,
  refreshOutline,
} from 'ionicons/icons';
import { nanoid } from 'nanoid';
import { useRef, useState } from 'react';
import type { ArtifactInfo, JourneyEntry } from '../../domain/types';
import { aiClient } from '../../services/ai/client';
import { ttsUrlFor } from '../../services/ai/identify';
import { takePhoto } from '../../services/camera/camera';
import {
  deletePhoto,
  journeyPhotoPath,
  savePhoto,
} from '../../services/storage/photos';
import { useJourney } from '../../state/useJourney';
import { useSession } from '../../state/useSession';
import { useUserProfile } from '../../state/useUserProfile';
import { ArtifactCard } from '../../ui/ArtifactCard';
import { EmptyState } from '../../ui/EmptyState';
import {
  applyStreamEvent,
  finalizeArtifact,
  initialStreaming,
  previewArtifact,
  type StreamingPhase,
} from './streamingPhase';

type Phase =
  | { kind: 'idle' }
  | { kind: 'saving'; photoDataUrl: string }
  | { kind: 'streaming'; stream: StreamingPhase }
  | { kind: 'result'; photoDataUrl: string; artifact: ArtifactInfo };

export function CapturePage() {
  const profile = useUserProfile((s) => s.profile);
  const museum = useSession((s) => s.museum);
  const addToJourney = useJourney((s) => s.add);
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  // The reducer state lives in a ref so SSE callbacks (which fire faster
  // than React renders) never read stale phase from a closure.
  const streamRef = useRef<StreamingPhase | null>(null);

  const startCapture = async () => {
    if (!profile) return;
    try {
      const photo = await takePhoto();
      if (!photo) return;
      setPhase({ kind: 'saving', photoDataUrl: photo.dataUrl });

      // The photo is sacred: persist before any AI runs (spec §9).
      const entryId = nanoid();
      const photoPath = journeyPhotoPath(entryId);
      await savePhoto(photoPath, photo.dataUrl);

      const stream = initialStreaming(photo.dataUrl, entryId);
      streamRef.current = stream;
      setPhase({ kind: 'streaming', stream });

      const update = (
        apply: (s: StreamingPhase) => StreamingPhase,
      ): StreamingPhase => {
        const next = apply(streamRef.current ?? stream);
        streamRef.current = next;
        setPhase({ kind: 'streaming', stream: next });
        return next;
      };

      let failed: string | null = null;
      let done: { narrativeId: string; cached: boolean } | null = null;

      await aiClient.identifyStream(
        {
          photoDataUrl: photo.dataUrl,
          museum: museum ?? undefined,
          language: profile.language,
          level: profile.level,
          interests: profile.interests,
        },
        {
          onMeta: (meta) => update((s) => applyStreamEvent(s, { type: 'meta', meta })),
          onSummary: (text) =>
            update((s) => applyStreamEvent(s, { type: 'summary', text })),
          onDelta: (text) =>
            update((s) => applyStreamEvent(s, { type: 'delta', text })),
          onExtras: (extras) =>
            update((s) => applyStreamEvent(s, { type: 'extras', extras })),
          onDone: (d) => {
            done = d;
          },
          onError: (message) => {
            failed = message;
          },
        },
      );

      const finalStream = streamRef.current ?? stream;
      streamRef.current = null;

      if (failed || !done) {
        await deletePhoto(photoPath);
        presentToast({
          message: failed ?? 'The guide went quiet — try again',
          duration: 2400,
          color: 'danger',
        });
        setPhase({ kind: 'idle' });
        return;
      }

      const artifact = finalizeArtifact(finalStream, done.narrativeId);
      const entry: JourneyEntry = {
        id: entryId,
        museumId: museum?.id ?? 'generic',
        museumName: museum?.name ?? 'Generic',
        capturedAt: new Date().toISOString(),
        photoPath,
        artifact,
        audioUrl: ttsUrlFor(done.narrativeId),
      };
      await addToJourney(entry);
      setPhase({ kind: 'result', photoDataUrl: photo.dataUrl, artifact });
      presentToast({
        message: 'Saved to your Journey',
        duration: 1800,
        color: 'success',
        icon: checkmarkCircle,
        position: 'top',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not identify the artifact';
      presentToast({ message, duration: 2400, color: 'danger' });
      streamRef.current = null;
      setPhase({ kind: 'idle' });
    }
  };

  const reset = () => setPhase({ kind: 'idle' });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Capture</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Capture</IonTitle>
          </IonToolbar>
        </IonHeader>

        {phase.kind === 'idle' && (
          <EmptyState
            icon={cameraOutline}
            title="Point at an artifact"
            description={
              museum
                ? `We'll identify it and save it to your Journey for ${museum.name}.`
                : 'Pick a museum on the Tour tab for tailored narration, or capture in generic mode.'
            }
            action={
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--sp-sm)',
                  width: '100%',
                  maxWidth: 320,
                }}
              >
                <IonButton expand="block" size="large" onClick={startCapture}>
                  <IonIcon slot="start" icon={cameraOutline} />
                  Take photo
                </IonButton>
                {!museum && (
                  <IonButton
                    fill="clear"
                    onClick={() => router.push('/tour', 'back')}
                  >
                    <IonIcon slot="start" icon={imageOutline} />
                    Pick a museum first
                  </IonButton>
                )}
              </div>
            }
          />
        )}

        {phase.kind === 'saving' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 'var(--sp-base)',
              gap: 'var(--sp-base)',
            }}
          >
            <img
              src={phase.photoDataUrl}
              alt="Captured artifact"
              style={{
                width: '100%',
                maxHeight: 320,
                objectFit: 'cover',
                borderRadius: 'var(--rd-md)',
                opacity: 0.9,
              }}
            />
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}
            >
              <IonSpinner name="crescent" />
              <IonText>
                <p style={{ margin: 0, fontWeight: 600 }}>Saving…</p>
              </IonText>
            </div>
          </div>
        )}

        {phase.kind === 'streaming' && (
          <>
            <ArtifactCard
              photoSrc={phase.stream.photoDataUrl}
              artifact={previewArtifact(phase.stream)}
              museumName={museum?.name}
              streaming
            />
            {!phase.stream.meta && (
              <IonNote
                color="medium"
                style={{
                  display: 'block',
                  padding: '0 var(--sp-base)',
                  fontSize: 'var(--ft-foot)',
                }}
              >
                Looking it up against {museum?.name ?? 'a generic catalog'} in{' '}
                {profile?.language?.toUpperCase()} at the {profile?.level} level…
              </IonNote>
            )}
          </>
        )}

        {phase.kind === 'result' && (
          <>
            <ArtifactCard
              photoSrc={phase.photoDataUrl}
              artifact={phase.artifact}
              museumName={museum?.name}
              capturedAt={new Date().toISOString()}
            />
            <div
              style={{ padding: 'var(--sp-base)', paddingBottom: 'var(--sp-2xl)' }}
            >
              <IonButton expand="block" onClick={reset}>
                <IonIcon slot="start" icon={refreshOutline} />
                Capture another
              </IonButton>
              <IonButton
                expand="block"
                fill="clear"
                onClick={() => router.push('/journey', 'forward')}
                style={{ marginTop: 'var(--sp-sm)' }}
              >
                Open Journey
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
```

(The Listen button is added in Task 14 — this task keeps the result actions unchanged.)

- [ ] **Step 8: Full client check**

```bash
npx vitest run && npx tsc --noEmit && npm run lint
```

Expected: all pass — the Task 12 transient type error is now resolved.

- [ ] **Step 9 (manual): visual smoke**

```bash
VITE_USE_MOCK_AI=true npm run dev
```

Open the app, complete onboarding if fresh, capture any image file: the card should appear immediately, title after ~1 s, story words ticking in with a blinking cursor, then the saved toast.

- [ ] **Step 10: Commit**

```bash
git add src/features/capture/streamingPhase.ts \
  src/features/capture/streamingPhase.test.ts \
  src/features/capture/CapturePage.tsx src/ui/ArtifactCard.tsx src/index.css
git commit -m "feat(r1): streaming capture phase and artifact card"
```

---

### Task 14: Client — narration player with Media Session + Listen button

**Files:**
- Create: `src/services/audio/player.ts`, `src/services/audio/player.test.ts`
- Modify: `src/features/capture/CapturePage.tsx` (result phase actions)

- [ ] **Step 1: Write the failing test `src/services/audio/player.test.ts`**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NarrationPlayer } from './player';

class FakeAudio {
  static instances: FakeAudio[] = [];
  src: string;
  paused = true;
  preload = '';
  private handlers = new Map<string, () => void>();
  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }
  addEventListener(name: string, fn: () => void) {
    this.handlers.set(name, fn);
  }
  fire(name: string) {
    this.handlers.get(name)?.();
  }
  async play() {
    this.paused = false;
    this.fire('playing');
  }
  pause() {
    this.paused = true;
    this.fire('pause');
  }
  removeAttribute() {
    this.src = '';
  }
  load() {}
}

describe('NarrationPlayer', () => {
  beforeEach(() => {
    FakeAudio.instances = [];
    vi.stubGlobal('Audio', FakeAudio as unknown as typeof Audio);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('transitions idle → loading → playing on play()', async () => {
    const player = new NarrationPlayer();
    const states: string[] = [];
    player.subscribe((s) => states.push(s));
    await player.play('/api/tts?nid=n1', { title: 'Sunrise' });
    expect(states).toEqual(['idle', 'loading', 'playing']);
  });

  it('toggle pauses and resumes', async () => {
    const player = new NarrationPlayer();
    await player.play('/api/tts?nid=n1', { title: 'Sunrise' });
    player.toggle();
    expect(FakeAudio.instances[0].paused).toBe(true);
    player.toggle();
    expect(FakeAudio.instances[0].paused).toBe(false);
  });

  it('ended returns the player to idle', async () => {
    const player = new NarrationPlayer();
    const states: string[] = [];
    player.subscribe((s) => states.push(s));
    await player.play('/api/tts?nid=n1', { title: 'Sunrise' });
    FakeAudio.instances[0].fire('ended');
    expect(states.at(-1)).toBe('idle');
  });
});
```

- [ ] **Step 2: Run it — expect failure**

```bash
npx vitest run src/services/audio/player.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/services/audio/player.ts`**

```ts
import { resolveApiUrl } from '../ai/identify';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused';
type Listener = (state: PlayerState) => void;

export interface NowPlayingMeta {
  title: string;
  artist?: string;
  museumName?: string;
}

/**
 * Single app-wide narration player. HTML5 audio streams the MP3 (playback
 * starts before the file completes); Media Session metadata gives lock-screen
 * controls where the platform supports it. The iOS background-audio
 * entitlement (UIBackgroundModes) lands with `npx cap add ios` in R4 —
 * until then, background playback works in browser contexts only.
 */
export class NarrationPlayer {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  private state: PlayerState = 'idle';

  private setState(state: PlayerState) {
    this.state = state;
    this.listeners.forEach((l) => l(state));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): PlayerState {
    return this.state;
  }

  async play(url: string, meta: NowPlayingMeta): Promise<void> {
    this.stop();
    const audio = new Audio(resolveApiUrl(url));
    this.audio = audio;
    audio.preload = 'auto';
    this.setState('loading');
    audio.addEventListener('playing', () => this.setState('playing'));
    audio.addEventListener('pause', () => {
      if (this.state !== 'idle') this.setState('paused');
    });
    audio.addEventListener('ended', () => this.setState('idle'));
    audio.addEventListener('error', () => this.setState('idle'));

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: meta.title,
        artist: meta.artist ?? '',
        album: meta.museumName ?? 'MuseumLover',
      });
      navigator.mediaSession.setActionHandler('play', () => void audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('stop', () => this.stop());
    }

    await audio.play();
  }

  toggle(): void {
    const audio = this.audio;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }

  stop(): void {
    const audio = this.audio;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load?.();
    }
    this.audio = null;
    this.setState('idle');
  }
}

export const narrationPlayer = new NarrationPlayer();
```

- [ ] **Step 4: Run the test — expect pass**

```bash
npx vitest run src/services/audio/player.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Add the Listen button to the result phase of `CapturePage.tsx`**

Add imports at the top of `src/features/capture/CapturePage.tsx`:

```ts
import { pauseOutline, playOutline } from 'ionicons/icons';
import { useEffect } from 'react';
import { narrationPlayer, type PlayerState } from '../../services/audio/player';
```

(merge `useEffect`/`useRef`/`useState` into one react import line), add player state inside the component:

```ts
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  useEffect(() => narrationPlayer.subscribe(setPlayerState), []);
  useEffect(() => () => narrationPlayer.stop(), []);
```

and in the `result` phase actions, insert ABOVE the "Capture another" button:

```tsx
              {phase.artifact.narrativeId && (
                <IonButton
                  expand="block"
                  size="large"
                  onClick={() => {
                    if (playerState === 'playing' || playerState === 'paused') {
                      narrationPlayer.toggle();
                    } else {
                      void narrationPlayer.play(
                        ttsUrlFor(phase.artifact.narrativeId!),
                        {
                          title: phase.artifact.title,
                          artist: phase.artifact.artist,
                          museumName: museum?.name,
                        },
                      );
                    }
                  }}
                  style={{ marginBottom: 'var(--sp-sm)' }}
                >
                  <IonIcon
                    slot="start"
                    icon={playerState === 'playing' ? pauseOutline : playOutline}
                  />
                  {playerState === 'playing'
                    ? 'Pause'
                    : playerState === 'loading'
                      ? 'Loading…'
                      : 'Listen'}
                </IonButton>
              )}
```

- [ ] **Step 6: Full check**

```bash
npx vitest run && npx tsc --noEmit && npm run lint
```

Expected: all pass.

- [ ] **Step 7 (manual, needs backend): end-to-end audio smoke**

With `npm run dev:full` and real keys: capture a painting photo → when the card completes, tap Listen → narration audio should start in < 10 s from capture and the OS media controls should show title/artist while playing.

- [ ] **Step 8: Commit**

```bash
git add src/services/audio/player.ts src/services/audio/player.test.ts \
  src/features/capture/CapturePage.tsx
git commit -m "feat(r1): narration player with media session and listen button"
```

---

### Task 15: Design tokens — museum themes + ThemeController (spec §6)

**Files:**
- Create: `src/theme/museumThemes.ts`, `src/theme/museumThemes.test.ts`
- Create: `src/app/MuseumThemeController.tsx`
- Modify: `src/theme/variables.css` (append `--ml-*` defaults)
- Modify: `src/App.tsx` (mount controller)

- [ ] **Step 1: Write the failing test `src/theme/museumThemes.test.ts`**

```ts
import { applyTheme, DEFAULT_THEME, themeForMuseum } from './museumThemes';

describe('themeForMuseum', () => {
  it('returns curated themes for known museums', () => {
    expect(themeForMuseum('mmfa').accent).toBe('#D64541');
    expect(themeForMuseum('moma').titleFont).toBe('sans');
  });

  it('falls back to the default gallery-red brand theme', () => {
    expect(themeForMuseum('some-scanned-museum')).toEqual(DEFAULT_THEME);
    expect(themeForMuseum(undefined)).toEqual(DEFAULT_THEME);
  });
});

describe('applyTheme', () => {
  it('sets the --ml-* variables on the document root', () => {
    applyTheme(themeForMuseum('mmfa'));
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--ml-accent')).toBe('#D64541');
    expect(root.style.getPropertyValue('--ml-on-accent')).toBe('#3B0D09');
    expect(root.dataset.mlCanvas).toBe('warm');
  });
});
```

- [ ] **Step 2: Run it — expect failure**

```bash
npx vitest run src/theme/museumThemes.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/theme/museumThemes.ts`**

```ts
import type { MuseumTheme } from '../domain/types';

/**
 * Per-museum design tokens (spec §6.2). The ink spine never changes; the
 * active museum owns the accent. Default = the gallery-red brand theme
 * (spec §6.3) for museum-less surfaces and unknown museums.
 */
export const DEFAULT_THEME: MuseumTheme = {
  accent: '#D64541',
  onAccent: '#3B0D09',
  surfaceTint: '#2A1D17',
  canvas: 'warm',
  titleFont: 'serif',
};

export const MUSEUM_THEMES: Record<string, MuseumTheme> = {
  mmfa: DEFAULT_THEME,
  moma: {
    accent: '#A78BFA',
    onAccent: '#14092E',
    surfaceTint: '#1C1830',
    canvas: 'cool',
    titleFont: 'sans',
  },
  'tate-modern': {
    accent: '#A78BFA',
    onAccent: '#14092E',
    surfaceTint: '#1C1830',
    canvas: 'cool',
    titleFont: 'sans',
  },
  met: {
    accent: '#D9A441',
    onAccent: '#3A2A05',
    surfaceTint: '#241B10',
    canvas: 'warm',
    titleFont: 'serif',
  },
  louvre: {
    accent: '#D9A441',
    onAccent: '#3A2A05',
    surfaceTint: '#241B10',
    canvas: 'warm',
    titleFont: 'serif',
  },
  rijksmuseum: {
    accent: '#5B9BD5',
    onAccent: '#0A2238',
    surfaceTint: '#16202B',
    canvas: 'cool',
    titleFont: 'serif',
  },
};

export function themeForMuseum(museumId?: string): MuseumTheme {
  if (!museumId) return DEFAULT_THEME;
  return MUSEUM_THEMES[museumId] ?? DEFAULT_THEME;
}

const SERIF_STACK = 'Georgia, "Times New Roman", serif';
const SANS_STACK =
  '-apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, sans-serif';

export function applyTheme(theme: MuseumTheme): void {
  const root = document.documentElement;
  root.style.setProperty('--ml-accent', theme.accent);
  root.style.setProperty('--ml-on-accent', theme.onAccent);
  root.style.setProperty('--ml-surface-tint', theme.surfaceTint);
  root.style.setProperty(
    '--ml-title-font',
    theme.titleFont === 'serif' ? SERIF_STACK : SANS_STACK,
  );
  root.dataset.mlCanvas = theme.canvas;
}
```

- [ ] **Step 4: Run the test — expect pass**

```bash
npx vitest run src/theme/museumThemes.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Create `src/app/MuseumThemeController.tsx`**

```tsx
import { useEffect } from 'react';
import { useSession } from '../state/useSession';
import { applyTheme, themeForMuseum } from '../theme/museumThemes';

/**
 * Applies the active museum's design tokens (spec §6.2) as --ml-* CSS
 * variables. Renders nothing. The full ink-spine restyle consumes these in
 * R2–R4; in R1 the streaming cursor and Listen button already do.
 */
export function MuseumThemeController() {
  const museumId = useSession((s) => s.museum?.id);
  useEffect(() => {
    applyTheme(themeForMuseum(museumId));
  }, [museumId]);
  return null;
}
```

- [ ] **Step 6: Append the `--ml-*` defaults to `src/theme/variables.css`** (end of file)

```css
/* ============================================================
   R1 — MuseumLover theme tokens (spec §6)
   The active museum overrides these via MuseumThemeController;
   the values below are the default gallery-red brand theme.
   ============================================================ */
:root {
  --ml-accent: #d64541;
  --ml-on-accent: #3b0d09;
  --ml-surface-tint: #2a1d17;
  --ml-title-font: Georgia, 'Times New Roman', serif;
}
```

- [ ] **Step 7: Mount the controller in `src/App.tsx`**

Add the import:

```ts
import { MuseumThemeController } from './app/MuseumThemeController';
```

and render it as the first child of the main `<IonApp>` (the one returned after hydration):

```tsx
  return (
    <IonApp>
      <MuseumThemeController />
      <IonReactRouter>
```

- [ ] **Step 8: Full check**

```bash
npx vitest run && npx tsc --noEmit && npm run lint
```

Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/theme/museumThemes.ts src/theme/museumThemes.test.ts \
  src/app/MuseumThemeController.tsx src/theme/variables.css src/App.tsx
git commit -m "feat(r1): museum theme tokens and controller"
```

---

### Task 16: Repo docs refresh + final verification (spec §13)

**Files:**
- Modify: `CLAUDE.md` (full rewrite)
- Modify: `PROJECT.md` (roadmap of record pointer)

- [ ] **Step 1: Replace `CLAUDE.md` with:**

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## What this is

MuseumLover — an AI museum tour guide. Ionic 8 + Capacitor 8 + React 19 +
Vite 5 + TypeScript + Tailwind 4 client; Vercel Functions backend in `api/`
(AI SDK via Vercel AI Gateway → Claude; ElevenLabs TTS; Supabase Postgres +
Storage for the narrative/audio cache).

**Roadmap of record:** `docs/superpowers/specs/2026-06-11-museumlover-replan-design.md`
(phases R1–R5). Implementation plans live in `docs/superpowers/plans/`.

## Commands

- `npm run dev` — Vite only (set `VITE_USE_MOCK_AI=true` for backend-less UI work)
- `npm run dev:full` — `vercel dev`: client + `api/` functions (needs `.env`)
- `npx vitest run` — all unit tests once (`npm run test.unit` is watch mode)
- `npx vitest run path/to/file.test.ts` — single test file
- `npm run lint` — ESLint
- `npm run build` — `tsc && vite build` (client only)
- `npm run typecheck:api` — typecheck the Vercel functions
- `npm run test.e2e` — Cypress

## Environment

Copy `.env.example` to `.env`. Server vars (`AI_GATEWAY_API_KEY`,
`ELEVENLABS_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are
function-side only — the client never holds a provider key. Commit a new
`.env.example` entry whenever you add a variable.

## Architecture in one breath

Capture saves the photo to the Capacitor filesystem FIRST (the photo is
sacred — a failed AI call must never lose a capture), then streams
`POST /api/identify` (SSE: meta → summary → delta… → extras → done) into
`CapturePage` via `src/services/ai/identify.ts`. Narratives are cached in
Supabase by museum + artifact + language + level — never put `interests`
into the narrative prompt (it would fragment the cache, spec §5.3).
`GET /api/tts?nid=…` streams ElevenLabs audio, cached in Supabase Storage.
Museum design tokens are `--ml-*` CSS variables set by
`MuseumThemeController` from `src/theme/museumThemes.ts`.

## Conventions

- Zustand stores in `src/state/`, hydrated once in `App.tsx`.
- Services in `src/services/<area>/`; server-only code stays in `api/_lib/`
  (self-contained — do not import from `src/`).
- Tests colocate as `*.test.ts(x)` next to the source.
- `api/identify.ts` / `api/tts.ts` are thin wiring; logic lives in
  dependency-injected `api/_lib/*Core.ts` factories — test those.
```

- [ ] **Step 2: Update `PROJECT.md`**

In the `### Status today` section, replace the old phase checklist tail (the
lines for 3b through 6) and the backend-pivot blockquote with:

```markdown
- [x] Phase 0 — Bootstrap
- [x] Phase 1 — Onboarding + Profile
- [x] Phase 2 — Museum picker + floor-plan capture
- [x] Phase 3a — Capture loop scaffold (mock AI)
- [x] Phase 3a.5 — Filesystem-backed Journey photos

> **Roadmap of record from here:** the whole-visit replan in
> `docs/superpowers/specs/2026-06-11-museumlover-replan-design.md` —
> R1 real streaming heart (in progress) → R2 conversation → R3 bookends →
> R4 hardening → R5 TestFlight. Backend finalized as Vercel Functions +
> Supabase; the tables above describe the original plan for historical
> context.
```

- [ ] **Step 3: Final verification sweep**

```bash
npx vitest run && npx tsc --noEmit && npm run typecheck:api && npm run lint && npm run build
```

Expected: everything green.

- [ ] **Step 4 (manual): R1 acceptance check (spec §8 R1 row)**

With real keys and `npm run dev:full`, photograph a real artwork photo
(file picker is fine on web):
1. First words on the card in **< 5 s** (stopwatch).
2. Tap Listen — audio starts in **< 10 s** from capture.
3. Same artwork again — `"cached":true` path, near-instant story.
4. Kill the dev server mid-stream — toast appears, no Journey entry, no
   orphaned photo (check Journey tab).

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md PROJECT.md
git commit -m "docs(r1): refresh CLAUDE.md and PROJECT.md to the replan"
```

---

## Plan self-review (completed)

**Spec coverage (R1 row, §8):** Vercel `/api` + Supabase + AI Gateway → Tasks 1, 2, 10; `identify` + `tts` streaming end-to-end → Tasks 10, 11; mock client swapped → Task 12; streaming card + audio player (background + lock-screen) → Tasks 13, 14 (iOS background entitlement explicitly deferred to R4's `cap add ios`, noted in player JSDoc); design tokens §6 → Task 15; repo docs §13 → Task 16. Guardrails §5.5: downscale → Task 4; device id (no enforcement yet, per R4) → Task 4. Cache economics §5.3 → Tasks 7, 10, 11; interests-exclusion rule tested in Task 8.

**Placeholder scan:** no TBDs; every code step has complete code; manual steps are explicit about what a human must provide (credentials only).

**Type consistency check:** `ArtifactMeta` (client `src/domain/aiEvents.ts` ↔ server `api/_lib/identifyTypes.ts` — intentionally mirrored, documented in Task 8); `NarrativeRecord` field names match repo ↔ identifyCore ↔ ttsCore; `IdentifyEvents` shape matches identify.ts ↔ mock.ts ↔ client.ts ↔ CapturePage; `ttsUrlFor`/`resolveApiUrl` used consistently (player resolves, entry stores relative).
