# LearnByRP — Roleplay Program Execution TODO V1

**Status:** active execution checklist for roleplay/program/pedagogy work  
**Branch reconciliation:** `feature/finish-remaining-roleplay-tasks` against `main` `44f57edd1ff211410e066712016b44f33b172119` (2026-10-03); implementation reconciled through feature head `331998d351218348ca9450cc2dcf0486728d631a`.  
**Scope:** Goal → Program → Mission → Attempt → Evidence → Next RP  
**Product rule:** LearnByRP teaches through roleplay. Skills, coach, evidence, transfer and recovery exist to shape and interpret roleplay; they do not replace it with a conventional lesson flow.  
**Companion authorities:** `Mission Coach — Master Product Architecture Specification.md`, `LEARNBYRP_POST_RUNTIME_ROADMAP_V2.md`, `LEARNBYRP_DESIGN_SYSTEM_V4_TODO.md`.

This checklist incorporates the reviewed corrections to the proposed roleplay-program architecture. Do not implement AI-composed programs before the scene/evidence contracts below are complete.

---

# 0. Authority and invariants

- [x] Roleplay remains the primary learning environment.
- [x] Goal is motivation/input, not learning evidence.
- [x] Program → Mission → Attempt → Evidence hierarchy is the working model.
- [x] Model proposes; deterministic code decides truth.
- [x] Character does not own scene truth.
- [x] Assessment model does not own learning truth.
- [x] Retry is not Transfer.
- [x] Silence/noise/disconnect/provider failure are never learning lapses.
- [x] Add this TODO to implementation-doc precedence notes where roleplay/program work is referenced. (`LEARNBYRP_POST_RUNTIME_ROADMAP_V2.md`; V4 authority boundary notice)
- [x] Keep UI-specific work in V4; keep roleplay/pedagogy correctness here. (`LEARNBYRP_DESIGN_SYSTEM_V4_TODO.md` remains UI/UX authority)

---

# 1. Gate G0 — close foundation correctness before new RP intelligence

## Voice/session baseline

- [x] Confirm recursion regression remains closed. (`tests/voice-session-regressions.test.ts`: cloud → native fallback is non-recursive)
- [x] Confirm stale-state regression remains closed. (`tests/voice-session-regressions.test.ts`: generation invalidation rejects stale async work)
- [x] Confirm mute/freeze/retry state is read from current runtime state. (`LiveSessionView` refs + voice/session G0 regression)
- [x] Confirm reconnect/error/mic-denied states are explicit. (`LiveSessionView`, `voice/lifecycle`, G0 regression)
- [x] Confirm typed draft survives provider errors/reconnects where intended. (`tests/voice-session-regressions.test.ts`)
- [x] Confirm audio resources close on every end path. (`tests/voice-session-regressions.test.ts`: transport/provider/scene cleanup)
- [ ] Physical Android native voice/STT pass.
- [ ] Physical iPhone native voice/STT pass.
- [ ] Physical cloud → native TTS fallback pass.

## Evidence baseline

- [x] Assessment proposals are validated before persistence.
- [x] Phrase and skill evidence are separate concepts.
- [x] Support exposure exists in the runtime.
- [x] Enforce validator-only observation write path by type/API boundary. (`ValidatedSkillEvidence` / `ValidatedPhraseEvidence`, archive API boundary, SQLite + IndexedDB runtime assertions)
- [x] Confirm reveal/listen cannot create unassisted phrase evidence. (`validateDrillReview`; reveal/model audio before attempt => assisted; support-only => no learner observation)
- [x] Confirm transcript revision invalidates stale derived evidence. (`skillEvidence.test.ts`, transcript/archive regression coverage)

## Scene baseline

- [x] Hosted scene routes exist.
- [x] Server route owns the authoritative hosted scene transition.
- [x] Client uses a scene mirror rather than deciding truth.
- [x] Duplicate action IDs are handled idempotently in current reducer/store flow.
- [x] Stale revision is rejected.
- [x] Retry/fork infrastructure exists.
- [x] Add missionVersion and sceneVersion to every authoritative action request. (`server/roleplay/routes.ts`, `SceneMirror.ts`)
- [x] Add provider call ID + connection generation for cross-channel dedupe. (`providerCallId`, `connectionGeneration`)
- [x] Move authoritative reducer execution contract into an explicitly shared pure package executed on the server. (`src/features/roleplay/runtime/index.ts`)
- [x] Add append-only scene event log so revision N can be replayed. (`scene_events`, `rebuildSceneStateFromEventLog`)

## Privacy/security/safety baseline

- [x] Confirm voice consent is tri-state and enforced server-side. (`server/security/requestGuard.ts`; `tests/request-guard.test.ts`)
- [x] Confirm saved-analysis consent is independently enforced server-side. (`requestGuard.ts`; independent saved-analysis regression)
- [x] Confirm AI endpoints require bounded authenticated/guest access. (bounded guest ID or hashed Bearer identity at provider ingress)
- [x] Confirm rate limits and request schemas on AI endpoints. (`ProviderRateLimiter`, `validateProviderBody`, request-guard tests)
- [x] Confirm delete tombstones block late assessment/provider writes. (archive generation-aware tombstones + persistent provider deletion tombstones)
- [x] Confirm regulated-domain content has no diagnosis/dosage/treatment advice. (pharmacy content hardened + release-time regulated-domain checks)
- [x] Add character-behavior policy for hostility, discrimination, harassment, sexual content and simulated abuse. (`characterPolicy.ts`; release-blocking validation + actor prompt rules)
- [ ] Decide audience/age gate before public release.

---

# 2. Lock the canonical skill model

## Two-layer model

- [x] Define `PracticeSkill` as learner-facing discovery/pedagogy labels. (`PracticeSkillDefinition`, `src/content/skills.ts`)
- [x] Initial PracticeSkills: (`PRACTICE_SKILLS` in `src/content/skills.ts`)
  - [x] Start a conversation
  - [x] Keep it going
  - [x] Explain an idea
  - [x] Ask for clarification
  - [x] Handle a difficult moment
  - [x] Speak for a purpose
- [x] PracticeSkills have no learner status in V1 unless an explicit roll-up policy is later approved. (`PracticeSkillDefinition` has no status field)

## Canonical CommunicativeSkill catalog

