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
| 1D Durable session/attempt ownership | Archive contract + lifecycle + live screen | Kill/reload after a learner turn retains transcript/help; terminal state is correct; retry retains parent/checkpoint context | Full browser visual suite and 320px/large-text/keyboard-height web recovery flow pass; native/process-kill checks remain open |
| 1E Transport lifecycle | Voice/conversation providers | One operation per event; stopped audio cannot resume late; disposed provider cannot reconnect; mic begins only on learner voice entry | Implemented; runtime/device verification open |
| 1F Hosted authority | Guard + router + scene store + actor context | Verified owner, bounded quotas, atomic revisions, replayable concurrent writes and deletion across read/write paths | Shared-file quota tests pass across processes; all HTTP quota routes now share one store and fail closed; hosted topology/runtime verification remains open |
| 1G Scene outcome separation | Finish/recap/program projection | Scene completion can yield zero evidence; phrase use cannot fabricate world completion; assessment failure preserves true scene outcome | Both directions verified: browser no-fabricated-outcome path, and a live typed session driven by the real reducer to `achieved`, with a `partial` negative control |
| 1H Qualified opportunities | Shared contracts + validators + SQLite/IndexedDB + projection | Mixed-band mission; spoken/typed distinction; no cross-channel or higher-to-lower backfill; legacy unknown remains unknown | Contracts, persistence, guards and regressions verified; all 65 opportunities now carry an authored band/channel/modality plus a rationale, and unreviewed qualification fails closed. **Open: a named reviewer has accepted none of them.** |
| 1I Reviewed nl-BE coverage | Content graph + release validator | First capabilities have guided/cold, near-miss, help, later retrieval and genuinely different-family opportunities; all assets reviewed | Review records now modeled and reported per scene (`content/releaseReview.ts`), asset inventory verified against the filesystem. **Open: no review recorded, no bundled audio or imagery, guided/cold paths unconfirmed.** |

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

### Dependency advisories — exposure analysis

`npm audit` reports 34 advisories (10 moderate, 24 high). None of them reach a learner,
and the number should not be read as release risk. Establishing that took checking what is
actually in the shipped bundle rather than reading the dependency tree, because a grep of
the bundle produces false positives: the string `uuid` is React Native's own module of
that name, and `braces` is a 24px lucide icon. Neither is the vulnerable package.

| Package | Advisory | Reachable through | Shipped? |
|---|---|---|---|
| `decode-uri-component` | DoS via exponential percent-decoding | `expo-router` → `query-string` | **Was; now overridden to 0.5.0** |
| `uuid` | Missing buffer bounds check in v3/v5/v6 with `buf` | `expo-sharing` → `@expo/config-plugins` → `xcode` (iOS prebuild) | No |
| `node-forge` | PKCS#1 v1.5 accepts extra nested DigestAlgorithm | `expo` → `@expo/cli` (build/sign) | No |
| `braces` | Stack exhaustion via deeply nested patterns | `tailwindcss` (devDependency, CSS build) | No |
| `vitest` | Path traversal via `@vitest/mocker` redirect mock | test runner | No |

Only `decode-uri-component` sat in the shipped path, and an npm `overrides` entry moves it
to 0.5.0 — one package changed, no tree churn. The override was verified against
typecheck, the unit suite, a web export and the full browser suite, because an override
that broke routing would be worse than the advisory it removed.

The remaining four are not fixable here, and deliberately were not forced:

- `node-forge` and `braces` are published with a vulnerable range of `*`, so no patched
  version exists to move to.
- `uuid` would need a breaking 7 → 11 major bump on an iOS-build-only dependency.
- `npm audit fix` was not run: it proposes adding roughly fifty optional platform binaries
  while resolving none of these, and `--force` would put Expo and React Native version
  compatibility at risk for advisories with no runtime exposure.

Re-check when Expo ships a version that drops the `xcode` and `@expo/cli` reach, or when
`braces` and `node-forge` publish fixes.

**Scene cycle warnings are structural, not 45 undiscovered defects.** `validate:scenes`
reports `cycle: <action> can repeat without changing logical facts` across all 16 scenes,
covering `confirm_arrangement`, `ask_specification`, `confirm_selection`,
`propose_arrangement` and others. Assessed rather than assumed:

- The check explores the state graph using a key of facts plus action counts *capped* at
  the highest `countOf` threshold in the scene, because a `countOf >= 3` predicate cannot
  distinguish three repetitions from fifty. **These scenes contain no `countOf` predicate
  at all**, so the cap map is empty, every count is clamped to zero, and no repetition can
  ever produce a new key. The warning is therefore guaranteed for any facts-preserving
  action in a scene that does not use count predicates. It reports the predicate style of
  the scene as much as the design of the action.
- The runtime is safe. `reduceSceneAction` records the repetition in `actionCounts` and
  leaves facts untouched; completion in these scenes is decided by facts alone, so a repeat
  can never accidentally satisfy a completion predicate. There is no deadlock, no infinite
  reducer loop and no false completion — a learner who repeats can still choose any other
  available action, and every scene has a dry-run path to achievement.
- Repeating a conversational action without changing the world is also legitimate. Asking a
  specification twice, or confirming twice, is ordinary learner behaviour, and a runtime
  guard that rejected it would break the retry and repair behaviour the blueprints require.

No change was made. Bulk-editing ~45 action definitions across 16 scenes is an authoring
decision that needs content review, and tightening the reducer would risk rejecting
legitimate repetition. The useful next step is either authoring review of repeated
confirmation in these scenes, or a validator change that reports whether a repeating state
still has other available actions — which would separate "harmless repeat" from "dead end".
Both are content/semantics decisions rather than defects.

### Content blueprint §10.6 acceptance checklist, audited against this checkout

