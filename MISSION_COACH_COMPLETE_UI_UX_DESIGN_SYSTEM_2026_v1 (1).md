# Mission Coach / Learn-By-RP — Complete UI/UX Design System & Cross-Platform Product UI Specification

> ## ⚠ SUPERSEDED — DO NOT IMPLEMENT FROM THIS DOCUMENT
>
> **Replaced by:** `MISSION_COACH_UI_UX_DESIGN_SYSTEM_v2.md`
>
> This document is retained as research input only. It is **not** implementation
> authority. It contains values and architecture that are known to be wrong:
>
> | Known wrong | Correct |
> |---|---|
> | Tamagui 2 required | NativeWind 4 + Tailwind 3 |
> | `#B4533A` brand | `#A7442F` — see the generated palette table |
> | Two dark palettes (§8 vs §125) with conflicting `raised` values | One canonical dark palette |
> | `#958A7D` interactive border | `#8A7F71` — 2.90:1 on canvas fails WCAG 1.4.11 |
> | `faint` used for dates, evidence counts, consent version | Removed; `muted` at ≥ 4.5:1 |
> | `brand` on `brandSoft` at 4.15:1 | Fixed in v2 palette |
> | Skill steady at 2 contexts | 4 contexts across 3 days |
> | Phrase and skill share promotion rules | Separate `PHRASE_POLICY` / `SKILL_POLICY` |
> | Skill evidence from phrase substring matching | `validated_explicit` only; legacy is migration-only |
> | SQLite WASM on web | IndexedDB web repository |
> | 1,120 blocking screenshots | 36 required PR snapshots |
> | `accessibilityLabel` examples written for Tamagui ARIA renames | React Native accessibility props |
> | Three conflicting monorepo shapes | One target shape; `src/design/` is current |
> | No compact Settings path | Header action on all three roots |
> | No RTL contract | Explicit RTL requirements |
> | `ContinueCard` listed but unspecified | Fully specified |
> | Progress tabs lead with Phrases | Action area first, Skills default tab |
>
> The original document continues below, unaltered, so the reasoning can still be
> read. **Do not copy any colour value, threshold, or stack decision from it.**
> The live palette lives in `src/design/tokens.ts` and is asserted by
> `tests/design.test.ts`.


# 0. Why this document exists

This document consolidates and resolves the design decisions from:

- `AMIKO_DESIGN_TEARDOWN_AND_ADAPTATION.md`
- `LEARNBYRP_CROSS_PLATFORM_UI_SPEC.md`
- `UI_UX_2026_AUDIT_AND_PATCH.md`
- `MISSION_COACH_MASTER_SPEC.md`
- `MISSION_COACH_COMPLETE_SKILL_MENU_ENGINE_v1.md`

It defines the **single canonical UI/UX system** for Mission Coach across mobile and web.

It covers:

- product visual identity
- framework and UI-library decision
- Tamagui usage policy
- color system
- typography
- spacing
- radius
- elevation
- motion
- iconography
- adaptive layout
- mobile navigation
- web navigation
- cards
- buttons
- chips
- sheets/dialogs
- forms
- voice UI
- conversation UI
- learning evidence UI
- skills UI
- exam-preparation UI
- every major screen
- responsive page organization
- accessibility
- dark mode
- content density
- interaction states
- component architecture
- repository organization
- QA and acceptance rules
- migration from the current Vite prototype

The purpose is to make UI decisions **deterministic**. A developer should not have to invent spacing, colors, card styles, responsive rules, or interaction patterns screen by screen.

---

# 1. Product design thesis

Mission Coach is not a generic chatbot and should not look like one.

It is a **voice-first practical language-learning workspace** where the user:

1. chooses or receives a real communication mission,
2. speaks with an AI character,
3. requests support only when needed,
4. receives a grounded recap,
5. keeps evidence-linked language,
6. encounters important patterns again in new contexts.

The visual product should communicate:

> **Calm concentration, practical confidence, and honest progress.**

It should not communicate:

> gamified addiction, AI spectacle, infinite social companionship, or generic chat.

---

# 2. Core product identity

## 2.1 Identity statement

**Warm Functional Editorial**

The product combines:

- warm editorial reading surfaces,
- task-focused interaction,
- restrained brand color,
- high-legibility language content,
- native-feeling controls,
- evidence-oriented progress.

Visual keywords:

```text
warm
calm
clear
editorial
human
focused
practical
trustworthy
quiet
high-legibility
```

Avoid:

```text
neon AI gradients
purple-blue generative AI clichés
over-glassmorphism
cartoon gamification
XP-heavy dashboards
busy analytics
large character portrait grids
romantic companion framing
overuse of shadows
overuse of pills
```

---

# 3. Framework and UI-library decision

## 3.1 Production stack

```text
Application
└── Expo SDK 57
    ├── React Native 0.86
    ├── React 19.2.x
    ├── Expo Router
    ├── New Architecture
    └── Web via React Native Web

Design system
└── Tamagui 2
    ├── custom Mission Coach theme
    ├── custom tokens
    ├── responsive media configuration
    ├── custom product components
    ├── Sheet / Dialog / Popover primitives where useful
    └── Reanimated driver when animation is required

Data/runtime
├── packages/core
├── packages/contracts
├── packages/content
└── packages/tokens/design

Persistence
├── native → SQLite
└── web → IndexedDB

Marketing
└── separate static/content-oriented site
```

## 3.2 Why Tamagui is now selected

Current Tamagui requirements are compatible with Expo SDK 57:

- React Native 0.81+,
- React 19+,
- TypeScript 5+,
- New Architecture for native.

Expo SDK 57 provides React Native 0.86 and React 19.2.x, so the stack is compatible.

The important architectural rule is:

> **Tamagui is the rendering/styling system. Mission Coach owns the design.**

Do not ship Tamagui's starter visual identity unchanged.

## 3.3 Compiler policy

### Phase 1

Start **without** the Tamagui compiler.

Reasons:

- reduce migration complexity,
- make debugging easier,
- stabilize tokens/components first,
- confirm web/native parity,
- avoid optimization work before component contracts settle.

### Phase 2

After component and screenshot parity is stable:

```text
evaluate compiler
→ measure actual web/native benefit
→ enable selectively
→ verify no component behavior changes
```

Compiler adoption is a performance optimization, not a prerequisite for the design system.

## 3.4 Tamagui package strategy

Recommended:

```text
tamagui
@tamagui/config
@tamagui/animations-reanimated
react-native-reanimated
react-native-gesture-handler
```

Use Tamagui for:

```text
View / XStack / YStack
Text primitives
Theme
media/adaptive styling
Button primitive
Input
Sheet
Dialog
Popover where appropriate
Switch
Select
Tabs/segmented structures where appropriate
ScrollView wrappers
```

Create Mission Coach wrappers for all product-facing components.

Never scatter raw Tamagui primitives across all screens without product abstractions.

Correct:

```tsx
<MissionCard />
<EvidenceCard />
<VoiceActivity />
<PrimaryButton />
<SupportSheet />
```

Avoid screen-specific styling like:

```tsx
<XStack bg="$orange7" br={19} p={13} ... />
```

inside every page.

---

# 4. Repository UI organization

Recommended monorepo:

```text
learn-by-rp/
├── apps/
│   ├── app/
│   │   ├── src/
│   │   │   ├── app/                    # Expo Router routes
│   │   │   ├── screens/                # screen composition
│   │   │   ├── ui/
│   │   │   │   ├── primitives/
│   │   │   │   ├── navigation/
│   │   │   │   ├── cards/
│   │   │   │   ├── learning/
│   │   │   │   ├── conversation/
│   │   │   │   ├── feedback/
│   │   │   │   └── forms/
│   │   │   ├── hooks/
│   │   │   ├── platform/
│   │   │   │   ├── voice/
│   │   │   │   ├── storage/
│   │   │   │   ├── share/
│   │   │   │   ├── permissions/
│   │   │   │   └── audio/
│   │   │   └── providers/
│   │   └── tamagui.config.ts
│   │
│   └── site/                           # public marketing/guides
│
├── packages/
│   ├── core/
│   ├── contracts/
│   ├── content/
│   ├── design/
│   │   ├── tokens.ts
│   │   ├── themes.ts
│   │   ├── typography.ts
│   │   ├── motion.ts
│   │   └── breakpoints.ts
│   └── i18n/
│
└── legacy/
    └── web-prototype/
```

---

# 5. Design principles

## P1 — One primary action

Every primary screen should make the next useful action obvious.

Examples:

```text
Talk → Start / Continue
Mission briefing → Start conversation
Live session → Speak
Recap → Continue / Done
Due practice → Answer
```

Never show three equally loud CTAs.

---

## P2 — Conversation is content

The spoken line is the hero of the live session.

The UI exists to support:

```text
listen
understand
respond
recover
continue
```

not to decorate the AI character.

---

## P3 — Evidence over scores

Prefer:

```text
Used independently in 3 situations
Used with help twice
Ready to practise
Needs another context
```

Avoid:

```text
Fluency 83%
Speaking score 712
Mastery 91%
```

unless the value has a transparent validated definition.

---

## P4 — Support is visible but not intrusive

Help is always reachable.

Help is never forced into the learner's face.

Support levels should be progressively revealing:

```text
1. intent hint
2. sentence starter
3. full example
4. explanation
```

---

## P5 — Skills and situations coexist

The user must be able to enter practice through either:

```text
"I need to practise a hotel check-in"
```

or:

```text
"I need to get better at asking for clarification"
```

Same engine; different discovery path.

---

## P6 — Platform-native behavior, product-native identity

The visual identity is shared.

Navigation material and system interaction may adapt.

Examples:

```text
iOS
→ system gestures
→ native-feeling sheets
→ optional control-layer glass

Android
→ predictive back
→ tonal surfaces
→ Material interaction expectations

Web
→ keyboard
→ hover enhancement
→ focus rings
→ expanded information density
```

---

# 6. Color system

## 6.1 Brand rule

Mission Coach uses **terracotta** for brand/action.

It uses **teal** for language-learning semantic content.

It uses **green** only for verified positive evidence/success.

It uses **amber** for partial/pending attention.

It uses **red** for destructive/error.

Do not use one semantic color for multiple meanings.

---

# 7. Light theme

| Token | Hex | Use |
|---|---:|---|
| `canvas` | `#FAF9F5` | main background |
| `surface` | `#FFFFFF` | cards, main panels |
| `surfaceSubtle` | `#F4F1EB` | secondary panel |
| `surfaceSunken` | `#EEE9E1` | inputs / recessed |
| `surfaceHover` | `#F7F3EC` | web hover |
| `ink` | `#1C1917` | highest emphasis |
| `body` | `#57534E` | normal body |
| `muted` | `#706C66` | secondary labels |
| `faint` | `#9A948C` | decorative metadata only |
| `border` | `#E6E0D7` | default border |
| `borderStrong` | `#D4CCC1` | stronger separator |
| `brand` | `#B4533A` | primary button/action |
| `brandHover` | `#9F472F` | hover |
| `brandPressed` | `#873B29` | pressed |
| `brandSoft` | `#F7E8E2` | warm highlighted card |
| `brandSoftStrong` | `#EFD5CB` | selected warm surface |
| `language` | `#246B63` | target-language semantic |
| `languageHover` | `#1E5D56` | target-language hover |
| `languageSoft` | `#E4F2EF` | phrase card background |
| `languageSoftStrong` | `#CDE6E1` | selected phrase |
| `success` | `#2D6B49` | independent/success |
| `successSoft` | `#E5F1E9` | success background |
| `warning` | `#8A5A12` | partial/pending |
| `warningSoft` | `#F7EDD8` | warning background |
| `danger` | `#B42318` | error/destructive |
| `dangerSoft` | `#FBE8E6` | error background |
| `info` | `#356C96` | informational status |
| `infoSoft` | `#E5EFF7` | informational background |
| `focus` | `#246B63` | focus outline |
| `scrim` | `rgba(28,25,23,0.52)` | modal/sheet backdrop |

---

# 8. Dark theme

| Token | Hex | Use |
|---|---:|---|
| `canvas` | `#171613` | app background |
| `surface` | `#211F1B` | main cards |
| `surfaceSubtle` | `#27241F` | secondary surface |
| `surfaceSunken` | `#12110F` | recessed |
| `surfaceHover` | `#302C26` | hover |
| `ink` | `#F7F4EE` | heading |
| `body` | `#D4CEC4` | body |
| `muted` | `#AFA79C` | secondary |
| `faint` | `#817A70` | faint metadata |
| `border` | `#3A352E` | default border |
| `borderStrong` | `#514A40` | strong border |
| `brand` | `#E98B6D` | accent text/icon |
| `brandButton` | `#B4533A` | CTA background |
| `brandPressed` | `#963F2D` | CTA pressed |
| `brandSoft` | `#38241D` | warm surface |
| `language` | `#7CC7BE` | language semantic |
| `languageSoft` | `#17332F` | language surface |
| `success` | `#7BC59A` | evidence positive |
| `successSoft` | `#193326` | positive surface |
| `warning` | `#E0B466` | attention |
| `warningSoft` | `#3B2D17` | attention surface |
| `danger` | `#FF8A80` | error/destructive |
| `dangerSoft` | `#3A1E1B` | error surface |
| `info` | `#86B7DF` | informational |
| `infoSoft` | `#1B2B38` | informational surface |
| `focus` | `#7CC7BE` | focus outline |
| `scrim` | `rgba(0,0,0,0.64)` | overlays |

---

# 9. Color usage rules

## Primary CTA

```text
background: brand / brandButton
foreground: white
```

Use brand only for the most important interactive action.

Good:

```text
Start conversation
Continue
Save changes
Practise now
```

Do not use brand fill for:

```text
every chip
every icon
every section title
every card
```

---

## Language color

Use teal for:

```text
target-language phrase
language-learning hint
meaning toggle
target-language icon
skill/pattern semantic highlights
```

Do not use teal for generic success.

---

## Success

Use green for:

```text
used independently
task achieved
saved
connected
verified
```

---

## Warning

Use amber for:

```text
used with help
partial completion
assessment pending
needs review
connection degraded
```

---

## Danger

Use red only for:

```text
delete
end destructive confirmation
microphone failure
hard error
invalid state
```

---

# 10. Typography system

## 10.1 Typeface strategy

### Display / editorial

**Newsreader**

Use only for:

```text
screen titles
mission titles
major section headlines
marketing headlines
```

Do not use it for dense UI or target-language conversation.

### UI/body

Use platform/system UI font.

```text
iOS → SF family
Android → system/Roboto
Web → system-ui
```

### Target-language text

Use platform-appropriate system font with script fallback.

Examples:

```text
Latin → system UI
Japanese → native Japanese system font
Arabic future support → native Arabic-capable system font
```

Avoid forcing a Latin display font onto script-heavy conversation.

---

# 11. Type roles

| Token | Compact size | Line height | Weight | Use |
|---|---:|---:|---|---|
| `displayLg` | 32 | 38 | 600 | hero |
| `displayMd` | 28 | 34 | 600 | major screen heading |
| `titleLg` | 24 | 30 | 600 | mission / conversation title |
| `titleMd` | 20 | 26 | 600 | card section |
| `titleSm` | 18 | 24 | 600 | card title |
| `bodyLg` | 17 | 25 | 400 | main readable text |
| `bodyMd` | 15 | 22 | 400 | UI body |
| `bodySm` | 14 | 20 | 400 | supporting text |
| `labelLg` | 16 | 20 | 600 | buttons |
| `labelMd` | 14 | 18 | 600 | chips/control |
| `caption` | 13 | 18 | 500 | metadata |
| `captionSm` | 12 | 16 | 500 | low-priority metadata |
| `conversation` | 26 | 35 | 500 | current spoken line |