- [x] Move the canonical skill catalog out of the monolithic mission data file. (`src/content/skills.ts` is the runtime authority; `src/data/missions.ts` only keeps a compatibility re-export)
- [x] Store skills as validated content data. (`COMMUNICATIVE_SKILLS_CATALOG`)
- [x] Give each skill a stable ID. (catalog uniqueness regression coverage)
- [x] Add localized can-do statement. (EN/FR/ES/NL `canDo`)
- [x] Add positive examples.
- [x] Add negative examples.
- [x] Add boundary notes vs neighboring skills.
- [x] Add modality: production / comprehension / interaction.
- [x] Add typical opportunity patterns.
- [x] Add deprecation + successor policy. (`CommunicativeSkillDeprecation`)
- [x] Never reuse retired skill IDs. (`RETIRED_COMMUNICATIVE_SKILL_IDS` + overlap test)

## Repair hierarchy

- [x] Make `communicative_repair` a parent/derived family, not directly evidenced. (`evidencePolicy: derived`; assessment/direct opportunity gates)
- [x] Child skills: (six direct children of `skill-communicative-repair`; hierarchy tests)
  - [x] request_repetition
  - [x] request_slower_speech
  - [x] ask_clarification
  - [x] check_understanding
  - [x] clarify_misunderstanding
  - [x] paraphrase_when_stuck
- [x] Attribute one communicative act to one most-specific child skill. (`sameCommunicativeAct` + ancestor rejection; regression-tested)
- [x] Cap distinct skills credited per passage [Tunable]. (`SKILL_POLICY.maxSkillsCreditedPerPassage = 2`, current learning policy v5; cap runs after validation and deterministically prefers mission primary skills; `skillCreditCap.test.ts`)
- [x] Add `give_opinion_with_reason`.
- [x] Add `compare_options`.
- [x] Add `make_arrangement`.
- [x] Add `narrate_past_event`.

---

# 3. Fix context identity before Transfer

Resolved: context identity is now derived from `domainId + scenarioFamilyId`; `sessionId`, retry and cosmetic variants do not create transfer credit.

- [x] Introduce required `scenarioFamilyId`. (`MissionDefinition.scenarioFamilyId`)
- [x] Define:

```ts
interface SkillContextKey {
  domainId: string;
  scenarioFamilyId: string;
  scenarioId?: string;
  examTaskId?: string;
}
```

- [x] Distinct context only when domain differs OR scenarioFamilyId differs. (`skillContextIdentity`)
- [x] Retry does not create a new context. (session/attempt excluded from context identity)
- [x] Pressure variant does not create a new context. (variant metadata excluded from context identity)
- [x] Regional/locale variant does not create a new context. (locale excluded from context identity)
- [x] Same-family mission variant does not create a new context.
- [x] Add family definition/reviewer metadata. (`ScenarioFamilyDefinition`, `src/content/scenarioFamilies.ts`; reviewed domain/inclusion/exclusion boundaries + build-time mission reference validation)
- [x] Update `SkillObservation` to carry required `contextKey`; persisted in SQLite schema v3.
- [x] Update `SkillProjection` to derive contexts from `contextKey`, never `sessionId`.
- [x] Add regression test: Café A → Café B in same family adds no transfer context. (`skillContext.test.ts`)
- [x] Add regression test: different families add distinct transfer contexts. (`skillContext.test.ts`)

---

# 4. Separate scene outcome from skill demonstration

- [x] Extend SkillObservation with:

```ts
taskOutcome:
  | 'achieved'
  | 'partial'
  | 'not_achieved'
  | 'unknown';

demonstration:
  | 'demonstrated'
  | 'attempted_not_demonstrated'
  | 'unknown';
```

- [x] Scene completion never implies skill demonstration. (`SkillObservation.demonstration`)
- [x] Scene failure never implies skill failure. (scene `taskOutcome` is context only)
- [x] Assessor may propose a demonstration classification only for a declared opportunity. (`server/index.ts` + `skillEvidence.ts` require an exact runtime `opportunityInstanceId`)
- [x] Deterministic validator decides whether the proposal is admissible.
- [x] Add reason codes for demonstration/evidence decisions. (`SkillEvidenceReasonCode`, deterministic derivation in `evidenceReasons.ts`, localized EN/FR/ES/NL rendering, SQLite schema v10 round-trip)
- [x] Add test: scene achieved without target skill → no skill demonstration. (`skillEvidence.test.ts`)
- [x] Add test: scene not achieved for authored world reason → no lapse.

---

# 5. Make opportunities first-class runtime records

## Definition

- [x] Add `SkillOpportunityDefinition` with: (`src/contracts/scene.ts`; authored examples in `src/content/scenes.ts`)
  - [x] stable opportunity ID
  - [x] one CommunicativeSkill ID
  - [x] scene conditions
  - [x] positive examples
  - [x] negative examples
  - [x] relevant action/intent IDs where applicable

## Runtime instance

- [x] Add:

```ts
interface OpportunityInstance {
  id: string;
  attemptId: string;
  opportunityId: string;
  status: 'presented' | 'taken' | 'declined' | 'not_presented';
  presentedAtPassage?: string;
  detection: 'provisional' | 'validated';
}
```

- [x] `not_presented` is never weakness.
- [x] Live semantic detection is provisional only for lapse eligibility; only `validated` opportunities can lapse.
- [x] Checkpoints may only reference deterministic/validated scene state, not provisional semantic judgments. (`RoleplayCheckpoint` v5 contains authored checkpoint id + authoritative revision + learner-history coordinates only; ingress/store reject semantic/unknown fields; `sceneStore.test.ts`)
- [x] Author explicit communication challenges for repair skills instead of waiting for accidental confusion. (`CommunicationChallengeDefinition`; six opt-in/skippable Café repair variants cover every direct repair child skill; challenge-linked opportunities materialize only after explicit delivery; capability/target-gated `decideDirector`; validation/model-check/runtime regressions)
- [x] Add tests for presented/taken/declined/not-presented lifecycle. (`src/features/roleplay/opportunityRuntime.test.ts`; includes retry isolation and validated-assessment commit)

---

# 6. Replace generic support with scoped support semantics

Coach support is now scoped to the active runtime opportunity/skill and, when an exact curated match exists, one phrase. Remaining work in this section is instrumentation of every non-coach exposure surface plus policy-versioned windows.

## Support target

- [x] Coach request carries `targetSkillId`. (`LiveSessionView.tsx` → `api.coachHint`)
- [x] Coach request may carry `targetOpportunityId`.
- [x] Coach request may carry one `targetPhraseId`.
- [x] Coach response returns exact validated target IDs; IDs are echoed from runtime scope, not generated by the LLM. (`server/index.ts`)
- [x] One hint never marks every useful phrase in the mission assisted. (`targetItemIds` is now zero/one for coach support)

