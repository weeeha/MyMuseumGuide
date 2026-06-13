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
