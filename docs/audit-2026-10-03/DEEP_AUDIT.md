# LearnByRP code and runtime audit — 3 October 2026

Audited checkout: `b2c1ad4eca8e140176b7c8e4fb1cb2c71b4f9ef7`.

**Assessment: the current application is not ready for a public production release.** There is substantial useful architecture and a passing core test suite, but the client runtime, evidence authority, server access control, and recovery paths contain concrete failures. More UI work would not resolve these failures.

This was an audit, not a repair. Application source and existing tests were not edited. Dependencies were installed with `npm ci --ignore-scripts`; a web build and normal test artifacts were generated. The pre-existing untracked documents under `docs/` were preserved. Audit files live only in this new subdirectory.

## Verification performed

| Check | Result | What it establishes |
| --- | --- | --- |
| `npm run typecheck` | Passed | Included client/server TypeScript compiles; this does not exercise React effects or device APIs. |
| `npm test -- --reporter=dot` | 732 passed, 3 skipped; 60 files passed, 1 skipped | Strong coverage of pure functions and repository fixtures. Paid-provider acceptance was skipped. |
| `npm run validate:scenes` | Passed, cycle warnings | Released content passes the static validator/model checker; it does not prove live director execution. |
| `npm run build:web` | Passed | Expo exported the web app; 2,848 bundled modules and a 4.1 MB JavaScript bundle. |
| Playwright mobile smoke, light theme | Passed | The six selected screens render at 390×844 without the tested horizontal overflow. |
| Playwright transcript survival, light theme | Failed | The fixture reaches “That mission is no longer available,” before exercising a dropped connection. |
| Audit probes | Reproduced failures below | Actual validator, SQLite/IndexedDB repositories, scene store, lifecycle reducer, router, and transport code. Native APIs are mocked for the transport probe. |
| `npm audit --json` | 37 affected packages: 24 high, 13 moderate | Registry dependency findings at audit time; not 37 proven exploitable application vulnerabilities. Install initially reported 35, so the saved later JSON is the snapshot used here. |

Commands and outputs are preserved in [probes.mts](D:/learnbyRP/docs/audit-2026-10-03/probes.mts), [probe-results.txt](D:/learnbyRP/docs/audit-2026-10-03/probe-results.txt), and [npm-audit.json](D:/learnbyRP/docs/audit-2026-10-03/npm-audit.json).

Run the reproductions with:

```powershell
npx tsx docs/audit-2026-10-03/probes.mts
```

The probes use in-memory databases, a fake IndexedDB, an ephemeral local Express listener, and mocked Expo APIs. They make no paid-provider requests. They print the observed incorrect behavior; they are evidence probes rather than passing acceptance tests.

## Findings requiring attention before release

### 1. [P1] Playback completion recursively starts and stops listening

**Confirmed by executing the transport with mocked Expo APIs.** [NativeVoiceTransport.startListening](D:/learnbyRP/src/providers/voice/nativeVoiceTransport.ts:146) calls `stopPlayback()` before any await. [stopPlayback](D:/learnbyRP/src/providers/voice/nativeVoiceTransport.ts:200) emits `playback_end` even when no playback exists. The [live screen callback](D:/learnbyRP/src/components/LiveSessionView.tsx:1223) reacts by calling `startListening()` when the session is not frozen, muted, or ending.

The resulting call chain is `stopPlayback → playback_end → startListening → stopPlayback`. The safe probe bounded the callback at 25 events and observed **25 playback-end events and 24 recognition starts from one stop call**. Without that bound the synchronous recursion can exhaust the stack, while unwinding can initiate numerous permission/recognition operations.

Fix the event semantics: emit completion only for an actual playback operation, distinguish cancellation from natural completion, and serialize recognition startup. Add an integration test subscribing the screen's listener to the actual transport.

### 2. [P1] Consent denial does not govern microphone capture or local evidence extraction

**Confirmed source wiring; no physical-device test.** Onboarding explicitly promises that voice consent is required for speaking and that denied analysis saves sessions with **no evidence recorded** ([copy](D:/learnbyRP/src/app/onboarding/index.tsx:469)). The consent gate only requires that decision records exist. Neither the live view nor the drill modal checks whether voice processing was granted before starting recognition.

The server does reject assessment without analysis consent, but the [finish path](D:/learnbyRP/src/components/LiveSessionView.tsx:1699) catches that refusal as an availability failure and then [always extracts local phrase evidence](D:/learnbyRP/src/components/LiveSessionView.tsx:1816). Retry finalization does the same. The screen does not receive consent as a runtime prerequisite. Native TTS fallback also continues after a cloud consent refusal.

