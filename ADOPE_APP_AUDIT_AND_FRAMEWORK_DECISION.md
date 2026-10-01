Your audit is materially correct, and it changes my previous recommendation. I would **not use the 4,299-line UI spec as implementation authority yet**. It should be treated as a design draft until these contradictions are patched.

The most important change is that I would **not migrate this existing app to Tamagui now**.

## The three decisions to lock

| Decision          | Final choice                                      | Reason                                                                          |
| ----------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| UI/styling        | **Stay on NativeWind 4.2.7 + Tailwind 3**   | Already implemented, officially supports Expo 57, avoids rewriting every screen |
| Skill evidence    | **Explicit curated skill IDs**              | Runtime phrase substring matching is too weak to be authoritative               |
| Palette/elevation | **Replace the v1 palette before migration** | Several semantic combinations fail contrast and surface hierarchy is too weak   |

### 1. NativeWind wins for this repository

If we were starting a brand-new universal app, Tamagui 2 would remain a reasonable option. But that is not the situation anymore.

NativeWind 4.2.7 is the current stable release, explicitly supports Expo SDK 57, and officially uses **Tailwind CSS 3**, including the traditional `@tailwind base/components/utilities` setup. NativeWind 5 is currently a pre-release and moves to Tailwind 4. :chatgpt-content-reference{index="0"}

So I would lock:

```text
Expo SDK 57
React Native 0.86
React 19.2.x
Expo Router
NativeWind 4.2.7
Tailwind CSS 3.4.x
Reanimated
Lucide
semantic Mission Coach components
```

and **remove Tamagui from the required architecture**.

That avoids weeks of largely non-product work.

Your current CSS mismatch should be fixed immediately. NativeWind 4 expects:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

not:

```css
@import "tailwindcss";

@theme {
  ...
}
```

The latter belongs to the Tailwind 4 / NativeWind 5 direction, and NativeWind's current stable documentation explicitly keeps v4 on Tailwind 3. :chatgpt-content-reference{index="1"}

### Tamagui accessibility correction

Your criticism of my spec is right, although there's an important nuance.

Tamagui 2 did not remove accessibility capability. It deliberately replaced React Native-style accessibility prop names with standard ARIA-style names:

```text
accessibilityLabel      → aria-label
accessibilityRole       → role
accessibilityHint       → aria-describedby
accessibilityLiveRegion → aria-live
accessibilityState      → aria-disabled / aria-selected / ...
```

So my specification's examples were wrong for Tamagui 2. :chatgpt-content-reference{index="2"}

Also, `@tamagui/core` would not actually need to be installed separately if using the full `tamagui` package—the official installation guide says `tamagui` is a superset of core. :chatgpt-content-reference{index="3"}

But you are right about the intended overlay stack: native portals are better configured with `react-native-teleport` plus `@tamagui/native/setup-teleport`, and native Sheet behavior benefits from Gesture Handler. Those dependencies were missing from my spec. :chatgpt-content-reference{index="4"}

None of that changes the migration decision: **keep NativeWind for Learn-By-RP**.

---

# 2. Skill evidence: remove phrase matching from authority

This one should be unambiguous.

Current behavior such as:

```ts
observationSupportsSkill(...)
```

matching:

```text
observation text
      ↓
samplePhrases substring
      ↓
skill
```

must **not** be the canonical skill-evidence engine.

The correct direction is:

```text
MissionDefinition
├── primarySkillIds[]
└── secondarySkillIds[]

ExamTaskDefinition
├── primarySkillIds[]
└── secondarySkillIds[]

PhraseDefinition
└── skillIds[]       // optional curated relationship
```

Then assessment works like:

```text
Conversation
     ↓
model proposes:
  skillId
  source quote
  task evidence
     ↓
deterministic validator
     ↓
Is skillId allowed by this mission?
Does quote exist in learner passage?
Was relevant support exposed?
Was task outcome compatible?
     ↓
SkillObservation
```

So an observation becomes:

```ts
type SkillObservation = {
  id: string;

  skillId: CommunicativeSkillId;

  source: {
    sessionId: string;
    attemptId: string;
    passageId: string;
    revision: string;
  };

  context: {
    domainId?: string;
    scenarioId?: string;
    examProgramId?: string;
    examTaskId?: string;
  };

  modality: 'spoken' | 'typed';
  retrieval: 'assisted' | 'unassisted' | 'unknown';
  taskOutcome: 'achieved' | 'partial' | 'not_achieved' | 'unknown';

  supportExposureIds: string[];

  recordedAt: string;
};
```

This also solves an important pedagogical issue.

The learner can say:

```text
Could you explain that again?
```

instead of the catalogued phrase:

```text
Could you clarify that?
```

and still demonstrate:

```text
ask_clarification
```

because **skills represent communicative capability, not memorization of one string**.

### What happens to the current phrase matcher?

Don't delete it immediately.

Demote it to:

```text
legacy/backfill inference only
```

For example:

```ts
evidenceSource:
  | 'validated_explicit'
  | 'legacy_inferred'
```

