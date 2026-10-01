# LearnByRP / Mission Coach — Remaining Implementation Plan with Mural Improvements

**Version:** 1.0  
**Date:** 2026-10-01  
**Status:** Implementation plan for the current codebase  
**Product:** LearnByRP / Mission Coach  
**Baseline:** 380 passing · 36 passing visual · iOS and Android bundles clean  
**Scope:** Finish the current remaining tasks without rewriting the completed skill-evidence architecture, while adopting the best product/runtime ideas identified from the full Mural codebase audit.

---

# 0. Purpose

This document is the implementation plan for the version of LearnByRP that is now being kept.

The completed evidence architecture remains authoritative.

The goal is **not** to re-platform the app, restart the repository, replace the skill engine, or copy Mural.

The goal is:

> Keep LearnByRP's stronger mission + communicative-skill + evidence architecture, while adopting the parts of Mural that materially improve conversation quality, reliability, accessibility, recovery, contextual learning support, and production readiness.

The target product should combine:

```text
LEARNBYRP

Mission
→ real communication goal
→ explicit communicative skills
→ live interaction
→ support ledger
→ deterministic scene/task result
→ validated phrase evidence
→ validated skill evidence
→ lapse signal
→ cross-context transfer
→ explainable progress
→ recommendation
```

with selected Mural strengths:

```text
MURAL-INSPIRED RUNTIME QUALITY

reliable voice lifecycle
contextual meaning
word/phrase lookup
connection recovery
inactivity handling
typed fallback
audio-route handling
stale-result protection
final-turn assessment
archive validation
language isolation
large-text behavior
reduced motion
error classification
source-backed current topics
```

---

# 1. Implementation authority

For the current codebase, use the following precedence.

```text
1. Master Product Architecture
   - product invariants
   - scene/runtime boundaries
   - privacy
   - evidence truth
   - support semantics
   - resumability

2. Skill/Menu Engine
   - skill taxonomy
   - mission membership
   - domains
   - roles
   - exam hierarchy

3. Skill-evidence runtime currently implemented in code
   - SkillObservation
   - SkillLapse
   - validator
   - persistence
   - policy
   - projection
   - runtime provenance

4. UI/UX Design System v2
   - after the v1 4,299-line document is patched/replaced

5. Older UI audits, teardown documents, and Mural analysis
   - research inputs only
```

If a lower-level document conflicts with a higher-level rule, the higher-level rule wins.

---

# 2. Current baseline — completed and protected

The following work is complete and should not be redesigned during the remaining tasks.

## 2.1 Skill evidence architecture

Completed:

- [x] `SkillObservation`
- [x] `EvidenceSource`
- [x] stable `CommunicativeSkillId`
- [x] required `MissionDefinition.primarySkillIds`
- [x] required `MissionDefinition.secondarySkillIds`
- [x] curated skill membership for all 22 missions
- [x] mission skill membership is authored, not substring-derived
- [x] phrase matching demoted to `legacy_inferred`
- [x] legacy-inferred evidence cannot establish `Steady`
- [x] phrase and skill promotion policies separated

## 2.2 Skill-evidence validator

Completed:

- [x] unknown skill rejected
- [x] skill not in mission rejected
- [x] missing passage rejected
- [x] non-learner passage rejected
- [x] revision mismatch rejected
- [x] quote absent from passage rejected
- [x] invalid support reference handled
- [x] support contradiction downgrades independent → assisted
- [x] rehearsal cannot become independent evidence
- [x] incompatible task outcome rejected

Stable check codes remain part of the evidence contract.

Do not replace these checks with a single generic validation error.

## 2.3 Runtime provenance

Completed:

- [x] runtime owns `sessionId`
- [x] runtime owns `attemptId`
- [x] proposal cannot relabel its own context
- [x] support is derived from the real support ledger
- [x] relevant support is based on attempt and timestamp
- [x] support displayed after a learner passage does not retroactively assist it
- [x] model does not decide whether support existed

This is a core invariant.

## 2.4 Skill lapse architecture

Completed:

- [x] `SkillLapse` is separate from `SkillObservation`
- [x] lapse can never promote a skill
- [x] lapse can never lower historical status
- [x] lapse can only set `reviewDue`
- [x] lapses are never model-nominated
- [x] `deriveLapses` operates from runtime facts
- [x] lapse requires:
  - task outcome `not_achieved`
  - learner actually produced speech
  - no support shown in the relevant session/attempt
  - not a rehearsal