Enforce current consent before each relevant operation. Treat policy denial separately from outages. With denied analysis, preserve the transcript but create no evidence bundle; with denied voice, allow typing and keep the microphone off. Test withdrawal as well as initial denial.

### 3. [P1] Model-proposed phrase IDs, forms, and modalities become evidence authority

**Confirmed with a validator reproduction.** [normalizeAssessmentResponse](D:/learnbyRP/src/components/LiveSessionView.tsx:194) accepts model-supplied item IDs, forms, session/attempt IDs, and modalities. [validateAssessmentProposal](D:/learnbyRP/src/features/learning/learningCore.ts:100) requires a nonempty item ID but has no canonical phrase catalog/context to verify that ID against its authored form. It matches the transcript against the model's `candidateForm`, and derives modality/retrieval from the proposal rather than the cited passage ([lines](D:/learnbyRP/src/features/learning/learningCore.ts:208)).

For a **typed** learner passage containing `hola`, a proposal naming `phrase.es.cafe_leche`, form `hola`, and modality `spoken` produced a validator-issued observation with **spoken / unassisted** retrieval for the coffee phrase. The archive accepts the resulting branded bundle. This bypasses the central promise that the deterministic product controls what was actually spoken.

Resolve the item ID and form against runtime-authored candidates; take session, attempt, modality, and status from the runtime passage/context. Require a current final learner passage belonging to the assessment attempt. Reject missing citations and `ambiguous` semantic matches rather than accepting everything except `none`. Branded write bundles are valuable, but only as strong as the validator issuing them.

### 4. [P1] Concurrent scene actions corrupt the revision/event chain

**Confirmed against real in-memory SQLite.** [applySceneAction](D:/learnbyRP/src/features/roleplay/sceneStore.ts:292) reads the record, checks deduplication, reduces, writes the event, and writes the snapshot through separate awaits. There is no transaction or revision compare-and-swap spanning those operations.

Two simultaneous proposals with different action IDs and `expectedSceneRevision: 1` both returned **accepted, revision 2**. The stored snapshot remained at revision 2, but replay failed: `expected revision 3, got 2`. This occurs in a single process, so the documented lack of multi-instance tuning does not explain it away. The event/snapshot split also exposes a crash window.

Serialize mutations per session and atomically verify revision, record the first verdict, and update the snapshot. Concurrent create, fork, close, and reconciliation also need coordinated ownership. Test simultaneous actions and duplicate IDs, not just sequential retries.

### 5. [P1] Live turns and support exposures are not durable until session completion

**Confirmed by tracing all runtime archive call sites.** The [briefing route](D:/learnbyRP/src/app/mission/[missionId].tsx:146) writes an empty preflight session. The live screen then adds transcripts and support only to React state/refs. Its [learner-turn handler](D:/learnbyRP/src/components/LiveSessionView.tsx:737) does not write the passage to the archive. The coordinator persists only lifecycle state; the repository contract has no live passage append/update operation.

The first durable full transcript arrives through [completeSession](D:/learnbyRP/src/app/session/[sessionId].tsx:95), after remote assessment can take up to 60 seconds. An app kill, reload, navigation away, or storage failure before that point loses the conversation and help history. Recovery nevertheless tells the learner “Your transcript was saved.” Retry evidence caches are also only in memory.

Persist each finalized turn and exposure before dependent work, keep live scene/attempt metadata durable, and flush the transcript before assessment. Verify by killing/reloading after a recorded learner turn and reopening the archive.

### 6. [P1] Provider authentication is arbitrary caller text; rate limits are trivially reset

**Confirmed by executing the guard.** [resolveProviderIdentity](D:/learnbyRP/server/security/requestGuard.ts:40) accepts any `Bearer` token and hashes it without signature, issuer, audience, expiry, or session validation. Guest identities are also accepted directly from a syntactically valid request header.

The probe accepted `Bearer made-up`; after consuming all 12 realtime requests for that identity, `Bearer another-made-up` obtained another allowance. An attacker can continually rotate identities to call billable actor, coach, assessment, speech, and realtime endpoints. Permissive CORS broadens browser access. The limiter's map also never evicts expired identities.

Implement server-issued bounded guests and verified authentication, with durable/shared quotas and additional abuse limits. Consent headers are client declarations, not authenticated consent records. A valid-looking string must not be called authenticated identity.

### 7. [P1] Hosted scene routes allow anonymous reading and mutation