Rules:

- normal reading text should generally stay at 16–17 effective px/pt,
- do not create more than ~6 visibly different sizes on one screen,
- Dynamic Type / user scaling must be respected,
- layouts must survive 200% browser zoom,
- do not truncate critical language-learning text.

---

# 12. Spacing system

```text
space.0  = 0
space.1  = 4
space.2  = 8
space.3  = 12
space.4  = 16
space.5  = 20
space.6  = 24
space.8  = 32
space.10 = 40
space.12 = 48
space.16 = 64
```

Usage:

```text
4  → fine icon/text gap
8  → small control gap
12 → chip/card internals
16 → standard card padding compact
20 → standard card padding large
24 → section gap
32 → major section gap
48 → page separation
```

Never invent:

```text
13
17
19
23
```

unless a platform-safe-area requirement forces a calculated value.

---

# 13. Radius system

```text
radius.xs       = 8
radius.sm       = 10
radius.control  = 14
radius.card     = 20
radius.hero     = 24
radius.sheet    = 28
radius.pill     = 999
```

Use:

```text
buttons → control or pill
inputs → control
standard card → card
hero card → hero
sheet → sheet
chips → pill
```

Do not use a different radius on every card.

---

# 14. Border system

```text
border.hairline = platform hairline / 1
border.default  = 1
border.focus    = 2
```

Default cards:

```text
1px border
minimal or no shadow
```

Selected cards:

```text
brand/language border
tonal background
```

Avoid large floating shadows.

---

# 15. Elevation system

Mission Coach uses **tonal depth before shadow depth**.

## Level 0

```text
canvas
```

## Level 1

```text
surface
1px border
```

## Level 2

```text
raised surface
subtle shadow
```

Use Level 2 for:

```text
floating support panel
dialog
popover
temporary sticky control
```

Do not make every card elevated.

---

# 16. Shadow tokens

Light:

```text
shadow.card:
0 1px 2px rgba(28,25,23,0.04)

shadow.floating:
0 8px 24px rgba(28,25,23,0.10)

shadow.dialog:
0 20px 48px rgba(28,25,23,0.18)
```

Dark:

Use weaker or nearly no shadow; rely on tonal surfaces and borders.

---

# 17. Iconography

Recommended product icon family:

**Lucide**

Rules:

```text
16 → inline small
20 → normal UI
24 → navigation / primary control
28 → special empty state
```

Stroke:

```text
1.75–2.0
```

Never mix:

```text
Lucide
Material icons
SF Symbols style
random emoji icons
```

in the same generic product UI.

Platform-native controls may render platform-native glyphs internally.

---

# 18. Touch target rules

Universal product floor:

```text
minimum interactive hit target = 48 × 48
```

Visible icon can still be:

```text
20 × 20
24 × 24
```

Adjacent live-session controls:

```text
minimum gap = 8
```

This is especially important for:

```text
mute
help
type
end
replay
meaning
```

---

# 19. Focus system for web

Every keyboard interactive element must have a visible focus state.

Recommended:

```text
2px focus outline
2px offset
color = focus
```

Focus cannot be hidden behind:

```text
sticky headers
bottom nav
support panel
cookie/consent banner
sheet
```

---

# 20. Motion system

## Motion tokens

```text
motion.instant  = 80ms
motion.short    = 140ms
motion.standard = 220ms
motion.long     = 320ms
```

Use spring behavior for:

```text
sheet presentation
selected card
pressed feedback
```

Use opacity/translate for:

```text
page content
small notices
```

No gratuitous motion.

---

# 21. Reduced motion

Under Reduce Motion / `prefers-reduced-motion`:

```text
voice pulse → static icon + label
spring → fade
card scale → color/border state
wave animation → static meter
parallax → disabled
```

---

# 22. Responsive/adaptive breakpoints

Use width, never user-agent.

```text
Compact
< 600

Medium
600–839

Expanded
840–1199

Large
1200–1599

Extra Large
>= 1600
```

---

# 23. Global layout behavior

## Compact

Typical:

```text
phone portrait
narrow browser
```

Navigation:

```text
bottom tab bar
```

Page:

```text
single column
16px horizontal gutter
```

Live session:

```text
full screen
tab bar hidden
```

---

## Medium

Typical:

```text
portrait tablet
foldable
small resized desktop window
```

Navigation:

```text
bottom bar or compact rail
```

Page:

```text
24px gutter
1–2 columns
```

---

## Expanded

Typical:

```text
landscape tablet
laptop
```

Navigation:

```text
left rail
```

Page:

```text
master-detail where useful
32px gutter
```

---

## Large

Typical:

```text
desktop
large tablet
```

Navigation:

```text
left rail
```

Page:

```text
content max width
two/three functional panes only when needed
```

---

## Extra Large

Do not stretch content infinitely.

Maximum widths:

```text
normal app content: 1180
conversation column: 720
reading/recap column: 760
wide catalog: 1320
```

---

# 24. Navigation architecture

Canonical application navigation:

```text
Talk
Missions
Progress
```

Never restore:

```text
Chat
Characters
Vocabulary
Progress
```

Characters are mission participants, not primary navigation.

Vocabulary/phrases belong inside Progress and review flows.

---

# 25. Compact navigation

Bottom tabs:

```text
┌─────────────────────────────┐
│ Talk     Missions   Progress│
│  ◉          ◇          ✓    │
└─────────────────────────────┘
```

Rules:

- 3 destinations only,
- text labels always shown,
- 48+ hit targets,
- no tab indicator based only on color,
- badge only for due practice,
- hidden during live session.

---

# 26. Expanded navigation

Left rail:

```text
┌───────┐
│ logo  │
│       │
│ Talk  │
│ Miss. │
│ Prog. │
│       │
│       │
│ Sett. │
└───────┘
```

Settings is secondary and anchored lower.

Do not add unrelated navigation just because desktop has room.

---

# 27. Mobile top bar

Default:

```text
[Back]    Screen title                  [...]
```

Talk root:

```text
Mission Coach                language / avatar
```

Live session:

```text
mission title
short goal
                         End
```

Avoid a persistent desktop-style mega header on mobile.

---

# 28. Web app top area

Expanded root screens:

```text
left rail + page title + page actions
```

Do not replicate a website navbar inside the app.

---

# 29. Core button components

## PrimaryButton

Use for one primary action.

```text
height: >= 48
radius: 14
background: brand
foreground: white
label: 16 semibold
horizontal padding: 20
```

States:

```text
default
hover (web)
pressed
focused
disabled
loading
```

---

## SecondaryButton

```text
surface background
border
ink text
```

Use for:

```text
View details
Try another
Cancel non-destructive
```

---

## TertiaryButton

Text/icon, no filled container.

Use sparingly.

---

## DestructiveButton

Red only for actual destructive action.

Never use red for ordinary "End conversation" unless ending will discard unsaved work.

---

# 30. IconButton

```text
48 × 48 hit area
24 icon
radius 14 or circle
```

Every icon-only button needs:

```text
accessibilityLabel
tooltip/title on web
```

---

# 31. Chips

Chips are filters or compact metadata—not miniature buttons everywhere.

Types:

```text
FilterChip
SkillChip
DomainChip
EvidenceTag
StatusChip
```

Height:

```text
32–36 visual
48 hit target where interactive
```

---

# 32. Segmented control

Use for mutually exclusive small sets.

Best example:

```text
[ Focus ] [ Situations ] [ Exams ]
```

Not for 8 categories.

---

# 33. Search field

Height:

```text
48
```

Contents:

```text
search icon
placeholder
clear action when non-empty
```

Web:

```text
Cmd/Ctrl + K may focus mission search
```

Do not use global command palette as a core mobile interaction.

---

# 34. Standard Card

```text
surface
1px border
radius.card
padding 16 compact / 20 expanded
minimal shadow
```

Every card must have a clear purpose.

Avoid nesting cards inside cards more than one level.

---

# 35. Hero Card

For one important action.

```text
radius.hero
20–24 padding
slightly warmer/tonal surface
one primary CTA
```

Use at most one hero card above the fold.

---

# 36. MissionCard

Required visible information:

```text
domain
mission title
one-sentence task
primary skill(s)
estimated time
difficulty/support metadata
```

Example:

```text
┌─────────────────────────────────┐
│ TRAVEL                          │
│ Hotel check-in                  │
│                                 │
│ Confirm your booking and ask    │
│ about breakfast.                │
│                                 │
│ Clarifying · Requests           │
│ 4 min · Guided              →   │
└─────────────────────────────────┘
```

Do not show:

```text
full character biography
five tags
long setting paragraph
all phrases
all completion predicates
```

in the catalog card.

---

# 37. SkillCard

Example:

```text
┌─────────────────────────────────┐
│ Understand & clarify            │
│                                 │
│ Ask people to repeat, explain,  │
│ slow down, or confirm meaning.  │
│                                 │
│ 8 practice missions         →   │
└─────────────────────────────────┘
```

Progress variation:

```text
Growing
2 independent contexts
```

if evidence exists.

---

# 38. ExamProgramCard

Example:

```text
┌─────────────────────────────────┐
│ FRENCH                          │
│ DELF                            │
│ A1 · A2 · B1 · B2               │
│                                 │
│ Official-format-aware practice  │
│ Not an official exam score.     │
│                             →   │
└─────────────────────────────────┘
```

Exam brand/logos should not be copied unless usage rights are clear.

Use exam names descriptively.

---

# 39. DuePracticeCard

```text
┌─────────────────────────────────┐
│ READY TO PRACTISE               │
│ 4 phrases · about 3 min         │
│                                 │
│ Two need another independent    │
│ use.                            │
│                     [Practise]  │
└─────────────────────────────────┘
```

No streak pressure.

---

# 40. EvidenceCard

Required:

```text
phrase / skill
evidence status
context
source quote
time/date
support state
```

Example:

```text
┌─────────────────────────────────┐
│ "Pouvez-vous préciser ?"        │
│ ✓ Used independently            │
│                                 │
│ Work meeting · Sep 29           │
│                                 │
│ You said:                       │
│ "Pouvez-vous préciser ce point?"│
│                                 │
│ [View evidence]             ⋯   │
└─────────────────────────────────┘
```

Overflow:

```text
Edit
Hide
Mark evidence wrong
```

---

# 41. PhraseCard

Variants:

```text
due
supported
growing
steady
```

Do not communicate these through color alone.

Example:

```text
Growing
"Ça marche pour vous ?"
Does that work for you?
Used independently once
```

---

# 42. Scene visual style

Mission art should be **scene-first**, not character-first.

Good imagery:

```text
café counter
hotel reception
parcel slip
train departure board
office meeting table
pharmacy counter
museum ticket desk
airport check-in desk
```

Style:

```text
simple editorial illustration
soft warm neutrals
subtle depth
no hyperrealistic AI faces
no photorealistic romantic companion identity
```

Characters may appear, but they should not dominate product navigation.

---

# 43. Illustration palette

Scene art may use:

```text
brand terracotta
warm sand
deep teal
muted blue
sage
ink
```

Keep saturation lower than CTA/UI colors.

The UI must remain readable if all illustrations are removed.

---

# 44. Bottom sheets

Compact usage:

```text
Help
phrase meaning detail
filters
secondary actions
evidence actions
consent explanation
```

Sheet radius:

```text
28
```

Sheet behavior:

```text
drag handle optional
dismiss gesture
escape on web
focus trap
screen reader title
safe-area aware
keyboard aware
```

---

# 45. Dialogs

Use centered dialog on expanded layouts for:

```text
destructive confirmation
critical consent
small non-navigation choice
```

Do not use desktop modal dialogs everywhere on phones.

---

# 46. Toasts / notices

For reversible/non-critical feedback:

```text
Saved
Phrase hidden
Practice updated
```

Use text + icon.

Do not use toast for errors requiring action.

---

# 47. Empty states

Structure:

```text
small icon / illustration
clear title
one short explanation
one recovery action
```

Example:

```text
No practice due

You're caught up for now.

[Choose a mission]
```

---

# 48. Error states

Always answer:

```text
what happened?
what can the user do?
will their work be lost?
```

Example:

```text
Connection lost

Your completed turns are saved.
Reconnect to continue the scene.

[Reconnect]
[End and keep progress]
```

---

# 49. VoiceActivity component

States:

```text
idle
connecting
listening
speaking
muted
paused
reconnecting
error
```

Visual:

```text
icon
state label
subtle motion
```

Never only an animated colored dot.

Examples:

```text
● Listening
◉ Speaking
Ⅱ Scene paused
↻ Reconnecting
```

---

# 50. CaptionBlock

This is one of the most important components.

```text
character name
current target-language line
meaning toggle
optional replay
```

Recommended current-line type:

```text
24–28
medium
high line height
```

Example:

```text
Receptionist

"Vous avez une réservation
à quel nom ?"

[Show meaning] [Replay]
```

---

# 51. MeaningLine

Default:

```text
hidden
```

On reveal:

```text
soft language surface
body text
"Meaning" label
```

The reveal writes a support exposure.

It is not just a visual state.

---

# 52. Transcript history

Transcript is secondary to the current line.

Current line:

```text
large, central
```

History:

```text
smaller
quieter
scrollable
```

Do not make the app primarily a bubble messenger.

---

# 53. User speech display

Recognized speech should be visibly distinct from:

```text
suggested reply
AI text
edited learner text
```

Labels may include:

```text
You
Heard
Edited
Suggested
```

Do not silently replace ASR output.

---

# 54. SupportSheet

Compact:

```text
Need help?

Give me a hint
Help me start
Help me say it
Explain what they said
Speak more slowly
```

Each support level has:

```text
icon
title
one short description
```

Do not show a large explanatory paragraph.

---

# 55. Support panel — desktop

Expanded live session:

```text
┌──────┬───────────────────────────────┬────────────────────┐
│ Rail │ Conversation                  │ Support            │
│      │                               │                    │
│      │ Current line                  │ Hints              │
│      │                               │                    │
│      │ Voice state                   │ Phrases seen       │
│      │                               │                    │
│      │ Transcript                    │ Support log        │
│      │                               │                    │
│      │ Controls                      │                    │
└──────┴───────────────────────────────┴────────────────────┘
```

Support panel width:

```text
280–340
```

Conversation stays primary.

---

# 56. Live controls

Compact bottom controls:

```text
[Mute] [Help] [Type] [End]
```

Each:

```text
48+ hit target
icon + visible label where space allows
```

If only icons fit:

```text
labels remain accessible
```

Primary speaking interaction is microphone state itself, not a giant decorative orb.

---

# 57. Freeze state

When frozen:

```text
actor playback stops
mic behavior is explicit
screen says "Scene paused"
support sheet/panel becomes prominent
```

Example:

```text
Scene paused

Take your time. The conversation
will continue when you're ready.

[Hint]
[Help me say it]
[Resume]
```

---

# 58. Onboarding

Goal:

> first meaningful conversation in about one minute.

## Step 1 — target language

```text
What are you learning?

French
Dutch
English
Spanish
...
```

