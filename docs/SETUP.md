# Backend provisioning

One-time setup to take MuseumLover from "unit tests pass" to "real photo,
real narrative, real audio". Everything here needs account access, so a human
does it — an agent should stop at this file and ask.

Verify each stage with `npm run preflight`, which checks all four credentials
against the live services and tells you exactly which one is wrong.

## 1. Supabase

1. Create a project — region **`us-east-1`** (spec §5.2; the launch museum is
   in Montreal, and the AI Gateway/Vercel functions default to US East).
2. SQL Editor → run both migrations, in order:
   - [`supabase/migrations/0001_narratives.sql`](../supabase/migrations/0001_narratives.sql) — the narrative cache table
   - [`supabase/migrations/0002_audio_bucket.sql`](../supabase/migrations/0002_audio_bucket.sql) — the public `audio` bucket for cached TTS
3. Settings → API → copy the **Project URL** and the **`service_role`** key
   (not `anon` — the functions are the only consumer and they need to bypass RLS).

## 2. Provider keys

- **AI Gateway** — Vercel dashboard → AI Gateway → create a key. Only needed
  for local dev; deployed functions authenticate via OIDC automatically.
- **ElevenLabs** — dashboard → API key. The plan must include
  `eleven_turbo_v2_5` ([elevenlabs.ts](../api/_lib/elevenlabs.ts) hardcodes it).

## 3. Local `.env`

```bash
cp .env.example .env
```

Fill the four server vars, then:

```bash
npm run preflight
```

All five checks must be green before going further.

## 4. Vercel

```bash
vercel link
```

Then add the same four vars so `vercel dev` and deploys can see them. Do this
yourself — never paste keys into an agent session:

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ELEVENLABS_API_KEY
vercel env add AI_GATEWAY_API_KEY
```

## 5. Prove the R1 gate

The acceptance criterion for R1 is a real artifact photo: **first words < 5 s,
audio start < 10 s** (spec §8).

```bash
sips -Z 1280 ~/Desktop/artwork.jpg --out /tmp/measure.jpg
npm run dev:full
npm run measure -- /tmp/measure.jpg --museum mmfa
```

The script prints a phase-by-phase breakdown and exits non-zero if either
budget is missed. Run it a second time on the same photo to see the cached
path — a cache hit should be dramatically faster and is the number that
matters for unit economics (spec §5.3).

### Known structural risk

`/api/tts` takes a `narrativeId`, and that id is only minted after the full
narrative has been generated *and* written to Postgres
([identifyCore.ts:102](../api/_lib/identifyCore.ts:102)). Audio synthesis
therefore starts only after generation finishes rather than overlapping it.
Measure before deciding whether this needs re-architecting — if generation
lands around 4–5 s, the 10 s audio budget may hold anyway.
