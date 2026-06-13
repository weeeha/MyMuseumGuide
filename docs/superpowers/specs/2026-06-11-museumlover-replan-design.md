# MuseumLover Replan — Whole-Visit Companion (v1 Sprint)

- **Date:** 2026-06-11
- **Status:** Approved by Nick (sections 1–3 validated in brainstorming session)
- **Supersedes:** the Phase 3b–6 roadmap in `PROJECT.md`
- **Unchanged:** Phases 0–3a.5 remain done and are the foundation this builds on

## 1. Why replan

Four drivers, all confirmed: the product direction deserved a rethink, the
roadmap had gone stale, the stack had open questions (Cloudflare vs Vercel
pivot note), and a new model generation (Fable 5) changes both what the app
can do and how fast it can be built.

## 2. Goals

MuseumLover serves four goals at once, and v1 must not sacrifice any of them:

1. **Real business** — paying users on the App Store, eventually.
2. **Personal tool** — makes Nick's own museum visits genuinely better.
3. **Learning & portfolio** — mastery of the modern AI app stack, visible artifact.
4. **AI showcase** — demonstrates what current AI makes possible.

**Working rhythm:** sprint. ~4–6 weeks to a TestFlight build testable in a
real museum, with aggressive v1 cuts.

## 3. Decision summary

**Chosen: Plan A — "Deepen the spine."** Keep the existing Ionic/Capacitor
scaffold; make the in-visit capture loop world-class with real AI; wrap it
with thin-but-genuine pre-visit and post-visit bookends so the whole-visit
vision ships in v1.

Rejected alternatives:

- **Plan B — heart only:** fastest (3–4 weeks) but abandons the whole-visit
  vision. Retained as the explicit fallback if week 4 slips.
- **Plan C — rewrite (Expo/RN or SwiftUI):** not justified now. The v1 heart
  (snap → narrate → converse) does not need realtime video streaming;
  Capacitor demonstrably handles camera, filesystem, and audio in this repo;
  a rewrite burns 1–2 weeks of the sprint reaching parity. The rewrite
  question is re-asked at v2 if the live conversational guide becomes the bet.

## 4. Product definition

**One-liner:** an AI companion for your whole museum day — it helps you plan
the visit, makes you understand what you're looking at, talks with you about
it, and hands you a beautiful memory of the day.

The product is three arcs around one heart. The heart — in-visit "see &
understand" — must be world-class in v1. The bookends are deliberately thin
slices.

### 4.1 Pre-visit (thin)

- Pick a museum from the list **or** scan the entrance floor plan — both
  already built (Phase 2).
- **New — "Plan my visit":** one screen. Inputs: floor-plan detected topics +
  user profile (interests, level, language) + "how much time do you have?".
  Output: a personalized route — an ordered list of stops, each with a
  one-line hook ("Room 12 — the Impressionists you came for"). Stored on the
  session, viewable any time during the visit.
- Explicitly **not** indoor navigation, positioning, or rendered maps. It is
  a smart checklist.

### 4.2 In-visit — the heart (world-class)

- Point and shoot → identification + personalized narrative **streams** onto
  the artifact card: **< 5 s to first words, < 10 s to audio start**.
- Narrative is personalized by language, level, interests, museum context,
  and (when present) the visit plan.
- **New — every artifact card is a conversation.** Follow-up questions by
  push-to-talk voice or text; answers stream as text and are spoken aloud.
  The existing follow-up chips become conversation starters.
- Entry saves to Journey with photo on the filesystem (Phase 3a.5 behavior
  unchanged: photo persisted first, AI second — a failed AI call never loses
  a capture).

### 4.3 Post-visit (thin)

- **New — "End visit" → memory book:** AI-written summary of the day, the
  route taken, photos with one-line takeaways. Viewable in-app and shareable
  as a web link that renders on any phone (server-rendered share page).
  Sharing publishes a snapshot (photos + text) to Supabase Storage under the
  share id; the in-app book itself stays local.