## Exposure kinds

- [x] intent_hint
- [x] partial_form
- [x] full_form
- [x] explanation
- [x] meaning_of_assistant_turn
- [x] model_phrase_audio (`supportSurfaces.ts`; full-form coach target only; explicit Listen plays the exact curated target phrase and records exact skill/opportunity/phrase scope after successful playback)
- [x] assistant_audio_replay (`LiveSessionView` Listen action records comprehension-only exposure)
- [x] assistant_audio_slow (`LiveSessionView` slower replay records comprehension-only exposure)
- [x] caption_view (`LiveSessionView` + `supportSurfaces.ts`; actually rendered final assistant captions are ledgered once per attempt/turn and remain non-production support)
- [x] typed_example (`LiveSessionView` + `supportSurfaces.ts`; learner explicitly copies the exact full-form coach target into the typed reply field; one stable exact skill/opportunity/phrase exposure per attempt target)
- [x] recap_exposure (`RecapScreen` + `ArchiveRepository.appendSupportExposures`; only validated phrase forms actually opened in the evidence sheet are ledgered; stable first-write-wins IDs/timestamps with SQLite↔IndexedDB parity coverage)
- [x] briefing_exposure (only explicitly previewed phrase IDs; policy-versioned)

## Relevance rules

- [x] Intent hint is recorded but does not expose target production form. (`supportScope.ts`)
- [x] Partial/full/model phrase/typed example affect production evidence for the exact target. (policy semantics in `supportScope.ts`; remaining surfaces still need event instrumentation)
- [x] Meaning/replay/slow/explanation of character speech do not downgrade production evidence. (`supportScope.ts`)
- [x] Briefing/recap exposure affects only shown target items within policy window. (`supportScope.ts`: exact phrase-scoped historical selector + same-UTC-evidence-day cross-session rule; `SessionScreen` feeds prior rows read-only; `supportScope.test.ts` covers same phrase/different phrase/same day/next day)
- [x] Support windows are policy-versioned and per target. (`SupportExposure.policyVersion`, SQLite migration v6, `supportScope.ts`)
- [x] Never mark an entire session assisted because any help occurred.
- [x] Add regression test: meaning of the character question does not downgrade unrelated production evidence. (`skillEvidence.test.ts`, `supportScope.test.ts`)
- [x] Add regression test: hint for one phrase affects only that phrase/target. (`supportScope.test.ts`)

---

# 7. Accessibility accommodations are not pedagogical help

- [x] Add `Accommodation` profile records. (`AccommodationProfile` persisted in `UserPreferences`; backward-compatible for old archives)
- [x] Initial kinds:
  - [x] captions_always
  - [x] slower_speech_default
  - [x] typed_preferred
  - [x] haptic_turn_cues
- [x] Captions remain available in Cold. (character transcript rendering is not gated by `coldAttempt`)
- [x] Accommodation is visible/manageable in Settings. (EN/FR/ES/NL labels + four switches)
- [x] Accommodation does not reduce unrelated production evidence. (accommodations are preferences, not support rows; comprehension-only exposure kinds are ignored by production scope)
- [x] Typed evidence remains typed; it does not establish spoken evidence. (existing validator rule retained)
- [x] Add regression coverage that caption/replay/slow/explanation are not production-form support. (`supportScope.test.ts`)
- [x] Preserve accommodations in final/minimal-support simulation. (minimal-support suppresses proactive briefing support only; `LiveSessionView` still receives learner accommodations)

---

# 8. Retry support ledger must never rewind

- [x] Retry checkpoint contract uses `supportLedgerHighWaterMark`; it is captured at retry time and is never used as a rewind point (`RoleplayCheckpoint`, `retrySupport.ts`).
- [x] Scene may rewind/fork; support knowledge does not. (`inheritSupportForRetry`)
- [x] Exact form seen before retry is inherited into the new attempt with exact target provenance.
- [x] Retry after answer reveal remains rehearsal; inherited support is materialized in the retry attempt.
- [x] Add regression test for retry support inheritance and idempotency. (`retrySupport.test.ts`)
- [x] Preserve original attempt and original evidence. (`LiveSessionView`: parent attempt is finalized before fork with local fallback, Retry cannot create a lapse, active assessment is attempt-isolated, final archive merges all attempt passages + phrase/skill evidence; `retrySupport.ts`/`.test.ts` dedupe and provenance regressions)

---

# 9. Strict lapse and revisit policy

## Strict lapse requirements — all required

- [x] opportunity was actually presented/taken and runtime-validated.
- [x] learner made a relevant attempt linked to a learner passage.
- [x] demonstration = attempted_not_demonstrated.
- [x] target was cold under the scoped, policy-versioned relevance matrix.
- [x] attempt was not rehearsal.
- [x] transcript/revision is valid.
- [x] no silence/noise/disconnect/provider failure.
- [x] no ASR failure/language mismatch masquerading as a language failure.

## V1 projection behavior

- [x] Keep status = new / supported / growing / steady. (`skillProjection.ts`; lapses never rewrite status)
- [x] Keep `revisit` as a separate boolean. (`SkillProjectionV2.revisit`)
- [x] Show `lastIndependentUseAt`. (projection + Progress skill cards/details)
- [x] One strict lapse does not demote status. It sets `reviewDue` only; regression-tested.
- [x] Second lapse within policy window may flag revisit [Tunable]. (`SKILL_POLICY.revisitMinRecentLapses = 2`)
- [x] Do not implement automatic demotion in V1.
- [x] Cap consecutive recovery missions per skill [Tunable]. (`RP_MODE_POLICY.maxConsecutiveRecoveries = 2`)
- [x] Offer off-ramps: guided practice / different skill / break / mute skill. (`RecoveryOffRamp`; deterministic `RECOVERY_CAP_OFF_RAMP`)

---

# 10. Formalize scene contracts

## Typed finite facts

- [x] Replace unrestricted scene facts with per-scene finite schemas. (`SceneFactSchema`, contract v3)
- [x] Supported fact types:
  - [x] boolean
  - [x] enum
  - [x] bounded integer where necessary
- [x] Every effect may only write declared facts with declared values. (`sceneValidation.ts`)

## Predicate DSL

