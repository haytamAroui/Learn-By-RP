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

The Gemini key stays on the server. `EXPO_PUBLIC_API_BASE_URL` points the app at
it — `http://localhost:3000` on the iOS simulator, `http://10.0.2.2:3000` on an
Android emulator, your LAN IP on a physical device.

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
