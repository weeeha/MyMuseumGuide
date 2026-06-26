# MyMuseumGuide

MuseumLover — an AI museum tour-guide mobile app. Point your camera at an artifact and it identifies the piece, generates a narrative, and reads it aloud.

## What it does

- Capture a photo of an artwork or exhibit (`src/features/capture`, `src/services/camera`)
- Identify the artifact and stream back a narrative via AI (`api/identify.ts`, `api/_lib/identifyCore.ts`, server-sent events in `api/_lib/sse.ts`)
- Narrate the result with text-to-speech (`api/tts.ts`, `api/_lib/elevenlabs.ts`, `api/_lib/ttsCore.ts`), with audio caching (`api/_lib/audioCache.ts`)
- Per-museum theming and a guided tour/journey flow (`src/theme/museumThemes.ts`, `src/features/tour`, `src/features/journey`)
- Persists narratives in Supabase (`api/_lib/narrativesRepo.ts`, `supabase/migrations/0001_narratives.sql`)

## Tech stack

- **Frontend:** React 19 + Ionic React, built with Vite, TypeScript, Tailwind CSS v4
- **Mobile:** Capacitor 8 (camera, geolocation, filesystem, haptics, preferences, share, status bar)
- **State/data:** Zustand, TanStack Query
- **Backend:** Vercel serverless functions (`api/`)
- **AI:** Vercel AI SDK via AI Gateway (`api/_lib/ai.ts`)
- **TTS:** ElevenLabs
- **Database:** Supabase
- **Testing:** Vitest (unit), Cypress (e2e)

## Getting started

```bash
npm install
cp .env.example .env   # fill in the keys below
```

Environment variables (see `.env.example`):

- Server: `AI_GATEWAY_API_KEY`, `ELEVENLABS_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Client: `VITE_API_BASE_URL` (empty for same-origin), `VITE_USE_MOCK_AI` (`true` to use the in-app mock instead of `/api`)

Scripts (from `package.json`):

```bash
npm run dev            # Vite dev server (frontend only)
npm run dev:full       # vercel dev — frontend + api functions
npm run build          # tsc && vite build
npm run preview        # preview the production build
npm run test.unit      # vitest
npm run test.e2e       # cypress run
npm run lint           # eslint
npm run typecheck:api  # type-check the api/ functions
```

## Project structure

```
api/            Vercel serverless functions (identify, tts) + shared _lib
src/
  features/     capture, tour, journey, onboarding, profile
  services/     ai, audio, camera, identity, storage
  state/        Zustand stores (session, journey, user profile)
  theme/        per-museum themes
  domain/       shared types and models
supabase/       SQL migrations
```

Mobile shell is configured via Capacitor (`capacitor.config.ts`, app id `com.museumlover.app`); the web app deploys to Vercel (`vercel.json`).