- [x] Define bounded JSON predicate language:
  - [x] eq
  - [x] neq
  - [x] in
  - [x] and
  - [x] or
  - [x] not
  - [x] exists
  - [x] lte / gte for bounded numbers
  - [x] countOf(actions)
- [x] No arbitrary code in content predicates. Predicates are data-only discriminated unions.
- [x] Bound predicate depth. (`MAX_PREDICATE_DEPTH = 8`)
- [x] Use same predicate language for:
  - [x] preconditions
  - [x] completion
  - [x] complications
  - [x] opportunity scene conditions

## Effects

- [x] Define finite effect language. Effects are authored `{ set, value }` over finite facts.
- [x] Remove arbitrary untyped nested mutations where the content schema cannot be statically checked.
- [x] Validate every action payload against its declared schema. (`validatePayload`)

---

# 11. Build-time scene model checker

- [x] Enumerate reachable states for each released finite scene. (`sceneModelChecker.ts`)
- [x] Fail build if completion is unreachable. (`npm run validate:scenes` in Verify CI)
- [x] Fail build on reachable non-complete deadlock.
- [x] Fail build if a complication can make completion unreachable. (`sceneModelChecker.ts` builds the reachable-state graph and reverse completion reachability; every state where the authored complication can trigger must still reach `achieved`; regression includes exact unsafe action path)
- [x] Fail build on dead authored action.
- [x] Fail build if declared opportunity is unreachable.
- [x] Detect/bound non-idempotent action cycles. Logical state keys cap action counts to referenced thresholds; global state/path bounds prevent infinite enumeration.
- [x] Generate scripted dry-run paths for reducer CI. Report includes the action path to first reachable `achieved` state.
- [x] Add model-check report to content validation output. (`scripts/validate-scenes.mts`)

---

# 12. Server-authoritative scene runtime hardening

- [x] Hosted routes exist under `server/roleplay`.
- [x] Client mirror exists.
- [x] Reducer is pure enough to share.
- [x] Create explicit shared runtime package/module boundary for reducer contracts (`features/roleplay/runtime/index.ts` is imported by hosted store, server routes and client mirror).
- [x] Server is the only authoritative executor in hosted mode (`sceneStore.applySceneAction` owns reducer execution and durable commit).
- [x] Client hosted path is mirror-only: `SceneMirror` sends proposals and applies only server-returned facts; it does not execute `reduceSceneAction`.
- [x] Add missionId + missionVersion to hosted action request. Required at HTTP ingress and pinned to hosted session.
- [x] Add sceneId + sceneVersion to hosted action request. Required at HTTP ingress and pinned to hosted session.
- [x] Add provider call ID to hosted action ingress (`providerCallId`).
- [x] Add connection generation to hosted action ingress (`connectionGeneration`).
- [x] Append accepted/rejected scene proposals and reducer verdicts to `scene_events`.
- [x] Rebuild current-attempt revision state from append-only event log during reconciliation; accepted verdicts replay, rejected verdicts remain audit-only, and replay fails closed on revision gaps/version drift (`rebuildSceneStateFromEventLog`, recovery tests).
- [x] Cross-channel duplicate `actionId` → first persisted verdict is replayed; accepted and rejected actions are both idempotent.
- [x] Consequential tool actions block actor confirmation until reducer result (`mayCommitActorReply`; Actor line suppressed on missing/rejected verdict).

---

# 13. Director V1 must be deterministic

- [x] Define deterministic `DirectorDecision`. (`director.ts`)
- [x] Director runs on scene events/between turns, not per audio frame. (`DirectorCadence` admits only completed learner/actor turns, accepted scene actions, resolved opportunities and checkpoint restores; attempt+revision and directive dedupe; `LiveSessionView` wiring; audio/interim/delta regression coverage)
- [x] Director chooses only authored: (`PressureBranchDefinition` joins authored opportunity/complication/completion choices; `DirectorDecision` has no free-form pressure output)
  - [x] opportunity
  - [x] complication
  - [x] pressure branch (`pressureBranches` are statically validated/model-checked; Director requires explicit pressure policy and emits only reviewed branch IDs/instructions; cadence dedupes per attempt)
  - [x] completion preparation
- [x] Director cannot invent facts. Decision output contains no fact mutation.
- [x] Director cannot create evidence. Decision contract has no evidence output.
- [x] Director cannot add skill IDs. Skill IDs are returned only from authored opportunity definitions.
- [x] AI interpretation may return semantic candidate + unknown (`SemanticDirectorCandidate`).
- [x] Unknown never becomes a state mutation (`acceptSemanticCandidate` is non-executable).
- [x] Defer free-form AI Director behavior beyond V1.

---

# 14. Provider capability negotiation

- [x] Define `TransportCapabilities`:
  - [x] speechRateControl
  - [x] endOfTurnDelayControl
  - [x] pushToTalk
  - [x] scriptedLineInjection
  - [x] blockingToolCalls
  - [x] transcriptRevisions
- [x] Roleplay requests capabilities; providers only declare capability support (`capabilities.ts`).
- [x] Slow speech without native rate control is marked best-effort.
- [x] Long thinking time falls back to push-to-talk / tap-when-done if timing control unavailable.
- [x] Challenge types only appear when provider supports them: `COMMUNICATION_CHALLENGE_REQUIREMENTS` defines required transport capabilities, negotiation produces the allowlist, and `recommendNextRp` policy v2 refuses to emit `kind: challenge` unless it can attach a negotiated compatible `challengeType` (`capabilities.test.ts`, `nextRp.test.ts`).
- [x] Blocking consequential tool calls are required before character confirms world changes; live actor lines are suppressed until reducer acceptance.
- [x] Log capability degradation as operational telemetry only (`SessionRecord.operationalTelemetry`, persisted in `usage_json`).

---

# 15. Character Actor contract

- [x] Character stays in role. HTTP + Realtime contracts explicitly require role fidelity.
- [x] Character never turns into the coach. Coach/evaluator/grammar-teacher behavior is prohibited in Actor prompts.
- [x] Character sees only the explicitly supplied mission/character context and authoritative scene facts.
- [x] Character does not see private coach content; coach state is not part of `ConversationTurnInput`.
- [x] Character does not see learner evidence projection; evidence/projection is not part of Actor input.
- [x] Character proposes only authored allowlisted actions; authoritative reducer decides.
- [x] Character may not assert consequential result before reducer acceptance (`mayCommitActorReply`).
- [x] Realtime actor contract exposes normalized transport events (`connected`, `disconnected`, response start/delta/complete/cancel/error) through `ConversationProvider.subscribe`; Realtime emits them, HTTP adapts to the same surface, and `LiveSessionView` consumes lifecycle events.
- [x] Text pipeline remains a valid fallback adapter; fallback actions pass the same allowlist sanitizer.

