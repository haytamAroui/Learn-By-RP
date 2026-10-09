# Mission Coach — UI/UX Design System v2

**Version:** 2.0
**Date:** 2026-10-01
**Supersedes:** `MISSION_COACH_COMPLETE_UI_UX_DESIGN_SYSTEM_2026_v1 (1).md`
**Status:** Historical / superseded by V4

---

> **Historical reference only.** This document is superseded by
> `LEARNBYRP_DESIGN_SYSTEM_V4_TODO.md`, which is the active UI/UX implementation
> authority on `main`. Keep V2 only for historical rationale and details that were
> intentionally carried forward into V4.

## Authority

```
PRECEDENCE
1. Master Product Architecture      — product invariants, evidence truth, privacy
2. Skill/Menu Engine                — taxonomy, mission membership, exams
3. Skill-evidence runtime (code)    — SkillObservation, SkillLapse, validator
4. This document                    — visual and interaction implementation
5. Older audits / teardowns / Mural analysis — research inputs only
```

Where a lower document conflicts with a higher rule, the higher rule wins.

**v1 is superseded.** Its palette values, its Tamagui requirement, its two-versus-four
context skill rule, and its 1,120-snapshot QA matrix are all known wrong. Do not copy
values from it. Where v1 and this document disagree, this document is correct.

### Current implementation note

Design tokens live in `src/design/`. `packages/design/` is a future workspace
extraction target, not a prerequisite. Generated styling artifacts are never
authoritative — `src/design/tokens.ts` is the only colour authority.

```
src/design/tokens.ts
        ↓  scripts/generate-css.mts
tailwind.config.js  +  global.css  +  the palette tables in this document
        ↓
UI
```

`tests/design.test.ts` fails if any generated artifact drifts from the token file.

---

## 1. Stack

```
Expo SDK 57
React Native 0.86
React 19.2.x
Expo Router
NativeWind 4.x + Tailwind CSS 3.x
Reanimated
Lucide
semantic Mission Coach components
```

**Tamagui is not used.** v1 required it and v2 does not.

> NativeWind is an implementation detail beneath semantic Mission Coach components.

```tsx
<MissionCard />     correct
<EvidenceCard />
<VoiceActivity />
<SupportSheet />
<AdaptiveNav />
```

```tsx
<XStack bg="#B4533A" br={19} p={13} />   avoid — arbitrary screen-specific styling
```

Accessibility uses React Native props, not ARIA renames:

```tsx
accessibilityLabel  accessibilityRole  accessibilityState  accessibilityHint
```

---

## 2. Colour

One palette. Two themes. No third definition anywhere.

<!-- BEGIN GENERATED:palette -->
| Token | Value | Use |
|---|---|---|
| `canvas` | `#F8F3E8` | App background |
| `surface` | `#FFFFFF` | Cards, main panels |
| `surface-soft` | `#F4F0E9` | Neutral secondary panel |
| `sunken` | `#E5E9E5` | Recessed: inputs, wells |
| `surface-hover` | `#ECF5F0` | Hover on a canvas-level surface |
| `raised` | `#FFFFFF` | Dialogs, popovers, floating support |
| `border-subtle` | `#D2D3C9` | Grouping only — not a control boundary |
| `border-interactive` | `#75857E` | Any control the user must see and hit |
| `ink` | `#0C2B2E` | Highest emphasis |
| `body` | `#42575B` | Normal body |
| `muted` | `#55646A` | Secondary labels, metadata, dates |
| `brand` | `#B5412F` | Primary action |
| `brand-hover` | `#9D3527` | Primary action hover |
| `brand-pressed` | `#822B20` | Primary action pressed |
| `brand-soft` | `#FFEAE2` | Warm highlighted / selected card |
| `brand-text` | `#FFFFFF` | Label on a brand fill |
| `brand-button` | `#07454B` | CTA fill |
| `brand-button-hover` | `#0C6469` | CTA hover fill |
| `brand-button-pressed` | `#05373C` | CTA pressed fill |
| `language` | `#0A726C` | Target-language semantics |
| `language-hover` | `#095D58` | Target-language hover |
| `language-soft` | `#DDF1EA` | Phrase card background |
| `language-text` | `#FFFFFF` | Label on a language fill |
| `success` | `#21664C` | Verified positive evidence |
| `success-soft` | `#E3F5EE` | Positive surface |
| `warning` | `#855818` | Assisted, partial, pending, degraded |
| `warning-soft` | `#FFF1DC` | Attention surface |
| `danger` | `#B42318` | Destructive, hard error |
| `danger-soft` | `#FBE8E6` | Error surface |
| `info` | `#0D6581` | Informational |
| `info-soft` | `#E0F2F8` | Informational surface |
| `focus` | `#0A726C` | Focus ring |
| `focus-on-brand` | `#FFFFFF` | Focus ring against a brand fill |
| `lime` | `#CBF37C` | lime |
| `lime-text` | `#17310F` | limeText |
| `coral-control` | `#EA4B3B` | coralControl |
| `lilac` | `#65509D` | lilac |
| `lilac-soft` | `#EFEAFF` | lilacSoft |