`legacy_inferred` evidence can help migrate old histories but should not be allowed by itself to establish `steady`.

That preserves existing user data without keeping the weak inference model as the future architecture.

---

# 3. Separate phrase thresholds from skill thresholds

This is why the existing policies became confusing.

A **phrase** and a **communicative skill** should not use identical promotion rules.

Phrase projection can remain relatively quick:

```text
NEW
no valid evidence

SUPPORTED
assisted use

GROWING
≥1 independent retrieval

STEADY
independent retrieval on ≥2 distinct days/attempt contexts
```

But skill projection should require transfer.

I would lock the skill policy as:

```text
NEW
no valid evidence

SUPPORTED
assisted evidence,
or only one independent context

GROWING
independent successful evidence
in ≥2 distinct contexts
across ≥2 distinct days

STEADY
independent successful evidence
in ≥4 distinct contexts
across ≥3 distinct days
```

That resolves your `2 contexts vs 4 contexts` conflict cleanly.

And a lapse should **not erase historical evidence**. It should affect scheduling:

```text
Steady
+
recent lapse
=
Steady, review due
```

rather than resetting the learner to zero.

---

# 4. The palette needs a v2

I agree with your contrast audit.

The previous:

```text
brand #B4533A
```

works with white at about **4.95:1**, but fails when used as foreground text on `brandSoft`.

Instead I would use a slightly darker canonical brand:

```text
brand #A7442F
```

That gives approximately:

```text
#A7442F on #FFFFFF  → 5.98:1
#A7442F on #F7E8E2  → 5.01:1
```

So the same semantic brand foreground remains valid on white and warm selected surfaces.

I would replace the light tokens with:

| Semantic token               |   New value |        Important contrast |
| ---------------------------- | ----------: | ------------------------: |
| Canvas                       | `#F2EDE4` | visibly warmer than white |
| Surface                      | `#FFFFFF` |                        — |
| Ink                          | `#1C1917` |                      high |
| Body                         | `#57534E` |                      high |
| Muted text                   | `#6E6963` |         ~4.66:1 on canvas |
| Subtle border                | `#C8BFB2` |      visual grouping only |
| **Interactive border** | `#958A7D` |     ~3.38:1 against white |
| **Brand**              | `#A7442F` |           5.98:1 on white |
| Brand soft                   | `#F7E8E2` |      brand on soft 5.01:1 |
| Language                     | `#246B63` |           6.25:1 on white |
| Language soft                | `#E4F2EF` |   language on soft 5.43:1 |
| Success                      | `#2D6B49` |                  evidence |
| Warning                      | `#8A5A12` |          assisted/pending |
| Danger                       | `#B42318` |               destructive |

And eliminate `faint` as a text role.

There can still be something like:

```text
decorativeDisabled
```

for non-informational visuals, but **dates, durations, evidence sources, timestamps and metadata may never use it**.

---

# 5. Fix elevation structurally, not just with another beige

Your criticism here is particularly good.

The original spec said:

> tonal depth before shadow depth

but then gave tones almost indistinguishable from each other.

The corrected rule should be:

```text
STATIC GROUPING CARD
white surface
subtle ~2:1 border
small shadow

INTERACTIVE CARD
white surface
≥3:1 control boundary
pressed/hover tonal change

SELECTED CARD
semantic 3:1+ border
semantic soft background

FOCUS
2px teal focus ring
3:1+ against adjacent colors
```

So default cards no longer depend on this:

```text
white
vs
almost-white
```

to establish hierarchy.

They use three channels together:

```text
surface
+ boundary
+ very small elevation
```

Dark mode should similarly become one canonical set:

```text
Canvas             #171613
Surface            #29251F
Raised             #342E27
Subtle border      #514A40
Interactive border #7A7063
Ink                #F7F4EE
Body               #D4CEC4
Muted              #AFA79C

Brand foreground   #EF9B7F
Brand button       #A7442F
Brand soft         #3B251E

Language           #7CC7BE
Language soft      #17332F
```

`#7A7063` against the new dark surface is about **3.14:1**, and the brand/language soft combinations have plenty of contrast.

There should be exactly **one** palette definition in the canonical spec. No separate §8 and §125 values.

---

# 6. NativeWind theme architecture

Since NativeWind stays, make the theme state:

```ts
type ThemePreference =
  | 'system'
  | 'light'
  | 'dark';
```

not:

```ts
type Theme =
  | 'light'
  | 'dark';
```

NativeWind 4 supports system appearance as well as manual `light`, `dark`, and `system`, and Expo must have `userInterfaceStyle: "automatic"` for system appearance. :chatgpt-content-reference{index="5"}

So:

```text
saved preference = system
resolved OS theme = dark
rendered theme = dark
```

and when the OS changes, the application follows it automatically.

That fixes the current “once saved, system preference is effectively ignored forever” behavior.

---

# 7. Persistence decision

Also resolved:

```text
ArchiveRepository
├── native → expo-sqlite
└── web    → IndexedDB
```

Do not make screens aware of either implementation.

