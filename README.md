# Mission Coach

Voice-first language practice in real-life situations. Expo + React Native client,
TypeScript backend, one shared learning core.

Practise spoken Spanish, French, German, Italian, or Japanese with a character in a
realistic scene. Every session produces a grounded evidence ledger: the app only
credits a phrase when it can verify from your own transcript that you produced it.

## Architecture

Three layers, each able to fail without taking down the others.

| Layer          | Owns                                                        | Authority                    |
| -------------- | ----------------------------------------------------------- | ---------------------------- |
| **Conversation** | Microphone, recognition, character audio, interruption      | `expo-speech-recognition` + `expo-audio` |
| **Scene**      | What is true in the fiction: facts, actions, outcomes       | Server reducer + client mirror |
| **Learning**   | What you demonstrably did, and with what help                | Pure TypeScript core over local SQLite |

The model **proposes**. The product **validates**. `src/features/learning/learningCore.ts`
is the only thing that writes an `observation`, and `src/features/roleplay/sceneReducer.ts`
is the only thing that changes a scene fact.

## Authority

These documents are not equal, and the order matters when they disagree.

The user-selected product direction is now
`docs/LEARNBYRP_COMPLETE_LEARNING_CONTENT_UX_ARCHITECTURE_V2.md`. Its phased
reconciliation and implementation status are tracked in
`docs/ARCHITECTURE_V2_IMPLEMENTATION.md`. The first delivery focuses on adult
learners using Belgian Dutch for everyday life. Existing contracts remain the
runtime boundary; blueprint examples do not automatically become reviewed content.

| Document | Status |
| -------- | ------ |
| `docs/LEARNBYRP_COMPLETE_LEARNING_CONTENT_UX_ARCHITECTURE_V2.md` | Current product, learning and delivery blueprint |
| `docs/ARCHITECTURE_V2_IMPLEMENTATION.md` | Blueprint-to-code reconciliation and acceptance gates |
| `Mission Coach — Master Product Architecture Specification.md` | Detailed prior runtime specification; reconcile with V2 and existing contracts |
| `MISSION_COACH_UI_UX_DESIGN_SYSTEM_v2.md` | UI authority. Generated tables come from `src/design/tokens.ts` |
| `MISSION_COACH_COMPLETE_UI_UX_DESIGN_SYSTEM_2026_v1 (1).md` | **Superseded.** Kept for history; do not copy values from it |
| `ADOPE_APP_AUDIT_AND_FRAMEWORK_DECISION.md` | Provenance for the stack: why this stayed on NativeWind and the 4,299-line spec was not treated as authority |
| `LEARNBYRP_REMAINING_TASKS_WITH_MURAL_IMPROVEMENTS_v1.md` | Remaining-work plan, in canonical order |

The v2 spec exists because the v1 one could not be implemented as written: several
semantic colour pairs failed contrast, and `src/design/tokens.ts` is now the source
that generates the spec's tables rather than the other way round.

## Layout

```
src/
  app/                          Expo Router screens
    _layout.tsx                 providers + boot recovery gate
    (tabs)/                     Talk · Missions · Vocabulary · Progress
    onboarding/                 first run: language, comfort, consent
    recovery.tsx                unfinished sessions, app-kill recovery
    session/[sessionId].tsx     full-screen live conversation
    recap/[sessionId].tsx       learning receipt
    phrase/[phraseId].tsx       phrase detail + transcript evidence
    settings/privacy.tsx        consent, retention, export, deletion
  contracts/
    scene.ts                    shared types, both sides import these
    fixtures.ts                 the §18.5 scenarios as data
    contractTests.test.ts       the regression suite
  content/scenes.ts             authored SceneDefinitions
  features/
    archive/                    SQLite schema, migrations, repository, provider
    learning/                   matcher, validator, projection, versioned policy
    roleplay/                   scene reducer, store, client mirror
    session/                    lifecycle reducer, coordinator
    consent/                    the gate that blocks the app until you decide
  lib/                          api client, share sheet, theme preference
  providers/voice/              speech capture and playback
  types/                        domain types
server/
  index.ts                      actor, coach helper, assessment
  roleplay/routes.ts            /v1/voice/sessions + scene director
```

## Running

```bash
npm install
cp .env.example .env      # set GEMINI_API_KEY
npm run server:dev         # API on :3000
npm start                  # Expo, in another shell
```

Provider keys and `GUEST_IDENTITY_SECRET` stay on the server. Production must set
a stable random `GUEST_IDENTITY_SECRET` of at least 32 characters on every API
instance; local development creates a private ignored key under `.data/`. The app
stores its signed guest credential in platform secure storage (web storage on
browser builds), so hosted sessions remain tied to that credential across reloads.
If the API is behind a trusted reverse proxy, set `TRUST_PROXY_HOPS` to the exact
number of proxy hops so per-IP guest issuance limits use the client IP safely.
`EXPO_PUBLIC_API_BASE_URL` points the app at the API — `http://localhost:3000` on
the iOS simulator, `http://10.0.2.2:3000` on an Android emulator, your LAN IP on a
physical device.

## Checks

```bash
npm run typecheck
npm test
```

`npm test` runs 200 tests over the learning core, evidence classification, skill
projection, transcript assembly, the archive, the scene reducer, the scene store,
and the contract fixtures. The fixtures encode the specification's required
scenarios: a clear paraphrase is credited, a perfect sentence for the wrong item
is not, a double tool request produces one transition, a stale revision is
refused, a hinted repetition cannot raise independent recall, and a typed answer
is never recorded as spoken evidence.

Several tests deliberately assert the limit rather than the success: a lapse
requires a genuine cold attempt with nothing on screen, repeated attempts in one
sitting do not become separate skill contexts, an in-memory database does not
survive a reopen, and a stale transcript revision removes the evidence that cited
it. These are the claims most likely to rot silently, so they are pinned.

## Known gaps

- **No realtime voice.** Conversation is turn-based HTTP, not WebRTC. The spec
  calls for OpenAI Realtime over WebRTC with a server sideband; that needs a
  provider account, a deployed backend, and physical devices to verify
  microphone and audio routing. Nothing here pretends otherwise.
- **The scene store is SQLite on a file, not PostgreSQL.** `sceneStore.ts` is the
  same interface a PostgreSQL `hosted_sessions` + `scene_events` pair would
  implement, including idempotency by `action_id`. It writes to
  `.data/scenes.sqlite` (override with `SCENE_DB_PATH`) with WAL and
  `synchronous = FULL`, and survives a process restart: verified by closing the
  database handle, reopening from disk, and confirming the committed revision
  and its dedup log are intact. It is not yet PostgreSQL, and it is not tuned for
  multi-instance deployment.
- **`expo-sqlite` is untested on device.** Migrations, transactions, the
  observation uniqueness constraint and deletion markers are written and
  typechecked, and are exercised against real SQLite in the test suite, but have
  not run through the `expo-sqlite` driver on a simulator. `npx expo run:ios` is
  the first real test of that path.
- **Not implemented:** usage metering, guest bootstrap, and account surfaces.