**Dark theme**

| Token | Value | Use |
|---|---|---|
| `canvas` | `#122322` | App background |
| `surface` | `#1D3231` | Cards, main panels |
| `surface-soft` | `#243C39` | Neutral secondary panel |
| `sunken` | `#0B191A` | Recessed: inputs, wells |
| `raised` | `#304B47` | Dialogs, popovers, floating support |
| `surface-hover` | `#2C4541` | Hover on a canvas-level surface |
| `border-subtle` | `#526F65` | Grouping only — not a control boundary |
| `border-interactive` | `#95ADA3` | Any control the user must see and hit |
| `ink` | `#F9F7F0` | Highest emphasis |
| `body` | `#D5E4DD` | Normal body |
| `muted` | `#B2C6BD` | Secondary labels, metadata, dates |
| `brand` | `#FFAB91` | Primary action |
| `brand-hover` | `#FFC0AA` | Primary action hover |
| `brand-pressed` | `#E8967D` | Primary action pressed |
| `brand-soft` | `#492E28` | Warm highlighted / selected card |
| `brand-button` | `#07454B` | CTA fill |
| `brand-button-hover` | `#0C6469` | CTA hover fill |
| `brand-button-pressed` | `#05373C` | CTA pressed fill |
| `brand-text` | `#FFFFFF` | Label on a brand fill |
| `language` | `#82D8C7` | Target-language semantics |
| `language-hover` | `#ADE8D9` | Target-language hover |
| `language-soft` | `#18453F` | Phrase card background |
| `language-text` | `#0B191A` | Label on a language fill |
| `success` | `#95D2AF` | Verified positive evidence |
| `success-soft` | `#1C4030` | Positive surface |
| `warning` | `#EFCA84` | Assisted, partial, pending, degraded |
| `warning-soft` | `#443820` | Attention surface |
| `danger` | `#FFA899` | Destructive, hard error |
| `danger-soft` | `#492D2A` | Error surface |
| `info` | `#99CBE1` | Informational |
| `info-soft` | `#203C47` | Informational surface |
| `focus` | `#82D8C7` | Focus ring |
| `focus-on-brand` | `#FFFFFF` | Focus ring against a brand fill |
| `lime` | `#CBF37C` | lime |
| `lime-text` | `#17310F` | limeText |
| `coral-control` | `#EA4B3B` | coralControl |
| `lilac` | `#C3ACF5` | lilac |
| `lilac-soft` | `#372C4D` | lilacSoft |
<!-- END GENERATED:palette -->

### Rules

| Rule | Requirement |
|---|---|
| Brand | Terracotta. Primary action and brand identity only. Never every chip. |
| Language | Teal. Target-language content and language-learning semantics only. Never generic success. |
| Success | Green. Verified positive evidence only. |
| Warning | Amber. Assisted use, partial completion, pending, degraded connection. |
| Danger | Red. Destructive action, hard error, invalid state. |
| Metadata | Never a decorative low-contrast token. Dates, durations, evidence counts, consent versions and state text are informative and must meet text contrast. |

There is no `faint` text role. If something needs to be quieter, it uses `muted`.

### Contrast

Verified by `tests/design.test.ts`, not asserted here:

- normal text ≥ 4.5:1 on every surface it may sit on
- interactive control boundary ≥ 3:1 on **both** surface and canvas
- focus ring ≥ 3:1 on every surface it may sit beside
- semantic status colours ≥ 4.5:1 on surface and on their own soft tint
- button label ≥ 4.5:1 on the button fill

