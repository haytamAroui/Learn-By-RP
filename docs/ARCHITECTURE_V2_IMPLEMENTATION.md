# LearnByRP V2 — reconciliation and implementation gates

Date: 3 October 2026. Target: [Complete Learning, Content, Levels and UX Architecture V2](D:/learnbyRP/docs/LEARNBYRP_COMPLETE_LEARNING_CONTENT_UX_ARCHITECTURE_V2.md).

This is the implementation companion to the user-selected blueprint, not another
product architecture. **Phase 0 is documented. Code work addresses all nine
Phase 1 gates, but required release evidence and content reviews are still open.**
Later phases remain planned unless a row below explicitly identifies working
code. The historical deep audit remains applicable to defects not yet repaired.

## Decisions adopted

- Product focus: independent adult learners; Belgian Dutch everyday-life practice;
  a small complete Pre-A1/A1 through B1 path before broader band/locale expansion.
- Preserve Talk / Missions / Progress, `src/design/tokens.ts`, and the current
  scene, opportunity, evidence, archive, and program modules.
- Keep scene outcome, communicative evidence, and linguistic observation separate.
  Narrative continuity, self-report, placement, activity, and telemetry confer no
  competence credit.
- Reviewed opportunities own their evidence band and assessed channel. Display
  level is presentation, not proof of an assessment band. Missing metadata remains
  missing; legacy history is not silently assigned new qualifications.
- No competing autonomous-agent architecture, second database of learning truth,
  universal numerical ability score, or generated assessed content without review.
- Use the V2 phase order. Reliability and evidence truth are prerequisites for
  shipping the illustrated world or more content as a complete learning product.

Existing specifications and TODO documents remain useful detail/history. Resolve
their conflicting product claims against V2, translate implementation proposals to
the current shared contracts, and record material contract migrations here.

## Blueprint-to-code reconciliation

Status describes inspected code, not deployment or a completed pedagogical review.

| V2 requirement | Canonical code to preserve | Current status | Required extension or repair |
| --- | --- | --- | --- |
| §3 goal and starting comfort | `features/program/goalResolver.ts`, `startingPoint.ts`, `app/onboarding/index.tsx` | Partial | Keep placement a hypothesis; align the short entry and beginner bridge to actual reviewed nl-BE availability. |
| §3 mission/attempt ownership | `types/index.ts`, `contracts/scene.ts`, `features/session/lifecycle.ts` | Partial | Preserve session/attempt IDs; fix terminal events, durable live turns and checkpoint recovery. |
| §4 world authority | `sceneReducer.ts`, `sceneStore.ts`, `SqliteSceneStore.ts`, `server/roleplay/routes.ts` | Partial | Keep reducer preconditions; make mutations atomic, owner-scoped, deletion-aware and version-pinned. |
| §4 bounded actor | `actorContract.ts`, `server/roleplay/actorContext.ts`, conversation providers | Partial | Resolve facts from hosted state; consistently enforce action and content authority across providers. |
| §4 director | `director.ts`, `opportunityRuntime.ts`, `LiveSessionView.tsx` | Partial | Selection logic exists; execute directives and record actual delivery before opportunity presentation. |
| §5 validator-only evidence | `learningCore.ts`, `skillEvidence.ts`, archive write bundles | Implemented boundary, partial eligibility | Phrase target/provenance repair implemented below; semantic calibration and full band/channel contracts remain. |
| §5 support and rescue | `supportScope.ts`, `supportSurfaces.ts`, `retrySupport.ts`, `LiveSessionView.tsx` | Partial | Exact form exposures exist; persist them live, cover failed/stale coach requests, and enforce consent. |
| §5 accessibility vs assistance | `capabilities.ts`, preference accommodations, support classification | Partial | Preserve production/comprehension distinction; add opportunity-specific accommodation eligibility. |
| §5 evidence key: skill × channel × band × family | `SkillObservation`, `SkillContextKey`, `SkillOpportunityDefinition`, `skillProjection.ts` | Partial; unknown metadata fails closed | Contracts, validator, SQLite persistence and partitioned promotion groundwork added. Released content still lacks reviewer-authored dimensions; complete per-band learner-facing frontiers and browser/SQLite verification remain. |
| §5 lexical/form observations | `LearningObservation`, phrase catalog and practice | Partial for phrases; missing general form observations | Existing phrase recall remains lexical evidence. Add a separately governed, passage-grounded construction observation contract; no inferred mastery. |
| §5 recurring-error loop | Coach and recap surfaces | Not found as a complete loop | Add reviewed language-specific targets, repeated usable observations, selective feedback and later independent return. |
| §6 authored task demands | Mission `levelRange`, support policy, scene pressure variants | Partial | Add explicit demand dimensions and opportunity rubrics; do not equate speed or a title with level. |
| §7 curriculum/content graph | `contracts/program.ts`, `data/programs.ts`, `scenarioFamilies.ts`, authored scenes | Partial | Extend reviewed transfer/review/readiness edges, assets and band/channel coverage in the existing graph. |
| §7 coverage query | `content/launchContent.ts`, `validate-scenes.mts` | Partial | Current validator counts skill/family availability. Expand to capability × band × channel × family × variety × entry mode. |
| §8 review/release pipeline | `sceneValidation.ts`, `sceneModelChecker.ts`, `releaseGates.ts`, `authoringPolicy.ts` | Partial | Add reviewer identities, rubric rationale, asset rights, sources, compatibility, review disagreements and pilot calibration. `released` flags alone do not prove external review. |
| §9 Belgian Dutch arc | `missions.nlBE.ts`, `scenes/nlBelgium.ts`, Flemish launch catalog | Partial | Existing families can seed the slice; the six-episode arc is a proposed authoring skeleton, not a shipped complete Pre-A1–B1 course. |
| §10 Talk/Missions/Progress | Existing tab routes and screen components | Implemented screens, partial journey | One recommended situation and reason; compact entry; rescue; honest pending recap; clear stop. Test actual completion, not only seeded screens. |
| §11 mobile/a11y | Existing tokens, motion preference, SafeArea and UI components | Partial / native not verified | Render at 320 width, large font and keyboard; test focus, screen reader, captions, contrast and accessible cancellation. |
| §12 continuity and voluntary return | `continuity.ts`, `privacy.ts`, program surfaces | Partial | Integrate permitted narrative facts independently of learning evidence; opt-in controlled reminders remain future work. |
| §13 next-scene selection | `nextRp.ts`, `rpModes.ts`, `skillProjection.ts` | Partial | Existing versioned reason codes and reviewed refs are useful. Goal/support inputs partly unused; add coverage, band/channel, delayed retrieval and observable exclusions. |
| §14 compatible voice | Runtime contracts, transport factory, conversation adapters | Partial / device unverified | Fix playback loop, cancellation and setup races; no autoplay microphone; enforce consent and capability compatibility. |
| §14 privacy | Consent records, local tombstones, exports, server deletion store | Partial | Stable owner identity, hosted cleanup/retry, retention policy and authenticated guest/account persistence. |
| §15 evaluation/claims | Contract fixtures and test suite | Engineering validation only | Human-calibrated semantic dataset, usability pilot, independent delayed/unseen tasks, outcome/claims ledger. |