The French/Belgian-Dutch content blueprint closes with a 20-item acceptance checklist. It
is the most falsifiable artifact in either document, so it was checked item by item rather
than assumed. Result: **7 met, 4 partly, 9 not met** — and the misses are content and test
gaps, not contract gaps.

Met, with the code that carries them:

| Item | Evidence |
|---|---|
| Exposed forms cannot generate unassisted target credit | `supportExposureIds` referenced across 21 modules |
| Retry and cosmetic variants cannot generate transfer credit | `retrySupport`, `parentAttemptId` in 7 modules |
| Silence, noise and disconnection cannot automatically create lapses | `skillLapses` with reason codes across 10 modules |
| French/Dutch histories and spoken/typed modalities remain distinct | six `LanguageCode` values; modality carried in evidence |
| Placement hypotheses do not confer durable progress | comfort level stored as a hypothesis only |
| Colours and typography meet contrast checks | `tests/design.test.ts` asserts WCAG contrast for real token pairs, both themes |
| Recap distinguishes world result, help, validated behaviour and pending assessment | verified in the rendered screen during this pass |

Narrative rewards trivially satisfy their item: **no badge, collectible or XP system
exists**, so nothing can masquerade as competence.

Partly met:

- *Every skill alias maps to canonical taxonomy.* Mapped in `LEARNBYRP_CANONICAL_RECONCILIATION_V1.md`
  (10 exact, 4 conditional, 22 content-only) but not encoded as a machine-checkable mapping.
- *A1 speech entry after a preparation bridge.* `ProgramEntryMode` exists with
  `observe_first | guided_first | warmup_first`, and the briefing renders a model option.
- *Scene, saved language, replay and help reachable.* Confirmed visually for the six
  captured screens; not covered by an automated reachability test.
- *Reminder consent is voluntary.* No reminder feature exists at all, so there is nothing
  to consent to yet.

Not met:

- **48 scenarios / 144 scenes authored.** This checkout has 16 scenes and 65 authored
  opportunities. The blueprint catalogue is a production plan, not shipped content.
- **Zero B2 content.** Missions are A1 (6) and A2 (26) only, so the blueprint's entire B2
  half — including its requirement that B2 scenes elicit sustained negotiation — is absent.
- **Transfer edges.** No authored `transferTo` edge exists in any scene; only
  `nextRp.ts` reasons about transfer. The blueprint's transfer graph is unimplemented, which
  is also why the Phase 3 exit criterion cannot be met.
- **Complete lexical, pattern, audio and support assets.** There is no bundled audio and no
  image component anywhere in `src`.
- **Large text and keyboard must not hide input, help or exit controls.** There is **no test
  of any kind** for large text or keyboard behaviour. This is the sharpest gap, because it
  is exactly what the Phase 2 exit criterion requires: a real attempt → help → finish →
  reload at 320 width on a physical phone with large text, keyboard and permitted typed
  mode. It is testable on web today at 320 width with a scaled font and a focused typed
  input, and is not yet written.

Also outstanding from the same blueprint: outcome validation on unseen tasks and delayed
return is Phase 6/7 work and has not started.

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
revision. Provider, scene and guest-issuance quotas now use one runtime rate-limit
store, so a configured shared SQLite file bounds each key across server processes.
Quota-store errors and lock exhaustion fail closed. Without a shared database,
instances remain process-local; separate-host deployment and production runtime
verification are still open. The deletion tombstone and scene database remain
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

### Phase 1 engineering closure pass — 2026-10-04

The stale status rows above are updated to reflect the current browser and source
checks. Changes in this pass ensure every server quota route shares the same runtime
store, guest identity issuance no longer keeps a separate per-process IP map,
expired SQLite quota buckets are pruned, and quota storage failures refuse the
request. Regression coverage includes the actual separate-process test and a
fail-closed store failure case.

Character output uses Gemini TTS; OpenAI Realtime is configured for text output
and does not provide the spoken character audio. The previous local-voice-only
Belgian Dutch route bypassed Gemini and failed in the Codex in-app browser, which
does not expose `window.speechSynthesis`. Gemini 3.8 TTS detects Dutch from the
transcript and accepts regional accent instructions, so `nl-BE` now goes through
Gemini's Interactions TTS API with explicit Belgian Flemish pronunciation guidance.
The server selects an exact `nl-BE` Gemini voice-library entry when one is
available, otherwise a multilingual voice receives that accent instruction; it
does not silently substitute a Netherlands-specific voice. Returned Gemini audio
is played directly by the browser audio transport, without requiring local speech
voices. When Gemini is unavailable, the exact-only native fallback still refuses
to select a French or `nl-NL` voice and explains why text practice remains
available. These source and mocked tests do not prove the live Gemini catalog's
regional voice inventory or auditioned voice quality. A deterministic actor
fallback also now replies in Dutch.

The Windows host used for this check has French, English and Arabic speech voice
registrations but no Dutch or Belgian Dutch voice. This no longer blocks Gemini
audio; it only means the native fallback is unavailable. The local browser preview
currently has no API server or provider keys, so a real Gemini/OpenAI session cannot
be verified from this checkout until its server-side environment is configured.

A new browser recovery test exercises an actual Dutch mission at 320px with 200%
root text size and a keyboard-height viewport. Help, typed submission, finishing,
reload, transcript durability and an `unknown` scene result all pass. This is web
coverage, not a substitute for native large-text/keyboard/process-kill verification.

