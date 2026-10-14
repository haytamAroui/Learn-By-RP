# Taalbad Werk × Learn-By-RP — Direct Integration Plan

**Status:** active implementation plan, first draft vertical slice  
**Product:** Taalbad / Nederlands op het werk  
**Codebase:** Learn-By-RP (shared runtime, not a second role-play engine)  
**Date:** 2026-10-14

## Architecture decision

Keep the **current Learn-By-RP** Expo application, scene runtime, evidence validator,
program engine, retry/recovery, and support ledger. Extend the engine with a
reviewed `nl-BE` workplace curriculum. Do not copy the entire application into a
new codebase, and do not rename the shared runtime to Taalbad.

Learn-By-RP remains a reusable technology/codebase. Taalbad Werk is a focused
learner-facing professional-Dutch route; branding and product distribution can be
decided separately. Taalbad's general Standard Dutch and Vlaams/tussentaal content
must not be collapsed into occupational scenarios.

### Separation of responsibilities

| Layer | Authority | Changes |
| --- | --- | --- |
| Programme/goal resolver | Curated programmes and release gates | Add work domain and one draft pilot |
| Scene runtime | Deterministic facts, actions, retries | Reuse existing reducer/model checker |
| Dialogue actor / voice | Character realism, capture, playback | Retain provider abstraction; test Dutch on devices |
| Learning evidence | Validated learner passages and authored opportunities | Reuse existing validator; add specific workplace skill |
| Learner interface | Short practical speaking missions | Adapt Taalbad presentation after first pilot works |
| Commercial backend | Real authentication, quotas, billing | Not in this PR; required before paid release |
| Employers | Optional organisation subscription later | No employee ratings, safety scores or raw transcripts by default |

## Product vision

**Taalbad — Nederlands dat werkt.** Prepare for real conversations in Belgian
workplaces: understand an instruction, describe a problem, ask for clarification,
confirm a next step, and try the same skill in a new setting.

- **Target learner first:** individual worker or jobseeker.
- **Primary target locale:** Belgian Standard Dutch (`nl-BE`).
- **Learning mode:** task-based, speaking-first, 3–5-minute practice opportunities
  (not a fixed duration limit on dialogue, retries or reviews).
- **Evidence:** what the learner demonstrated in the simulation with or without
  support, not generic AI grades, job readiness or a CEFR certificate.
- **Business:** validate individual paid routes first; employer/team seats later.
- **B2B funding:** never promise automatic Cevora/LOGOS reimbursement or generate
  supposedly audit-ready engagement logs without documented eligibility.

## First vertical slice (included in this branch)

**Pilot:** `program.nl-be.work.logistics.pilot` — one draft scene:
`mission-nl-be-work-damaged-delivery`.

The learner reports three damaged boxes, requests the next instruction from a
team leader, and confirms that next step in their own words. The scene has
authoritative facts, allowlisted action transitions, three authored skill
opportunities, a separate scenario family, a dedicated reporting skill, and
honest task-outcome semantics. A completed scene is **not** proof of technical,
employment or safety competence.

The programme and scene remain **draft**; onboarding may preview the work goal,
but the programme cannot become executable until the existing release gates
pass. Native Belgian Dutch review is required.

## How to extend content safely

1. Start from *workplace tasks*, not vocabulary lists, grammar chapters, or
   business sector names alone.
2. Author a finite SceneDefinition: context, information gap, facts, character
   knowledge boundaries, valid actions, completion predicates, checkpoints.
3. Bind explicit SkillOpportunityDefinition records to what the learner can
   genuinely demonstrate. Do not credit an unpresented opportunity.
4. Protect support provenance: translation, hint, example, retry and replay
   influence evidence. Assisted completion does not become independent success.
5. Keep task outcome separate from speaking skill. A simulated success never
   establishes workplace readiness, language certification, or safety compliance.
6. Add independent transfer situations. Repeating a cosmetic variation of one
   scenario family does not count as transfer.
7. Have a native Belgian Dutch reviewer check dialogue authenticity, register,
   audio accuracy and differences between Standard Belgian Dutch and informal
   speech before moving scene/program review statuses to released.

## Four strategic pillars

1. **TBLT:** one meaningful operational communication task per mission,
   followed by feedback, retry and transfer.
2. **Mobile microlearning:** short audio-first scenarios, pausable and resumable;
   text alternatives for accessibility and noisy environments.
3. **Speech-first interaction:** use speech recognition and validated transcripts
   to support communication practice; abstain on uncertain recognition. Do not
   claim validated intelligibility or pronunciation scoring.
4. **Learner-first commercial launch:** no employer dashboard in V1. Optional
   team licences later with privacy-limited reporting and verified subsidy rules.

## Follow-on engineering gates (not implemented by this branch)

### Gate A — Real workplace pilot quality
- Review the single scene and scripts with a Belgian Dutch professional.
- Test static validation, scene model checker, learner support/provenance, and
  both typed and spoken practice on real iOS/Android devices.
- Add a second distinct workplace family before making transfer claims.
- Build mobile-ready listening/comprehension prompts if real practice requires
  understanding instructions before speech.

### Gate B — Paid individual MVP
- Verify authentication; the existing server must not treat unverified Bearer
  headers or self-declared guest IDs as paid identities.
- Add persistent quotas and provider-cost budgets, idempotent usage accounting,
  payments and entitlements.
- Add privacy retention/export/deletion and per-session consent controls.
- Explicitly test network outages, interruption recovery and speech fallback.

### Gate C — Employer module (conditional on buyer demand)
- Tenant isolation, seats, invite/assignment features, limited aggregation.
- Learner controls for whether progress is shared; prohibit using simulator
  results as performance evaluation by default.
- Sector-fund reporting only where requirements and eligibility are verified.

## Acceptance criteria for this PR

- Existing daily-life programmes remain unchanged.
- An `nl-BE` work goal returns the new authored pilot candidate.
- Work candidate remains non-executable while programme/scene are draft.
- One bounded scene is registered with a canonical scenario family and skills.
- Scene validator and model checker have coverage in `workplacePilot.test.ts`.
- No automatic billing, official funding claims, pronunciation scores, or
  employer surveillance are introduced.

**Next engineering slice:** native content review and first end-to-end
voice interaction in the existing app. Avoid a second platform.