## Contract translation

### Runtime states

V2's lifecycle is a logical contract. Extend the existing lifecycle rather than
introducing another state machine:

| V2 logical state | Existing representation | Work needed |
| --- | --- | --- |
| created / entry_ready | `created` / `preflight` | Entry mode and readiness result must be durable. |
| active | `connecting`, `live`, `paused`, `reconnecting` | Wire actual runtime events to the coordinator. |
| checkpointed | Scene checkpoints and attempt fork metadata | Persist learner turns/support and validate restoration before resuming. |
| ended | `ending` / `ended`, session `endReason` | Fix `ENDED` mismatch and await archive completion. |
| assessment_pending | `recap_pending` | Persist activity before assessment starts. |
| assessed / incomplete | `recap_ready` / `recap_unavailable` | Preserve separate world outcome and assessment status; expose pending/incomplete honestly. |
| cancelled / unusable / incompatible | Current error/end reasons, provider capability results | Extend reason vocabulary explicitly; do not translate these into learner failure. |

### Evidence

- `SkillObservation` remains communicative evidence. Its current context/family
  fields are preserved, but it does **not** yet implement the full V2 evidence key.
- `LearningObservation` remains phrase-production/recall evidence. It is not proof
  of a whole communicative capability or grammatical construction.
- `OpportunityInstance` and `SkillOpportunityDefinition` remain the eligibility
  boundary. Band, channel, eligible modality, rubric version and accommodation
  conditions must be authored on the opportunity rather than copied from mission
  display metadata or inferred by the assessor.
- Add future construction/linguistic observations through one new canonical type
  and the existing archive contract, with uncertainty, target/version and passage
  references. They cannot mutate communicative evidence.
- A later schema migration must preserve historical identities and versioned
  interpretation. Older observations without authored qualification remain
  explicitly unqualified for band/channel promotion.

## Implemented: Phase 1A phrase evidence authority

The public `validateAssessmentProposal` interface now receives a
`PhraseAssessmentContext` carrying the runtime session, attempt and authored
mission candidates. Both current-attempt completion and parent-attempt retry
finalization pass that context from `LiveSessionView`.