- [x] failed attempts can create a lapse even when the model proposes no skill evidence

This design remains.

## 2.5 Persistence

Completed:

- [x] skill observations are durable
- [x] skill lapses are durable
- [x] transcript + observations + lapses commit in one transaction
- [x] replay is idempotent
- [x] uniqueness prevents duplicate skill context manufacture
- [x] provenance is stored
- [x] recap cannot show evidence not held by the archive

## 2.6 Server boundary

Completed:

- [x] server returns `skillItems`
- [x] phrase `items` and skill `skillItems` are separate
- [x] server prompt receives mission-scoped allowed skill IDs
- [x] allowed skill IDs live in domain logic, not HTTP
- [x] model-offered skill set and validator-allowed skill set are tested for equality across all 22 missions
- [x] prompt is not treated as a security/evidence boundary

## 2.7 Current verification baseline

Current baseline:

```text
TypeScript: clean
Unit tests:  380 passing (15 files)
Visual:      36 passing (6 screens x 3 widths x 2 themes)
iOS bundle:  clean
Android:     clean
```

The deterministic no-provider fallback correctly returns:

```text
taskOutcome = unknown
items       = []
skillItems  = []
```

It does not invent capability evidence from phrase matching.

---

# 3. Non-goals for this phase

Do not:

- migrate to Tamagui
- rewrite Expo/React Native architecture
- split iOS and Android into SwiftUI + Compose
- replace the skill taxonomy
- replace `SkillObservation`
- replace `SkillLapse`
- restore phrase-substring inference as authoritative
- introduce a single opaque learner proficiency score
- add a fourth primary bottom tab
- expand to hundreds of missions before runtime quality is stable
- add billing/minutes infrastructure just because Mural has it
- copy Mural's companion/friend positioning
- copy Mural's orb as the product identity
- copy Talk / Themes / Words navigation
- copy Mural's free-text `capability` identity model
- copy Mural's 0–5 learner level as the durable learner state

---

# 4. Current open work — canonical order

The remaining current work is:

```text
R0  Patch UI/UX Design System v2                          DONE
R1  Remove all essential sub-12px text                    DONE
R2  Navigation: remove Vocabulary + add Settings access   DONE
R3  Voice lifecycle: reconnecting/error + recovery UI     REMAINING
R4  Reduced-motion foundation                             DONE
R5  IndexedDB web repository                              DONE
R6  Progress IA: ReadyToPractise above tabs               DONE
```

Only `R3` remains. Its twelve acceptance criteria are listed in §12.

Web export is no longer broken, so the sequencing note that gated `R5` before
Progress work no longer applies.

Mural-inspired improvements are embedded into these tasks where relevant.

---

# 5. R0 — Patch the 4,299-line UI/UX specification into v2

## Status

```text
CURRENT:
v1 exists but contains known-invalid values and architecture.

TARGET:
v2 becomes the canonical UI implementation authority.
```

This task is non-optional.

A future developer must not be able to copy known-wrong values from v1.

## 5.1 Required front matter

The new document must start with something equivalent to:

```text
STATUS: IMPLEMENTATION AUTHORITY

SUPERSEDES:
MISSION_COACH_COMPLETE_UI_UX_DESIGN_SYSTEM_2026_v1.md

PRECEDENCE:
1. Master Product Architecture
2. Skill/Menu Engine
3. Current skill-evidence runtime
4. This UI/UX Design System
5. Older audits and teardown documents are research inputs only

CURRENT IMPLEMENTATION NOTE:
Design tokens currently live in src/design/.
packages/design/ is a future workspace extraction target,
not a prerequisite for the current implementation.
```

## 5.2 Framework correction

Remove Tamagui as the required implementation layer.

Canonical stack:

```text
Expo SDK 57
React Native 0.86
React 19.2.x
Expo Router
NativeWind 4.x
Tailwind CSS 3.x
Reanimated
Lucide
semantic Mission Coach components
```

Rule:

> NativeWind is an implementation detail underneath semantic Mission Coach components.

Correct:

```tsx
<MissionCard />
<EvidenceCard />
<VoiceActivity />
<SupportSheet />
<AdaptiveNav />
```

Avoid raw screen-specific arbitrary styling.

## 5.3 Token authority correction

Canonical source:

```text
src/design/tokens.ts
```

