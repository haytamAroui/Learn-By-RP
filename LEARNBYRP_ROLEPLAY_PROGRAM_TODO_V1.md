# LearnByRP — Roleplay Program Execution TODO V1

**Status:** active execution checklist for roleplay/program/pedagogy work  
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
- [ ] Add this TODO to implementation-doc precedence notes where roleplay/program work is referenced.
- [ ] Keep UI-specific work in V4; keep roleplay/pedagogy correctness here.

---

# 1. Gate G0 — close foundation correctness before new RP intelligence

## Voice/session baseline

- [ ] Confirm recursion regression remains closed.
- [ ] Confirm stale-state regression remains closed.
- [ ] Confirm mute/freeze/retry state is read from current runtime state.
- [ ] Confirm reconnect/error/mic-denied states are explicit.
- [ ] Confirm typed draft survives provider errors/reconnects where intended.
- [ ] Confirm audio resources close on every end path.
- [ ] Physical Android native voice/STT pass.
- [ ] Physical iPhone native voice/STT pass.
- [ ] Physical cloud → native TTS fallback pass.

## Evidence baseline

- [x] Assessment proposals are validated before persistence.
- [x] Phrase and skill evidence are separate concepts.
- [x] Support exposure exists in the runtime.
- [ ] Enforce validator-only observation write path by type/API boundary.
- [ ] Confirm reveal/listen cannot create unassisted phrase evidence.
- [ ] Confirm transcript revision invalidates stale derived evidence.

## Scene baseline

- [x] Hosted scene routes exist.
- [x] Server route owns the authoritative hosted scene transition.
- [x] Client uses a scene mirror rather than deciding truth.
- [x] Duplicate action IDs are handled idempotently in current reducer/store flow.
- [x] Stale revision is rejected.
- [x] Retry/fork infrastructure exists.
- [ ] Add missionVersion and sceneVersion to every authoritative action request.
- [ ] Add provider call ID + connection generation for cross-channel dedupe.
- [ ] Move authoritative reducer execution contract into an explicitly shared pure package executed on the server.
- [ ] Add append-only scene event log so revision N can be replayed.

## Privacy/security/safety baseline

- [ ] Confirm voice consent is tri-state and enforced server-side.
- [ ] Confirm saved-analysis consent is independently enforced server-side.
- [ ] Confirm AI endpoints require bounded authenticated/guest access.
- [ ] Confirm rate limits and request schemas on AI endpoints.
- [ ] Confirm delete tombstones block late assessment/provider writes.
- [ ] Confirm regulated-domain content has no diagnosis/dosage/treatment advice.
- [ ] Add character-behavior policy for hostility, discrimination, harassment, sexual content and simulated abuse.
- [ ] Decide audience/age gate before public release.

---

# 2. Lock the canonical skill model

## Two-layer model

- [ ] Define `PracticeSkill` as learner-facing discovery/pedagogy labels.
- [ ] Initial PracticeSkills:
  - [ ] Start a conversation
  - [ ] Keep it going
  - [ ] Explain an idea
  - [ ] Ask for clarification
  - [ ] Handle a difficult moment
  - [ ] Speak for a purpose
- [ ] PracticeSkills have no learner status in V1 unless an explicit roll-up policy is later approved.

## Canonical CommunicativeSkill catalog

- [ ] Move the canonical skill catalog out of the monolithic mission data file.
- [ ] Store skills as validated content data.
- [ ] Give each skill a stable ID.
- [ ] Add localized can-do statement.
- [ ] Add positive examples.
- [ ] Add negative examples.
- [ ] Add boundary notes vs neighboring skills.
- [ ] Add modality: production / comprehension / interaction.
- [ ] Add typical opportunity patterns.
- [ ] Add deprecation + successor policy.
- [ ] Never reuse retired skill IDs.

## Repair hierarchy

- [ ] Make `communicative_repair` a parent/derived family, not directly evidenced.
- [ ] Child skills:
  - [ ] request_repetition
  - [ ] request_slower_speech
  - [ ] ask_clarification
  - [ ] check_understanding
  - [ ] clarify_misunderstanding
  - [ ] paraphrase_when_stuck
