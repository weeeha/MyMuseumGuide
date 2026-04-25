# Visitor — AI Museum Tour Guide

A mobile app that turns any museum visit into a personalized, AI-narrated tour
in your language and at your level of curiosity.

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

## Status

- [x] Repo scaffold (Ionic + Capacitor + React + Vite + TS + Tailwind)
- [x] Design tokens + light/dark theme
- [x] App shell with tab navigation (Tour, Capture, Journey, Profile)
- [x] Onboarding flow (mock)
- [x] Tour page with museum picker + floor-plan upload (mock)
- [x] Capture → artifact detail (mock AI)
- [x] Journey log (in-memory + localStorage)
- [x] Profile with credits & subscription stub
- [ ] Real Capacitor camera integration
- [ ] Backend service (artifact cache + AI proxy + billing)
- [ ] Streaming responses
- [ ] Photo cleanup pipeline
- [ ] iOS App Store submission

## Open decisions

- **First museum partner**: self-curate Montreal Museum of Fine Arts as the
  "golden path" before generic mode.
- **Pricing**: credit-based vs. monthly. Suggest monthly with included credits
  + top-ups for paid add-ons.
- **Cold-start identification**: do we ask the user to also photograph the
  caption/label? Likely yes — drives accuracy from ~70% to ~95%.