Current verification: `npm test -- --run` passes (815 tests; three provider
acceptance tests skipped), the full Playwright suite passes (52 tests, including
the added recovery path), and `npm run typecheck` and `git diff --check` pass.
`validate:scenes`
still reports both launch locales open: 65/65 opportunities lack reviewed
evidence-band/channel/modality qualification, and no locale/audio/assets review
manifest exists. Phase 1 therefore remains **not release-complete** pending human
content/asset review, native-device and process-kill checks, a positive live authored
scene-outcome path, and hosted deployment verification.

### Phase 1 completion pass — 2026-10-04

Phase 1 was re-checked gate by gate rather than read as done. Engineering for the
gates the machine can verify is complete; the gates that require a person are now
specific, small and recorded, instead of absent.

**What this pass changed**

*1H — authored qualification, and a review gate that fails closed.* All 65
authored opportunities now carry `evidenceBand`, `assessedChannel`,
`eligibleModalities` and a `qualification` record with a per-opportunity rationale
and rubric version. Authoring a band and accepting it are now separate acts:
`features/learning/opportunityQualification.ts` requires the current rubric
version, `status: 'reviewed'` **and** a named `reviewerId` before an authored band
may qualify anything. Until a reviewer signs, every observation from that
opportunity is recorded with `evidenceBand: 'unknown'` and no channel, so nothing
can promote, lapse or backfill on it — the same fail-closed behaviour as before,
now with the values present and checkable.

Positive and negative evidence both read the band through that gate. The lapse
path deliberately uses it too: a weakness signal needs the same review as a
strength signal, or one asymmetry or the other misleads the learner.

`assessedChannel` is checked, not authored freely: the canonical skill taxonomy in
`content/skills.ts` owns it and `sceneValidation.ts` rejects disagreement. The
first authoring pass wrote `production` everywhere and the scene validator caught
it, which is the check working rather than a near miss.

The scene validator now also refuses: authored dimensions without a qualification
record, an empty rationale, a `reviewed` status with no reviewer or date, reviewer
details without a `reviewed` status, a stale rubric version, and `unknown` written
as an authored band. `unknown` is what an unqualified opportunity resolves to;
writing it into content would look like a content owner having judged the band.

*1I — a review record to review into.* `content/releaseReview.ts` models the
locale/voice/imagery review per scene. The registry is empty, which is the accurate
state. It reports each scene's absence as a specific gap, and it derives the asset
findings from a declared inventory that `releaseReview.test.ts` verifies against
the filesystem, so the "zero audio, zero images" finding cannot quietly rot into a
stale claim. A scene's `released` flag is still not treated as a review.

*1G — the positive path.* `e2e/scene-outcome-achieved.spec.ts` drives four real
learner turns through the authored pharmacy scene and records `achieved`, with the
scene endpoints answered by the real `reduceSceneAction` so the preconditions and
completion predicates under test are the authored ones. Only the model is mocked:
what the character says is a provider's decision, what the world records is not. A
paired negative test ends the same scene after two turns and requires `partial`
and the partial copy, which is what makes the positive assertion discriminating.

*Tests made faithful and then made non-vacuous.* Two fixtures claimed to model a
runtime opportunity instance while omitting the authored qualification, and began
rejecting everything. They now build the instance from the scene object the
runtime reads. That in turn made two lapse tests compare empty with empty, so they
now apply a review acceptance explicitly — the same mutation a reviewer's sign-off
performs — and a new test asserts that withdrawing it removes the lapse again.

**Verification**

- `npm run typecheck`: passed.
- `npm test -- --run`: **863 passed, 3 skipped** (provider acceptance only).
- `npm run build:web`: passed.
- `npm run validate:scenes`: structure passed; readiness reported per skill.
- Full Playwright suite, both themes, on a fresh export: **56 passed**.
- `git diff --check`: passed.

`validate:scenes` now distinguishes the two states instead of blending them:
`authored band a1/interaction [typed, spoken] awaits a qualified reviewer`, and
`OPEN review evidence: scene.…: no release review record` / `no bundled audio` /
`no bundled imagery` per scene.

**What is still open, and what each one needs**

| Gate | Blocker | Who/what closes it |
|---|---|---|
| 1H | 65 authored bands awaiting a qualified reviewer; 0 accepted | A named pedagogy/locale reviewer accepting or correcting each value against `docs/OPPORTUNITY_QUALIFICATION_RUBRIC_V1.md`. The rubric itself is authored by this pass and is unverified. |
| 1I | No locale/voice/imagery review recorded; zero bundled audio; zero images | Reviewer decisions, plus a product decision on whether the illustrated world is in scope. 1I cannot close by review alone while the assets do not exist. |
| 1C–1E | No attached device: `adb devices -l` lists none | Physical device run of consent withdrawal, capture, process-kill/relaunch recovery, and playback cancellation. No amount of web testing substitutes. |
| 1E | Provider acceptance unverified | One live session against configured Gemini/OpenAI credentials, including auditioning the `nl-BE` voice actually selected. |
| 1F | Hosted topology unverified | A deployed run with `GUEST_IDENTITY_SECRET` and `LEARNBYRP_QUOTA_DB` set on every instance, plus a multi-host quota decision — the shared store spans one filesystem only. |
| 1I | Guided and cold learner paths unconfirmed | Two human-guided sessions, one using the help ladder and one without any support. |

**Not claimed**

Phase 1 is not release-complete, and the engineering pass does not change that. The
blueprint's exit condition includes "reviewed opportunities", and no reviewed
opportunity exists yet. What changed is that the remaining work is 65 review
decisions, two asset/product decisions, and the device and deployment runs — named,
scoped and checkable — rather than a list of things that had not been started.

## Reference-design adaptation — 9 October 2026

The user-selected Taalbad Apple 2026 HTML design was adapted through the existing
`src/design/tokens.ts`, generated CSS/Tailwind maps, shared Button/Card/header,
and current screen components. It adds the source's geometric city illustration,
pastel action entries, navy actions, rounded white panels, and floating navigation.
Talk / Missions / Progress and the current full-screen session routes remain the
workflow. The router's theme now derives from the same tokens as native/web UI.