**Confirmed against the actual Express router.** [roleplayRouter](D:/learnbyRP/server/roleplay/routes.ts:35) is mounted without identity, ownership, consent, or quota middleware. The hosted record has no owner. The probe anonymously created a session (**201**), read it (**200**), and closed it (**200**).

The same boundary exposes scene actions, forks, reconciliation, and abandoned-session discovery. Session IDs generated by the UI are timestamp-based. An anonymous caller with a session ID can read or alter another session; the abandoned list can reveal IDs. Creation also permits a released mission and scene to be paired without checking their relationship.

Bind hosted sessions to an authenticated or server-issued guest owner. Authorize every read/mutation, restrict operational discovery, bound creation/mutation volume, and validate the authored mission/scene pair. IDs alone must not be access credentials.

### 8. [P1] Completing a conversation leaves the lifecycle in `ending`

**Confirmed by executing the exact event sequence.** After saving the recap, [SessionScreen](D:/learnbyRP/src/app/session/[sessionId].tsx:101) dispatches `END`, `ENDED`, `ASSESS_START`, `ASSESS_OK`. The [reducer](D:/learnbyRP/src/features/session/lifecycle.ts:68) has no `ENDED` transition from `ending`; it accepts `PLAYBACK_VERIFIED` or another `END` instead. No live screen events advance the coordinator into `live` either.

Starting at `preflight`, the actual finish sequence ends at **ending**. Its persistence callback can overwrite the just-written `recap_ready` row with `ending`; the later ignored events cannot repair it. On the next boot a finished conversation can appear unfinished.

Align the screen and reducer events and await authoritative persistence in order. Also change the [onEndSession contract](D:/learnbyRP/src/components/LiveSessionView.tsx:132) to return a promise and await/catch it: currently a failed archive write can leave the UI permanently ending with an unhandled rejection. Test finish → reload → no recovery prompt.

### 9. [P1] Checkpoint retry reinitializes the entire live runtime

**Confirmed dependency/source trace; not a mounted React reproduction.** [handleRetryCheckpoint](D:/learnbyRP/src/components/LiveSessionView.tsx:1513) changes `attemptId` at line 1605. Both `handleUserMessage` and `runDirectorCadence` depend on that value, and both are dependencies of the [runtime setup effect](D:/learnbyRP/src/components/LiveSessionView.tsx:1104).

The dependency change runs cleanup: closes the scene session and disposes the transport/provider. Setup then creates fresh instances and [replaces passages with a new greeting](D:/learnbyRP/src/components/LiveSessionView.tsx:1274) tagged `attempt-1`, overwriting the checkpoint-visible transcript. Cleanup sets `mountedRef.current = false`, but setup never resets it to true, suppressing later mirror initialization. Changes to other callback dependencies can cause the same restart.

Give the runtime one stable session lifetime. Update attempt/configuration through current refs or explicit methods, preserve checkpoint context, and make async setup cancellation scoped to the particular setup operation. Test retry after several turns with both transcript and hosted attempt assertions.

### 10. [P1] Removing the last evidence leaves stale learning claims on both platforms

**Confirmed in SQLite and IndexedDB.** Both reprojectors skip phrases when no usable observations remain: [SQLite](D:/learnbyRP/src/features/archive/SqliteArchiveRepository.ts:1007), [IndexedDB](D:/learnbyRP/src/features/archive/IndexedDbArchiveRepository.ts:712). They retain the old status, stats, and schedule.

The probe recorded one unassisted observation, deleted its evidence-bearing session, and read **0 remaining observations**, while the phrase still showed **growing, unassistedCount: 1**. Hiding/disputing the final observation follows the same reprojector path. This undermines deletion and learner correction.

Project every phrase, including the empty ledger; reset status, counters, and schedule from policy. Add removal tests asserting the read-model claim rather than only that database rows disappeared.

### 11. [P1] Wrong drill answers receive independent evidence

**Confirmed by executing the validator.** [validateDrillReview](D:/learnbyRP/src/features/learning/learningCore.ts:391) only checks that a learner quote is nonempty and an attempt was captured. It does not match the answer against the target. Saying `banana` for `Un café con leche` and selecting “remembered” produces **unassisted spoken** evidence for the coffee phrase.

The modal's self-report becomes a semantic verdict. Validate content separately from self-report; when correctness cannot be established, store self-reported practice distinctly without upgrading verified phrase recall.

### 12. [P1] Recap and program completion trust assessor outcome instead of scene truth

**Confirmed source trace.** The [finish outcome mapping](D:/learnbyRP/src/components/LiveSessionView.tsx:1857) uses `proposedOutcome`, even though `finalSceneState.outcome` is already available. The [deterministic server assessor](D:/learnbyRP/server/index.ts:516) returns `achieved` whenever any phrase matches. Producing a greeting or one relevant phrase can therefore mark the mission completed without its authored completion conditions being satisfied.