---

# 16. Coach contract

- [x] Coach is private and outside fictional world (separate Help sheet + `/api/coach/hint`).
- [x] Help content appears only after learner action (`Help`/ladder selection); it is not injected into Actor turns.
- [x] Help is an affordance; no proactive coach answer is inserted into the fictional transcript.
- [x] Coach ladder:
  - [x] intent
  - [x] partial form
  - [x] full form
  - [x] explanation
- [x] Coach support emits scoped skill/opportunity/phrase exposure records.
- [x] Remove Spanish-specific deterministic fallback examples.
- [x] Fallback is target-language aware/template-driven (`coachFallback.ts`).
- [x] Coach never creates evidence; only support exposure is written.
- [x] Coach never changes scene facts.

---

# 17. Evidence loop V1

- [x] Add `demonstration`.
- [x] Add `opportunityInstanceId`.
- [x] Add required `contextKey`.
- [x] Add `dayKey` with SQLite round-trip/backfill.
- [x] Add deterministic reason codes with SQLite round-trip/backfill. (legacy audit `reasonCode` + detailed learner-facing `reasonCodes`; schema v10)
- [x] Add policy version to skill observations/lapses.
- [x] Preserve phrase and skill evidence separately.
- [x] One communicative act maps to one most-specific skill. (`skillHierarchyEvidence.test.ts`)
- [x] Assessor proposes; deterministic validator persists.
- [x] Rehearsal cannot count as independent.
- [x] Provider/session failure cannot produce lapse; lapse requires natural `completed` end + strict taken cold opportunity.
- [x] Add learner dispute flow: dispute marks phrase/skill observation hidden + user-disputed while preserving raw history; Progress exposes the action.

---

# 18. Program contracts — curated first

## RoleplayProgram

- [x] Add targetLanguage (`RoleplayProgram`).
- [x] Add validated `targetLocale` (BCP-47 shape, e.g. nl-BE).
- [x] Add program policy version.
- [x] Pin every plan entry to mission ID + missionVersion.
- [x] Pin referenced sceneId + sceneVersion; catalog validation rejects drift.
- [x] Split:
  - [x] `ProgramProjection` — derived/rebuildable
  - [x] `ProgramPreferences` — skipped/pinned/muted source data

## Goal input V1

- [x] Slot-based goal type (`ProgramGoalInput`).
- [x] Domain/context selection.
- [x] Target language + locale.
- [x] Optional deadline is contractually an ordering constraint only.
- [x] No readiness prediction field/derivation exists in goal contract.
- [x] Personal profile fields local-only by default; `toExecutableProgramGoalInput` strips `personalProfile` and local retention metadata before execution/provider boundaries (`contracts/program.ts`, contract test).
- [x] Free-text goal is rejected by `isExecutableGoalInput`.

---

# 19. V1 authoring modes

- [x] **Curated programs — V1 execution default.** (`authoringPolicy.ts`)
- [x] **Template programs — gated behind extraction + screening + caps + learner preview.**
- [x] **AI-composed sequencing — V2 only.** V1 policy returns non-executable.
- [x] AI may sequence reviewed/version-pinned catalog missions only when V2 is enabled.
- [x] AI may not generate new executable mission content at runtime in V1.
- [x] Exam goal domain is curated-only in authoring policy.
- [x] Template free text contract requires extraction, screening, caps, preview and discard state before execution.

---

# 20. Curated Program V1

Target scope should remain small enough for review capacity.

- [ ] Choose one launch language/locale.
- [ ] Choose first two curated programs.
- [ ] Target about 8–10 missions per program only if review capacity supports it.
- [ ] Start with roughly 6–8 CommunicativeSkills.
- [ ] Ensure each core skill has at least 3 scenario families before claiming transfer.
- [ ] Every mission:
  - [ ] released/reviewed
  - [ ] model-checked scene
  - [ ] declared opportunity examples
  - [x] completion predicate (scene validation + reachable achieved path)
  - [ ] locale review
- [ ] One final simulation for one program first.
- [ ] Record reviewer hours per mission and content throughput.

---

# 21. Program adaptation / next-RP engine

Prefer deterministic/versioned policy.

Inputs:

- [x] validated evidence
- [x] relevant support history (input preserved for deterministic policy; support semantics remain in scoped ledger)
- [x] strict lapse/revisit state
- [x] recent scenario families
- [x] program goal
- [x] learner program preferences (skip/pin/mute)
- [x] mission readiness
- [x] optional deadline ordering input; never used for competence/readiness prediction

Outputs:

- [x] continue
- [x] transfer
- [x] recovery
- [x] optional challenge with learner confirmation
- [x] final simulation recommendation after reviewed core plan is complete

Rules:

- [x] Independent success → offer same skill in a different family.
- [x] Supported success → offer cold transfer in a different available family.
- [x] Genuine strict cold lapse → recovery candidate.
- [x] No valid strict lapse → no weakness inference.
- [x] Repeated independent success → optional challenge; learner confirmation required, and the recommendation carries only a negotiated compatible `challengeType` (next-RP policy v2).
- [x] Same evidence + same policy version → same deterministic recommendation.
- [x] Recommendation stores deterministic reason codes only.
- [x] Render EN/FR/ES/NL explanation from reason code (`renderNextRpReason`).

---

# 22. Cold / Guided / Transfer / Recovery

These are properties of RP opportunities/attempts, not conventional lesson screens.

## Cold

- [x] Cold = no relevant production-form exposure within scoped policy window.
- [x] Captions/accommodations remain available and are outside production-help ledger.
- [x] No proactive coach answer; Help is learner-triggered.
- [x] Learner can request help through the four-step ladder.

## Guided

- [x] Guided support is scoped to exact target rather than whole mission.
- [x] Progressive intent → partial → full → explanation ladder.
- [x] Exact skill/opportunity/phrase scope recorded.
- [x] Any relevant production support makes the attempt guided/assisted.

## Transfer

- [x] Transfer recommendation targets the same CommunicativeSkill.
- [x] Transfer requires a different `scenarioFamilyId`.
- [x] Transfer recommendation is a cold-transfer policy path.
- [x] Rehearsal/retry is explicitly ineligible for transfer.
- [x] Variants sharing a `scenarioFamilyId` do not count as transfer.