Active phrase review is scoped to Dutch; other-language archive records remain
readable. No mock dots, pronunciation scores, scene outcomes, or assessment targets
from the reference were imported as learning truth. This visual work does not close
the Phase 1 human-review, native-device, provider, or hosted acceptance gates.
See `DESIGN.md`, `UX-CONTRACT.md`, and `docs/design-2026-10-09/AUDIT_NOTES.md` for
reference decisions, UI ownership, and verification limitations.

### Conversation screenshot adaptation

The additional user-selected screenshot is implemented in `ConversationStage`
and `LiveSessionView`: café backdrop and Lotte portrait, speech bubbles, inline
translation, direct replay, collapsed authored answers with draft insertion and
phrase listening, scene-checkpoint progress, and conversation options with pause,
slow replay, and stopping. Support is saved before answers are revealed or used;
drafting never sends automatically. New delayed playback checks current attempt
ownership and voice consent. The portrait belongs only to Lotte. The asset
inventory now records two generated images and scopes visual orientation to the
Belgian Dutch café scene; human review records remain empty.

See `docs/design-2026-10-09/SESSION_REFERENCE.md` for asset provenance and
verification. This adaptation does not certify provider voice quality or native
device acceptance, and does not complete the Phase 1 human-review gates.


## Lingo 2027 app-wide reference adaptation — 9 October 2026

The user's newer Lingo HTML supersedes the earlier reference's visual styling.
The complete app now shares AppText typography, warm paper/forest theme tokens,
deep teal actions, lime mission CTA, teal circular conversation microphone, pastel practice
cards, exact static reference vectors, tonal dialogue, and floating navigation.
Briefing, program, recap, settings, privacy, onboarding, phrase detail, recovery,
and sheets reuse the same owners. Source JavaScript and demo learner metrics
were not imported. Home review and progress cards use actual archive counts.

The live view renders turns chronologically. Older-turn disclosure scopes caption
support to the rendered slice. Suggested answers remain opt-in with durable support
writes before exposure; drafting does not send. The dock owns bounded scrolling
for narrow/large-text/keyboard layouts; stopping and recovery remain available.

The conversation screen was then aligned to the user's newer portrait reference:
the character joins the close/options controls in the header, authored scene
checkpoint progress stays factual, the illustrated mission summary sits above the
transcript, and the bottom dock exposes typing, speaking, help, and stopping. A
newer screenshot refinement brings the collapsible, authored suggestions card into
that dock, with teal microphone rings and compact Type and Help controls. Suggestions
remain closed until chosen; reveal and draft-insertion persistence rules are unchanged.

The reference's Bricolage Grotesque and Figtree web font link is integrated using
Expo Router Head, with readable fallbacks. Registry/font downloads failed in the
shell due to DNS; native system-font fallback is explicit until offline font assets
are available. This is a visual adaptation, not human content review, native device
acceptance, a deployment, or an audition of live provider speech. Details and
verification are in docs/design-2026-10-09/LINGO_REFERENCE.md.

## Original 3 refinement study — 10 October 2026

The user selected Original 3 as the visual foundation and requested the next step.
`docs/design-2026-10-10/lingo-original3-refined.html` is a standalone, connected
Home / Speaking / Recap / Progress prototype. It preserves the source's
illustrated scenes, activity colors and microphone focus, and explores refined
typography, card geometry, shared spacing, compact layouts and Warm Midnight.
The inspector compares the proposed Fraunces/DM Sans pairing with the current
Bricolage/Figtree pairing. Canonical colors/artwork are copied as static snapshots;
production tokens, screen owners and learning/runtime code are unchanged.

Browser checks cover the four-screen UI flow, opt-in draft help, simulated offline
draft recovery, pending/first-use states, text wrapping at 320/390/430 px and 200%
text, and both theme captures. Typecheck and script syntax checks passed. These
are prototype checks, not a real session, audio/provider test, native acceptance,
content review or evidence that all 142 Studio screens have been implemented.
See `docs/design-2026-10-10/ORIGINAL3_REFINEMENT.md` for the reference lock, scope,
verification limits and integration boundary. Typography/component details remain
proposed pending benchmark acceptance; existing reliability gates are unchanged.

## Tutor catalog slice — 20 October 2026

The app had 23 characters and one face for all of them, chosen by gender. A
character is a person, and a person keeps a face.

Implemented:

- `src/features/avatar/avatarCatalog.ts` is the list of faces the app can show,
  and it decides which one a character wears. The learner's own choice comes
  first, because choosing a tutor is the learner's decision and not the
  content's. The face the mission authored comes next, and a character with no
  authored face still gets a stable one, so the same character always looks the
  same between sessions.
- `CharacterDefinition.avatarId` lets a mission name the face of its character.
  It is optional, so nothing breaks while the content catches up.
- `UserPreferences.preferredAvatarId` records the learner's choice. It is
  learner-owned and local, like the other preferences, and it is included in
  the export and delete scope.
- The settings screen has a tutor section with the catalog and an automatic
  option, in every interface language the app ships.
- The stage loads the model the catalog names, and falls back to the placeholder
  character if the asset cannot be loaded.

The catalog holds two placeholder faces for now, both with the same morph
contract, so the choice is real rather than decorative. More faces are assets,
not code.

Not decided here: whether a character may be given a face that contradicts the
character, and how a tutor change is presented when it happens mid-session.

Cost: the two models add 7.2 MB to the application bundle. The web build does
not carry them.

