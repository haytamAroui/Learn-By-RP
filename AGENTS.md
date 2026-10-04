# LearnByRP implementation guidance

## Product direction

Follow `docs/LEARNBYRP_COMPLETE_LEARNING_CONTENT_UX_ARCHITECTURE_V2.md` as the
user-selected product and learning blueprint. Use
`docs/ARCHITECTURE_V2_IMPLEMENTATION.md` for its reconciliation with this checkout,
delivery sequence, completed changes, and outstanding acceptance gates.

Keep the existing shared contracts and learning/runtime modules as the execution
boundary. Extend them deliberately; do not add a parallel learning engine or treat
a blueprint example as already-reviewed executable content.

Initial delivery serves independent adult learners practising Belgian Dutch for
everyday life, with a small complete Pre-A1/A1 through B1 path. Existing locales may
remain available. Do not label existing content as reviewed at a new band without
authored opportunities and appropriate review.

## Invariants

- Scene outcome, communicative evidence, and linguistic observations are separate.
- Models propose. Validators own evidence writes; scene reducers own world changes.
- Targets, session/attempt identity, modality, provenance, and support come from
  authored content and runtime records, never model claims.
- Abstain on uncertain, unusable, partial, or unscoped evidence.
- Help and answer exposure cannot manufacture independent recall. Accessibility
  effects depend on the assessed channel and opportunity conditions.
- Same-family retry does not establish transfer; placement and scene completion do
  not establish mastery. Higher bands do not backfill lower bands.
- Evidence needs authored band/channel/family provenance. Until those fields are
  implemented and reviewed, do not infer them from mission display levels.
- Preserve prior attempts and durable learner turns through cancellation/recovery.
- Enforce consent and ownership at actual I/O and persistence boundaries.
- Keep Talk / Missions / Progress and the current design tokens. Make small-phone
  input, rescue, captions, and stopping controls usable before adding visual scope.

## Delivery and verification

Follow the blueprint's phases: reconciliation, truth/content, speaking UX, complete
learning loop, linguistic development, living program, calibration, expansion.
Finish the truth/reliability gates before declaring later phases release-ready.

Test changed public behavior, including negative evidence cases. Source-string
assertions and seeded recap screenshots are insufficient evidence for a working
live session. Run `npm run typecheck` and `npm test` for core changes;
`npm run validate:scenes` for content/contract changes. Use web export/E2E checks for
rendered route changes. Report native/provider verification separately.

`docs/audit-2026-10-03/DEEP_AUDIT.md` is a historical audit of the pre-repair
checkout. Track fixes in the implementation map rather than rewriting its original
findings or saved reproduction output.