## Recovery

- [x] Recovery is eligible only from a persisted strict `SkillLapse`.
- [x] Recovery chooses a different recent family when possible.
- [x] Lower/manageable pressure. (`RP_MODE_POLICY.recoveryPressureCeiling = manageable`; recovery next-RP policy v3 carries `pressureCeiling: manageable`; `pressurePolicyForLearningMode` cannot admit standard/stretch branches in Recovery)
- [x] Consecutive recovery cap = 2 (`RP_MODE_POLICY`).
- [x] Recovery cap produces deterministic `RECOVERY_CAP_OFF_RAMP` recommendation.
- [x] Return to cold as soon as reasonable. (`nextRp.ts`: later independent evidence closes recovery loop and prevents repeated recovery treatment)

---

# 23. Final simulation

- [ ] Build one integrated reviewed final simulation.
- [x] Support hidden by default but accommodations preserved. (`MissionBriefingScreen`: final simulation uses minimal support while normal accommodation profile remains active)
- [x] Help remains explicitly available. (minimal-support briefing does not remove learner-triggered live Help ladder)
- [x] No official score/readiness/pass probability. (final simulation reuses ordinary evidence/recap path; no score field or readiness prediction)
- [x] Evidence rules remain identical. (final simulation carries program context only; validator-owned evidence path is unchanged)
- [x] Program completion recap separates scene result from skill evidence. (`RecapScreen`; final-simulation label + separate scene/skill evidence presentation)

---

# 24. Connected-world continuity

- [x] Replace bare fact-key carry-forward with `CarryForwardFact`. (`types/index.ts`, `continuity.ts`)
- [x] Add sensitivity. (`CarryForwardSensitivity`)
- [x] Add source. (`CarryForwardFact.source`)
- [x] Add mission allowlist. (`allowedMissionIds`)
- [x] Add expiry/TTL. (`expiresAt`; expired facts fail closed)
- [x] Use learner alias rather than real name by default. (`LearnerContinuityProfile.alias`; no real-name carry-forward contract)
- [x] Learner sees "What this place remembers". (Privacy settings continuity panel)
- [x] Learner can edit/clear. (`settings/privacy.tsx`: learner-owned alias/fact controls)
- [x] Local-only by default. (`localOnly: true`)
- [x] Higher-sensitivity facts never carry across scenes. (`canCarryFactToMission` rejects `high`)

---

# 25. Privacy/data architecture for programs

- [x] ConsentRecord included in data boundaries. (`ArchiveRepository.types.ts`; SQLite + IndexedDB consent stores/export)
- [x] Accommodation included. (`UserPreferences.accommodations`; archive defaults/export boundary)
- [x] ProgramPreferences included. (`UserPreferences.programPreferences`; persistence/export/delete-all scope)
- [x] Deletion tombstones included. (archive deletion markers + provider deletion tombstones)
- [x] Pending jobs included. (`ArchiveRepository.getPendingJobs`; export/delete-all scope)
- [x] Policy versions included. (learning/support/evidence policy versions + consent version in archive export)
- [x] Content provenance included. (`exportArchiveJson`: mission/version provenance per session)
- [x] Retention rule defined for goal/profile inputs. (`PROGRAM_GOAL_RETENTION_DAYS`; continuity fact TTL pruning)
- [x] Export includes learner-owned program/preferences/evidence data. (SQLite/IndexedDB export parity coverage)
- [x] Delete-all removes program/profile data and blocks late writes. (marker-first archive deletion + generation-aware late-write guards)
- [x] Consent withdrawal immediately changes eligible features. (consent state synchronized to provider eligibility; Settings withdrawal path)
- [ ] Raw custom goal text discarded by default after extraction/preview.

---

# 26. Content and mission gates

A released mission must pass:

- [x] valid stable ID + version (`validateMissionForProgramRelease`)
- [ ] target language + target locale review
- [x] scenarioFamilyId (`validateMissionForProgramRelease` + canonical family validation)
- [x] typed finite scene facts (scene static validation)
- [x] predicate DSL validation (`validateSceneDefinition`)
- [x] model checker (`modelCheckScene`; build-blocking released content validation)
- [ ] learner role
- [x] character knowledge boundary (`validateMissionForProgramRelease`)
- [x] at least one primary CommunicativeSkill (`validateMissionForProgramRelease`)
- [x] at least one reachable opportunity (model-check reachable opportunity gate)
- [x] positive + negative opportunity examples (release gate validates each authored opportunity)
- [ ] completion predicate
- [x] complication policy (static/model checks include safe complication reachability)
- [x] support policy (released mission requires learner-triggered hint ladder)
- [ ] typed fallback
- [ ] captions/accessibility support
- [x] regulated-domain checks (`validateCharacterBehaviorPolicy`)
- [x] character-behavior checks (`validateCharacterBehaviorPolicy`)
- [x] scripted dry-run (`modelCheckScene.achievedPath`; `validate:scenes` report)
- [ ] localization completeness

---

# 27. Program gates

A program must pass:

- [x] every mission pinned to released version (`validateProgramAgainstCatalog`)
- [x] every mission content-ready (`validateProgramForActivation` → mission release gates)
- [ ] no dead-end plan entry
- [x] at least one real transfer path (`hasRealTransferPath`)
- [x] adaptation uses reason codes (`nextRp.ts`; deterministic localized reason codes)
- [ ] target locale supported
- [ ] profile/goal data under consent scope
- [x] final simulation where program promises one (activation gate validates pinned final-simulation mission)
- [x] no generated unreviewed mission content (V1 authoring policy + released-content activation boundary)
- [ ] exam provenance fresh where exam path is used

---

# 28. Required regression tests

## Identity

- [x] same-family Café A → Café B adds no context. (`skillContext.test.ts`)
- [x] pressure variant adds no context. (`skillContext.test.ts`: pressured scenario provenance with the same domain + scenarioFamilyId collapses to the same transfer context)
- [x] retry adds no context. (`skillContext`/retry transfer regression; retry is rehearsal and context identity excludes attempt/session)

## Evidence