Verification: typecheck passes, 1011 tests pass, the Android bundle builds, the
web bundle is 4.01 MB and carries no models, and all 40 visual snapshots pass.
The tutor picker was not inspected on a device.

## Reaction policy slice — 20 October 2026

The character reacted to a finished session. That was the least honest version of
a reaction, because a session can be completed and still have gone badly. This
slice ties the reaction to what actually happened in the turn.

Implemented:

- `src/features/avatar/avatarReactionPolicy.ts` decides the reaction, and it
  uses the same support ledger the evidence uses. A turn that was assisted is
  acknowledged with concern rather than praise, because help cannot manufacture
  independent recall. A turn that did nothing notable gets no reaction at all.
- The support window is the turn itself: support shown before the learner spoke
  is modelling, support shown after the reply is bookkeeping. This is the rule
  the evidence already applies, reused rather than reinvented.
- A turn in which the scene accepted a proposed action moved the world forward,
  which is a real result and is acknowledged as one.
- A finished session is praised only when it was completed and carried through
  without production-form support. A session the learner cut short is not
  celebrated, and a session carried through with help is acknowledged rather
  than praised.
- The scene's acceptance is recorded from the reducer's answer, not from what
  the model proposed.

Not decided here: whether a reaction should also be driven by the assessment
result. The assessment is produced when the session ends, by which time the
character is no longer on screen, so a reaction based on it would be seen in the
next session rather than in this one. That is a product question about where
the character lives, not about the policy.

Verification: typecheck passes, 1002 tests pass, the Android bundle builds, the
web bundle is unchanged at 3.99 MB, and all 40 visual snapshots pass. The policy
is covered by tests; the reaction on a real session was not inspected on a
device.

## Avatar reaction slice — 20 October 2026

A character that only opens and closes its mouth is a recording. This slice gives
it states and reactions, which is the part Praktika has and this app did not.

Implemented:

- `src/features/avatar/avatarExpressions.ts` expresses a state with blendshape
  weights and a head pose. The weights address the ARKit set a standard rig
  carries, so a state is a mix of several shapes rather than one switch: listening
  raises the brows and tilts the head, thinking looks aside and up, a reaction
  warms the mouth and the eyes.
- `src/features/avatar/avatarState.ts` owns one state. The session sets the base
  state, and the voice overrides it while audio is running, because the voice is
  the most immediate truth about what the character is doing. The state is
  derived from the clock rather than tracked, so it cannot drift.
- The voice layer now reports listening as well as speaking, so the character
  listens while the learner speaks without the session having to say so.
- The session drives it: it waits while a reply is being written, it greets
  when the tutor speaks its first line, and it reacts when a session was carried
  through to the end. A session the learner cut short is not celebrated.
- The head is posed through its bone, so the skin follows it, and the camera
  frames the eyes rather than the head mesh, which covers the neck and left the
  face high in the portrait.

Not decided here: which reaction belongs to which outcome. The praise reaction
follows a completed session, but a session can be completed and still have gone
badly, and the assessment result is the honest signal. That mapping belongs with
the assessment, not with the renderer.

Verification: typecheck passes, 988 tests pass, the Android bundle builds, the
web bundle is unchanged at 3.99 MB, and all 40 visual snapshots pass. The
expressions were inspected in a browser preview of the live session: the head
tilts and the brows lift while listening, and the mouth warms for a reaction. It
was not inspected on a physical device.

## Edge voice slice — 20 October 2026

The speech provider was the blocker: ten requests a day, on a free tier, for an
app that speaks on every turn.

Implemented:

- `server/providers/edgeTts.ts` speaks with the Edge read-aloud voice. It needs
  no account, no key and no quota, it streams, and it reports where every word
  is spoken. That last part is the real prize: the mouth stops guessing.
- `pickEdgeVoice` chooses the voice for a locale and a voice gender. The exact
  regional voice is preferred, and a learner who asked for Belgian Dutch is
  never answered in Netherlands Dutch when a Belgian voice exists.
- `visemeTimelineFromWords` builds the mouth timeline from reported word
  timings. The word carries the timing, and only the shapes inside a word are
  estimated. This is the first time the mouth is driven by the voice rather
  than by the text.
- The speech providers are now a chain. A provider that is blocked, metered out
  or broken does not take the voice away from a session: the next provider is
  tried, and the client's own speech remains the last resort.
- `SPEECH_PROVIDER=edge` puts the Edge voice first. Without it, the cloud voice
  stays first when a key is present, because it is the voice that has been
  heard working.

**Not verified against the live service from this environment.** The Edge
read-aloud endpoint refused every connection here: the older host answers 403,
and the current host accepts the socket and then closes it without audio. The
reference Python client fails the same way, so this is the network, not the
implementation. The provider, the voice choice, the word timing and the mouth
timeline are covered by tests; the live call is not. The Edge voice must be
tried from the app's own network before it is relied on.

The chain is what makes that acceptable: if the Edge voice does not answer, the
session speaks with the cloud voice, and if that is metered out, the client
falls back to the device's own speech.

Verification: typecheck passes, 975 tests pass, the Android bundle builds, the
web bundle is unchanged at 3.99 MB, and all 40 visual snapshots pass.

## Streamed speech slice — 20 October 2026

A tutor line was one wait: the learner heard nothing until the whole line had
been synthesised. This slice hands the line over in pieces.

Implemented:

- `POST /api/speech/synthesize/stream` is a server-sent event stream. Each
  piece carries its text, its audio, its length, its offset within the line, and
  its mouth timeline, so the client plays the pieces back to back and runs one
  mouth clock across the whole line.
- `splitIntoSpeechChunks` cuts a line at sentence boundaries. Every sentence is
  its own piece, because a piece is a synthesis call and the first sound cannot
  be heard before the first piece exists.