- [ ] Attribute one communicative act to one most-specific child skill.
- [ ] Cap skills credited per passage [Tunable].
- [ ] Add `give_opinion_with_reason`.
- [ ] Add `compare_options`.
- [ ] Add `make_arrangement`.
- [ ] Add `narrate_past_event`.

---

# 3. Fix context identity before Transfer

Current code still counts `sessionId` as an independent context in `skillProjection.ts`. This must be removed before Transfer or Steady can be trusted.

- [x] Introduce required `scenarioFamilyId`. (`MissionDefinition.scenarioFamilyId`)
- [ ] Define:

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
- [ ] Add family definition/reviewer metadata.
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
- [ ] Add reason codes for demonstration/evidence decisions.
- [ ] Add test: scene achieved without target skill → no skill demonstration.
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
- [ ] Checkpoints may only reference deterministic/validated scene state, not provisional semantic judgments.
- [ ] Author explicit communication challenges for repair skills instead of waiting for accidental confusion.
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
- [ ] model_phrase_audio
- [x] assistant_audio_replay (`LiveSessionView` Listen action records comprehension-only exposure)
- [x] assistant_audio_slow (`LiveSessionView` slower replay records comprehension-only exposure)
- [ ] caption_view
- [ ] typed_example
- [ ] recap_exposure
- [x] briefing_exposure (only explicitly previewed phrase IDs; policy-versioned)

## Relevance rules

- [x] Intent hint is recorded but does not expose target production form. (`supportScope.ts`)
- [x] Partial/full/model phrase/typed example affect production evidence for the exact target. (policy semantics in `supportScope.ts`; remaining surfaces still need event instrumentation)
- [x] Meaning/replay/slow/explanation of character speech do not downgrade production evidence. (`supportScope.ts`)
- [ ] Briefing/recap exposure affects only shown target items within policy window.
- [x] Support windows are policy-versioned and per target. (`SupportExposure.policyVersion`, SQLite migration v6, `supportScope.ts`)
- [x] Never mark an entire session assisted because any help occurred.
- [x] Add regression test: meaning of the character question does not downgrade unrelated production evidence. (`skillEvidence.test.ts`, `supportScope.test.ts`)
- [x] Add regression test: hint for one phrase affects only that phrase/target. (`supportScope.test.ts`)

---

# 7. Accessibility accommodations are not pedagogical help

- [x] Add `Accommodation` profile records. (`AccommodationProfile` persisted in `UserPreferences`; backward-compatible for old archives)
- [ ] Initial kinds:
  - [x] captions_always
  - [x] slower_speech_default
  - [x] typed_preferred
  - [x] haptic_turn_cues
- [x] Captions remain available in Cold. (character transcript rendering is not gated by `coldAttempt`)
- [x] Accommodation is visible/manageable in Settings. (EN/FR/ES/NL labels + four switches)
- [x] Accommodation does not reduce unrelated production evidence. (accommodations are preferences, not support rows; comprehension-only exposure kinds are ignored by production scope)
- [x] Typed evidence remains typed; it does not establish spoken evidence. (existing validator rule retained)
- [x] Add regression coverage that caption/replay/slow/explanation are not production-form support. (`supportScope.test.ts`)
- [ ] Preserve accommodations in final/minimal-support simulation.

---

# 8. Retry support ledger must never rewind

- [ ] Rename checkpoint support position to `supportLedgerHighWaterMark`.
- [x] Scene may rewind/fork; support knowledge does not. (`inheritSupportForRetry`)
- [x] Exact form seen before retry is inherited into the new attempt with exact target provenance.
- [x] Retry after answer reveal remains rehearsal; inherited support is materialized in the retry attempt.
- [x] Add regression test for retry support inheritance and idempotency. (`retrySupport.test.ts`)
- [ ] Preserve original attempt and original evidence. Transcript/support provenance is now retained across retries; per-attempt evidence finalization before retry is still open.

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
- [ ] One strict lapse does not demote status.
- [ ] Second lapse within policy window may flag revisit [Tunable].
- [ ] Do not implement automatic demotion in V1.
- [ ] Cap consecutive recovery missions per skill [Tunable].
- [ ] Offer off-ramps: guided practice / different skill / break / mute skill.

---

# 10. Formalize scene contracts

## Typed finite facts

- [ ] Replace unrestricted `Record<string, unknown>` scene facts with per-scene finite schemas.
- [ ] Supported fact types:
  - [ ] boolean
  - [ ] enum
  - [ ] bounded integer where necessary