- The share link is also the v1 growth loop: the artifact people show friends
  *is* the marketing.

### 4.4 Explicit v1 cuts (deferred post-TestFlight)

- Paywall / RevenueCat / IAP — TestFlight does not need it. Costs are guarded
  by an anonymous per-device credit quota instead.
- Sign in with Apple — no accounts in v1; anonymous device id only.
- Photo cleanup (glare removal etc.), annotated photo export.
- Offline packs, journey cloud sync, Android.

### 4.5 v1 acceptance scenario

At the Montreal Museum of Fine Arts: scan the floor plan → receive a route →
capture ~10 artifacts over a day (first words < 5 s, audio < 10 s) → hold a
3-turn voice conversation about one artifact → end the visit → the memory-book
link opens on a friend's phone. The TestFlight build survives 30 minutes of
real-museum use on cellular, crash-free.

### 4.6 In-visit experience decisions

Validated choices for the seams between moments:

- **Resting face — visit dashboard.** During an active visit the app opens
  to a dashboard: route progress on top, a large capture button below; the
  camera is one tap away. The dashboard becomes the in-visit home when the
  route ships (R3); until then the existing tab shell stands.
- **Audio — smart auto-play.** With earbuds connected, narration auto-plays
  when ready and keeps playing with the screen locked (proper background
  audio session + Now Playing lock-screen controls, built in R1). On
  speaker, narration waits for a tap — nothing blasts in a quiet gallery.
- **Visit lifecycle — explicit with a nudge.** Picking or scanning the
  museum starts the visit; "End visit" on the dashboard ends it. If a visit
  is left open, a local notification that evening offers to wrap up and
  build the memory book (`@capacitor/local-notifications`). The app never
  ends a visit silently; no geolocation permission in v1.