- `VoiceTransport.enqueueSpeech` queues a piece. Pieces play back to back, the
  line keeps one start and one end, and the returned promise resolves when that
  piece has finished. The abandoned queue releases its waiters, so a cancelled
  turn never leaves a caller waiting.
- `speakStreamedWithBestAvailable` is the session's path for a spoken line. A
  line that fits in one piece keeps the single-clip path, because the audio
  cache is worth more there than a stream. A stream that fails is not an error
  state: the line is spoken through the single-clip path instead.
- The event stream is read with `XMLHttpRequest`, because a streaming response
  body is not available in the React Native fetch implementation.

**The provider cost is the constraint.** The configured speech provider allows
ten requests a day on its free tier, and a metered provider is charged per
request. A line is therefore synthesised with **one** request and the audio is
cut into pieces, rather than one request per sentence. Cutting the audio is
cheaper and keeps the quota; the trade is that the first sound still waits for
the whole synthesis, and only the transfer is overlapped. Setting
`SPEECH_STREAM_PER_SENTENCE=1` switches to one request per sentence, which is
the faster path to a first sound and is meant for a provider that streams or
has a generous quota.

**The quota is a product problem, not a code problem.** A language app speaks on
every turn, so ten requests a day cannot carry a session. Before the streaming
path is exercised in production the speech provider needs a paid tier, or a
replacement that streams and reports visemes, such as Azure Speech with viseme
events or AWS Polly with speech marks. Both also remove the estimate from the
mouth timeline, because they report the phoneme timing with the audio.

Verification: typecheck passes, 961 tests pass, the Android bundle builds, the
web bundle is unchanged at 3.99 MB, and all 40 visual snapshots pass. The
stream was exercised against the live provider before the daily quota was
exhausted: four pieces arrived with correct offsets, lengths and mouth
timelines. The end-to-end behaviour is now covered by a test with a stub
provider, because the live provider has no quota left to test with.

## Praktika patterns worth taking — 20 October 2026

A reverse engineering pass over a comparable product (Praktika, a Flutter and
Unity language app) produced a set of patterns. This records which ones apply
here, which are already held, and which were taken in this slice.

| Praktika pattern | Evidence | State here |
|---|---|---|
| Chunked TTS with a stream session, so the first sound arrives early | `Praktika.Lesson.TTS.TtsProtocol`: `InitSession`, `OpenStream`, `HandleChunk`, `Eos`; responses `SessionInitialized`, `StreamOpened`, `ChunkReady`, `StreamFinished`; errors `BadPayload`, `BadSequence`, `ServerError`, `RateLimitExceeded`, `ProviderError` | **Open.** The speech endpoint returns the whole clip. Streaming would cut the wait before the tutor speaks. |
| Word timings inside the speech chunk, which are the lip-sync clock | `TtsChunkReady` carries `StreamId`, `Audio`, `Text`, `DurationMs`, `WordStartTimesMs` | **Held in spirit.** The clip length is measured and a viseme timeline is derived. A provider that streams word timings would replace the estimate. |
| A pre-roll buffer, so speech does not start before the character is on screen | `GenAvatarPreRollBuffer`, `GenAvatarPrefetchService`, and the log line `Scene became ready while TTS was already playing` | **Taken.** `avatarReadiness` reports when the stage is on screen and the session waits up to 1.2 s before the greeting. The session always continues if the wait times out. |
| A speech queue, and a gate that drops audio once the view is closed | `GenAvatarSpeechQueueService`, `appendAudioData rejected after the view closed`, `[LIPSYNC_GATE] dispose started` | **Held.** The app's transport already cancels playback when the attempt ends, and the session owns the audio. |
| Load metrics for the avatar, per phase | `GenAvatarLoadMetricsService`, `GenAvatarLoadPhaseTimings` | **Open.** Nothing measures how long the character takes to appear. |
| The tutor reacts to what the learner said, and the reaction is part of the turn | `NextBotReactionReady`, `UserMessageReactionResponse`, `GenAvatarReactionService` | **Open.** The avatar has a mouth clock but no reaction channel. This is the natural next avatar feature. |
| The tutor poses a challenge and the learner answers it inside the conversation | `Challenge`, `ChallengeResponse`, `SendChallengeAnswer`, `NextBotChallengeReady` | **Open.** A conversational challenge is a different shape from the current coach hint. |
| The avatar can change mid-session without ending it | `LessonAvatarSwitchLifecycleService`, `avatarSwitchRecoveryRequired`, `selectedAvatarSlug`, `defaultAvatarId` | **Open.** `mission.character` carries no avatar reference yet. |
| Blurred artwork while the real character loads | `assets/images/avatars/placeholders/skye_base_mode.webp` | **Partly.** The web build shows the designed artwork; the device build shows an empty frame until the model arrives. A soft placeholder is a small addition. |
| A human tutor and the AI tutor share one avatar and one lip-sync path | `GenAvatarRemoteAudioService`, `LiveKitLipSyncAudioService` | **Not applicable.** No human tutor in this product. |
| Course generation with a status the client polls | `post_study_plan_generation_v15`, `get_study_plan_generation_v15`, `CourseGenerationStatus` | **Open.** Matches the living curriculum direction, but the generation contract is a product decision. |
| The session is the unit of scoring, and the content is verified separately | `create_session_assessment_v15`, `post_session_content_verification_v15`, `post_session_content_lexis_usages_v15` | **Held.** The app keeps scene outcome, communicative evidence and linguistic observations separate. |
| Lesson content is materialised on every start and replays | `materialize_practice_activity_lesson_v15` | **Open.** Relevant to a replayable lesson. |
| A pricing surface for the generated avatars | `avatars_four_step_paywall.webp`, `avatars_upsell_new_tutors.webp`, `premium_avatar_required_shown` | **Not applicable.** No premium avatar tier in this product. |