until the repository intentionally becomes a workspace/monorepo.

Generated styling artifacts are not authoritative.

Required dependency flow:

```text
src/design/tokens.ts
        ↓
Tailwind / NativeWind config
        ↓
generated variables/styles
        ↓
UI
```

No manually maintained duplicate palette.

## 5.4 Palette correction

The v2 spec must use the already-tested v2 palette from `src/design/tokens.ts`.

Remove obsolete references to old brand/border values and duplicate dark raised values.

The exact values in `src/design/tokens.ts` win.

## 5.5 Semantic contrast rules

The v2 spec must state:

```text
normal text:
WCAG AA contrast

informational metadata:
must remain readable
must not use a decorative faint token

interactive boundaries:
must meet the intended control-boundary contrast rule

semantic selected states:
must be tested as actual foreground/background combinations
```

Delete any rule that allows dates, durations, evidence source, or state text to use a decorative/faint-only token.

## 5.6 Elevation correction

Canonical hierarchy:

```text
Static grouping card
→ surface
→ visible grouping boundary
→ minimal elevation

Interactive card
→ visible interactive boundary
→ hover/press state

Selected card
→ semantic soft background
→ semantic border
→ selected icon/text state

Focus
→ explicit focus ring
```

Do not depend on barely distinguishable tonal surfaces.

## 5.7 Accessibility API correction

Because LearnByRP remains on React Native / NativeWind, use React Native accessibility APIs where appropriate.

Examples:

```tsx
accessibilityLabel
accessibilityRole
accessibilityState
accessibilityHint
```

Do not leave Tamagui-specific accessibility migration instructions as if they govern this codebase.

## 5.8 Skill-state correction

Phrase policy and skill policy must be distinct.

Skill policy:

```text
Growing:
≥2 contexts
≥2 days

Steady:
≥4 contexts
≥3 days
plus validated-evidence requirements
```

A lapse:

```text
never lowers historical status
may set reviewDue
```

## 5.9 Evidence-source correction

Explicitly document:

```text
validated_explicit
legacy_inferred
```

Rules:

```text
new live runtime:
validated_explicit only

legacy inference:
migration/backfill only

legacy_inferred alone:
cannot establish Steady
```

## 5.10 SkillLapse section

Add a first-class section.

```text
SkillObservation = evidence of demonstrated capability
SkillLapse       = durable review signal
```

Lapses are:

- never model-nominated
- derived from authoritative runtime facts
- non-promotional
- non-demotional
- capable of setting `reviewDue`

## 5.11 Persistence correction

Canonical abstraction:

```text
ArchiveRepository
├── native → SQLite
└── web    → IndexedDB
```

Screens may not depend directly on either storage technology.

## 5.12 Compact Settings path

Document:

```text
Bottom navigation:
Talk
Missions
Progress
```

Settings is not a fourth tab.

Compact root pages expose a consistent header action.

## 5.13 RTL section

Add explicit RTL support rules.

Use semantic start/end layout. Directional navigation icons mirror under RTL. Conversation text must support per-language writing direction, text alignment, and font fallback.

## 5.14 ContinueCard section

Specify `ContinueCard`.

Render only when resumable state exists.

Required information:

```text
mission
saved progress
goal
last activity
continue action
```

Do not show invented completion percentages.

## 5.15 QA matrix correction

Mandatory PR visual regression:

```text
6 critical screens
×
3 widths
×
2 themes
=
36 snapshots
```

Critical screens:

```text
Talk
Missions
Mission briefing
Live session
Recap
Progress
```

Widths:

```text
390
840
1440
```

Extended release coverage may add large type, French, Dutch, RTL, offline/error states, more widths, and native-device screenshots.

## 5.16 Mural-inspired additions to v2

The v2 UI spec should additionally define states for:

```text
reconnecting
connection lost
meaning loading
meaning failed
meaning non-retryable
typed reply failed but draft retained
inactivity check-in
ending countdown
final analysis pending
```

## R0 acceptance criteria

- [ ] v2 has implementation-authority status
- [ ] v2 supersedes v1
- [ ] precedence is explicit
- [ ] v2 uses NativeWind, not Tamagui
- [ ] exact code token values match `src/design/tokens.ts`
- [ ] only one dark palette
- [ ] no known invalid contrast examples remain
- [ ] phrase and skill policies differ
- [ ] `SkillLapse` documented
- [ ] IndexedDB web documented
- [ ] compact Settings path documented
- [ ] RTL documented
- [ ] ContinueCard documented
- [ ] QA tier reduced to realistic mandatory coverage
- [ ] Mural-inspired runtime states included