Implemented behavior:

1. A model may select an authored target ID, but cannot replace the target's form
   or meaning. The validator matches against and stores the authored target.
2. Every proposal cites a current **final learner passage** in the same runtime
   session/attempt and revision. Missing, partial, foreign and stale citations
   cannot create evidence. Missing runtime context fails closed.
3. Modality comes from the recorded passage. A model labeling typed text as speech
   cannot produce spoken or independent spoken credit.
4. The proposed quote must occur in the cited normalized passage. Word-overlap
   coverage no longer excuses a fabricated continuation.
5. Only exact or supported lexical-paraphrase matcher verdicts are eligible.
   Ambiguous matches abstain.
6. The local fallback enforces the same final/current session/attempt scope.
7. A nonempty wrong answer plus “remembered” in a drill no longer creates verified
   recall. It must also match the target under the existing lexical policy.

This first slice used learning policy version **6**. Existing historical evidence is not rewritten or
reinterpreted automatically. A separate cleanup/revalidation procedure will be
needed if previously stored incorrect observations are to be corrected.

Tests: `architectureEvidence.test.ts` uses the existing Belgian Dutch cafe mission
to exercise the actual public validator and local fallback. It includes negative
target, modality, citation, ambiguity and drill cases. Existing learning-core tests
now supply an explicit authored fixture context.

Limits: lexical matching is still a conservative heuristic, not calibrated
semantic understanding. This change does not implement the missing assessed
channel/band key, consent governance, durable live persistence, scene outcome
separation, projection repair, or any remaining transport/server audit fix.

## Ordered delivery backlog and exit gates

### Phase 1B — Projection integrity implemented

Both archives reproject phrases from the complete surviving ledger, including an
empty ledger. Removing the last usable observation clears recall counters, last
practice time, modality history and the old interval; the phrase becomes new and
due. Item IDs are authoritative: matching displayed forms cannot transfer credit
to another authored item. A supported drill retains earlier independent evidence,
and replaying a bundle cannot duplicate its counts.

IndexedDB now commits evidence changes and projections together. Transaction work
that throws aborts its queued writes; regression tests inject a projection-write
failure to check rollback. Catalog merges write missing rows only, avoiding stale
copies overwriting existing projections.

Drill source IDs include a unique review ID, so reviews in the same millisecond
cannot overwrite one another. The live drill modal assigns a practice-sitting ID.
Delayed recall can meet the existing phrase policy across separate sittings, while
repeated reviews in one sitting do not establish distinct-session recall. Old
`sessionId: drill` records are preserved; their missing sitting identities are not
reconstructed.

Recap hides excluded evidence after reload and updates the shared archive context
after a successful hide/dispute write. At startup the provider rebuilds phrase
projections and IndexedDB recap caches from the existing ledger. This repairs old
materialized caches; it does **not** revalidate or certify historical observations.
Previously admitted false evidence still needs a separate review/cleanup policy.

Learning policy version is now **7**. This slice does not implement durable live
turns, retry lifecycle repair, scene-outcome authority, qualified bands/channels,
or provider/device acceptance.

### Phase 1C — Consent boundaries implemented

Microphone capture now consults the durable voice-consent record before OS
permission and again before starting recognition. Concurrent start requests share
one operation; stop/dispose during the permission dialog prevents capture. Late
recognition results are checked against current consent and capture generation.
The live and drill screens stop recording and offer typing when consent is absent
or withdrawn. Playback, unfreezing and retry no longer restart the microphone.

Assessment requests fail before network I/O without saved-analysis consent.
Withdrawal updates the request context immediately. Live finalization and retry
assessment abstain when consent is absent or withdrawn, and an assessment 403
cannot activate local fallback credit. Practice activity and transcripts still save.

Both SQLite and IndexedDB check saved-analysis consent inside the evidence-write
transaction. A precomputed valid phrase, drill or skill bundle cannot bypass a
later withdrawal. Prior evidence remains available; withdrawal does not erase
history. New analysis feedback is not persisted without consent.

Regression coverage includes actual storage operations, microphone permission
races against mocked Expo modules, and two Playwright browser paths starting a
real mission, typing a target phrase, finishing and inspecting IndexedDB. The
browser cases exercise denied analysis and a server 403 with local consent granted.
Provider responses are mocked; physical-device capture and real-provider behavior
remain unverified. The transport lifecycle code has since been hardened in the
Phase 1E slice below; these browser paths do not exercise physical audio
cancellation or real provider reconnect behavior.

### Phase 1 — Truth and content slice