## Step 2 — explanation language

```text
What language should help be in?
```

## Step 3 — comfort

```text
How comfortable are you?

Just starting
I can manage simple conversations
I can handle everyday conversations
Not sure
```

Do not call this a proficiency diagnosis.

## Step 4 — goal

```text
What do you want to use the language for?

Everyday life
Work
Travel
Study
Exam preparation
Social
Explore
```

## Step 5 — focus

Optional:

```text
What would you most like to improve?

Speaking without freezing
Understanding people
Finding the right words
Explaining clearly
Handling difficult conversations
Not sure
```

## Step 6 — microphone and data

Separate:

```text
Voice processing
Saved learning analysis
```

No prechecked consent.

## Step 7

Launch first mission.

---

# 59. Talk screen

## Product question

Talk must answer:

> What is the best thing I can do right now?

---

## Compact

```text
┌──────────────────────────────┐
│ Good evening                 │
│ French · Guided              │
│                              │
│ ┌──────────────────────────┐ │
│ │ TODAY'S MISSION          │ │
│ │ Ask for clarification    │ │
│ │ Pharmacy · 4 min         │ │
│ │                          │ │
│ │ You used this with help  │ │
│ │ in your last session.    │ │
│ │                  [Start] │ │
│ └──────────────────────────┘ │
│                              │
│ Ready to practise            │
│ ┌──────────────────────────┐ │
│ │ 4 phrases · ~3 min       │ │
│ │              [Practise]  │ │
│ └──────────────────────────┘ │
│                              │
│ Choose another mission  →    │
└──────────────────────────────┘
```

---

## Medium

Two secondary cards beside each other:

```text
hero mission
↓
due practice | transfer mission
```

---

## Expanded

```text
rail
+
main content max width 960
```

Hero width full.

Below:

```text
Due practice | Recommended transfer
```

No dashboard charts.

---

# 60. Recommendation reason

Every AI/system recommendation must have a human-readable reason.

Good:

```text
Reuses two phrases from your café practice.
```

Good:

```text
You asked for help with clarification last time.
```

Bad:

```text
Recommended for you.
```

Bad:

```text
AI score 0.82.
```

---

# 61. Missions screen

Primary views:

```text
Focus
Situations
Exams
```

Search applies across the selected view.

---

# 62. Missions — Compact

```text
Missions

[ Search missions                  ]

[ Focus ] [ Situations ] [ Exams ]

Recommended
[ mission card ]

Focus areas
[ Understand & clarify ]
[ Ask for what you need ]
[ Explain clearly ]
...
```

---

# 63. Missions — Expanded

```text
┌──────┬──────────────────────────────────────────────┐
│ Rail │ Missions                                    │
│      │ [Search.................................]   │
│      │                                              │
│      │ [Focus] [Situations] [Exams]                │
│      │                                              │
│      │ Filters       Results                        │
│      │ ┌────────┐    ┌──────────┐ ┌──────────┐      │
│      │ │level   │    │ mission  │ │ mission  │      │
│      │ │time    │    └──────────┘ └──────────┘      │
│      │ │mode    │                                    │
│      │ └────────┘                                    │
└──────┴──────────────────────────────────────────────┘
```

Do not show a permanent left filter panel under 840.

---

# 64. Focus menu

Learner-facing families:

```text
Start & keep a conversation
Understand & clarify
Ask for what you need
Explain & describe
Give your opinion
Recover when communication breaks
Social communication
Work & study communication
Mediation
Exam task skills
```

Do not expose every internal atomic skill on the first screen.

---

# 65. Situation menu

```text
Daily life
Work
Travel
Study
Health communication
Entertainment & social
Sports
```

Professional role packs:

```text
inside Work / Professional
```

AI character role:

```text
filter or mission attribute
```

not a main top-level section.

---

# 66. Exam menu

```text
Exam preparation
├── English
├── French
└── Dutch
```

English:

```text
IELTS
TOEFL iBT
PTE Academic
Cambridge English
```

French:

```text
DELF
DALF
TCF
TEF
```

Dutch:

```text
Belgium
├── Werkenvoor.be language tests
├── CNaVT
└── ITNA

Netherlands
└── Staatsexamen NT2
```

---

# 67. Exam level screen

Example:

```text
DELF

Choose a level

A1
A2
B1
B2

About DELF
Practice uses current reviewed task formats.
Mission Coach does not issue DELF scores or certificates.
```

---

# 68. Exam section screen

Example:

```text
DELF B1

Speaking
Listening
Reading
Writing
```

For a voice-first MVP:

```text
Speaking → available
other sections → planned / available only if implemented
```

Never visually imply unsupported exam coverage.

---

# 69. Exam task card

```text
Interaction exercise

Speak with an interlocutor and
handle a practical exchange.

Skills:
Ask questions · clarify · respond

~5 min

[Practise]
```

Official timing/task details must come from versioned reviewed exam definitions.

---

# 70. Mission briefing

## Compact

Full-screen route.

```text
Back

TRAVEL
Hotel check-in

A busy hotel desk in Brussels.

You will speak with:
Receptionist

YOUR GOAL
Confirm your reservation and
ask when breakfast is served.

STRETCH
Ask whether late checkout is possible.

PRACTICE MODE
[Immersion]
[Guided]
[Focused]

Cold attempt
[ on ]

Useful phrases
Hidden until requested

────────────────────
[ Start conversation ]
```

Primary CTA sticky above safe area.

---

## Expanded

Master-detail:

```text
mission list
|
briefing detail
```

Do not open a centered modal for the core mission flow on desktop.

Use a route.

---

# 71. Mode selector

Cards/segments:

```text
Immersion
Target language first.
Help only when you ask.

Guided
Hints and explanations available.

Focused
Practice selected skills or phrases.
```

Never use labels without explanations the first time.

---

# 72. Cold attempt

Do not make "cold attempt" sound punitive.

UI wording:

```text
Try first without seeing phrases
```

Secondary explanation:

```text
You can still ask for help during the conversation.
```

---

# 73. Live session — compact

```text
┌────────────────────────────────┐
│ Hotel check-in            End  │
│ Goal: confirm your booking     │
├────────────────────────────────┤
│                                │
│ Receptionist                   │
│                                │
│ "Vous avez une réservation     │
│  à quel nom ?"                 │
│                                │
│ [Show meaning] [Replay]        │
│                                │
│                                │
│            ● Listening         │
│        Speak when ready        │
│                                │
│ Previous conversation          │
│ ...                            │
│                                │
├────────────────────────────────┤
│ [Mute] [Help] [Type] [End]     │
└────────────────────────────────┘
```

---

# 74. Live session — expanded

```text
┌───────┬─────────────────────────────────┬─────────────────────┐
│ Rail  │ Hotel check-in                  │ Support             │
│       │ Confirm your booking            │                     │
│       │                                 │ Need help?          │
│       │ Receptionist                    │ Hint                │
│       │                                 │ Sentence starter    │
│       │ "Vous avez une réservation..."  │ Help me say it      │
│       │                                 │ Explain             │
│       │ [Show meaning] [Replay]         │                     │
│       │                                 │ Phrases seen        │
│       │ ● Listening                     │ ...                 │
│       │                                 │                     │
│       │ Transcript                      │ Support used        │
│       │                                 │ ...                 │
│       │ [Mute] [Type] [End]             │                     │
└───────┴─────────────────────────────────┴─────────────────────┘
```

Support panel may collapse.

---

# 75. Typed fallback

Typed mode is a fallback, not a separate learning product.

Input:

```text
min height 48
send button 48
keyboard-aware
```

Show clearly:

```text
Typing instead of speaking
```

The evidence modality remains different.

---

# 76. Session state messaging

## Connecting

```text
Connecting…
Your mission will start when audio is ready.
```

## Reconnecting

