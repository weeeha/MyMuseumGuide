# MuseumLover — AI Museum Tour Guide

A mobile app that turns any museum visit into a personalized, AI-narrated tour
in your language and at your level of curiosity.

Stack: **Ionic 8 + Capacitor 8 + React 19 + Vite 5 + TypeScript + Tailwind 4**
shipping to **iOS App Store** first, Android later. Backend on **Cloudflare
Workers + Hono** with **Supabase** for Postgres + Storage. **Anthropic Claude
Sonnet 4.6** (vision + narrative) and **ElevenLabs Turbo v2.5** (TTS) behind a
server proxy that caches identical lookups.

## Pitch

You walk into a museum (say, the Montreal Museum of Fine Arts). You either pick
it from a list or **photograph the floor plan** at the entrance. The app uses
that plan plus a quick web pass to understand which collections live where.

As you walk around and see something interesting, you point your phone at it.
The app **identifies the artifact**, then writes a short narrative just for
you: who made it, when, why it matters, the story behind it, and a couple of
"wanna go deeper?" prompts (similar artists, related movements, the room next
door). It also **reads it aloud**, so you can put your phone away and just
listen.

Everything you photograph gets saved into a **Journey** — a scrollable diary of
the visit you can revisit later, share, or print.

## Core flows

1. **Onboarding** — language, native cultural context, depth level (curious /
   informed / scholarly), interests (e.g. Impressionism, antiquity, modern
   sculpture).
2. **Pick or scan a museum** — choose from a list, or photograph a floor plan.
   The plan becomes context for everything else.
3. **Capture an artifact** — point and shoot. We identify it (label OCR + visual
   match), then generate a personalized narrative + audio.
4. **Listen / read / save** — narration plays, the entry lands in your Journey.
5. **Go deeper** — tap a follow-up to spawn a new mini-page on a related
   artist, movement, or technique.
6. **Journey** — chronological log of the visit, with photos, summaries, and
   audio.
7. **Profile / Subscription** — language, interests, credit balance, plan.

## Paid add-ons (post-MVP)

- **Photo cleanup**: remove glass glare, crop crowd, straighten, denoise.
- **Annotated export**: render the artifact name + period directly on the
  photo for sharing.
- **Offline pack**: pre-download a curated tour for a specific museum.

## Architecture (target)

```
┌──────────────┐    ┌──────────────────────────────┐    ┌──────────────────┐
│  iOS app     │ →  │  Backend (FastAPI / Hono)    │ →  │ AI providers     │
│  Capacitor + │    │  • Auth + subscription       │    │ • Anthropic      │
│  React +     │    │  • Artifact cache (per       │    │   Claude (text + │
│  Ionic       │    │    museum + tag + lang +     │    │   vision)        │
│              │    │    level)                    │    │ • OpenAI / 11Labs│
│              │    │  • TTS proxy                 │    │   (TTS)          │
│              │    │  • Floor-plan understanding  │    │ • Google Lens    │
│              │    │  • Photo enhancement         │    │   API (label OCR)│
└──────────────┘    └──────────────────────────────┘    └──────────────────┘
```

The client never holds a provider API key — every AI call goes through our
backend, which charges credits against the user's subscription.

### Why a backend (not direct calls)

- Hide API keys (App Store rejection risk if shipped in the binary).
- Cache identical lookups across users (huge cost win at scale: 10 visitors
  who all photograph the same Monet only generate the description once per
  language × level bucket).
- Rate-limit and meter credits.
- Mix providers per task (Claude for text, ElevenLabs for voice, etc.) without
  client changes.

### Provider shortlist (to validate)

| Task                   | First pick                    | Backup           |
| ---------------------- | ----------------------------- | ---------------- |
| Artifact identification| Claude Sonnet 4.6 (vision)    | GPT-4o vision    |
| Narrative generation   | Claude Sonnet 4.6 / Haiku 4.5 | GPT-4o-mini      |
| TTS                    | ElevenLabs Turbo v2.5         | OpenAI tts-1-hd  |
| Floor-plan parsing     | Claude Sonnet 4.6 (vision)    | GPT-4o vision    |
| Photo cleanup (glass)  | Replicate (real-ESRGAN +      | bespoke pipeline |
|                        | dehaze) or Gemini 2.5 image   |                  |

Latency budget for the "point and learn" loop: **< 5 seconds** to first
caption, **< 10 seconds** to audio start. Use streaming for both.

## Repository layout