[Program projection](D:/learnbyRP/src/features/program/projection.ts:31) uses `session.taskOutcome === 'completed'` to unlock progression. Thus the mismatch affects program/final-simulation gates, not only recap wording. When the server is unreachable, the reverse problem occurs: an actually achieved scene can be shown as unknown because assessment failed.

Derive scene outcome from reconciled authoritative scene state. Keep evidence extraction and narrative suggestions separate; never treat phrase presence as task completion. Add disagreement fixtures between scene state and assessor proposals.

### 13. [P1] Remote deletion marks a tombstone but retains the hosted session and events

**Confirmed source trace; provider-side retention was not queried.** [privacy deletion](D:/learnbyRP/server/index.ts:53) only inserts a row in `provider_deletion_tombstones`. It does not remove hosted scene state, attempts, or action payload/event records. Those remain readable through the unguarded scene API. Only the assessment endpoint checks the tombstone; actor and scene mutations do not.

The [client ID](D:/learnbyRP/src/lib/api.ts:41) is regenerated each app load, while server tombstones are identity-scoped. A relaunch does not share the original scope. [ArchiveProvider](D:/learnbyRP/src/features/archive/ArchiveProvider.tsx:200) silently drops failed deletion requests, and no consumer retries the queued jobs; native deletion even queues a job called `assessment` rather than remote cleanup.

Use durable owner identity and apply deletion atomically to hosted records/events with a persistent tombstone protecting all affected write paths. Queue and retry failed remote cleanup explicitly. State clearly what remote/vendor records are outside the app's deletion operation.

## Other concrete defects and incomplete runtime behavior

### 14. [P2] Drill projection discards earlier valid history

**Confirmed on both repositories.** [SQLite recordDrillReview](D:/learnbyRP/src/features/archive/SqliteArchiveRepository.ts:1233) and [IndexedDB recordDrillReview](D:/learnbyRP/src/features/archive/IndexedDbArchiveRepository.ts:824) project from the newly supplied observations alone, despite appending them to the historical ledger. After one independent drill followed by one supported drill, both retain **2 observations** but display **supported, unassistedCount: 0**.

Rebuild from the full active ledger in the same transaction. Drill observations all use `sessionId: 'drill'`, so distinct practice sessions cannot independently satisfy the multi-session steady rule either; introduce real review-session identity if drills should support durable recall.

### 15. [P2] Program/final-simulation provenance is lost at completion

**Confirmed source trace.** The briefing persists `programContext`, including program version and final-simulation designation. The [live finish record](D:/learnbyRP/src/components/LiveSessionView.tsx:1877) constructs a new session and omits it. SQLite replaces the session row with null program fields; IndexedDB replaces the document with the new record. [RecapScreen](D:/learnbyRP/src/components/RecapScreen.tsx:174) reads the omitted final-simulation flag.

Preserve immutable metadata from `initialSession` when forming the completed session. Verify briefing → actual completion → archive export/recap, rather than seeding an already-completed fixture.

### 16. [P2] Audio cancellation does not control all playback resources

**Confirmed source trace; physical audio behavior unverified.** [playViaWebAudio](D:/learnbyRP/src/providers/voice/nativeVoiceTransport.ts:302) creates an `Audio` element in a local variable. `stopPlayback`, mute, freeze, and dispose hold no reference to pause that element, so generated web audio can continue after cancellation/navigation. Native base64 playback resolves its promise only on `didJustFinish`; removing the player during cancellation leaves that promise/subscription unresolved. Pending cloud synthesis can also start playback after a stop unless a request generation invalidates it.

Maintain a playback operation/resource handle for every backend, stop and settle it on every cancellation, and reject stale synthesis results. The live view also hardcodes audio enabled and does not receive the saved `audioPlaybackEnabled`/`autoPlaySpeech` preferences.

### 17. [P2] Director decisions are logged but not operationalized

**Confirmed source trace.** [runDirectorCadence](D:/learnbyRP/src/components/LiveSessionView.tsx:491) evaluates a decision, logs its kind, and returns it. Call sites ignore the returned directive. The live invocation supplies neither communication-challenge capabilities nor pressure policy, so those authored branches are not selected by the director. No actor instruction/action applies the returned complication/opportunity/completion decisions.

The authored catalog, pure director, and model checker are implemented. Execution of those decisions in the live experience is **partial**, and passing authored reachability checks does not prove learners encounter the challenges. Add a bounded directive executor and tests asserting actual actor input and scene events.