- [x] scene achieved without skill demonstration. (`skillEvidence.test.ts`: achieved scene + no taken target opportunity produces no SkillObservation)
- [x] scene failed without skill lapse. (`skillEvidence.test.ts`: scene failure alone creates no lapse)
- [x] wrong passage revision rejected. (`skillEvidence.test.ts`)
- [x] assistant quote rejected. (`skillEvidence.test.ts`)
- [x] one communicative act cannot be credited to overlapping parent + child skills. (`skillHierarchyEvidence.test.ts`)
- [x] rehearsal cannot create independent evidence. (`skillEvidence.test.ts`)

## Support

- [x] hint about one phrase affects one target only. (`supportScope.test.ts`)
- [x] meaning of character turn does not downgrade production. (`supportScope.test.ts`)
- [x] accessibility captions do not downgrade unrelated production. (`supportScope.test.ts`)
- [x] support shown after checkpoint still applies after retry (`retrySupport.test.ts`, high-water regression).

## Runtime

- [x] forged facts ignored. (`tests/actor-context.test.ts`: actor authority derived from reviewed server content)
- [x] duplicate client + sideband action → one transition. (`sceneStore.test.ts`; actionId first-verdict replay/idempotency)
- [x] stale revision rejected. (`sceneReducer.test.ts`, `sceneStore.test.ts`)
- [x] consequential action result returns before character confirms. (`actorContract.test.ts`)
- [x] event-log replay reconstructs revision. (`sceneStore.test.ts`)

## Scene verification

- [x] unreachable completion fails build. (`sceneModelChecker.test.ts`, `validate:scenes`)
- [x] deadlock fails build. (`sceneModelChecker.test.ts`, `validate:scenes`)
- [x] unsatisfiable opportunity fails build. (`sceneModelChecker.test.ts`)
- [x] unsafe complication path fails build. (`sceneModelChecker.test.ts`: global happy path can exist while a complication-trigger branch is rejected because achievement is no longer reachable)

## Lapse/recovery

- [x] silence → no lapse. (`skillEvidence.test.ts`)
- [x] disconnect → no lapse. (`skillEvidence.test.ts`)
- [x] ASR failure → no lapse. (`skillEvidence.test.ts`)
- [x] real failed cold opportunity can create revisit/recovery. (`skillEvidence.test.ts`, `nextRp.test.ts`)
- [x] recovery cap/off-ramp works. (`nextRp.test.ts`)

## Privacy/security

- [x] consent enforced server-side. (`tests/request-guard.test.ts`)
- [x] deletion tombstone blocks late assessment. (provider tombstone check + archive late-write regression)
- [x] goal prompt injection cannot change skill/predicate/system contracts. (reviewed actor authority/version pins + realtime prompt-isolation regression)

## Program

- [x] same evidence + same policy version → same next-RP decision. (`nextRp.test.ts`)
- [x] policy bump rebuilds reproducibly. (fail-closed reproducibility regression at feature head)
- [x] unreviewed mission cannot enter active program. (`validateProgramForActivation`; released-program build gate)

---

# 29. Execution order

## P0 — finish current provider/device confidence

- [x] Cloud OpenAI Realtime acceptance.
- [x] Cloud Gemini TTS acceptance.
- [x] FR/NL cloud speech acceptance.
- [ ] Android native voice/STT.
- [ ] iPhone native voice/STT.
- [ ] Physical cloud → native fallback.

## P0.5 — learning correctness lock

- [x] Required scenarioFamilyId/contextKey.
- [x] Fix sessionId-as-context in `skillProjection.ts`.
- [x] Canonical skill hierarchy/catalog. (`src/content/skills.ts`; parent/child + direct/derived evidence policy)
- [x] taskOutcome vs demonstration.
- [x] OpportunityInstance.
- [x] scoped support relevance matrix. (`supportScope.ts`, `supportScope.test.ts`)
- [x] accommodations. (`AccommodationProfile`; Settings + evidence regression coverage)
- [x] support high-water mark (retry inherits every parent-attempt exposure below the captured mark, including support shown after the scene checkpoint; regression-tested).
- [x] strict lapse/revisit semantics. (`skillEvidence.ts`, `skillProjection.ts`; reviewDue/revisit remain separate from status)
- [ ] consent/privacy/security G0 confirmations.

## P1 — scene/mission runtime hardening

- [x] server-authoritative shared reducer boundary (`features/roleplay/runtime`; hosted store executes reducer, `SceneMirror` consumes server verdicts only).
- [x] versioned action request (mission + scene IDs/versions required at hosted ingress).
- [x] append-only scene event log (accepted/rejected proposal + verdict persisted by actionId).
- [x] typed finite facts (`SceneFactSchema`).
- [x] predicate/effect DSL (bounded data-only predicates + finite set effects).
- [x] model checker. (`sceneModelChecker.ts`; `npm run validate:scenes`)
- [x] deterministic Director. (`director.ts`; authored opportunity/complication/pressure/completion selection, event-bound cadence and directive dedupe)
- [x] blocking consequential actions (`mayCommitActorReply` + authoritative reducer acceptance).
- [x] provider capability negotiation (`features/roleplay/capabilities.ts`; challenge gating + degradation telemetry).

## P2 — evidence loop V1

- [x] demonstration validator. (`skillEvidence.ts`; exact validated opportunity linkage required for positive skill evidence)
- [x] opportunity-linked evidence. (`OpportunityInstance` runtime generation, assessment linkage, SQLite/IndexedDB persistence)
- [x] reason codes. (`SkillObservation.reasonCode`, `SkillLapse.reasonCode`; persistence/backfill)
- [x] revisit + last independent use. (`skillProjection.ts`, Progress UI)
- [x] learner dispute flow. (hide/dispute preserves raw history and excludes disputed evidence)
- [ ] calibration fixtures.

## P3 — curated programs

- [ ] choose launch language/locale.
- [ ] choose first two programs.
- [ ] author/review mission set.
- [x] ProgramProjection + ProgramPreferences. (`contracts/program.ts`, persisted learner preferences)
- [x] deterministic next-RP engine. (`nextRp.ts`, policy v3; recovery recommendations carry a bounded manageable pressure ceiling)
- [x] Program UI. (`ProgramScreen.tsx`, `/program/[programId]`, Missions → Programs route; mobile-first V4 styling)

## P4 — pedagogy loop

- [x] Cold. (`rpModes.ts`, scoped support semantics)
- [x] Guided. (`rpModes.ts`, four-step coach ladder)
- [x] Transfer. (`rpModes.ts`, `nextRp.ts`)
- [x] Recovery. (`rpModes.ts`, `nextRp.ts`)
- [x] Retry distinction. (rehearsal is not transfer; support ledger high-water is inherited)
- [x] recovery caps/off-ramps. (`RP_MODE_POLICY`, `RECOVERY_CAP_OFF_RAMP`)