```
src/
  app/              # Routing, providers, app shell
  features/
    onboarding/     # Language + interests + level setup
    tour/           # Museum picker + floor plan
    capture/        # Camera flow + artifact recognition
    artifact/       # Detail page + narration + follow-ups
    journey/        # Saved entries
    profile/        # Subscription + preferences
  services/
    ai/             # AIService — swap mock for real backend
    tts/            # TTSService — swap mock for real backend
    storage/        # Local persistence (Capacitor Preferences)
  domain/           # Types: Museum, Artifact, JourneyEntry, UserProfile
  ui/               # Shared building blocks (cards, buttons, etc.)
```

Existing `pages/DesignTokens.tsx`, `pages/Components.tsx`, `pages/Todo.tsx` are
kept as the design-system reference and live at `/dev/*` routes for now.

## Roadmap (6 weeks to TestFlight)

Decisions baked in: Mac available, Apple Developer enrollment in progress;
launch museum is **Montreal Museum of Fine Arts** with a curated artifact
pack; pricing is **$6.99/mo with credits + $2.99 top-up packs**; auth is
**Sign in with Apple only**; backend is **Cloudflare Workers + Hono + Supabase
(Postgres + Storage)**; AI is **Anthropic Claude Sonnet 4.6 vision** for
identification + narrative and **ElevenLabs Turbo v2.5** for TTS.

| Phase | What ships | Accept when |
| ----- | ---------- | ----------- |
| **0 — Bootstrap** (this commit) | Renamed app identity, deps added, tab shell, design system intact, starter cruft removed. | `npm run dev` serves the onboarding flow; design system at `/dev/tokens` and `/dev/components` still works. |
| **1 — Shell + Onboarding + Profile** (this commit) | Onboarding (language → level → interests), Zustand + Capacitor Preferences persistence, Profile page reading the store. | Kill app, reopen, profile survives. All 10 languages pickable. Onboarding only on first launch. |
| **2 — Museum Picker + Floor-Plan Capture** | 6-museum hard-coded list, Capacitor Camera, photo upload to mock backend, `Museum` + `FloorPlan` in session. | Pick MMFA, scan a printed plan, see detected topics in session. |
| **3a — Capture loop scaffold** | Capture → ArtifactCard → Journey loop end-to-end against the mock AI client; reusable `ArtifactCard`; swipe-to-delete + `Reset everything`. | Capture a photo (web file picker or device camera), see a mock narrative, find it in Journey. |
| **3a.5 — Filesystem-backed Journey photos** | Photos written to `Filesystem.Directory.Data` keyed by entry id; Journey index in Preferences holds only paths; legacy entries auto-migrate on hydrate. | Capture, hard-reload, thumbnail still loads; delete an entry, file is removed; `Reset everything` empties the photos dir. |
| **3b — Capture loop with real AI** | Backend live; Claude vision identification; ElevenLabs streamed TTS. | Inside MMFA, photograph a painting, get narrative in <6s, audio in <10s, entry saved. |
| **4 — Auth + Paywall** | Sign in with Apple, RevenueCat ($6.99/mo + $2.99 top-up), free-tier gate (5 captures/mo), follow-ups, annotated export. | Sandbox IAP completes; SIWA works; free user paywalled at 5 captures. |
| **5 — Hardening + TestFlight** | Privacy manifest, Info.plist strings, nutrition labels, app icon + splash, Sentry, analytics. | First TestFlight build runs on a real iPhone for 30 min crash-free over cellular. |
| **6 — App Store** | Screenshots, metadata, submission. | Approved. |

### Status today

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

### Pre-launch checklist (Apple)

- [ ] Apple Developer Program enrolled (1–3 days; start now).
- [ ] Bundle ID `com.museumlover.app` reserved in App Store Connect.
- [ ] `npx cap add ios` once Apple Developer account is active.
- [ ] `Info.plist` usage strings: camera, photo-library-add.
- [ ] `PrivacyInfo.xcprivacy` merged with Capacitor's.
- [ ] App Privacy Nutrition Labels filled in.
- [ ] Sign in with Apple capability enabled (only auth method → no SIWA-required-as-option trap).
- [ ] RevenueCat configured (`museumlover.monthly`, `museumlover.credits.topup.20`).
- [ ] Free tier = 5 captures/month, English + device language, no TTS — keeps Apple's "too much paywalled" reviewers happy.

### Open questions for later

- Voices: one default per language vs. let user pick.
- Analytics: PostHog vs. plain fetch-to-Worker event log.
- Supabase region: `us-east-1` vs. `eu-central-1` (depends on first audience).
- Journey sharing: strictly personal in v1 (recommended) vs. shareable later.