| Item | Code boundary | Acceptance test | Status |
| --- | --- | --- | --- |
| 1A Canonical phrase/provenance authority | `learningCore.ts`, live assessment handoff | Model cannot reassign target, modality or attempt; ambiguity abstains; unrelated drill earns no credit | Implemented |
| 1B Projection integrity | Both archive implementations | Delete/hide/dispute final evidence → no stale recall claim; supported drill preserves earlier valid history | Implemented |
| 1C Consent at real I/O | Archive consent + voice/assessment/drill operations | Denied/withdrawn voice never captures; denied analysis stores activity with no evidence; 403 is not an outage fallback | Implemented; native device verification open |
| 1D Durable session/attempt ownership | Archive contract + lifecycle + live screen | Kill/reload after a learner turn retains transcript/help; terminal state is correct; retry retains parent/checkpoint context | Targeted browser paths verified; native/process-kill checks open; visual snapshot gate red |
| 1E Transport lifecycle | Voice/conversation providers | One operation per event; stopped audio cannot resume late; disposed provider cannot reconnect; mic begins only on learner voice entry | Implemented; runtime/device verification open |
| 1F Hosted authority | Guard + router + scene store + actor context | Verified owner, bounded quotas, atomic revisions, replayable concurrent writes and deletion across read/write paths | Partial; multi-instance quota implemented and verified across separate processes; hosted runtime verification open |
| 1G Scene outcome separation | Finish/recap/program projection | Scene completion can yield zero evidence; phrase use cannot fabricate world completion; assessment failure preserves true scene outcome | Implementation and projection regressions verified; live outcome-path confirmation remains open |
| 1H Qualified opportunities | Shared contracts + validators + SQLite/IndexedDB + projection | Mixed-band mission; spoken/typed distinction; no cross-channel or higher-to-lower backfill; legacy unknown remains unknown | Contracts, persistence, fail-closed guards and regressions verified; released authored qualification metadata remains absent |
| 1I Reviewed nl-BE coverage | Content graph + release validator | First capabilities have guided/cold, near-miss, help, later retrieval and genuinely different-family opportunities; all assets reviewed | Partial; loop-coverage audit added, human review and runtime confirmation open |

Phase 1 exit requires all nine gates, not only passing validator tests. Repair the
historical audit's blockers within these items. No public readiness claim before
ownership, privacy, voice and recovery checks are verified.

### Phase 1 regression and release-gate audit — 2026-10-03

The latest engineering verification passed `npm run typecheck`, the complete unit
suite (**780 passed, 3 skipped**), `git diff --check`, a static web export, and six
targeted Chromium flows covering consent boundaries, checkpoint retry, transcript
recovery and projection integrity. Those six functional paths also passed in both
light and dark themes within the full 50-test browser suite. Scene validation
passes deterministic structure checks and reports learning-loop readiness gaps
separately. Provider/hosted responses in browser tests are mocked; the three
skipped unit tests remain provider-only checks.

The initial complete 50-test Playwright run passed 12 functional tests and failed
the remaining 38. The mobile journey fixture seeded a completed session where it
expected a live one; it now keeps separate active and completed records, ends the
live session through the UI, and passes at 390px in both light and dark themes.
The remaining 36 visual snapshots exceed the configured image-difference
threshold. Those baselines need a separate visual review; they were not regenerated
as part of this audit.

The evidence guards now require a failed opportunity to match the scene's authored
skill, band, channel and eligible modalities. Client/runtime metadata cannot
manufacture a lapse. Projection partitions promotion by channel and band, and a
qualified lapse can trigger review without prior positive evidence. Historical
unknown evidence remains visible but cannot qualify for progression.

Phase 1 is **not release-complete**. `adb devices -l` found no attached Android
device. The release checklist still needs physical-device and process-kill
verification (1C–1E), hosted runtime checks (1F), human-authored band/channel/
modality qualification for released opportunities (1H), and a linked locale/audio/
assets review record plus guided/cold learner-path confirmation (1I). The scene
validator reports content and review gaps as open. No human review or production
infrastructure evidence is inferred from passing code tests.

### Phase 1 remediation — 2026-10-04

Four defects were found by running the release gate rather than reading it. Each was
fixed at its cause and guarded by a test that fails without the fix.

**Shared provider quota (1F).** `ProviderRateLimiter` kept its buckets in a
per-process `Map`, so every instance granted a full budget and the effective limit
scaled with the instance count. Quota state now lives behind a `RateLimitStore`, with
an atomic SQLite implementation (`server/security/rateLimitStore.ts`) used when
`LEARNBYRP_QUOTA_DB` names a shared file; a production server warns when it is unset.
`take()` stays synchronous because `node:sqlite` is synchronous underneath and the guard
runs in Express middleware. Coverage includes two store instances on one file and two
genuinely separate OS processes, which is the case the previous single-limiter test
could not express. This holds only for instances sharing a filesystem — the same
requirement as the existing scene and privacy stores. Separate hosts need a different
backend behind the same interface.