```text
Connection interrupted
Your completed turns are saved.
Reconnecting…
```

## Mic denied

```text
Microphone access is off

Enable microphone access in settings,
or continue by typing.

[Open settings]
[Type instead]
```

## Scene frozen

```text
Scene paused
Take your time.
```

---

# 77. Back behavior during live session

Back gesture/button must not silently destroy a session.

Prompt:

```text
Leave this conversation?

Your completed turns are saved.

[Stay]
[End and keep progress]
```

If the runtime supports resumability:

```text
[Pause and return later]
```

may be available.

---

# 78. Recap screen

## Compact structure

```text
Mission complete

Hotel check-in
You confirmed the booking and
asked about breakfast.

WHAT YOU USED

[ evidence card ]
[ evidence card ]

ONE THING TO TRY NEXT
...

NEXT
Try the same skill in another situation
[Start next mission]

[Done]
```

---

# 79. Recap outcome language

Prefer:

```text
Goal achieved
Partly achieved
Conversation changed direction
Assessment unavailable
```

Avoid:

```text
Perfect
Failed
Bad
Fluent
```

---

# 80. Evidence actions

Do not put four buttons on every card.

Use:

```text
View evidence
⋯
```

Overflow:

```text
Edit my saved phrase
Hide from progress
This evidence is wrong
```

---

# 81. Progress screen

Top order:

```text
Ready to practise
Skills
Phrases
History
```

This makes the next action more prominent than analytics.

---

# 82. Progress — Compact

```text
Progress

READY TO PRACTISE
4 phrases · 2 skills
[Practise now]

SKILLS
Understand & clarify
Growing
2 independent contexts

Ask for information
Steady
4 independent contexts

PHRASES
...

HISTORY
...
```

---

# 83. Progress — Expanded

Master/detail:

```text
┌───────┬───────────────────────┬────────────────────────────┐
│ Rail  │ Skills / phrases list │ Selected evidence detail   │
└───────┴───────────────────────┴────────────────────────────┘
```

Selected evidence detail shows:

```text
timeline
contexts
quotes
support
source session
```

---

# 84. Skill state language

Canonical:

```text
New
Supported
Growing
Steady
```

Optional descriptor:

```text
Supported
Used with help
```

```text
Growing
Used independently, but needs more contexts
```

```text
Steady
Used independently across several situations
```

---

# 85. Skill detail

```text
Understand & clarify

Growing

You have used this independently
in 2 different situations.

Evidence
✓ Hotel check-in
✓ Work meeting
○ DELF B1 interaction — used with help

Practice next
[Pharmacy question]
```

No hidden score required.

---

# 86. Phrase detail

```text
"Pouvez-vous préciser ?"

Could you clarify?

Growing

Usage note
...

Evidence timeline
Sep 29 · Work meeting · Independent
Sep 24 · Hotel · Assisted

Next review
Oct 3

[Practise]
```

---

# 87. Due practice screen

Prompt from meaning/context first.

Example:

```text
How would you ask someone to clarify?

[Speak]

or

[Type instead]
```

Only after answer:

```text
target phrase
learner production
difference/feedback
```

If answer was revealed:

```text
that attempt cannot become independent evidence
```

---

# 88. History

Session list:

```text
date
mission name
domain
mode
outcome
evidence count
```

Do not derive names from IDs in the UI.

Use mission snapshot/title stored with the session.

---

# 89. Settings structure

```text
Settings

Learning
├── Target language
├── Explanation language
├── Default practice mode
└── Conversation difficulty

Voice & audio
├── Playback
├── Speech speed
├── Input/output device where available
└── Audio behavior

Accessibility
├── Follow system text size
├── Reduce motion
└── Captions

Privacy & data
├── Voice processing consent
├── Saved analysis consent
├── Data retention
├── Export learning archive
├── Delete session
└── Delete all learning data

Appearance
├── System
├── Light
└── Dark

About
├── Help
├── Privacy
├── Terms
└── App version
```

---

# 90. Privacy screen

Do not bury consent inside generic settings.

Each processing scope has:

```text
status
what is processed
why
where
what changes if disabled
```

Example:

```text
Voice processing
Accepted

Allows your speech to be processed
during live conversation.

[Change]
```

---

# 91. Theme setting

Recommended:

```text
System
Light
Dark
```

Default:

```text
System
```

Do not invent a user-visible name like:

```text
Anthropic Slate
```

---

# 92. Web app design

The web app should not look like a stretched phone.

Expanded structure:

```text
persistent navigation rail
bounded content
contextual second/third panes
keyboard support
visible hover states
```

But all learning behavior remains identical.

---

# 93. Marketing website

Marketing is a separate concern.

Recommended public structure:

```text
/[locale]/
/[locale]/try
/[locale]/learn/{language}
/[locale]/skills/{skill}
/[locale]/guides/{language}/{topic}
/[locale]/exams/{program}
/[locale]/privacy
/[locale]/terms
```

Marketing may use:

```text
stronger editorial typography
larger illustrations
larger spacing
```

The app itself remains denser and task-focused.

---

# 94. Landing page visual structure

```text
HEADER
logo
How it works
Languages
Exam practice
Guides
[Try a mission]

HERO
Practise the conversations you'll actually have.
Keep the language you needed.

[Try a mission]
[Get the app]

SCENE STRIP
café
parcel
work
hotel
travel

LIVE DEMO 1
Hear it / reveal meaning

LIVE DEMO 2
Freeze and get help

LIVE DEMO 3
See the same skill return later

HOW IT WORKS
Choose → Speak → Keep → Reuse

WHY DIFFERENT
Evidence, not an opaque fluency score.

GUIDES

FAQ

FINAL CTA
```

---

# 95. No-signup demo

Visual boundary:

```text
Demo mode
3–5 turns
no persistence unless user opts in
```

Before microphone:

```text
Your voice will be processed to run this practice conversation.
```

Required before public launch:

```text
guest token
rate limiting
server-side mission lookup
request validation
usage quotas
```

---

# 96. Liquid Glass policy

On iOS, glass may be used for:

```text
navigation/control layer
tab/nav controls
small floating system controls
```

Never use glass behind:

```text
target-language captions
mission card text
evidence cards
progress lists
long reading content
```

Content remains opaque and high contrast.

Android should use native/tonal Material behavior rather than simulated Apple glass.

Web should not imitate Liquid Glass simply for trendiness.

---

# 97. Material / Android policy

Android behavior should honor:

```text
predictive back
edge-to-edge
safe insets
48dp interaction targets
tonal surfaces
adaptive rail layouts
```

Brand colors remain controlled by Mission Coach.

Do not allow wallpaper-derived dynamic color to redefine:

```text
success
warning
danger
evidence meanings
```

---

# 98. Accessibility standard

Target:

```text
WCAG 2.2 AA on web
strong native accessibility parity
```

Required:

```text
text contrast >= 4.5:1 normal text
UI/focus indicators >= 3:1 where applicable
visible keyboard focus
focus not obscured
touch target >= 48 app-wide
no status communicated by color only
dynamic type / text scaling
screen reader labels
screen reader state announcements
reduced motion
captions
typed fallback
```

---

# 99. Screen reader announcements

Announce important live changes:

```text
"Listening"
"Character speaking"
"Scene paused"
"Connection lost"
"Reconnected"
"Microphone unavailable"
```

Do not announce every animation update.

---

# 100. Web zoom/reflow

Application must remain usable at:

```text
200% zoom
320 CSS px viewport
```

Avoid:

```text
fixed text heights
critical horizontal scroll
hidden focus behind sticky UI
```

---

# 101. Keyboard web shortcuts

Optional expanded/web enhancement:

```text
M → mute
H → help
Space → contextual start/stop only when safe
Esc → close sheet/dialog
```

Never make shortcuts the only interaction method.