- [ ] Every effect may only write declared facts with declared values.

## Predicate DSL

- [ ] Define bounded JSON predicate language:
  - [ ] eq
  - [ ] neq
  - [ ] in
  - [ ] and
  - [ ] or
  - [ ] not
  - [ ] exists
  - [ ] lte / gte for bounded numbers
  - [ ] countOf(actions)
- [ ] No arbitrary code in content predicates.
- [ ] Bound predicate depth.
- [ ] Use same predicate language for:
  - [ ] preconditions
  - [ ] completion
  - [ ] complications
  - [ ] opportunity scene conditions

## Effects

- [ ] Define finite effect language.
- [ ] Remove arbitrary untyped nested mutations where the content schema cannot be statically checked.
- [ ] Validate every action payload against its declared schema.

---

# 11. Build-time scene model checker

- [ ] Enumerate reachable states for each released finite scene.
- [ ] Fail build if completion is unreachable.
- [ ] Fail build on reachable non-complete deadlock.
- [ ] Fail build if a complication can make completion unreachable.
- [ ] Fail build on dead authored action.
- [ ] Fail build if declared opportunity is unreachable.
- [ ] Detect/bound non-idempotent action cycles.
- [ ] Generate scripted dry-run paths for reducer CI.
- [ ] Add model-check report to content validation output.

---

# 12. Server-authoritative scene runtime hardening

- [x] Hosted routes exist under `server/roleplay`.
- [x] Client mirror exists.
- [x] Reducer is pure enough to share.
- [ ] Create explicit shared runtime package/module boundary for reducer contracts.
- [ ] Server is the only authoritative executor in hosted mode.
- [ ] Client reducer use, if any, is prediction/mirror only.
- [ ] Add missionId + missionVersion to action request.
- [ ] Add sceneId + sceneVersion to action request.
- [ ] Add provider call ID.
- [ ] Add connection generation.
- [ ] Append accepted/rejected scene events to an event log.
- [ ] Rebuild revision state from event log.
- [ ] Cross-channel duplicate tool call → one transition.
- [ ] Consequential tool actions block actor confirmation until reducer result.

---

# 13. Director V1 must be deterministic

- [ ] Define deterministic `DirectorDecision`.
- [ ] Director runs on scene events/between turns, not per audio frame.
- [ ] Director chooses only authored:
  - [ ] opportunity
  - [ ] complication
  - [ ] pressure branch
  - [ ] completion preparation
- [ ] Director cannot invent facts.
- [ ] Director cannot create evidence.
- [ ] Director cannot add skill IDs.
- [ ] AI interpretation may return semantic candidate + unknown.
- [ ] Unknown never becomes a state mutation.
- [ ] Defer free-form AI Director behavior beyond V1.

---

# 14. Provider capability negotiation

- [ ] Define `TransportCapabilities`:
  - [ ] speechRateControl
  - [ ] endOfTurnDelayControl
  - [ ] pushToTalk
  - [ ] scriptedLineInjection
  - [ ] blockingToolCalls
  - [ ] transcriptRevisions
- [ ] Roleplay pressure requests capabilities; provider does not define pedagogy.
- [ ] Slow speech without native rate control is marked best-effort.
- [ ] Long thinking time falls back to push-to-talk / tap-when-done if timing control unavailable.
- [ ] Challenge types only appear when provider supports them.
- [ ] Blocking consequential tool calls are required before character confirms world changes.
- [ ] Log capability degradation as operational telemetry only.

---

# 15. Character Actor contract

- [ ] Character stays in role.
- [ ] Character never turns into the coach.
- [ ] Character sees only allowed scene/program facts.
- [ ] Character does not see private coach content.
- [ ] Character does not see learner evidence projection.
- [ ] Character proposes actions; reducer decides.
- [ ] Character may not assert consequential result before reducer acceptance.
- [ ] Realtime actor contract uses transport events, not only text-in/text-out.
- [ ] Text pipeline remains a valid fallback adapter.

---

# 16. Coach contract

- [ ] Coach is private and outside fictional world.
- [ ] Help content appears only after learner acceptance.
- [ ] A breakdown may surface a Help affordance, not proactive answer text.
- [ ] Coach ladder:
  - [ ] intent
  - [ ] partial form
  - [ ] full form
  - [ ] explanation