---

# 6. R1 — Remove 53 sub-12px text sites

## Goal

No essential product information should depend on 9px, 10px, or 11px text.

Current known debt:

```text
53 sites
```

## 6.1 Text floor

Canonical floor:

```text
12px:
very low-priority caption only

13–14px:
normal metadata

15–17px:
body / UI text

24px+:
primary live caption where appropriate
```

## 6.2 Upgrade first

Prioritize:

```text
evidence status
dates
mission duration
support state
skill state
error text
voice state
navigation labels
button text
exam notices
privacy/consent
```

## 6.3 Semantic typography

Prefer semantic roles/components over arbitrary numeric classes.

Example:

```tsx
<AppText variant="metadata" />
```

## 6.4 Mural improvement

Adopt Mural's large-text rule:

> Wrap and scroll rather than shrink the user's chosen text size.

Especially for onboarding, live caption, meaning, support sheet, settings, and typed reply.

## R1 acceptance criteria

- [ ] zero essential 9px text
- [ ] zero essential 10px text
- [ ] zero essential 11px text
- [ ] remaining 12px text explicitly justified
- [ ] updated text maps to semantic roles
- [ ] large text does not clip critical actions
- [ ] live session remains usable at large text
- [ ] screenshot regression updated

---

# 7. R2 — Navigation cleanup and compact Settings

Canonical primary navigation:

```text
Talk
Missions
Progress
```

## 7.1 Remove Vocabulary root tab

Delete or retire the Vocabulary root route and any fourth-tab registration.

Vocabulary/phrases belong under Progress.

## 7.2 Add Settings access from root screens

Compact:

```text
Talk                       [Settings]
Missions                   [Settings]
Progress                   [Settings]
```

Expanded:

```text
navigation rail
...
Settings anchored lower
```

## 7.3 Mural improvement

Adopt the navigation economy seen in Mural: three primary destinations and Settings outside the main tab model.

Do not copy Mural's Talk / Themes / Words taxonomy.

## R2 acceptance criteria

- [ ] only 3 primary root destinations
- [ ] no Vocabulary root route
- [ ] Vocabulary/Phrases accessible from Progress
- [ ] Settings one tap away from all three roots
- [ ] compact and expanded navigation tested
- [ ] accessibility labels exist
- [ ] no blank routes remain

---

# 8. R3 — Voice lifecycle: reconnecting, error, and recovery UI

This task should adopt several Mural runtime-quality patterns.

This is larger than simply adding enum members.

## 8.1 Canonical state model

Recommended:

```ts
type ConversationConnectionState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'paused'
  | 'reconnecting'
  | 'ending'
  | 'ended'
  | 'error';
```

Keep independent dimensions where needed:

```text
connectionState
audioInputState
assistantOutputState
sceneState
supportState
analysisState
```

## 8.2 Transient network recovery

Adopt the Mural concept:

```text
connected
↓
disconnected
↓
reconnecting grace window
↓
connected
```

Start with an approximately 8-second recovery window and tune later from device evidence.

Ending a conversation must cancel pending recovery callbacks.

## 8.3 Reconnecting UI

Example:

```text
Reconnecting…

Your completed turns are saved.
Keep this screen open.
```

## 8.4 Sustained failure

Example:

```text
Connection lost

Your completed turns are saved.

[Reconnect / Restart]
[End and keep progress]
```

Only promise same-session resumption if the transport really supports it.

---

# 9. ConversationActivityController

Adopt Mural's deterministic inactivity model.

Track:

```text
last learner activity
voice input activity
typing activity
assistant/helper busy state
mute state
```

Actions:

```text
wait
gentle check-in
warning(countdown)
end
```

Mural-inspired starting points:

```text
check-in after ~15s quiet
warning near final 5s
bounded speech grace
bounded typing grace
bounded assistant/helper grace
```

## 9.1 Check-in UX

```text
Still there?

Reply when you're ready.
```

One check-in is enough.

## 9.2 Countdown UX

```text
Ending in 5s
Reply to continue
```

Use tabular numbers and stable layout.

---

# 10. Typed fallback reliability

If typed sending fails:

```text
draft remains
sheet remains
error remains
retry remains possible
```