Although `expo-sqlite` technically exposes web support, Expo currently labels its web support **alpha** and requires WASM configuration plus cross-origin isolation headers. I would not make that the production web archive dependency yet. :chatgpt-content-reference{index="6"}

So:

```ts
interface ArchiveRepository {
  saveSession(...): Promise<void>;
  getSession(...): Promise<SessionRecord | null>;
  getObservations(...): Promise<Observation[]>;
  saveObservation(...): Promise<void>;
  deleteObservation(...): Promise<void>;
  exportArchive(...): Promise<ArchiveExport>;
}
```

with:

```text
SQLiteArchiveRepository.native.ts
IndexedDbArchiveRepository.web.ts
```

`localStorage` becomes a temporary migration source only.

---

# 8. One monorepo shape

You're right that the spec accidentally described three.

There should be one:

```text
apps/
  app/                Expo universal product
  site/               marketing/guides

services/
  api/

packages/
  core/
  contracts/
  content/
  design/
  i18n/
```

And:

```text
packages/design/
  tokens.ts
  colors.ts
  typography.ts
  motion.ts
  breakpoints.ts
  nativewind-preset.js
```

No separate `packages/tokens`.

No root-vs-package ambiguity.

`apps/app/tailwind.config.js` consumes the shared design preset.

---

# 9. Specification precedence

This also needs to be explicit.

```text
1. MASTER PRODUCT ARCHITECTURE
   runtime, evidence, privacy, product invariants

2. SKILL MENU ENGINE
   learning taxonomy and content relationships

3. UI/UX DESIGN SYSTEM
   visual/interaction implementation

4. Individual teardown/audit documents
   research/reference only
```

When a lower document conflicts with a higher one, the higher one wins.

The next UI spec should explicitly say which earlier UI documents it supersedes.

---

# 10. Settings on compact

Keep only:

```text
Talk
Missions
Progress
```

in bottom navigation.

Settings should be accessible from the top-right action of every root screen:

```text
Talk                         ⚙
Missions                     ⚙
Progress                     ⚙
```

or from a consistent profile/settings button.

Therefore settings remains one tap from a primary destination without becoming a fourth tab.

---

# 11. ContinueCard

This was indeed missing.

`ContinueCard` should only exist when there is resumable state.

```text
CONTINUE

Hotel check-in

3 turns completed
Last practised 12 minutes ago

Goal:
Confirm your reservation

[Continue]
```

No percentage.

No fictional “65% finished” unless the scene actually has deterministic progress semantics.

If nothing is resumable, the component does not render; it is replaced by the recommendation hero.

---

# 12. RTL needs to be a design-system requirement

Even if Arabic isn't R1, the component system should avoid creating migration debt.

Use:

```text
start / end
marginStart / marginEnd
paddingStart / paddingEnd
```

instead of semantic layout logic based on:

```text
left / right
```

Directional icons should mirror:

```text
back
forward
chevron navigation
```

Non-directional icons should not.

Conversation text needs per-language:

```text
writingDirection
textAlign
script fallback
```

Mixed content such as:

```text
Arabic sentence + Latin exam code + numbers
```

must be tested.

---

# 13. QA matrix needs a blocking tier, not 1,120 PR screenshots

I agree.

The huge matrix belongs to **release coverage**, not every commit.

I would make the mandatory PR visual suite:

```text
6 critical screens:
Talk
Missions
Briefing
Live session
Recap
Progress

× 3 widths:
390
840
1440

× 2 themes

= 36 web snapshots
```

That's realistic.

Then add targeted component tests for:

```text
large text
FR
NL
long strings
RTL fixture
error states
```

Release/nightly can expand to the broader matrix.

Web visual regression can use Playwright. Native should prioritize core flow screenshots plus physical-device/VoiceOver/TalkBack testing rather than attempting 1,000 pixel-perfect native screenshots.

---

# 14. The Tailwind problem should be the first UI code fix

Given your audited Expo build is on NativeWind 4, the immediate sequence should now be:

1. fix Tailwind 3 / NativeWind configuration and remove dead Tailwind 4 syntax;
2. create the corrected semantic palette and contrast tests;
3. implement `system/light/dark`;
4. create `packages/design`;
5. fix text floors and remove `9px/10px/11px` essential UI text;
6. add reduced-motion primitives;
7. unify Talk/Missions/Progress navigation and compact Settings access;
8. replace skill substring inference with explicit curated skill evidence;
9. only then begin component-by-component visual migration.

That order avoids converting screens twice.

So the most important change to my earlier recommendation is:

> **Do not migrate to Tamagui. Migrate the existing NativeWind app to a disciplined semantic Mission Coach design system.**

Tamagui wasn't a bad technical choice; for a greenfield build it is quite defensible. But given the application that now exists, it does not provide enough product value to justify rewriting the presentation layer. The stronger architecture is to make `MissionCard`, `EvidenceCard`, `CaptionBlock`, `VoiceActivity`, `AdaptiveNav`, etc. the stable API and let NativeWind remain an implementation detail underneath them.