- [ ] Coach support always emits exact scoped exposure records.
- [ ] Remove Spanish-specific deterministic fallback examples.
- [ ] Fallback is target-language aware/template-driven.
- [ ] Coach never creates evidence.
- [ ] Coach never changes scene facts.

---

# 17. Evidence loop V1

- [ ] Add `demonstration`.
- [ ] Add `opportunityInstanceId`.
- [ ] Add required `contextKey`.
- [ ] Add `dayKey`.
- [ ] Add reason codes.
- [ ] Add policy version.
- [ ] Preserve phrase and skill evidence separately.
- [ ] One communicative act maps to one most-specific skill.
- [ ] Assessor proposes; validator persists.
- [ ] Rehearsal cannot count as independent.
- [ ] Provider/session failure cannot produce lapse.
- [ ] Add learner dispute flow: "That's not right" hides observation from projection without deleting raw history.

---

# 18. Program contracts — curated first

## RoleplayProgram

- [ ] Add targetLanguage.
- [ ] Add `targetLocale` (BCP-47, e.g. nl-BE).
- [ ] Add program policy version.
- [ ] Pin every plan entry to mission ID + missionVersion.
- [ ] Pin referenced scene/content versions where needed.
- [ ] Split:
  - [ ] `ProgramProjection` — derived/rebuildable
  - [ ] `ProgramPreferences` — skipped/pinned/muted source data

## Goal input V1

- [ ] Slot-based goal type.
- [ ] Domain/context selection.
- [ ] Target language + locale.
- [ ] Optional deadline used only for ordering.
- [ ] No readiness prediction from deadline.
- [ ] Personal profile fields local-only by default.
- [ ] Free-text goal is not directly executable input.

---

# 19. V1 authoring modes

- [ ] **Curated programs — V1 launch default.**
- [ ] **Template programs — after curated path works.**
- [ ] **AI-composed sequencing — V2 only.**
- [ ] AI may sequence reviewed missions only.
- [ ] AI may not generate new executable mission content at runtime in V1.
- [ ] Exams and regulated domains remain curated/reviewed.
- [ ] Template free text goes through extraction, screening, caps, preview and discard.

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
  - [ ] completion predicate
  - [ ] locale review
- [ ] One final simulation for one program first.
- [ ] Record reviewer hours per mission and content throughput.

---

# 21. Program adaptation / next-RP engine

Prefer deterministic/versioned policy.

Inputs:

- [ ] validated evidence
- [ ] relevant support history
- [ ] strict lapse/revisit state
- [ ] recent scenario families
- [ ] program goal
- [ ] learner preferences
- [ ] mission readiness
- [ ] optional deadline ordering

Outputs:

- [ ] continue
- [ ] transfer
- [ ] recovery
- [ ] optional challenge
- [ ] final simulation

Rules:

- [ ] Independent success → offer same skill in a different family.
- [ ] Supported success → offer cold attempt in a different manageable family.
- [ ] Genuine cold failed opportunity → recovery candidate.
- [ ] No valid opportunity → no weakness inference.
- [ ] Repeated success → suggest harder variant; learner confirms.
- [ ] Same evidence + same policy version → same recommendation.
- [ ] Store reason codes, not model-generated reason prose.
- [ ] Render localized explanation from reason code.

---

# 22. Cold / Guided / Transfer / Recovery

These are properties of RP opportunities/attempts, not conventional lesson screens.

## Cold

- [ ] Useful production form not exposed within relevance window.
- [ ] Captions/accommodations remain available.
- [ ] No proactive coach answer.
- [ ] Learner can request help.

## Guided

- [ ] Minimum necessary help.
- [ ] Progressive ladder.
- [ ] Exact scope recorded.
- [ ] Guided success does not masquerade as cold success.

## Transfer

- [ ] Same CommunicativeSkill.
- [ ] Different scenario family/domain.
- [ ] Prefer cold start.
- [ ] Retry never counts.
- [ ] Pressure/regional variants never count as new context.

## Recovery

- [ ] Only from strict lapse.
- [ ] Different family when possible.
- [ ] Lower/manageable pressure.
- [ ] Cap consecutive recoveries.
- [ ] Offer off-ramp.
- [ ] Return to cold as soon as reasonable.