After retry succeeds:

```text
one transcript row
```

Typed modality remains distinct from spoken evidence.

---

# 11. Provider failure categories

Add stable application-level categories such as:

```text
authentication
model_access
credit_exhausted
spend_limit
usage_limit
quota
rate_limit
network
service_unavailable
invalid_request
microphone_denied
audio_route
unknown
```

Map each to:

```text
safe explanation
recovery action
retryability
support reference where available
```

Do not expose raw provider bodies.

---

# 12. Audio lifecycle boundary

Separate:

```text
VoiceTransport
AudioRouteAdapter
ConversationActivityController
VoiceConnectionRecovery
```

Do not put all state into `LiveSessionView`.

Longer-term route tests should cover built-in speaker, wired/USB headset, Bluetooth, interruption, and background/foreground transitions.

## R3 acceptance criteria

- [ ] `reconnecting` exists
- [ ] `error` exists
- [ ] old recovery timer cannot mutate a new session
- [ ] completed transcript/evidence survives network loss
- [ ] reconnecting UI explicit
- [ ] sustained failure has actionable recovery
- [ ] typed draft survives failure
- [ ] typed retry does not duplicate transcript
- [ ] provider errors use stable categories
- [ ] activity timer respects voice/typing/helper work
- [ ] countdown works at large text
- [ ] activity controller unit-tested independently

---

# 13. R4 — Shared reduced-motion foundation

Create one shared hook:

```text
useReducedMotionPreference()
```

Sources:

```text
native accessibility setting
web prefers-reduced-motion
```

Route motion through semantic primitives:

```text
PressScale
FadeTransition
SheetTransition
VoicePulse
NavigationTransition
```

Reduced-motion mapping:

```text
listening pulse → static icon + label
spring sheet → short/no fade
card scale → state/color
looping waveform → static meter
```

Mural improvement to adopt:

```text
system animations disabled
or app backgrounded
→ pause continuous decorative motion
```

## R4 acceptance criteria

- [ ] one shared reduced-motion hook
- [ ] voice animation respects it
- [ ] sheet/page motion respects it
- [ ] decorative animation stops in background
- [ ] no essential information relies only on motion
- [ ] native and web preference paths tested

---

# 14. R5 — IndexedDbArchiveRepository.web.ts

This is a functional requirement because web export is currently broken.

## 14.1 ArchiveRepository abstraction

Screens/services depend only on the repository interface.

Platform implementations:

```text
ArchiveRepository.native.ts
→ SQLite

IndexedDbArchiveRepository.web.ts
→ IndexedDB
```

No screen-level storage branching.

## 14.2 Atomic transaction invariant

The web adapter must preserve:

> transcript + validated observations + lapses commit atomically.

If a write fails, abort the transaction.

## 14.3 Suggested stores

Depending on current schema:

```text
sessions
passages
phrase_observations
skill_observations
skill_lapses
preferences
support_exposures
schema_metadata
```

The public repository contract matters more than identical physical schemas.

## 14.4 Schema versioning

Use an explicit schema version and explicit migrations.

Reject unknown future versions rather than guessing.

## 14.5 Mural-inspired import hardening

Adopt:

```text
size bound
schema version check
language validation
duplicate validation
identifier validation
numeric/date bounds
validate full candidate before mutation
revalidate imported evidence
transactional merge
```

## 14.6 Import algorithm

```text
read
↓
size bound
↓
decode
↓
schema validation
↓
migration
↓
validate languages
↓
validate IDs/provenance
↓
validate evidence
↓
detect duplicate/conflict
↓
BEGIN TRANSACTION
↓
apply
↓
COMMIT
```

Failure:

```text
ROLLBACK
```

## 14.7 Transcript corrections

A corrected passage/revision must invalidate or supersede derived state tied to the previous revision:

```text
PhraseObservation
SkillObservation
SkillLapse where appropriate
TaskEvidence
MeaningCache
RecommendationProjection
```

Only records linked to the superseded revision should change.

## R5 acceptance criteria

- [ ] web no longer relies on SQLite WASM for archive persistence
- [ ] web export works
- [ ] web import works
- [ ] same repository interface as native
- [ ] transaction semantics preserve evidence integrity
- [ ] migrations/version handling exist
- [ ] malformed import cannot partially mutate state
- [ ] native/web semantic archive fixture passes

---