---

## 3. Focus

A single-colour focus ring cannot contrast with both a component and its background.
Teal clears the canvas at 5.36:1 and measures 1.05:1 against the terracotta CTA; any
colour that works on the CTA is invisible on the canvas.

The ring is therefore drawn **with an offset**, against the background:

```
ring 2px · offset 2px
```

Where a ring must sit flush against a filled control, use `focusOnBrand`, not `focus`.

---

## 4. Elevation

Tonal depth before shadow depth, but the tones must actually differ.

| Level | Treatment |
|---|---|
| Canvas | Page background. |
| Static grouping card | Surface + visible grouping boundary + minimal elevation. |
| Interactive card | Interactive boundary (≥3:1) + hover/press state. |
| Selected card | Semantic soft background + semantic border + selected text/icon state. |
| Floating (dialog, popover, support panel) | `raised` surface + shadow. |

A card must never depend on white versus almost-white to establish hierarchy. In light
mode `raised` equals `surface` and is separated by shadow; in dark mode it differs in
tone because dark mode also gets weaker shadows.

---

## 5. Typography

Editorial display face for titles; platform system font for UI and body; platform
system font with script fallback for target-language text.

Do not force a Latin display face onto script-heavy conversation.

<!-- BEGIN GENERATED:typography -->
| Role | Size | Line height | Weight |
|---|---:|---:|---:|
| `displayLg` | 32 | 38 | 600 |
| `displayMd` | 28 | 34 | 600 |
| `titleLg` | 24 | 30 | 600 |
| `titleMd` | 20 | 26 | 600 |
| `titleSm` | 18 | 24 | 600 |
| `bodyLg` | 17 | 25 | 400 |
| `bodyMd` | 15 | 22 | 400 |
| `bodySm` | 14 | 20 | 400 |
| `labelLg` | 16 | 20 | 600 |
| `labelMd` | 14 | 18 | 600 |
| `caption` | 13 | 18 | 500 |
| `captionSm` | 12 | 16 | 500 |
| `conversation` | 26 | 35 | 500 |
<!-- END GENERATED:typography -->

Rules:

- `captionSm` at 12px is the floor. Nothing a user must read may render below it.
- Prefer semantic roles over arbitrary numeric classes: `<AppText variant="metadata" />`.
- No more than about six visibly different sizes on one screen.
- Dynamic Type and user scaling are respected: **wrap and scroll, never shrink**.
- Critical language-learning text is never truncated.

---

## 6. Spacing, radius, touch

Spacing uses the published scale only. Invented values such as 13/17/19/23 are not
allowed unless a safe-area requirement forces a calculated value.

Radius: `control` for buttons and inputs, `card` for cards, `hero` for hero cards,
`sheet` for sheets, `pill` for chips. Not a different radius on every card.

Minimum interactive target is 48 × 48. Visible icons may be 20 or 24. Adjacent
live-session controls keep at least an 8px gap.

Icons: Lucide only. Never mix icon families in the product UI. Platform-native
controls may render native glyphs internally.

---

## 7. Navigation

Primary destinations, and only these:

```
Talk      Missions      Progress
```

`Vocabulary` is not a destination. Phrases live under Progress. Characters are
mission participants, not navigation. Do not add a fourth tab because desktop has
room.

```
Compact        bottom tabs, 3 items, labels always shown,
               badge only for due practice, hidden during a live session
Expanded       left rail, Settings anchored lower
```

**Settings is not a tab.** Compact root screens expose a consistent header action so
Settings stays one tap from any primary destination.

---

## 8. Motion

```
instant 80ms · short 140ms · standard 220ms · long 320ms
```

Springs for sheet presentation, selected card and pressed feedback. Opacity and
translate for page content and small notices. No gratuitous motion.

Reduced motion is centralised in `useReducedMotionPreference()` and observed by every
motion primitive:

```
listening pulse  → static icon + label
spring sheet     → short fade
card scale       → colour/border state
looping waveform → static meter
```

System animations disabled, or the app backgrounded, pauses continuous decorative
motion. No essential information may depend on motion.

---

## 9. Layout

Width tiers, never user-agent:

| Tier | Width | Navigation | Page |
|---|---|---|---|
| Compact | < 600 | bottom tabs | single column, 16px gutter |
| Medium | 600–839 | bottom bar or compact rail | 24px gutter, 1–2 columns |
| Expanded | 840–1199 | left rail | master–detail where useful, 32px gutter |
| Large | 1200–1599 | left rail | bounded content |
| Extra large | ≥ 1600 | left rail | bounded, no infinite stretch |

Maximum content widths: app 1180, conversation 720, reading/recap 760, catalog 1320.

Branch on the tier name (`layout === 'compact'`), not on device labels
(`isTablet`). Web must not look like a stretched phone.

---

## 10. Right-to-left

RTL is a design-system requirement, not a future migration, so no layout debt is
created now.

```
Use   start / end, marginStart / marginEnd, paddingStart / paddingEnd
Avoid left / right in semantic layout logic
```

Directional icons mirror under RTL: back, forward, chevron navigation.
Non-directional icons do not mirror.

Conversation text carries per-language writing direction, text alignment and script
fallback. Mixed content — target sentence plus Latin exam code plus numerals — is a
tested case.

---

## 11. Components

```
ui/
├── primitives/    AppText Surface Divider Icon AppButton IconButton Chip AppInput
├── navigation/    AdaptiveNav BottomTabs NavigationRail ScreenHeader
├── cards/         MissionCard SkillCard ExamProgramCard DuePracticeCard
│                  EvidenceCard PhraseCard ContinueCard
├── conversation/  CaptionBlock MeaningLine VoiceActivity ConversationControls
│                  TranscriptList SupportSheet SupportPanel FreezeOverlay
├── learning/      EvidenceTag SkillStatus PhraseStatus RecommendationReason
│                  ProgressTimeline ExamDisclaimer
└── feedback/      EmptyState RecoverableError LoadingState StatusNotice
```

Every public component exposes semantic props (`<EvidenceTag state="independent" />`),
never colour props. Every interactive component defines default, pressed, focused,
disabled, loading, and where relevant error and selected. Web adds hover, which may
enhance but never reveal essential functionality.

### ContinueCard

Renders only when resumable state exists. Without it, the recommendation hero takes
that place.

```
CONTINUE

Hotel check-in

3 turns completed · Last practised 12 minutes ago

Goal:
Confirm your reservation

[Continue]
```

No invented completion percentage. A percentage appears only when the scene has
deterministic progress semantics.

### EvidenceCard

Shows phrase or skill, evidence status, context, the source quote, time, and support
state. Actions are `View evidence` plus an overflow menu containing edit, hide, and
mark-wrong. Four buttons on every card is wrong.

### VoiceActivity

States: `idle`, `connecting`, `listening`, `speaking`, `paused`, `reconnecting`,
`error`. Always icon **and** state label. Never an animated dot alone.

### MeaningLine

Hidden by default. **Revealing it writes a support exposure.** It is not a visual
state — see §13.

---

## 12. Screens

Five questions the UI must answer instantly:

| Screen | Question |
|---|---|
| Talk | What should I practise now? |
| Missions | What do I want to practise? |
| Briefing | What am I about to do? |
| Live session | What did they say, and what do I do next? |
| Recap / Progress | What did I actually use, and what should return later? |

Anything that does not help answer one of those probably does not belong.

- **Talk** leads with the best next action: one hero mission, then due practice. No
  dashboard charts. Every recommendation carries a human-readable reason.
- **Missions** has three views: Focus, Situations, Exams. Search applies across the
  selected view. No permanent left filter panel under 840px.
- **Briefing** states the goal, the stretch, the mode, cold attempt, and hides useful
  phrases until requested. Primary CTA sticks above the safe area.
- **Live session** — the spoken line is the hero. Transcript history is secondary.
  Recognised speech is visibly distinct from suggested, AI, or edited text. Back must
  not silently destroy a session. Controls: mute, help, type, end.
- **Recap** prefers *goal achieved*, *partly achieved*, *conversation changed
  direction*, *assessment unavailable*. Never *perfect*, *failed*, *fluent*.
- **Progress** begins with an action area, then information tabs.

---

## 13. Evidence and support

The UI must never imply a claim the archive does not hold.

**Evidence categories** are distinct and are never collapsed into a learned flag:
`independent`, `assisted`, `unknown`, `encountered`, `corrected`, `lapse`.