### 18. [P2] Archive initialization failure renders a blank app

**Confirmed source trace.** [ArchiveProvider](D:/learnbyRP/src/features/archive/ArchiveProvider.tsx:126) sets an error after a failed initial refresh, but if preferences never loaded its context value stays null. [Its final branch](D:/learnbyRP/src/features/archive/ArchiveProvider.tsx:281) returns nothing, so descendants cannot display the error or offer retry. The separately implemented BootGate is not mounted in the root.

Render an explicit initialization error/retry surface outside the context-dependent subtree, while preserving the existing archive. Test unavailable/corrupt storage and a successful retry.

## Test coverage and authority limits

- `tests/voice-session-regressions.test.ts` and `tests/session-flow.test.ts` contain source-string assertions. They confirm that selected lines exist, but miss the callback recursion, hook dependency restarts, invalid completion events, and lack of live persistence. Keep these as limited structural checks; add behavior tests at the actual integration boundaries.
- The failing transcript-survival E2E seeds preferences and consent, but **no session record**. Its direct session URL is now rejected by the persisted-session prerequisite. Fix the fixture or enter through briefing before testing a dropped turn. The smoke test's successful navigation uses seeded recap data and does not establish actual end-to-end conversation completion.
- The realtime provider has prompt-string tests, but no ordinary unit suite exercising cancellation, connect/dispose races, response correlation, or reconnect context. `handleMessage` uses whichever turn is currently pending without matching response IDs. `dispose` does not invalidate a still-pending secret fetch/connect; reconnect does not clear `lastInstructions` or reconstruct history. These are additional runtime risks requiring focused tests, not claimed live-vendor failures.
- Actor context is narrowed to reviewed character, actions, versions, and finite fact-schema values. However, [resolveActorContext](D:/learnbyRP/server/roleplay/actorContext.ts:85) still takes those fact values from the caller, not from a hosted session snapshot. Actor requests contain no hosted session ID. Its “authoritative scene facts” prompt is therefore schema-validated client state, not server-reconciled truth.
- A lexical phrase matcher is not a semantic verifier. The probe classified `No quiero un café con leche` as an exact match for `Un café con leche`. That utterance does contain the phrase, so this alone is not proof of wrong phrase-production credit. It does prove that phrase presence cannot establish an affirmative order or scene success. Prefix/token-overlap rules need adversarial coverage across Spanish, French, Dutch, German, Italian, and Japanese.
- README's test count and “no realtime” description are stale. The code contains a websocket **text-turn** realtime conversation provider, with separate speech recognition/synthesis; it does not implement the specified WebRTC audio/sideband runtime.
- Server runtime dependencies such as Express, cors, dotenv, tsx, and the provider SDK are under `devDependencies`. A production install omitting dev dependencies cannot run `server:start` as configured. Ship an explicit server build/runtime dependency strategy.
- Dependency audit includes build/development and transitive packages. Do not apply `npm audit fix --force` blindly: the saved resolver suggestions include major changes and some apparent downgrades. Review advisory reachability and compatible upgrades separately. No packages were upgraded here.

## What is well implemented

The skill-evidence boundary is stronger than the phrase boundary: it checks authored membership, passage/revision provenance, opportunity identity/state, support relevance, rehearsal, and credit caps. Scene reduction has useful deterministic allowlists, authored preconditions, and sequential deduplication. SQLite/IndexedDB share an explicit contract and have meaningful parity tests. Support exposure policy is versioned and considers timing and cross-session scope. Local deletion tombstones and validator-issued write capabilities are valuable foundations.

These strengths should be retained. The major failures occur where these modules are wired into live effects, persistence, server identity, and model-derived read models.

## Recommended repair sequence

1. Stop transport recursion; implement cancellation ownership; enforce runtime consent.
2. Persist live transcript/support/attempt state before asynchronous provider work; repair completion transitions and error handling.
3. Make phrase/drill evidence canonical and passage-derived; repair empty-ledger and drill-history projection.
4. Introduce verified ownership/quota boundaries and atomic scene mutations; implement real hosted deletion.
5. Separate authoritative scene outcomes from assessment; stabilize checkpoint retry and preserve program metadata.
6. Execute director directives; repair E2E fixtures and add real behavior tests for the failures above.

Native microphone/audio routing, Expo SQLite on a physical device, vendor acceptance, deployment configuration, concurrent multi-instance operation, and the full visual baseline suite were **not verified**. Passing static checks and the smoke test do not cover those limits.