# 15. R6 — Progress IA: ReadyToPractise above tabs

Target:

```text
Progress

READY TO PRACTISE
[action card]

[ Skills ] [ Phrases ] [ History ]
```

Do not create a fourth information tab unless user testing later justifies it.

## 15.1 ReadyToPractise inputs

Can aggregate:

```text
due phrases
due skills
skills with reviewDue
recently assisted skills
transfer opportunities
```

Do not expose ranking math.

## 15.2 Skills tab

Show:

```text
skill
New / Supported / Growing / Steady
context count
reviewDue
```

Example:

```text
Understand & clarify
Steady · review due

4 independent contexts
Recent difficult attempt
```

A lapse never visually erases historical mastery.

## 15.3 Phrases tab

Show phrase-specific status and scheduling separately from skill state.

## 15.4 History tab

Show mission, date, mode, outcome, evidence count, and support used.

Do not render raw internal IDs.

## 15.5 Legacy evidence

If a skill depends materially on reconstructed data:

```text
Reconstructed from older records
```

must remain visible.

## 15.6 Mural improvement

Adopt Mural's clarity around meaning/example/last-seen/review state, but apply it to LearnByRP's richer skill model with contexts, days, provenance, support, lapse/review, and transfer suggestions.

## R6 acceptance criteria

- [ ] ReadyToPractise above tabs
- [ ] default tab = Skills
- [ ] phrase and skill policies visibly distinct
- [ ] lapse shows review due without demotion
- [ ] legacy evidence labeled
- [ ] evidence detail links to provenance
- [ ] no opaque fluency score
- [ ] no phrase-substring logic reintroduced

---

# 16. Phase 2 — Mural-inspired improvements after the seven open tasks

These are not required to finish the seven current open tasks, but are the highest-value improvements from the Mural audit.

Canonical order:

```text
M1 Contextual Meaning Controller
M2 Contextual word/phrase lookup
M3 Transcript assembler + assembly version
M4 Recent-model support exposure
M5 Durable final-evidence queue
M6 Adaptive session delivery profile
M7 LanguagePack / locale architecture
M8 Source-backed current-topic missions
M9 AI utterance reporting
M10 Cross-platform golden fixtures / adapter contract tests
M11 Production audio-route hardening
```

---

# 17. M1 — Contextual Meaning Controller

Create a revision-safe meaning pipeline.

Request identity:

```ts
type MeaningRequest = {
  sessionId: string
  passageId: string
  sourceRevision: string
  learningLanguageId: string
  explanationLanguageId: string
  text: string
}
```

Cache identity must include source revision + explanation language.

Rules:

- stale result cannot attach to a changed caption
- one translation in flight per relevant context
- short delay for sentence-complete text
- longer delay for incomplete transcript
- minimum spacing between helper requests
- optional partial streaming only while context still matches

Support ledger integration:

```text
meaning loaded in background
≠ support exposure

meaning actually revealed to learner
= support exposure
```

---

# 18. M2 — Contextual word/phrase lookup

Flow:

```text
target-language caption
↓
select word/phrase
↓
contextual explanation
↓
original sentence remains visible
```

The helper should explain the selected item in that sentence, briefly, without treating the sentence as instructions.

Track lookup as support where relevant.

---

# 19. M3 — TranscriptAssembler + assembly version

Create a formal layer:

```text
provider fragments
↓
TranscriptAssembler
↓
passages
```

Responsibilities:

```text
Unicode-aware joining
fragment ordering
speaker grouping
typed-vs-spoken boundaries
revision keys
assembly version
```

Future evidence should record:

```text
sourcePassageId
sourceRevision
textAssemblyVersion
```

---

# 20. M4 — Recent-model support exposure

If the assistant recently modeled the same target language form, that may mean later learner production is assisted.

Represent it explicitly rather than globally marking a session assisted.

Possible record:

```ts
SupportExposure {
  kind: 'recent_model'
  sourcePassageId
  targetItemId?
  targetSkillId?
  shownAt
  expiresAt
}
```

Scope by item, skill, time, and attempt where possible.

---

# 21. M5 — Durable FinalEvidenceQueue

Problem:

```text
last learner turn
↓
session closes
↓
assessment may not finish
```

Required flow:

```text
persist session
↓
detect unprocessed final learner passage
↓
enqueue evidence job
↓
validate against persisted transcript
↓
write only if revision still matches
```

Suggested job states:

```text
pending
running
completed
failed_retryable
failed_terminal
```

Recap can render already-durable evidence while final analysis finishes.

---

# 22. M6 — Adaptive SessionDeliveryProfile

Adopt Mural's temporary delivery adaptation, not its durable 0–5 learner score.

```ts
type SessionDeliveryProfile =
  | 'gentle'
  | 'natural'
  | 'extended'
```

Inputs can include:

```text
recent validated independent evidence
current mission difficulty
help usage
recent breakdown
response length
session mode
```

Effects:

```text
assistant turn length
speech-rate guidance
lexical complexity
follow-up depth
pause space
```

Invariant:

```text
SessionDeliveryProfile
≠ learner proficiency record
```

---

# 23. M7 — LanguagePack / locale architecture

Create region-aware language packs.

Example:

```ts
type LanguagePack = {
  id: 'fr-BE'
  baseLanguage: 'fr'
  region: 'BE'
  locale: string
  greeting: string
  voiceGuidance: string
  writingGuidance: string
  lexicalRules: unknown
  culturalContext: unknown
  missionOverrides: unknown
  pronunciationGuidance: unknown
  examPrograms: unknown
}
```

Priority:

```text
fr-BE
nl-BE
en
```

Learning language and explanation language remain separate.

Progress remains namespaced by language.

---

# 24. M8 — Source-backed current-topic missions

Adapt Mural's sourced topic feature into mission-based practice.

Example:

```text
Mission:
Discuss a current Brussels mobility story

Goal:
state your opinion
ask one follow-up
respond to disagreement

Primary skills:
express_opinion
support_opinion
ask_follow_up
```

Requirements:

```text
current source required
source links required
facts vs opinion separated
freshness limit
```

Unsourced current facts should not become authoritative mission context.

---

# 25. M9 — AI utterance reporting

Future quality feature.

Reasons:

```text
incorrect
wrong language
unsafe/inappropriate
poor translation/explanation
other
```

Privacy:

- show exactly what excerpt will be sent
- require explicit report consent
- detect secrets/credentials
- never upload API keys, auth tokens, whole archives, or unrelated transcript history

---

# 26. M10 — Golden fixtures and adapter contracts

LearnByRP has one TypeScript core, so it does not need Mural's Swift/Kotlin parity system.

Use the idea for platform adapters.

Example evidence fixture:

```json
{
  "skillId": "ask_clarification",
  "validatedIndependentContexts": 4,
  "distinctDays": 3,
  "recentLapse": true,
  "expectedStatus": "steady",
  "expectedReviewDue": true
}
```

Run against:

```text
projection engine
native repository
web repository
```

Same semantic archive should round-trip through SQLite and IndexedDB.

---

# 27. M11 — Production audio-route hardening

Progressively cover:

```text
wired headset
USB audio
Bluetooth classic
BLE headset
hearing devices where supported
speaker
earpiece
audio focus
route changes
interruptions
```

Important invariant:

> Restoring an old speaker route must never steal output from a headset that connected later.

This belongs in platform adapters, not UI components.

---

# 28. Product-level comparison target

Do not target:

> More features than Mural.

Target:

> Mural-level conversation reliability plus a more rigorous learning system.

The resulting architecture:

```text
User goal / need
      ↓
communicative skill
      ↓
authored mission
      ↓
deterministic scene goal
      ↓
reliable realtime conversation
      ↓
support ledger
      ↓
exact transcript provenance
      ↓
model proposes evidence
      ↓
deterministic validation
      ↓
PhraseObservation + SkillObservation
      ↓
cross-context transfer
      ↓
4 contexts / 3 days
      ↓
Steady

Failure path:
task not achieved
+ real cold attempt
+ no support
+ not rehearsal
→ SkillLapse
→ reviewDue
→ never demotes history
```

---

# 29. Recommended execution order

## Phase A — finish current open tasks

```text
A0 Spec v2
A1 Typography cleanup
A2 Navigation + Settings
A3 Voice reconnect/error + activity controller
A4 Reduced motion
A5 IndexedDB web
A6 Progress IA
```

## Phase B — Mural-derived high-value learning UX

```text
B1 MeaningController
B2 Contextual word/phrase lookup
B3 TranscriptAssembler
B4 Recent-model support exposure
B5 FinalEvidenceQueue
B6 SessionDeliveryProfile
```

## Phase C — scale and differentiation