**Meaning reveal is support.** Showing a translation the learner did not ask for is
support, is written to the ledger once per passage, and makes the following turn
assisted. A background translation fetch is not support; only the reveal is.

**Phrase recall and communicative skill are separate states.** A phrase may be steady
from repeated retrieval. A skill requires transfer.

| | Phrase | Skill |
|---|---|---|
| Supported | assisted retrieval | assisted evidence, or insufficient transfer |
| Growing | ≥ 1 independent retrieval | independent success in ≥ 2 contexts across ≥ 2 days |
| Steady | independent retrieval across time and sessions | independent success in ≥ 4 contexts across ≥ 3 days, with validated evidence |

**Legacy evidence.** History reconstructed by matching historical observations against
sample phrasings is labelled *Reconstructed from older records*. It is preserved so
old sessions are not discarded, and it can never on its own establish Steady.

**A lapse is a review signal, never a demotion.** A steady skill with a recent lapse
reads *Steady · review due*. Historical competence is never erased by one bad attempt.
A session the learner ended, that timed out, or that lost network is not a lapse.

**No status is communicated by colour alone.**

---

## 14. Accessibility

Target WCAG 2.2 AA on web with native parity.

```
text contrast ≥ 4.5:1
non-text and focus indicators ≥ 3:1
visible keyboard focus, never obscured by sticky UI
touch targets ≥ 48
no status by colour alone
dynamic type respected, wrapping rather than shrinking
screen reader labels and state announcements
reduced motion honoured
typed fallback everywhere a voice action exists
```

Live changes worth announcing: listening, character speaking, scene paused, connection
lost, reconnected, microphone unavailable. Not every animation frame.

Web must remain usable at 200% zoom and a 320 CSS px viewport.

---

## 15. Persistence

Screens depend on `ArchiveRepository` only.

```
native → SQLite
web    → IndexedDB
```

Web does not use SQLite WASM for archive persistence. Transcript, validated phrase
observations, skill observations and lapses commit atomically: a recap may never
render evidence the archive does not hold. Imports are size-bounded, schema-checked
and transactional — a malformed archive cannot partially mutate state.

A corrected transcript revision invalidates derived state that cited the superseded
revision.

---

## 16. QA

**PR-blocking visual regression:** 6 screens (Talk, Missions, Briefing, Live session,
Recap, Progress) × 3 widths (390, 840, 1440) × 2 themes = **36 snapshots**.

The harness is part of this requirement, not a follow-up. Without it the gate is
unenforceable.

Extended release coverage adds large type, French, Dutch, RTL, offline and error
states, further widths, and native device screenshots.

Before release, on physical devices: microphone granted and denied, network
interruption, typed fallback, large text, screen-reader smoke, reduced motion,
background/foreground, session end, export/import, delete data, headset/Bluetooth
where available.

---

## 17. Anti-patterns

```
purple AI gradient
app that reads as a chat messenger
character avatars at the centre of navigation
a fourth primary tab
more than one primary CTA per region
colour without a label or icon
text below the 12px floor for essential information
glass behind captions
full-screen modal dialogs for routine mobile navigation
hard-coded component colours or radii
skill progress derived from phrase substring matches
opaque ability scores or levels
official exam logos used casually
claiming certification
help hidden behind an obscure icon
ambiguous microphone state
a live session destroyed by an accidental back gesture
a lapse that visually erases demonstrated competence
```

---

## 18. Definition of done

- [ ] No screen hardcodes a brand colour or radius
- [ ] Light and dark themes complete on native and web
- [ ] All pairing contrast requirements hold
- [ ] Focus ring visible and offset where required
- [ ] Bottom navigation is exactly Talk, Missions, Progress
- [ ] Settings reachable from all three roots on compact and expanded
- [ ] Live session has explicit listening/speaking/paused/reconnecting/error
- [ ] Meaning reveal is recorded as support
- [ ] Recap shows provenance, never an opaque score
- [ ] Phrase and skill states are visibly distinct
- [ ] Lapse shows review due without demotion
- [ ] Legacy evidence is labelled
- [ ] Reduced motion is centralised
- [ ] All primary controls ≥ 48 × 48
- [ ] 36-snapshot visual gate runs in CI
- [ ] Evidence remains validator-authoritative

---

**End of specification.**