Taken in this slice: the pre-roll behaviour, with the race it prevents documented
rather than only worked around.

Verification: typecheck passes, 940 tests pass, the Android bundle builds, the web
bundle is 3.99 MB, and all 40 visual snapshots pass. The readiness gate was
verified by unit test, not on a device.

## Viseme fidelity slice — 20 October 2026

The mouth drove seven coarse shapes. A mouth needs the canonical viseme set.

Implemented:

- The viseme set is now the canonical Oculus set (`sil`, `PP`, `FF`, `TH`, `DD`, `kk`,
  `CH`, `SS`, `nn`, `RR`, `aa`, `E`, `I`, `O`, `U`), which is what every glTF
  avatar rig carries as `viseme_*` morph targets and what the Rhubarb, Azure and
  Polly converters already emit. A provider that reports real visemes can replace
  the text estimator without the client changing.
- `ARKIT_WEIGHTS` expresses each viseme with several ARKit blendshapes at once,
  following the published Oculus viseme reference and the tuning used by the
  MIT-licensed `talking-head-studio` project. A standard avatar rig carries the
  ARKit set, so the mouth reads as a mouth rather than a switch between fifteen
  binary shapes.
- The renderer applies both: the `viseme_*` morph target and the ARKit weights
  are driven from the same clock.

Not adopted, and why:

- `talking-head-studio` (MIT) is a full framework: 238 dist files, its own audio
  player, its own TTS server contract, `react-native-wgpu`, MediaPipe and a
  drei dependency. It would replace the app's voice ownership rules, which are
  stricter than the library's.
- `avatoon` (MIT) is the cleaner library, but it owns audio playback through
  `expo-av` while this app plays through `expo-audio` behind a transport with
  consent and attempt-ownership rules, and it needs drei.
- `perxona-connect-kit` (Apache-2.0) is a web component, and `privacypuppet` is a
  web app. Neither is a React Native component.

The upgrade path for real phoneme timing is a provider that reports visemes with
the audio: Azure viseme events and Polly speech marks both stream, so they add no
latency. Rhubarb also works, but it analyses the whole clip first, which would
delay the first sound of every line.

Verification: typecheck passes, 933 tests pass, the Android bundle builds, the
web bundle is 3.99 MB, and all 40 visual snapshots pass. The mouth was
inspected in a browser preview of the live session: the mouth now opens, rounds
and narrows with the viseme set. It was not inspected on a physical device.

## Human avatar asset slice — 20 October 2026

The stage carried a character built from primitives. That proved the pipeline and
failed the product: a character has to look like a person.

Implemented:

- `src/assets/avatars/tutor.glb` is a rigged human avatar with the full Oculus
  viseme set and the ARKit blendshapes (72 morph targets). The viseme names this
  app already computes map straight onto the blendshapes the model carries, so no
  extra mapping table was needed.
- `AvatarModelGLTF` loads the asset, frames the camera on the head, and drives
  the morph influences from the shared playback clock each frame. It also drives
  the blink from the same clock, and falls back to the procedural character if
  the asset cannot be loaded.
- `.glb` is registered as a Metro asset extension, and the asset is read through
  the file system on a device and over HTTP on the web.

Asset provenance: the model is the Ready Player Me default creator avatar, taken
from the `met4citizen/TalkingHead` repository because the Ready Player Me model
host is not reachable from this environment. Ready Player Me avatars are free for
non-commercial use under CC BY-NC 4.0; a commercial app needs a Ready Player Me
developer account and its own avatar, which is a drop-in replacement for the
bundled file. The model is a placeholder for the real tutor art, not the product
art.

Not decided here: which avatar belongs to which character. The mission character
carries a voice and a role today; an avatar reference, and the choice of the
tutor's look per character, is a content decision.

Verification: typecheck passes, 931 tests pass, the Android bundle builds, the web
bundle is unchanged at 3.99 MB because the renderer stays native-only, and all 40
visual snapshots pass unchanged. The character was inspected in a browser preview
of the live session: the head is framed in the portrait and the mouth moves
through the viseme set. It was not inspected on a physical device.

## Avatar stage slice — 20 October 2026

The timing slice above is now connected to a renderer. The session header carries a
3D character whose mouth follows the voice.

Implemented:

- `src/providers/voice/playbackClock.ts` is the shared position of the voice. The
  transport mirrors its own playback events into it, so a renderer can follow the
  voice without reaching into session internals. A failing subscriber cannot break
  playback.
- `src/features/avatar/` is the character module. `visemeTargets.ts` maps a mouth
  shape to a pose for a procedural character and to Oculus/RPM morph target names
  for a real asset. `avatarCapabilities.ts` decides whether a stage may be shown.
  `ProceduralAvatar.native.tsx` is a character built from primitives with a mouth,
  a breath and a blink. It is a placeholder with the same contract as a GLB with
  morph targets, so an asset can replace it without touching the stage.
- The stage is platform split, following the `archiveRepository` pattern:
  `AvatarStage.native.tsx` is the GL renderer, `AvatarStage.web.tsx` keeps the
  designed artwork, and `AvatarStage.tsx` is the type-check entry point. The web
  bundle is 3.99 MB with the stage in place, the same size as before it existed;
  three.js is not in the web build.
- `CharacterStageAvatar` in the live session header is the single character
  surface. The per-message portraits keep the designed artwork, because one GL
  context per message bubble is not acceptable. A device that cannot create a GL
  context falls back to the same artwork, so the session never depends on the
  renderer.
- `expo-gl`, `three` and `@react-three/fiber` are added. `expo-gl` ships inside
  Expo Go, so the stage runs without a development build and without changing the
  app's start flow.