**Scene-result projection (1G live path).** The visual fixture seeded
`sceneState.outcome: 'completed'`, a `taskOutcome` value, into a field whose vocabulary
is `achieved | partial | not_achieved | unknown`. Recap correctly refused to claim a
result it could not establish, and the wrong state was recorded as a baseline. The
fixture is now typed `SessionRecord`, so an out-of-vocabulary value is a compile error,
and the mapping lives in `sceneOutcome.ts` with negative-case coverage.

**Visual gate capture.** The shell pins `body` to the viewport with `overflow: hidden`
and scrolls inside an inner ScrollView, so `fullPage: true` measured a document that
never scrolls and silently captured one viewport while claiming full-page coverage —
41% of Progress at 1440px was never compared. Capture now grows the viewport to the
measured content height. Difference ratios fell from 0.05–0.99 to 0.05–0.21.

**Dead briefing test.** Six briefing tests failed at `expect(locator).toBeVisible()`
because the locator matched `/Level A\d/` and the string "Level A" no longer exists in
`src`; all six snapshots were unmaintained behind a test that could not reach its
screenshot. The locator is now derived from `MISSION_CATALOG`.

All 36 visual tests came to fail on image comparison alone, with every functional
assertion passing. The remaining failures were stale baselines, and they were held that
way until the recap consent-disclosure removal and the live redesign were resolved:
`--update-snapshots` would have made the gate green over both an undecided privacy
disclosure and an unapproved control removal. Both were then settled — the disclosure was
restored, and Freeze Scene turned out never to have been removed — and the baselines were
recaptured deliberately.

**Visual gate is green.** The full 50-test Playwright suite passes, twice in a row, with
the freshly recorded baselines unchanged by the second run, so the capture is
deterministic rather than accidentally passing. The new baseline set is also internally
consistent in a way the old one was not: 22 of 36 are now taller than the viewport
because they capture scrollable content, and the 14 that fit are the screens that
genuinely do. Recapture happened only after the functional assertions were confirmed
independent of the snapshots, and two of the new baselines were inspected by eye to
confirm they record real screens rather than a dead end — the failure mode this suite has
already produced twice.

**Consent disclosure (1C).** A redesign dropped the "AI Processing & Consent
Disclosures" block from the recap without a recorded decision. The wording had not been
deleted — it still existed in all four locales under `settings` — so only the call to it
was removed, which is the shape a privacy notice disappears in. The block is restored in
the recap body using that approved copy rather than a new `recap` key, so the sentence a
learner consented to in Settings and the sentence they read on the receipt cannot drift.
Two further gaps were found in the same area:

- The exported `.txt` receipt carried **no disclosure at all**, and it is the one artifact
  that leaves the app. Header, disclosure and footer now come from a shared
  `learningReceipt` module used by both the SQLite and IndexedDB repositories, because a
  compliance-relevant line is exactly the kind of thing that must not be written twice.
  A test asserts the exported wording is identical to the approved Settings copy.
- The exported header still read **"MISSION COACH"**, the pre-rename product name, in a
  file whose purpose is to be shown to someone else.

The approved wording says records are stored locally on the device. That is accurate for
the IndexedDB and native archives. It must be re-reviewed before hosted persistence is
enabled for a learner, because a disclosure that is confidently wrong is worse than none.

**Freeze Scene: no defect.** Reported as removed during triage; it is present in the live
header as a Pause/Play control with `freezeScene`/`resumeScene` as its accessible name
(LiveSessionView). The earlier reading mistook the icon for decoration. No change made.

**1H inventory is now a generated list.** `SkillOpportunityDefinition` declares
`evidenceBand`, `assessedChannel` and `eligibleModalities`, all optional, so nothing fails
to compile while the metadata is absent. Of **65 authored opportunities, 0 set a band and
0 set a channel**, and every one sits in a scene already marked `released`. The field
exists; the values do not, which is why 1H cannot be closed by a passing test.

`docs/PHASE_1H_OPPORTUNITY_REVIEW.md` is generated from the same scene objects the runtime
reads, by `scripts/generate-opportunity-review.mts`. It is deliberately not maintained by
hand: a hand-kept list of outstanding review is stale the moment content changes, and a
stale review list is worse than none because it reads as coverage. The generated file
states plainly that it is not evidence any row has been reviewed.

**1I cannot be reviewed, because the assets do not exist.** The gate item reads "locale/
audio/assets review", which implies a review queue. There is no queue:

- **Zero bundled audio assets.** Every utterance is synthesized at runtime by a provider.
  There is no reference recording to review for pronunciation, pacing or register, which
  is what the blueprint's asset gate asks for. The applicable rule is the one for
  synthetic speech: fluent-sounding audio is not thereby authentic.
- **Zero bundled images.** No `Image` or `ImageBackground` component is used anywhere in
  `src`. The product is icon and text only.

That second point is a scope finding rather than a defect, and it should not be discovered
during pilot review. Both blueprints specify an illustrated world as the visual direction:
"an approachable illustrated world", "scene imagery as orientation, not decorative
wallpaper", a family-specific illustration palette, and a per-scene context image in the
asset table. None of that is built. 1I is therefore blocked on asset production, and until
that is scheduled it is better recorded as absent than as pending review.

Locale coverage itself is a separate matter and is genuinely reviewable: the product ships
es, fr, de, it, ja and nl, and the French content is Paris-context while the Belgian Dutch
missions carry nl-be identifiers.

**Mission catalogue filters no longer hide content.** The category chips were a horizontal
ScrollView with its indicator disabled, so the last chip was cut mid-word with nothing to
signal it could be scrolled, and at 840/1440px it hid filters while leaving a wide empty
margin beside them. They now wrap. Six chips over two or three lines is a small cost for
every filter being visible without a gesture, and both blueprints rule out horizontal
scrolling for ordinary screens.

**Exported receipts are now in parity.** `exportLearningReceiptText` had drifted between
the archives — SQLite emitted language, mode, start time, outcome and a per-phrase recall
status; IndexedDB emitted none of them and formatted phrases differently, so the same
learner received a different receipt on web than on native. The parity suite only asserted
the method existed, so it could not see this. Rather than test two implementations into
agreement, both now delegate to one `renderLearningReceipt`, and the exported text is part
of the parity snapshot. The new assertion was verified non-vacuous by reintroducing
one-character divergence and confirming the suite failed.

### Phase 2 — Speaking UX

Keep existing screen components and tokens. Deliver the short language/goal entry,
reviewed beginner preparation bridge, compact briefing and controllable live input.
Expose reachable rescue, uncertainty and cancel controls, and an honest
saved/pending/incomplete recap. Preserve final-simulation/program metadata.

Exit: actual first attempt → help → finish → reload works on 320-width web and a
physical phone, with large text, keyboard and permitted typed mode. Fix the current
transcript-survival fixture to create a real session before exercising its failure.

### Phase 3 — Complete learning loop

Extend `nextRp.ts`, existing program graph and projection. Deliver supported retry,
different-family transfer and later retrieval with policy versions, learner-facing
reasons and recorded exclusions. Respect explicit eligible learner choice and
content/capability gaps. Same-day replay cannot qualify as transfer.

Exit: one nl-BE capability passes guided practice → independent familiar attempt →
reviewed other-family attempt → delayed return. Each recommendation resolves to
actually available reviewed content. Test missing content as an explicit outcome.

### Phase 4 — Linguistic development

Add reviewed lexical/construction targets and uncertain passage-grounded linguistic
observations, then selective recurring-error micro-interventions. Keep feedback
separate from communicative evidence and avoid invented pronunciation analysis.

Exit: a communicatively successful but linguistically inaccurate utterance retains
both interpretations independently; feedback exposure downgrades only affected
later production; sparse evidence remains uncertain.

### Phase 5 — Living program

Use the proposed Brussels neighbourhood arc as authored content, reusing reviewed
families. Add permitted recurring cast/facts and optional reminders. Narrative facts
have independent reset/retention and cannot establish learning qualifications.

Exit: coherent continuity, easy stopping, explicit reminder consent and no punitive
absence or artificial emotional dependence.

### Phase 6 — Calibration

Recruit qualified locale/pedagogy reviewers; review actual targets, inputs, bands
and rubrics. Build assisted/independent/near-miss/no-opportunity/noisy/ambiguous
assessment cases. Run a usability pilot, then choose the independent unseen and
delayed task endpoint with an evaluation protocol.

Exit: documented semantic agreement/false-credit/false-lapse findings and corrected
major failures. Static content flags or this software test suite do not certify
pedagogical outcomes.

### Phase 7 — Expansion

Extend deeper B1, then reviewed B2/C1 and other locale paths when review capacity,
qualified coverage and outcome evidence support the scope. Translation is not a
curriculum port.

## External decisions still needed before their dependent work

These do not block the implemented validator changes or other deterministic
Phase 1 repairs. They must be settled before shipping their dependent features:

- Qualified reviewers and actual content/rubric approval, including example audio.
- Guest/account continuity, raw audio retention, deployed ownership and cost caps.
- Free/paid content boundaries; rescue, access needs and stopping remain available.
- Provider/device capability baseline and supported release transports.
- Pilot participant segment, independent evaluator, outcome rubric and measurement.

## Verification of the first implementation slice — 2026-10-03

- `npm run typecheck`: passed.
- `npm test -- --reporter=dot`: 746 passed, 3 provider tests skipped.
- `npm run validate:scenes`: passed with existing graph-cycle warnings.
- `npm run build:web`: passed.
- `git diff --check`: passed.

These checks cover the changed evidence behavior and compilation. They do not
establish live-session recovery, physical-device audio behavior, deployed security,
or pedagogical calibration. The prior audit's failed transcript-survival E2E test
has not been repaired by this slice.

No reviewer approval, native-device verification, provider acceptance, or learning
efficacy is claimed by this reconciliation.

### Verification after the consent slice — 2026-10-03

- Type checking and `git diff --check`: passed.
- Full unit suite: **763 passed, 3 provider tests skipped**.
- Web export: passed.
- `e2e/consent-boundaries.spec.ts`, light Chromium project: **2 passed**.
- Logs are saved in `docs/phase-1-consent/`.

The E2E tests use the real mission-start route and archive, with provider API
responses mocked. They do not repair or revalidate the historical
transcript-survival fixture, and do not verify physical-device microphone capture.

### Verification after projection integrity — 2026-10-03

- Type checking and `git diff --check`: passed.
- Full unit suite: **773 passed, 3 provider tests skipped**.
- Web export: passed.
- Light Chromium: **4 browser tests passed**, covering the two consent paths,
  hiding the final observation and reopening Recap, and startup repair of stale
  recall/recap caches.
- Logs are saved in `docs/phase-1-projection/`.

Projection UI tests seed a known ledger; they do not claim live speech or provider
assessment verification. The durable-transcript/retry/lifecycle gate (1D) remains
open, as do the later Phase 1 gates.


### Durable session and checkpoint slice — 2026-10-03

Live activity now uses a serialized journal of immutable snapshots. Learner turns
are saved before requesting an actor response, and assistant replies are saved
before playback. Coach exposure is checkpointed before revealing its hint. These
writes carry no validator-issued learning evidence and do not set an end time.
A failed save is visible and blocks subsequent learner requests until the learner
retries saving. Finish drains activity writes before the explicit
`END → ENDED → ASSESS_START → ASSESS_OK` sequence; terminal rows reject late progress
and lifecycle writes.

Both IndexedDB and SQLite preserve active attempt identity, parent/checkpoint
history, support, the complete scene snapshot, and existing program context.
SQLite schema migration 13 adds the runtime snapshot; historical rows remain
readable without invented attempt provenance. Repeated session creation preserves
an existing record. Checkpoint retry retains parent passages and inherited support,
saves the child context, and keeps the transport mounted. Recovery offers an
explicit Resume action and restores saved turns without repeating the greeting or
starting microphone capture. Hosted scene reconciliation still depends on the
server's idempotent reattachment contract; deployment/security/provider gates are
tracked separately in 1E–1I.

Validation:

- Type checking: passed.
- Full unit suite: **778 passed, 3 provider tests skipped**.
- Scene/content validation: passed with existing graph-cycle warnings.
- Web export and `git diff --check`: passed.
- Light Chromium: **6 browser tests passed**, including real mission entry,
  provider failure followed by reload/explicit Resume/finish, and checkpoint retry
  retaining parent/child turns without recreating the transport. Provider and
  hosted scene responses are mocked.
- Repository parity exercises SQLite and IndexedDB for support/turn/runtime
  snapshots, activity-only writes, repeated creation, and late/deleted writes.
- Logs: `docs/phase-1-durability/`.

The historical transcript-survival fixture used an uncreated session. Its current
replacement starts a real mission and checks the durable archive before and after
reload. This does not change the original audit's recorded failure.
Physical-device/process-kill behavior, real hosted reattachment, and provider
acceptance remain unverified. Phase 1 as a whole remains open.

### Transport lifecycle slice — 2026-10-03

Voice playback now has a generation per playback request. Stopping or disposing
invalidates pending audio setup, cancels native/web playback, and ignores late
completion callbacks; a failed encoded-audio path can still fall back to speech
without reporting a false completed playback. Microphone start remains consent
gated and user initiated, and a second start is refused while the native stop event
is pending.

Conversation providers reject work after disposal and abort HTTP turns on cancel.
Realtime connection setup checks disposal after session creation, and stale socket
events are ignored. Cancellation, timeout, and provider errors retire the realtime
socket so a delayed response cannot attach to a later turn. The resilient wrapper
may fall back after a connection failure before a turn starts; once a turn has
started, it preserves the failed turn and only switches providers for a later
learner retry, avoiding an automatic duplicate request.