```text
C1 LanguagePack / fr-BE / nl-BE
C2 Source-backed current-topic missions
C3 AI utterance reporting
C4 adapter/golden-fixture contracts
C5 deeper audio-route/device verification
C6 professional/domain mission expansion
C7 exam-preparation vertical
```

---

# 30. Testing plan

Keep the current baseline:

```text
380 passing unit tests
36 passing visual snapshots
``````

Each phase adds coverage.

## R3 voice minimum tests

```text
disconnected → reconnecting
reconnected before timeout
timeout → error
close cancels recovery
new session immune to previous timer
quiet → check-in
speech grace
typing grace
helper busy grace
countdown
network loss preserves transcript
typed retry does not duplicate
```

## R4 reduced-motion minimum tests

```text
native reduced motion
web prefers-reduced-motion
voice-pulse fallback
sheet-transition fallback
background stops decorative motion
```

## R5 IndexedDB minimum tests

```text
empty export
full export
import round trip
skill observations survive
skill lapses survive
support provenance survives
duplicate import safe
malformed import rejected without mutation
unknown schema rejected
transaction rollback
corrected passage invalidates stale derived state
native/web semantic fixture parity
```

## R6 Progress minimum tests

```text
ReadyToPractise above tabs
default Skills tab
Steady + lapse → Steady + reviewDue
legacy evidence label
phrase policy independent of skill policy
```

---

# 31. Mandatory visual QA

PR-blocking:

```text
Talk
Missions
Briefing
Live session
Recap
Progress
```

Widths:

```text
390
840
1440
```

Themes:

```text
light
dark
```

Total:

```text
36 snapshots
```

Add focused snapshots only when a changed feature needs them.

---

# 32. Mandatory device/manual QA before release

At minimum:

```text
iPhone physical device
Android physical device
desktop browser
mobile browser
```

Flows:

```text
microphone granted
microphone denied
network interruption
typed fallback
large text
screen-reader smoke test
reduced motion
background/foreground
session end
export/import
delete data
headset/Bluetooth where available
```

---

# 33. Definition of done — current remaining phase

The current phase is complete when:

- [ ] UI spec v2 is canonical
- [ ] no known obsolete v1 guidance remains authoritative
- [ ] no essential sub-12px text remains
- [ ] primary navigation is Talk / Missions / Progress
- [ ] Settings is reachable on compact and expanded layouts
- [ ] reconnecting/error are real runtime states
- [ ] recovery UI preserves completed work
- [ ] inactivity handling is deterministic
- [ ] reduced motion is centralized
- [ ] web persistence uses IndexedDB
- [ ] web export/import work
- [ ] Progress begins with ReadyToPractise
- [ ] skill evidence remains validator-authoritative
- [ ] lapses remain separate and non-demotional
- [ ] existing tests still pass
- [ ] new tests cover every new invariant

---

# 34. Definition of done — Mural-improvement wave

The Mural-derived enhancement phase is complete when:

- [ ] meaning requests are passage/revision-safe
- [ ] stale meanings cannot attach to corrected captions
- [ ] meaning reveal is recorded as support
- [ ] contextual word/phrase lookup exists
- [ ] lookup support is observable
- [ ] transcript assembly has a version
- [ ] recent-model exposure can downgrade independence
- [ ] final unassessed turns cannot silently disappear
- [ ] session delivery adapts without becoming a proficiency score
- [ ] language packs are region-aware
- [ ] current-topic missions require sources
- [ ] AI response reporting has explicit consent and secret filtering
- [ ] native/web adapters pass semantic fixtures
- [ ] production audio routes are tested

---

# 35. Final product principle

Use Mural as a quality benchmark for:

```text
voice reliability
meaning
lookup
accessibility
failure recovery
audio behavior
archive safety
```

Do not use Mural as the learning-model authority.

LearnByRP remains:

```text
mission-first
skill-aware
evidence-grounded
support-aware
context-transfer-driven
exam-capable
explainable
```

The product objective is:

> Match or exceed Mural's conversation reliability while keeping a substantially stronger model of what the learner actually demonstrated, under what support conditions, in which contexts, and what should be practised next.

---

# 36. Immediate next task

Start with:

```text
R0 — UI/UX Design System v2
```

Then:

```text
R1 → R2 → R3 → R4 → R5 → R6
```

with the Mural-derived improvements integrated as defined above.

---

**End of implementation plan**