## P5 — template programs

- [x] slot-based goal input. (`ProgramGoalInput`, `isExecutableGoalInput`)
- [ ] reviewed program templates.
- [ ] preview.
- [ ] free-text extraction/screening/discard.
- [ ] template → reviewed mission sequencing.

## P6 — final simulation

- [ ] one integrated reviewed final simulation.
- [x] minimal-support mode. (`MissionBriefingScreen`; final simulation starts cold with proactive support hidden)
- [x] program completion recap. (`RecapScreen`: durable program/final-simulation context + scene-vs-skill separation)

## V2+

- [ ] AI-composed sequencing over reviewed missions only.
- [ ] no runtime generation of unreviewed executable mission content.
- [ ] more languages/domains only when review capacity supports them.

---

# 30. V1 definition of done

V1 roleplay-program architecture is complete only when the learner can:

- [ ] choose a reviewed goal/program or resolve a slot-based goal to a reviewed template.
- [ ] see a program of reviewed missions.
- [ ] play a defined role against a bounded character.
- [ ] experience deterministic scene truth and controlled consequences.
- [ ] receive private graduated help that is scoped precisely.
- [ ] finish through authored/model-checked completion.
- [ ] receive evidence grounded in real transcript/opportunity/support state.
- [ ] receive a next RP with an explainable deterministic reason.
- [ ] transfer the same communicative skill to a genuinely different scenario family.

And the system can prove:

- [x] character never defined world truth. (server-authoritative scene reducer + reviewed actor context boundary)
- [x] model never directly persisted learning evidence. (opaque validator-issued evidence bundles + archive API boundary)
- [x] support was target-scoped and window-limited. (`supportScope.ts`, policy-versioned exposure ledger)
- [x] accommodations were not penalized. (accommodations remain outside production-support downgrade semantics)
- [x] provider/session failures created no lapse.
- [x] same-family variants did not fake transfer. (`skillContext.test.ts`; same domain + same reviewed family collapses to one context, while domain + family identity remains explicit)
- [x] retry never masqueraded as transfer. (rehearsal/attempt identity excluded from transfer context; dedicated regression)
- [x] scene completion is reachable and deadlock-free. (build-time finite-state model checker)
- [x] program decisions are reproducible under the same policy version. (`nextRp.test.ts` + policy-bump rebuild regression)

---

# 31. Immediate known code deltas

Confirmed from `main` after squash merge `520102dc12dd162b081d93c92503e5a3030c47c1`:

- [x] Context identity is domain + `scenarioFamilyId`; session/retry/cosmetic variants do not create transfer contexts.
- [x] Scene outcome and skill demonstration are independent, and strict lapses require a validated taken cold opportunity tied to learner evidence.
- [x] Authored `SkillOpportunityDefinition` → runtime `OpportunityInstance` → assessment → validated evidence is wired end-to-end.
- [x] Coach support is scoped to exact skill/opportunity/phrase targets; unrelated comprehension assistance does not contaminate production evidence.
- [x] Retry support uses a high-water ledger and never rewinds learner exposure; parent-attempt evidence is finalized before fork and merged into the final archive without re-assessing old passages as the active attempt.
- [x] Finite scene facts, bounded predicate/effect DSL, payload validation and build-time model checking are active; complication-trigger states are also required to retain a path to authored achievement.
- [x] Hosted scene execution is server-authoritative with versioned requests, cross-channel dedupe metadata and append-only event replay.
- [x] Deterministic Director V1 exists for authored opportunities, complications, pressure branches and completion preparation; pressure is reviewed/opt-in content, while live evaluation remains gated to completed scene/turn boundaries and deduped per authoritative revision/directive.
- [x] Provider capabilities are negotiated; unsupported communication challenge types cannot be emitted by next-RP policy v3.
- [x] Explicit repair challenge content is authored for all six direct repair skills in Café v2; it is opt-in/skippable, provider-capability gated, and challenge-linked opportunities cannot appear from scene predicates alone. Pharmacy remains challenge-free under the medical-simulation exclusion.
- [x] RoleplayProgram contracts, ProgramProjection/Preferences, deterministic next-RP, Cold/Guided/Transfer/Recovery, recovery caps and manageable Recovery pressure ceiling are implemented.
- [x] Carry-forward continuity facts have source, sensitivity, mission allowlist, TTL and local-only enforcement.
- [x] Canonical PracticeSkill/CommunicativeSkill hierarchy and most-specific parent/child attribution implemented (`src/content/skills.ts`, `skillEvidence.ts`, scene/catalog/hierarchy regression tests; duplicate mission-owned catalog removed).
- [x] Canonical reviewed ScenarioFamily catalog defines stable family IDs, domain boundaries, inclusion/exclusion reviewer metadata and fail-closed mission/program validation (`src/content/scenarioFamilies.ts`, `scenarioFamilies.test.ts`, `validate-scenes.mts`).
- [x] Detailed evidence reason codes are deterministic, persisted and localized; scene success still cannot manufacture target-skill evidence (`evidenceReasons.ts`, schema v10, `skillEvidence.test.ts`).
- [x] Retry checkpoints are deterministic-authority only: semantic opportunity judgments are excluded from the v5 checkpoint contract and rejected if injected at ingress/store boundaries (`scene.ts`, `sceneStore.ts`, `routes.ts`, `sceneStore.test.ts`).
- [x] Support-surface exposure instrumentation is complete for the §6 exposure-kind list, including exact-target same-day cross-session briefing/recap relevance under learning policy v5.
- [x] Director pressure branches are bounded authored content with static validation, reachability checks, explicit opt-in policy gating and same-family/no-transfer-credit regression coverage.
- [ ] Curated launch content, locale review and final simulation remain open.
- [x] Consent/privacy/security hardening and delete-tombstone guarantees are implemented and regression-covered; only the audience/age release decision remains open in G0.
- [ ] Physical Android/iPhone native voice and cloud → native fallback verification remain open.

---

# 32. Maintenance rule

When completing an item:

1. change `[ ]` to `[x]`;
2. add the smallest useful implementation/test reference;
3. do not mark physical-device or review-dependent work complete from browser CI;
4. do not mark semantic pedagogy claims complete because an LLM prompt mentions them;
5. keep this checklist executable and evidence-based.