- **Guide initiative — spoken invitations.** Every narration ends with one
  spoken teaser ("…and if you want to know why the critics hated this, just
  ask"). Pure prompt design: zero cost, invites conversation, makes the
  conversation feature discoverable. The guide never speaks unprompted
  otherwise.
- **Dead zones — quiet badge.** Captures always succeed instantly (photo
  first, AI second). Offline captures sit in Journey as "waiting for
  signal" entries; the dashboard shows "2 stories on their way"; arrivals
  chime softly and never auto-play over an ongoing narration or
  conversation.
- **Navigation — four flat tabs.** Home · Capture · Journey · You (today's
  shell with renames: Tour → Home, Profile → You). Home is contextual —
  museum start screen outside a visit, the visit dashboard during one. The
  Capture tab opens straight into the viewfinder; the artifact card opens
  as a sheet over the current tab; the route lives inside Home rather than
  being its own destination.

## 5. Architecture

### 5.1 Client

Unchanged scaffold: Ionic 8 + Capacitor 8 + React 19 + Vite 5 + TypeScript +
Tailwind 4. The `aiClient` seam (`src/services/ai/client.ts`) was built to be
swapped from mock to real; that is exactly what happens in R1.

New client capabilities:

- **Streaming audio player** — plays TTS audio as it arrives.
- **Push-to-talk voice input** — on-device iOS speech recognition via a
  Capacitor community plugin (free, low-latency). Default candidate:
  `@capacitor-community/speech-recognition`; confirm plugin health and
  per-language coverage for all 10 app languages during R2 — text input is
  the universal fallback wherever on-device STT falls short. No server STT
  in v1.
- **Client-side image downscale** (~1280 px long edge) before upload.

### 5.2 Backend — Vercel Functions + Supabase

Decision finalized: **Vercel Functions in this same repo** (already
Vercel-linked via `vercel.json`), Node runtime on Fluid Compute. **Supabase**
(Postgres + Storage), region `us-east-1` (launch museum is Montreal).
The client never holds a provider API key.

| Endpoint | Does | Model |
|---|---|---|
| `POST /api/identify` | photo + profile + museum context → streamed narrative (SSE) | **Fable 5** (vision); fallback Sonnet 4.6 |
| `POST /api/converse` | artifact context + question → streamed answer | **Haiku 4.5** |
| `POST /api/plan-visit` | floor-plan topics + profile + time budget → route JSON | Sonnet 4.6 |
| `POST /api/tts` | text → streamed audio | ElevenLabs (Turbo family), streamed |
| `POST /api/memory-book` | visit entries → day summary + share assets | Sonnet 4.6 |
| `GET /share/[id]` | server-rendered memory-book share page (plain HTML from a function) | — |

- Anthropic calls route through the **Vercel AI Gateway** (`anthropic/...`
  model strings): one key, automatic fallbacks, observability. ElevenLabs is
  called directly. Exact ElevenLabs model/voice per language chosen in R1
  against the latency budget.
- Rationale for a backend at all (unchanged from original plan): hide keys,
  cache across users, meter quotas, mix providers freely.

### 5.3 Caching — the unit economics

- **Narratives** cached in Postgres keyed by museum + artifact + language +
  level bucket. Ten visitors photographing the same Monet pay for one
  generation per bucket.
- **TTS audio** cached in Supabase Storage keyed by text-hash + voice.
- **Conversations are never cached** — they are personal.

### 5.4 Identification accuracy

- Per-museum **context pack** (curated MMFA artifact/collection list)
  injected into the identify prompt.
- UX nudge to include the wall label in frame — the model reads the label,
  which beats pure visual matching.

### 5.5 Guardrails

- Per-device daily caps (Supabase counters, anonymous device id), failing
  soft with a clear in-app message.
- No PII server-side in v1.

## 6. Design language

Reference: pliability-style mobile UI — near-black canvas, oversized
editorial type, a single vivid accent, full-bleed imagery, pill CTAs,
minimal chrome. MuseumLover adapts the formula with one twist: **the accent
belongs to the museum, not the app.**

### 6.1 Ink spine (fixed)

A monochrome dark skeleton shared by every screen: near-black canvas,
neutral grays, big display titles, pill CTAs, hairline dividers, three-tab
bar (Route · Capture · Journey). The spine is never themed — consistency
lives here.

### 6.2 Museum themes (variable)

The active museum sets a small token set via CSS variables: `--accent`,
`--on-accent` (always the darkest shade of the accent family),
`--surface-tint` (chips, mic button), canvas temperature (warm charcoal /
cool black / stone-dark), and a display-font flavor for artifact titles
(serif for fine arts & antiquity, sans for modern & contemporary).

Curated examples: MMFA — vermilion on warm charcoal, serif titles.
Contemporary art — electric violet on cool black, sans titles.
Archaeology — verdigris on stone-dark, serif titles.

Sourcing: hand-curated themes for the six listed museums. For a scanned,
unlisted museum, the floor-plan parse response additionally returns a
model-suggested accent; fallback is the default brand theme.

### 6.3 Default brand theme

**Gallery red** — vermilion accent on warm charcoal with serif display —
used on museum-less surfaces (onboarding, Journey home, Profile) and as the
brand identity. Purple deliberately lives on as the contemporary-museum
theme rather than the brand color.

### 6.4 Guardrails & implementation

On-accent text always uses the darkest shade of its accent family; every
curated accent is contrast-checked against its canvas. A small ThemeProvider
reads the session's active museum and sets CSS variables — Tailwind 4 and
Ionic both consume them natively. Tokens land in R1; screens adopt the
language as they are touched in R2–R3; the R4 polish pass trues everything
up. Post-v1 flourish (backlog): artifact-extracted "living accent" — e.g.,
the audio progress bar takes the captured artwork's dominant color.

## 7. Data model changes (`src/domain/types.ts`)

- **`Visit`** — `id`, `museumId`, `startedAt`, `endedAt?`. Journey entries
  gain `visitId`; the memory book is per-visit. Existing entries migrate into
  a synthetic visit on hydrate (same pattern as the 3a.5 photo migration).
- **`VisitPlan`** — ordered stops (`title`, `hook`, `done?`) attached to the
  session/visit.
- **`ArtifactConversation`** — message list attached to a journey entry.
- **`MemoryBook`** — `visitId`, generated summary, `shareId`.
- **`MuseumTheme`** — `accent`, `onAccent`, `surfaceTint`, `canvas`,
  `titleFont: 'serif' | 'sans'`; optional `theme` on `Museum`; scanned
  museums may carry a suggested accent from the floor-plan parse.
- **`JourneyEntry.status`** — `'pending' | 'ready'`, so offline captures
  render as "waiting for signal" cards (quiet-badge behavior, §4.6).

## 8. Roadmap

Phases 0–3a.5 remain done. The following replaces old Phases 3b–6:

| Phase | Week | Ships | Accept when |
|---|---|---|---|
| **R1 — Real heart** | 1–2 | Vercel `/api` + Supabase + AI Gateway; `identify` + `tts` streaming end-to-end; mock client swapped out; streaming card + audio player (background + lock-screen); design tokens (§6); repo docs refreshed (§13) | Real artifact photo on device: first words < 5 s, audio < 10 s |
| **R2 — Conversation** | 3 | `converse`; push-to-talk + text input; spoken replies; chips become openers | 3-turn voice conversation about a captured artifact |
| **R3 — Bookends** | 4 | `plan-visit` + route screen; visit dashboard as in-visit home; `Visit` model + migration; end-visit nudge; memory book + share page | Full-day flow yields a share link that opens on another phone |
| **R4 — Hardening** | 5 | Offline/error states, cost caps, Sentry, privacy manifest, icons/splash, `npx cap add ios`, Info.plist strings | App survives airplane-mode galleries gracefully |
| **R5 — TestFlight** | 6 | Build + MMFA field test | 30 min real-museum use, crash-free, on cellular |

Identification accuracy is validated in week 2 — the earliest possible moment
— because it is the highest product risk.

**Fallback:** if week 4 slips, ship R1 + R2 only (Plan B) and move R3 behind
TestFlight.

## 9. Error handling principles

- **The photo is sacred.** Saved to filesystem first, AI called second; a
  failed AI call never loses a capture (already guaranteed by 3a.5).
- **Museums have terrible signal.** Captures queue as "pending" Journey
  entries and retry when connectivity returns; every AI call has a timeout
  and a human-readable retry affordance on the card.
- **Caps fail soft** with a clear message, never a dead-end.

## 10. Testing

- **Vitest (unit):** cache keys, prompt builders, credit metering,
  visit/migration reducers; backend function logic (caching, quotas).
- **Component tests:** capture and conversation flows against a stubbed
  client.
- **Cypress (existing setup):** web happy path.
- **Field test (R5 gate):** MMFA, real device, cellular.

## 11. Risks

| Risk | Mitigation |
|---|---|
| Identification accuracy in the wild | Museum context pack + wall-label nudge; validated week 2 |
| Voice input in noisy galleries | Push-to-talk, short utterances; text input always available |
| TestFlight API costs | Per-device caps + narrative/TTS caching |
| 6-week clock | Plan B fallback (R1+R2 only) pre-agreed |
| Ionic "web feel" on iOS | Existing design system + R4 polish pass; revisit stack only at v2 |

## 12. Post-v1 backlog (in rough order)

1. Paywall (RevenueCat: `museumlover.monthly` $6.99, top-up packs) + Sign in
   with Apple + free-tier gate.
2. Android.
3. Photo cleanup + annotated export.
4. Offline packs; journey cloud sync.
5. **v2 bet to evaluate: live conversational guide** (realtime camera +
   voice). This is when the Expo/SwiftUI rewrite question is re-asked, with
   revenue and learning in hand.

## 13. Repo housekeeping (part of R1)

- Rewrite `CLAUDE.md` — it still calls the repo an empty stub; it must
  document the real commands (`npm run dev`, `npm run build`,
  `npm run test.unit`, `npm run lint`) and architecture.
- Update `PROJECT.md` to reference this design as the roadmap of record.