---

# 23. Final simulation

- [ ] Build one integrated reviewed final simulation.
- [ ] Support hidden by default but accommodations preserved.
- [ ] Help remains explicitly available.
- [ ] No official score/readiness/pass probability.
- [ ] Evidence rules remain identical.
- [ ] Program completion recap separates scene result from skill evidence.

---

# 24. Connected-world continuity

- [ ] Replace bare fact-key carry-forward with `CarryForwardFact`.
- [ ] Add sensitivity.
- [ ] Add source.
- [ ] Add mission allowlist.
- [ ] Add expiry/TTL.
- [ ] Use learner alias rather than real name by default.
- [ ] Learner sees "What this place remembers".
- [ ] Learner can edit/clear.
- [ ] Local-only by default.
- [ ] Higher-sensitivity facts never carry across scenes.

---

# 25. Privacy/data architecture for programs

- [ ] ConsentRecord included in data boundaries.
- [ ] Accommodation included.
- [ ] ProgramPreferences included.
- [ ] Deletion tombstones included.
- [ ] Pending jobs included.
- [ ] Policy versions included.
- [ ] Content provenance included.
- [ ] Retention rule defined for goal/profile inputs.
- [ ] Export includes learner-owned program/preferences/evidence data.
- [ ] Delete-all removes program/profile data and blocks late writes.
- [ ] Consent withdrawal immediately changes eligible features.
- [ ] Raw custom goal text discarded by default after extraction/preview.

---

# 26. Content and mission gates

A released mission must pass:

- [ ] valid stable ID + version
- [ ] target language + target locale review
- [ ] scenarioFamilyId
- [ ] typed finite scene facts
- [ ] predicate DSL validation
- [ ] model checker
- [ ] learner role
- [ ] character knowledge boundary
- [ ] at least one primary CommunicativeSkill
- [ ] at least one reachable opportunity
- [ ] positive + negative opportunity examples
- [ ] completion predicate
- [ ] complication policy
- [ ] support policy
- [ ] typed fallback
- [ ] captions/accessibility support
- [ ] regulated-domain checks
- [ ] character-behavior checks
- [ ] scripted dry-run
- [ ] localization completeness

---

# 27. Program gates

A program must pass:

- [ ] every mission pinned to released version
- [ ] every mission content-ready
- [ ] no dead-end plan entry
- [ ] at least one real transfer path
- [ ] adaptation uses reason codes
- [ ] target locale supported
- [ ] profile/goal data under consent scope
- [ ] final simulation where program promises one
- [ ] no generated unreviewed mission content
- [ ] exam provenance fresh where exam path is used

---

# 28. Required regression tests

## Identity

- [ ] same-family Café A → Café B adds no context.
- [ ] pressure variant adds no context.
- [ ] retry adds no context.

## Evidence

- [ ] scene achieved without skill demonstration.
- [ ] scene failed without skill lapse.
- [ ] wrong passage revision rejected.
- [ ] assistant quote rejected.
- [ ] one communicative act cannot be credited to overlapping parent + child skills.
- [ ] rehearsal cannot create independent evidence.

## Support

- [ ] hint about one phrase affects one target only.
- [ ] meaning of character turn does not downgrade production.
- [ ] accessibility captions do not downgrade unrelated production.
- [ ] support shown after checkpoint still applies after retry.

## Runtime

- [ ] forged facts ignored.
- [ ] duplicate client + sideband action → one transition.
- [ ] stale revision rejected.
- [ ] consequential action result returns before character confirms.
- [ ] event-log replay reconstructs revision.

## Scene verification

- [ ] unreachable completion fails build.
- [ ] deadlock fails build.
- [ ] unsatisfiable opportunity fails build.
- [ ] unsafe complication path fails build.

## Lapse/recovery

- [ ] silence → no lapse.
- [ ] disconnect → no lapse.
- [ ] ASR failure → no lapse.
- [ ] real failed cold opportunity can create revisit/recovery.
- [ ] recovery cap/off-ramp works.

## Privacy/security

- [ ] consent enforced server-side.
- [ ] deletion tombstone blocks late assessment.
- [ ] goal prompt injection cannot change skill/predicate/system contracts.

## Program