Document them in a help panel.

---

# 102. Data visualization

Mission Coach should use almost no chart-first visualization in R1.

Preferred:

```text
lists
timelines
evidence counts
context tags
status text
```

If charts are introduced later:

```text
they must be explainable
not suggest unsupported proficiency precision
```

---

# 103. Microcopy style

Voice:

```text
calm
direct
adult
non-judgmental
short
```

Avoid:

```text
Amazing!!!
You're a superstar!
Perfect streak!
Crush your goals!
```

Use:

```text
Nice — you handled the request without help.
```

or:

```text
You got the main point across.
```

---

# 104. Status wording

Prefer:

```text
Used with help
Used independently
Needs another context
Ready to practise
Assessment pending
```

Avoid:

```text
Weak
Poor
Failed
Low level
```

---

# 105. Flag usage

Flags may be used to indicate locale/geographic exam context, but language labels must remain text.

Good:

```text
🇳🇱 Dutch
```

not:

```text
🇳🇱
```

alone.

For Dutch Belgium vs Netherlands:

```text
Belgium
Netherlands
```

must be explicit.

---

# 106. Exam disclaimer component

Every exam program detail can include:

```text
Practice for DELF B1
Not affiliated with or endorsed by the examining body.
This practice does not issue an official score or certificate.
```

Keep the disclaimer calm and secondary.

---

# 107. Regulated-domain missions

Health/legal/financial scenes require a semantic notice if relevant:

```text
Language practice
This scene practises communication, not professional advice.
```

Do not use a scary warning banner for ordinary low-risk language practice.

Use small neutral info treatment.

---

# 108. Tamagui token mapping

Example conceptual config:

```ts
const tokens = createTokens({
  color: {
    canvasLight: '#FAF9F5',
    surfaceLight: '#FFFFFF',
    inkLight: '#1C1917',
    brandLight: '#B4533A',
    languageLight: '#246B63',

    canvasDark: '#171613',
    surfaceDark: '#211F1B',
    inkDark: '#F7F4EE',
    brandDark: '#E98B6D',
    languageDark: '#7CC7BE',
  },

  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },

  radius: {
    xs: 8,
    sm: 10,
    control: 14,
    card: 20,
    hero: 24,
    sheet: 28,
    pill: 999,
  },

  size: {
    control: 48,
    iconSm: 16,
    iconMd: 20,
    iconLg: 24,
  },
})
```

Actual implementation may use valid Tamagui token key naming conventions required by the installed version.

---

# 109. Tamagui media strategy

Map semantic width tiers:

```text
compact
medium
expanded
large
xl
```

to:

```text
<600
600–839
840–1199
1200–1599
>=1600
```

Screen code should say:

```text
layout = compact / medium / expanded
```

rather than:

```text
isTablet
isDesktop
isPhone
```

---

# 110. Component folder design

```text
ui/
├── primitives/
│   ├── AppText.tsx
│   ├── Surface.tsx
│   ├── Divider.tsx
│   ├── Icon.tsx
│   ├── AppButton.tsx
│   ├── IconButton.tsx
│   ├── Chip.tsx
│   └── AppInput.tsx
│
├── navigation/
│   ├── AdaptiveNav.tsx
│   ├── BottomTabs.tsx
│   ├── NavigationRail.tsx
│   └── ScreenHeader.tsx
│
├── cards/
│   ├── MissionCard.tsx
│   ├── SkillCard.tsx
│   ├── ExamProgramCard.tsx
│   ├── DuePracticeCard.tsx
│   ├── EvidenceCard.tsx
│   ├── PhraseCard.tsx
│   └── ContinueCard.tsx
│
├── conversation/
│   ├── CaptionBlock.tsx
│   ├── MeaningLine.tsx
│   ├── VoiceActivity.tsx
│   ├── ConversationControls.tsx
│   ├── TranscriptList.tsx
│   ├── SupportSheet.tsx
│   ├── SupportPanel.tsx
│   └── FreezeOverlay.tsx
│
├── learning/
│   ├── EvidenceTag.tsx
│   ├── SkillStatus.tsx
│   ├── PhraseStatus.tsx
│   ├── RecommendationReason.tsx
│   ├── ProgressTimeline.tsx
│   └── ExamDisclaimer.tsx
│
└── feedback/
    ├── EmptyState.tsx
    ├── RecoverableError.tsx
    ├── LoadingState.tsx
    └── StatusNotice.tsx
```

---

# 111. Component API rules

Every public component should expose semantic props.

Good:

```tsx
<EvidenceTag
  state="independent"
/>
```

Bad:

```tsx
<Tag color="#2D6B49" bg="#E5F1E9" />
```

Good:

```tsx
<MissionCard
  mission={mission}
  recommendationReason={reason}
/>
```

Bad:

```tsx
<Card>
  60 lines of screen-specific markup...
</Card>
```

---

# 112. Component states

Every interactive component must define:

```text
default
pressed
focused
disabled
loading
error where relevant
selected where relevant
```

Web also:

```text
hover
```

Hover may enhance but never reveal essential functionality.

---

# 113. Card density rules

Compact cards:

```text
padding 16
gap 8–12
```

Expanded:

```text
padding 20
gap 12–16
```

Maximum body copy inside normal catalog card:

```text
~2–3 lines
```

If more explanation is needed, open detail.

---

# 114. Information hierarchy

Screen hierarchy:

```text
1. page purpose
2. primary action
3. immediate context
4. secondary choices
5. details
```

Do not start screens with:

```text
filter bars
analytics
long descriptions
```

before users know the task.

---

# 115. Loading patterns

Use skeletons only where shape is predictable.

Live runtime:

```text
explicit state text
```

Example:

```text
Connecting to the conversation…
```

better than an infinite generic spinner.

---

# 116. Offline state

Because live conversation needs network:

```text
Offline

Your saved phrases and history are still available.
Live missions need a connection.

[View saved practice]
```

---

# 117. Content readiness

Do not display a mission as available if:

```text
content is draft
voice path is unsupported
exam format is unverified
required language pack is incomplete
```

Possible state:

```text
Coming later
```

but avoid filling the app with unavailable cards.

---

# 118. Design QA screen gallery

Create a private internal route:

```text
/dev/ui
```

or Storybook-like equivalent showing:

```text
all buttons
all cards
all chips
all evidence states
all voice states
all light/dark variants
all font-scale variants
all breakpoints
```

This is mandatory for design consistency.

---

# 119. Screenshot QA matrix

Screens:

```text
Onboarding
Talk
Missions Focus
Missions Situations
Missions Exams
Briefing
Live session
Help
Recap
Progress
Skill detail
Phrase detail
Settings
```

Widths:

```text
390
600
840
1200
1600
```

Themes:

```text
light
dark
```

Text:

```text
default
large
```

Languages:

```text
English UI
French UI
Dutch UI
one long-text locale
```

---

# 120. Current repository migration

Current Vite prototype is not the final UI foundation.

Preserve:

```text
Talk concept
Mission concept
briefing flow
live caption focus
progress/evidence idea
warm visual direction
i18n content
theme semantics
```

Replace or refactor:

```text
legacy Chat/Characters/Vocabulary nav
hard-coded Tailwind styling
generic category enum
phrase-only skill inference
DOM-only modal assumptions
browser-only voice UI
localStorage-specific screen logic
```

---

# 121. Migration order

## UI-0 — tokens

Create:

```text
packages/design
tamagui.config.ts
light/dark themes
spacing/radius/type tokens
```

Acceptance:

```text
no new screen hardcodes colors
```

---

## UI-1 — primitives

Create:

```text
AppText
AppButton
IconButton
Chip
Surface
Input
Screen
Stack
```

Acceptance:

```text
all pass light/dark
all pass 48 target rule
```

---

## UI-2 — adaptive navigation