Not decided here: where a larger stage belongs. The header portrait is a living
portrait, not a stage surface. A full character view needs a layout decision, a
motion accommodation, and an asset pipeline, none of which this slice claims.

Verification: `npm run typecheck` passes. `npm test` passes (931 tests, 3 skipped).
The Android bundle builds (8.7 MB Hermes bytecode) and the web bundle is unchanged
at 3.99 MB. All 40 visual snapshots pass unchanged, so the web rendering of the
live session is pixel-identical to the baseline. The stage itself was not exercised
on a physical device: no device was attached, and the render was not inspected on
hardware.

Pre-existing, unrelated to this work: 16 Playwright tests in this checkout fail
because the learner turn never reaches the actor endpoint
(`e2e/transcript-survival.spec.ts` and the specs that depend on the same flow).
The same failures reproduce on a clean HEAD build with the avatar work removed.

## Avatar speech timing slice — 20 October 2026

The speaking surface needs a mouth clock before any 3D or illustrated character can
be attached. The slice below establishes that clock without choosing a renderer, so
the decision about a 3D stage stays open and reversible.

Implemented:

- `src/providers/voice/visemes.ts` derives a mouth timeline from the spoken text and
  the measured length of the clip. It is an estimate, not a phonetic alignment, and it
  is deterministic: the same text and duration always produce the same cues. Cues are
  contiguous and cover the whole duration, so a playback position maps to a shape
  without gaps. Scripts without latin letters keep the mouth moving with one neutral
  movement instead of freezing it.
- `src/providers/voice/audioTiming.ts` measures the real length of a base64 WAV
  payload. It parses the RIFF container directly and reports `null` when the payload
  is not a readable WAV, so an unreadable clip degrades to an estimate rather than a
  wrong number.
- `POST /api/speech/synthesize` now returns `durationMs` and `visemes` beside the
  audio. The server and the client share one estimator, so both sides read the same
  contract. A client that ignores both fields is unaffected.
- `VoiceEvent` gained `playback_progress` (`currentTimeMs`, `durationMs`, `viseme`).
  The native transport emits it every 50 ms while provider audio plays, using the
  real player position. The native-speech fallback has no measurable duration, so its
  clock runs on elapsed time against the estimated length of the line.
- `speakWithBestAvailable` forwards the timeline to playback and caches it with the
  audio, so a replayed line keeps the same mouth movement.

Not decided here: the renderer (3D stage, illustrated character, or none), the avatar
asset pipeline, emotion and idle channels, and any claim that a mouth shape is
evidence of the learner's own production.

Verification: `npm run typecheck` passes. `npm test` passes (909 tests, 3 skipped).
`npm run validate:scenes` passes with its existing cycle warnings. The real provider
acceptance test passes against Gemini TTS for French and Belgian Dutch. The live
`/api/speech/synthesize` endpoint returned `durationMs=2120` and 21 viseme cues for
"Goeiedag! Welkom in Brussel." with a 143 840 byte WAV body. This verifies the timing
contract only: no avatar renders this yet, and native device playback was not
exercised.

One unrelated pre-existing design-scale violation was fixed so the suite could be
trusted: `src/components/LiveSessionView.tsx` used `text-[19px]`, an invented size
outside the allowed scale. It now uses `text-[18px]`.

## Refined Original 3 applied to all 142 Studio screens — 10 October 2026

The user then requested application across the complete Lingo UX Experience
Studio. `docs/design-2026-10-10/lingo-ux-studio-v5.html` now preserves all 142 source
routes and nine families under the selected shared visual system. Home, live
speaking, scene recap and Progress use the benchmark layouts; other families
retain their tasks with shared typography, cards, fields, choices, activity colors,
reading surfaces and controls. Both themes, screen board, filtering, keyboard
navigation and a static Original 3 comparison remain available.

The retained Studio controller owns its in-page demo behavior. Stacked experimental
scripts and real browser audio calls are removed; audio is explicitly a visual
simulation. The generated Studio keeps source French fixtures and does not
translate/review content, change an assessment band or write application evidence.
Production UI/runtime modules and canonical tokens are unchanged.

Verification: 568 actual rendered-route checks cover all 142 routes in light/320
and dark/430, each with 100% and 200% text. Twenty-two representative checks cover
390 px in both themes. Checked surfaces had no horizontal overflow. Exercise
negative cases, optional draft help, explicit send, recording-state preview,
independent switches, selected appearance, search/reset and the 142-card board were
exercised. Build, script parsing/syntax, typecheck and diff checks passed.
This verifies the standalone Studio, not native acceptance, a live provider,
production deployment or complete accessibility. See
`docs/design-2026-10-10/STUDIO_REFINEMENT.md` and its saved audit/captures.
<!-- Studio color preferences: prototype-only, 2026-10-10. -->

The standalone 142-screen Studio now includes a Warm / Warm Midnight color bar
with five paired canvas choices (cream, sage, rose, lavender and sand), retained
in its URL across navigation/reload. Ten combinations, header synchronization and
320 px control usability were checked in the browser. Details and capture are in
`docs/design-2026-10-10/STUDIO_REFINEMENT.md`. Canonical production colors and the
learning/runtime boundaries remain unchanged.

The Studio palette bar was corrected after its first implementation changed only
the canvas. Presets now coordinate neutral surfaces, text, borders, primary
actions and navigation, including retained dark-mode chrome. Ten combinations
passed targeted card/button/badge contrast checks on `study-time`; all 142 routes
rendered correctly with dark lavender and no page overflow. Evidence is recorded
in `docs/design-2026-10-10/STUDIO_PALETTE_AUDIT.json`. These remain prototype-only
overrides of the canonical palette.