- [ ] same evidence + same policy version → same next-RP decision.
- [ ] policy bump rebuilds reproducibly.
- [ ] unreviewed mission cannot enter active program.

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
- [ ] Canonical skill hierarchy/catalog.
- [x] taskOutcome vs demonstration.
- [x] OpportunityInstance.
- [ ] scoped support relevance matrix.
- [ ] accommodations.
- [ ] support high-water mark.
- [ ] strict lapse/revisit semantics. (strict lapse eligibility complete; revisit policy remains)
- [ ] consent/privacy/security G0 confirmations.

## P1 — scene/mission runtime hardening

- [ ] server-authoritative shared reducer boundary.
- [ ] versioned action request.
- [ ] append-only scene event log.
- [ ] typed finite facts.
- [ ] predicate/effect DSL.
- [ ] model checker.
- [ ] deterministic Director.
- [ ] blocking consequential actions.
- [ ] provider capability negotiation.

## P2 — evidence loop V1

- [ ] demonstration validator. (positive demonstration contract landed; authored opportunity requirement for all positive evidence remains)
- [ ] opportunity-linked evidence. (contracts/persistence landed; runtime generation/linkage remains)
- [ ] reason codes.
- [ ] revisit + last independent use.
- [ ] learner dispute flow.
- [ ] calibration fixtures.

## P3 — curated programs

- [ ] choose launch language/locale.
- [ ] choose first two programs.
- [ ] author/review mission set.
- [ ] ProgramProjection + ProgramPreferences.
- [ ] deterministic next-RP engine.
- [ ] Program UI.

## P4 — pedagogy loop

- [ ] Cold.
- [ ] Guided.
- [ ] Transfer.
- [ ] Recovery.
- [ ] Retry distinction.
- [ ] recovery caps/off-ramps.

## P5 — template programs

- [ ] slot-based goal input.
- [ ] reviewed program templates.
- [ ] preview.
- [ ] free-text extraction/screening/discard.
- [ ] template → reviewed mission sequencing.

## P6 — final simulation

- [ ] one integrated reviewed final simulation.
- [ ] minimal-support mode.
- [ ] program completion recap.

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

- [ ] character never defined world truth.
- [ ] model never directly persisted learning evidence.
- [ ] support was target-scoped and window-limited.
- [ ] accommodations were not penalized.
- [x] provider/session failures created no lapse.
- [ ] same-family variants did not fake transfer.
- [ ] retry never masqueraded as transfer.
- [ ] scene completion is reachable and deadlock-free.
- [ ] program decisions are reproducible under the same policy version.

---

# 31. Immediate known code deltas

Confirmed from current `main` during this TODO update:

- [x] `src/features/learning/skillProjection.ts` derives independent contexts from required domain + scenario family, not `sessionId`.
- [x] Scene `taskOutcome` is independent from `SkillObservation.demonstration`; a failed scene alone cannot create a lapse.
- [x] `OpportunityInstance` is persisted and strict lapse derivation requires a validated, taken, failed opportunity tied to a learner passage.
- [x] Authored `SkillOpportunityDefinition` and deterministic runtime opportunity generation are wired through live assessment. (`scene.ts`, `opportunityRuntime.ts`, `LiveSessionView.tsx`, `server/index.ts`)
- [ ] Coach support in `LiveSessionView` still needs exact skill/opportunity/phrase targeting rather than mission-wide phrase targeting.
- [ ] Current scene reducer still uses broad `Record<string, unknown>` facts/mutations; finite fact schemas and model checking remain open.
- [x] Hosted roleplay routes already document server ownership of scene truth.
- [x] Client scene mirror already exists.
- [x] Current reducer already rejects stale revisions and supports action-id idempotency.
- [ ] Action request still needs mission/scene versions and cross-channel dedupe metadata.
- [ ] Append-only scene event replay remains open.
- [ ] Deterministic Director remains open.
- [ ] First-class RoleplayProgram runtime remains open.

---

# 32. Maintenance rule

When completing an item:

1. change `[ ]` to `[x]`;
2. add the smallest useful implementation/test reference;
3. do not mark physical-device or review-dependent work complete from browser CI;
4. do not mark semantic pedagogy claims complete because an LLM prompt mentions them;
5. keep this checklist executable and evidence-based.