Create:

```text
Talk
Missions
Progress
```

Acceptance:

```text
compact bottom nav
expanded rail
all routes work
legacy nav deleted
```

---

## UI-3 — core cards

Build:

```text
ContinueCard
MissionCard
SkillCard
ExamProgramCard
DuePracticeCard
EvidenceCard
PhraseCard
```

---

## UI-4 — Talk

Implement mobile first.

Then verify expanded.

---

## UI-5 — Missions

Implement:

```text
Focus
Situations
Exams
```

Do not import 200 scenarios before interaction structure is proven.

---

## UI-6 — Briefing

Route-based screen.

Compact sticky CTA.

Expanded master/detail.

---

## UI-7 — Live session shell

Build UI against mocked state machine first.

States:

```text
connecting
listening
speaking
paused
reconnecting
error
```

Only then connect real voice transport.

---

## UI-8 — Support

Build:

```text
compact SupportSheet
expanded SupportPanel
```

---

## UI-9 — Recap

Build evidence-driven cards.

---

## UI-10 — Progress

Build:

```text
due
skills
phrases
history
```

---

## UI-11 — Settings/privacy/onboarding

Finish consent and accessibility.

---

## UI-12 — QA

Run:

```text
screenshots
keyboard
screen reader
font scaling
reduced motion
physical devices
browser matrix
```

---

# 122. Anti-pattern list

Do not:

```text
use a purple AI gradient
turn the app into a chat messenger
put character avatars at the center of navigation
show 100 categories at once
put more than one primary CTA per region
use color without a label/icon
use text smaller than readable mobile sizes for essential information
use glass under captions
use full-screen modal dialogs for routine mobile navigation
hard-code component colors
hard-code random radii
derive skill progress from phrase substring matches
display opaque ability scores
use official exam logos casually
claim certification
hide help behind an obscure icon
make microphone state ambiguous
destroy live session on accidental back
```

---

# 123. Final design contract

Mission Coach should visually answer five questions instantly.

## Talk

```text
What should I practise now?
```

## Missions

```text
What do I want to practise?
```

## Briefing

```text
What am I about to do?
```

## Live session

```text
What did they say, and what do I do next?
```

## Recap / Progress

```text
What did I actually use, and what should return later?
```

If a design element does not help answer one of those questions, it probably does not belong.

---

# 124. Final recommended stack

```text
Expo SDK 57
React Native 0.86
React 19.2.x
TypeScript 5+
New Architecture
Expo Router
Tamagui 2
Tamagui custom Mission Coach theme
Tamagui compiler OFF initially
Reanimated animation driver where needed
Lucide icon family
SQLite native
IndexedDB web
separate static marketing/content site
```

Tamagui adoption rule:

> Use Tamagui to make one high-quality cross-platform design system easier to maintain. Do not let Tamagui determine what Mission Coach looks like.

---

# 125. Final palette snapshot

```text
LIGHT

Canvas           #FAF9F5
Surface          #FFFFFF
Surface subtle   #F4F1EB
Ink              #1C1917
Body             #57534E
Muted            #706C66
Border           #E6E0D7

Brand            #B4533A
Brand soft       #F7E8E2

Language         #246B63
Language soft    #E4F2EF

Success          #2D6B49
Warning          #8A5A12
Danger           #B42318
Info             #356C96
```

```text
DARK

Canvas           #171613
Surface          #211F1B
Raised           #2A2722
Ink              #F7F4EE
Body             #D4CEC4
Muted            #AFA79C
Border           #3A352E

Brand accent     #E98B6D
Brand button     #B4533A

Language         #7CC7BE
Success          #7BC59A
Warning          #E0B466
Danger           #FF8A80
Info             #86B7DF
```

---

# 126. Final visual summary

```text
MISSION COACH

Warm paper canvas
     +
editorial screen titles
     +
system-readable body text
     +
deep terracotta primary action
     +
teal target-language semantics
     +
opaque tonal cards
     +
48px/dp touch targets
     +
quiet borders
     +
little shadow
     +
few animations
     +
voice state always explicit
     +
evidence always explainable
     +
responsive rail/pane layouts on large screens
```

The product should feel:

> **like a calm private practice room for real conversations.**

Not:

> a game,
> a social companion,
> a generic AI chat,
> or an enterprise dashboard.

---

# 127. Primary reference checks used for this specification

## Tamagui

- Installation / requirements: https://tamagui.dev/docs/intro/installation
- Tamagui introduction: https://tamagui.dev/docs/intro/introduction
- Tamagui 2: https://tamagui.dev/blog/version-two
- Config v5: https://tamagui.dev/docs/core/config-v5
- Native integrations: https://tamagui.dev/ui/native

Verified design implication:

```text
React Native 0.81+ with New Architecture
React 19+
TypeScript 5+
```

The current Mission Coach target based on Expo SDK 57 satisfies these requirements.

The compiler is not required to begin building the UI and should be treated as a later optimization.

## Expo

- Expo SDK 57: https://expo.dev/sdk/57
- Expo current SDK reference: https://docs.expo.dev/versions/latest/

SDK 57 maps to:

```text
React Native 0.86
React 19.2.x
```

## Android adaptive layout

- https://developer.android.com/develop/ui/views/layout/use-window-size-classes

Width classes used by this specification:

```text
Compact       < 600
Medium        600–839
Expanded      840–1199
Large         1200–1599
Extra Large   >= 1600
```

## Accessibility

- WCAG 2.2 overview:
  https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

Important design implications include:

```text
Focus Not Obscured
Target Size
keyboard visibility
accessible interaction alternatives
```

---

# 128. Definition of done for the design system

The design system is considered implemented only when:

- [ ] Expo app runs on iOS, Android and web.
- [ ] Tamagui theme is the only application theme source.
- [ ] Light and dark themes are complete.
- [ ] No screen hardcodes arbitrary brand colors.
- [ ] No screen hardcodes arbitrary radii.
- [ ] Compact/medium/expanded layouts are tested.
- [ ] Bottom navigation contains only Talk, Missions and Progress.
- [ ] Live session hides normal app navigation on compact.
- [ ] Live session has explicit listening/speaking/paused/reconnecting states.
- [ ] All primary controls have at least 48×48 hit areas.
- [ ] Normal text satisfies contrast requirements.
- [ ] Focus states are visible on web.
- [ ] Dynamic text does not destroy core layouts.
- [ ] Reduced motion is honored.
- [ ] Support actions produce visible/recordable support states.
- [ ] Recap cards show provenance rather than opaque scores.
- [ ] Mission discovery supports Focus, Situations and Exams.
- [ ] Exam UI never implies official certification.
- [ ] Medical/legal/financial scenarios identify themselves as language practice where needed.
- [ ] No legacy Chat/Characters/Vocabulary navigation remains.
- [ ] Screenshot QA exists for major screens at all principal widths.
- [ ] Accessibility QA exists for every core flow.
- [ ] Tamagui compiler remains optional until parity and performance are measured.

---

# 129. Short implementation decision record

**Decision:** Use Tamagui 2 as the universal UI/styling foundation.

**Why:**

- compatible with Expo SDK 57's modern React Native stack,
- one theme system for native and web,
- responsive/adaptive primitives,
- good fit for a solo builder maintaining one product UI,
- optional compiler means migration can start simple,
- native integrations can be adopted selectively,
- enables a strong custom visual identity instead of maintaining separate CSS and React Native styling systems.

**Constraint:** Tamagui must remain below the Mission Coach semantic component layer.

Architecture:

```text
Screens
   ↓
Mission Coach components
   ↓
Tamagui primitives/themes
   ↓
React Native / React Native Web
```

Never:

```text
Screens
   ↓
arbitrary Tamagui styling
   ↓
inconsistent one-off UI
```

---

**End of specification.**