`npm run typecheck` and `git diff --check` passed after these changes. Provider
unit tests, mocked playback-cancellation cases, and physical-device microphone and
audio checks were not run for this slice. Gate 1E remains subject to those
runtime checks; Phase 1 remains open.

### Hosted authority slice — 2026-10-03

Provider requests now use an HMAC-signed guest credential minted by the server.
The app persists it in SecureStore on native and browser storage on web. Caller
chosen guest IDs and arbitrary bearer strings no longer establish identity. The
development server keeps its signing key under ignored `.data/`; production must
set one stable `GUEST_IDENTITY_SECRET` of at least 32 characters on every API
instance.

Hosted scene rows persist their owner identity. Reads, reattachment, actor turns,
scene actions, checkpoint forks, close, recovery, assessment and deletion check
that identity. Owner mismatches return no session data. Legacy rows without owner
metadata fail closed and need an explicit retention or migration decision. Deletion
records an owner-scoped tombstone before removing hosted scene events and state.

Create, action verdict plus state update, fork, close, reconcile, and deletion use
SQLite `BEGIN IMMEDIATE` transactions. A write re-reads the current record inside
the transaction, so concurrent proposals cannot both commit from one scene
revision. Existing per-identity provider limits remain process-local and bounded;
the guest-issuance IP limit is also process-local. Production multi-instance quotas
need a shared limiter, and the deletion tombstone and scene database remain
separate stores. This slice is not a production deployment certification.

The guest-identity issuance IP limiter uses Express `req.ip`; configure the
trusted proxy hop count with `TRUST_PROXY_HOPS` when deployed behind a reverse
proxy. It defaults to direct-request mode when unset and rejects invalid values.

### Scene outcome separation slice — 2026-10-03

The authored scene reducer is now the source for the persisted session outcome.
The model's proposed task outcome remains validator context for communicative
skill evidence; it cannot mark the world task complete. Program projection only
advances from a finalized recap whose scene outcome is `achieved`, and checks the
pinned scene id when the program specifies one. Thus scene completion may advance
the mission with no language evidence, while phrase evidence alone cannot advance
an unachieved scene.

When assessment is disabled, withdrawn, or rejected by the consent boundary, the
recap still stores the reducer's actual scene outcome while persisting no new
learning evidence. The recap already renders scene result separately from phrase
and skill evidence.

Validation: `npm run typecheck` and `git diff --check` passed after the change.
Tests were not run for this slice, so Gate 1G remains partial pending regression
coverage and the full Phase 1 acceptance path.

### Qualified opportunity foundation — 2026-10-03

Opportunity and evidence contracts now carry optional authored evidence band,
assessed channel, and eligible delivery modalities. Runtime records copy these
fields, preserve the actual passage modality, and reject a model modality that
differs from the cited learner passage. SQLite schema 14 persists the fields;
IndexedDB stores them with the existing structured records. Missing historical
metadata maps to `unknown`, never to the mission display level.

Skill projection now evaluates context/day thresholds within a single assessed
channel and evidence band. Evidence with missing/unknown dimensions cannot
qualify independent progression, and cross-channel or cross-band histories do
not pool toward a status. Current released opportunity definitions still need
qualified author metadata; until then new evidence remains recorded with unknown
band/channel and does not promote a skill. Spoken/typed eligibility, mixed-band
content, and end-to-end storage/projection regressions remain open.

Validation: `npm run typecheck` and `git diff --check` passed. No tests or runtime
checks were run for this slice. Gate 1H remains partial pending qualified content
metadata and regression coverage.

### nl-BE learning-loop coverage audit — 2026-10-03

Launch-content validation now reports per-core-skill opportunities, contrastive
positive/negative rubric examples, missions with the help ladder, and later
retrieval paths that follow authored `nextMissionId` links into a different
scenario family. It also reports which opportunities have complete band/channel/
eligible-modality metadata. `validate:scenes` prints these readiness gaps without
confusing structural validity with review approval.

The content model has no linked locale/audio/assets review manifest, so the audit
marks asset review as untracked. It does not infer a human review from a scene's
`released` flag. The nl-BE loop remains partial until evidence bands/modalities are
authored, the locale/audio/assets review is recorded, and guided/cold live paths are
verified. Validation was limited to `npm run typecheck` and `git diff --check`;
tests and the scene validator were not run.

Validation for this slice: `npm run typecheck` and `git diff --check` passed. The
server/store integration suite and multi-process concurrency checks were not run.
Phase 1F remains partial pending those checks and shared production quota policy.
