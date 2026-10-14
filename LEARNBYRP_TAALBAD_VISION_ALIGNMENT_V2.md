# Learn-By-RP × Taalbad Werk — Vision Alignment V2

**Status:** implementation-in-progress, branch `feature/learning-vision-alignment-v2`  
**Date:** 2026-10-14  
**Base:** `feature/taalbad-werk-foundation-v1` (PR #29); do not merge this PR independently before its base  
**Authorities:** `LEARNBYRP_SPEAKING_FIRST_LIVING_CURRICULUM_ARCHITECTURE_V1.md`, `TAALBAD_WERK_LEARNBYRP_INTEGRATION_V1.md`

## Executive decision

**Adapt Learn-By-RP directly as the shared role-play learning engine**. Do not create a competing dialogue engine for Taalbad, and do not turn Learn-By-RP into an LMS or employer platform.

- **Learn-By-RP:** general-purpose role-play, deterministic scene runtime, transparent evidence, support/rescue, transfer, progression, provider infrastructure.
- **Taalbad Werk:** learner-facing, paid Belgian workplace-Dutch product using the engine and curated work contexts.
- **Taalbad Standard Dutch:** progressive language learning; A1–C1 is meaningful for reviewed language tasks, not an automatic learner label.
- **Vlaams & tussentaal:** separate unlevelled route for real-life regional speech and sociolinguistic competence; NEVER label tussentaal itself as CEFR A1/B1/etc.
- **No employer surveillance:** team sponsorship is a possible later commerce/entitlements feature, not an employee-rating engine.

## Invariants (MUST)

1. Enter a meaningful role-play task early, without mandatory vocabulary or grammar lessons.
2. A mission has a real need, friction, bounded world, actual consequences, rescue, authored opportunities, a reliable exit, and a transfer bridge.
3. The AI may propose an utterance or semantic interpretation but cannot create facts, author opportunities, certify success, or grant skill evidence.
4. Scene/task success, speaking duration, transcript content, learner CEFR and real-world workplace/safety competence are separate concepts.
5. Assistance is tracked; supported success cannot masquerade as independent performance. Typing is not automatically evidence of spoken production.
6. A retry or cosmetic difficulty variant is **not** transfer to another scenario family.
7. **Opportunities own level bands and assessed channels**. B2/C1 content is not releasable on the existing unbanded projection. No automatic downward backfill from C1.
8. Incorrect or uncertain STT is not a learner lapse. ASR uncertainty should lead to clarification/abstention.
9. Time-to-first-meaningful-speech, genuine learner attempts and learner-controlled help matter more than passive screen completion.
10. Paid accounts and model access require real server-verified identities, entitlements, durable quotas, privacy and billing boundaries.

## Implementation in this branch

### A. Goal-first occupational routing — IMPLEMENTED AS CODE

- `src/content/workplaceContexts.ts`: curated contexts that are actually backed by an authored programme, starting with `logistics-warehouse`. No pretend catalogue of courses.
- `src/contracts/program.ts`: optional reviewed `goalBinding` contract.
- `src/data/programs.ts`: the draft Taalbad Werk logistics programme declares a work/context binding; its missions must match.
- `src/features/program/goalResolver.ts`: resolve work only for an *explicit* valid `contextId`; never silently route an unknown profession into logistics.
- `src/app/onboarding/index.tsx`: a compact work-context choice; persist the learner-owned work goal locally; use workplace-relevant starting-point wording, without assigning a proficiency label.
- Other languages and existing daily-life/travel routes remain separate.

### B. Task-based Mission DNA — IMPLEMENTED AS CODE

- `MissionDefinition.taskContract` is a reviewed authoring shape: `learnerRole`, `communicationNeed`, `friction`, `consequence`, `rescue`, `realWorldBridge`.
- `src/features/program/workplaceMissionContract.ts` checks that occupational tasks belong to an available context and have all required human-authored fields.
- The damaged-delivery pilot includes its Mission DNA; release/catalogue validation rejects missing or mismatched contracts.
- `scripts/validate-scenes.mts` checks draft workplace-scene structural reachability without changing its `reviewStatus`.

### C. Task-first UX — IMPLEMENTED AS CODE

- `src/components/ProgramScreen.tsx` gives a workplace learner one next conversation, a concrete situation, goal and (once released) Start action.
- The existing general-language programme route UI remains unchanged.
- The draft preview is explicitly non-executable.

### D. Advanced level correctness — SAFETY GATE IMPLEMENTED

- `MissionDefinition.levelRange` accepts A1 through C1 as **authored mission metadata**.
- `validateMissionForProgramRelease` blocks B2/C1 until the separate opportunity-banded projection exists.
- This is **not** implementation of B2/C1 progress evaluation or learner proficiency classification.

## Remaining architectural changes — NOT IMPLEMENTED BY THIS BRANCH

### P0. Stabilise baseline before merging

- Re-run Node/TypeScript typecheck, scene validation, all unit tests, web export and mobile smoke tests.
- Resolve GitHub Actions runner issues if jobs terminate with zero executed steps. A CI-infrastructure failure is NOT proof of code failure or success.
- Add on-device iOS/Android smoke tests for microphone permission, native STT, TTS voice selection, interruptions, retry, offline availability and accessibility.
- Review the new occupational phrases with a native Belgian Dutch reviewer. Keep scene/program in `draft` meanwhile.

### P1. Finish real speaking activation (engine + Taalbad UX)

- Implement time-to-first-meaningful-speech instrumentation and accessible Observe/Guided/Warm-up entry based on entry support, not a fake CEFR placement.
- Make one Rescue affordance prominent in live role-play; progressively reveal intention, partial phrase, full phrase, slower/repeated audio.
- Track these supports before evidence assessment. Preserve accommodation ≠ assistance.
- Ensure role-play is the primary screen; vocabulary, grammar, and explanations are optional side surfaces.
- Acceptance: user can start a reviewed mission, produce an unscripted turn, request help, recover from ASR/network failure, and understand why the turn counted or was uncertain.

### P2. Opportunity-banded evidence (major core migration)

Required design:
```text
(skillId, assessedChannel, evidenceBand, scenarioFamilyId)
assessedChannel = production | comprehension
deliveryModality = spoken | typed
evidenceBand = A1 | A2 | B1 | B2 | C1
```

- Extend `SkillOpportunityDefinition` with a **reviewed** band and assessed channel.
- Propagate immutable opportunity metadata into `OpportunityInstance`, then into validator-issued `SkillObservation`. Never trust AI-proposed band/channel.
- Update SQLite and IndexedDB schema/migrations, archive export/import, parity fixtures, evidence explanations and projections.
- Extend `projectSkill` / `nextRp` to separate per-skill frontiers by band/channel. No downward CEFR backfill and no automatic general proficiency label.
- Version the learning policy and preserve migration semantics; legacy/unbanded evidence stays unbanded and cannot be silently promoted.
- Add tests for wrong-band proposals, stored provenance, retry, unknown transcript, legacy migrations, and cross-family independent transfer.
- Only then lift the B2/C1 release gate.

### P3. Reviewed work-content coverage

- Do not build 20 superficial professions. Complete the first **real** vertical.
- For logistics, add different communicative task families (e.g. damaged delivery, missing item, delayed loading, unclear supervisor instruction). Do not count cosmetic variants as transfer.
- Review genuine Belgian Dutch register and native `nl-BE` voices.
- Provide meaningful listening comprehension opportunities separately from spoken-production evidence.
- Define `OpportunityDefinition` quality gates: positive/negative examples, authentic information gap, consequences and relevant repair affordances.
- Include work-specific communication and safety-context language **without certifying safety procedure mastery**.

### P4. Paid app boundaries

- Replace self-declared guest IDs and unverified Bearer token hashing as authorization with server-verified identity.
- Persistent tenant-safe quota/metering, subscription and entitlement enforcement before expensive model calls.
- Keep local learning history separate from server usage/billing events.
- Consent, retention, export/deletion, user-disputed observations and audio privacy must be implemented and tested.
- B2C paid missions before any employer dashboard; sector-fund reimbursement is **conditional**, never guaranteed.

### P5. Optional employer sponsorship (after paying-customer evidence)

- Employer buys seats and assigns content, not access to workers' raw utterances or automatic employability/safety labels.
- No employer-facing pronunciation rankings, competence predictions, raw voice, or unsupported regulatory attestations.
- If an employer dashboard is needed, use proportionate engagement/assignments with transparent worker controls and verified legal basis.
- Confirm Cevora/LOGOS eligibility for the *specific product and activity* before describing it as reimbursable.

## File ownership boundaries

| Concern | Existing home | Action |
|---|---|---|
| Deterministic scene and AI boundary | `src/features/roleplay/` | Reuse/harden |
| Authored missions/contexts | `src/data/` and `src/content/` | Extend by sector |
| Goal + next-RP policy | `src/features/program/` | Keep deterministic |
| Opaque validated evidence | `src/features/learning/` | Preserve; P2 add bands |
| Mobile speaking | `src/providers/voice/`, `src/components/LiveSessionView.tsx` | P1 device tests/refactor |
| Local archive | `src/features/archive/` | P2 migration; parity tests |
| Paid usage API | `server/` | P4 verify accounts, quotas, entitlement |
| Learner application UX | `src/app/`, `src/components/` | Product-specific but shared shell |
| Employer offering | New later module | Never core engine |

## Merge order / definition of done

1. Merge parent **PR #29** only after its CI and content review are acceptable.
2. Review this branch against PR #29 as a **stacked draft PR**. Do not accidentally merge it into `main` ahead of the parent.
3. For THIS branch, require typecheck + existing test suite + scene validator + web build + mobile smoke, plus unit checks for unknown occupation, forged goal binding, missing mission DNA, draft release and premature B2/C1 release.
4. After review, merge this branch and begin P1/P2 as dedicated PRs, not as one untestable all-or-nothing rewrite.
5. Full vision alignment means **P0–P4 complete**. This branch is a meaningful foundation, **not** that claim.

## Sources in repository

- [Living Curriculum Architecture](./LEARNBYRP_SPEAKING_FIRST_LIVING_CURRICULUM_ARCHITECTURE_V1.md)
- [Taalbad Werk Integration V1](./TAALBAD_WERK_LEARNBYRP_INTEGRATION_V1.md)
- [Learning Evidence Validator](./src/features/learning/skillEvidence.ts)
- [Program Release Gates](./src/features/program/releaseGates.ts)
- [Scene Contract](./src/contracts/scene.ts)
- [Native Voice Transport](./src/providers/voice/nativeVoiceTransport.ts)
