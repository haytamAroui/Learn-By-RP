# LearnByRP Mobile-First UI/UX Design System v3

**Status:** active UI authority for `feature/mobile-first-ui-v3`  
**Primary target:** phone first, then tablet, then desktop/web  
**Canonical review viewport:** **390 × 844**

This document supersedes the existing dashboard-oriented visual treatment for new UI work.
It does **not** replace the learning engine, evidence model, archive, scene runtime, mission
semantics, or session state machine.

## 1. Product direction

LearnByRP should feel like a consumer language-learning app rather than an internal
software dashboard.

The interface is designed in this order:

1. Phone: 360–430 px
2. Tablet: 600–1023 px
3. Desktop/web: 1024 px and above

Desktop is a progressive enhancement of the phone experience, not the source layout
shrunk down to fit a phone.

## 2. Core principles

- One dominant action per screen.
- Content before analytics.
- Prefer whitespace, typography, rows, and native surfaces over card-inside-card UI.
- Primary controls should be 48–56 px high.
- Briefing, conversation, recap, and practice are full-screen flows.
- Root navigation stays `Talk · Missions · Progress`.
- Settings is a header action, not a fourth root destination.
- Secondary actions use sheets where appropriate.
- The mission is the product on the Talk screen.
- Technical/evidence detail stays available as secondary depth, not default learner UI.
- Preserve safe areas, keyboard avoidance, native back behavior, and reduced-motion support.

## 3. Visual language

Keep the existing warm editorial palette, but use it more sparingly:

- warm off-white canvas
- strong dark typography
- terracotta primary action
- soft teal/green success states
- large rounded surfaces
- minimal borders
- almost no decorative shadow
- generous whitespace
- simple scene/mission imagery when introduced

Avoid:

- dashboard grids
- admin-style cards
- multiple equal-priority panels
- tiny metadata
- dense badge systems
- data-table presentation
- unnecessary borders around every section

## 4. Phone layout contract

### Screen

- full available width
- 16 px horizontal gutters
- safe-area-aware top and bottom spacing
- default reading/conversation content max width: 720 px on larger screens
- no tiny centered “desktop panel” on phone

### Root header

- title/brand on the left
- one 48 px settings action on the right
- no theme toggle or secondary controls in the root header

### Bottom navigation

Three destinations only:

- Talk
- Missions
- Progress

Phone uses large icon + label targets. Desktop may use a side rail after 1024 px.

## 5. Talk / Home

Hierarchy:

1. app header
2. language/practice context
3. one hero mission
4. primary `Start conversation` CTA
5. lightweight review row
6. lightweight mission-browse row

Do not expose implementation IDs, transfer internals, character metadata stacks, skill
counts, or multiple badges on the home screen.

## 6. Missions

Missions must feel browsable:

- one search field
- horizontal category chips
- simple mission rows
- concise level + duration metadata
- connected route as a secondary view

Avoid dense filter matrices or multiple filter panels.

## 7. Mission briefing

Target treatment:

- full-screen route
- mission title and character
- one goal section
- concise practice focus
- support/help status
- sticky bottom `Start conversation` CTA

Useful phrases remain hidden before a cold attempt unless the learner explicitly asks.

## 8. Live conversation

The current turn is the visual hero.

Keep visible:

- close/back
- scene/character
- latest character turn
- learner turn
- listening/speaking state
- Help / Type / End actions

Older transcript becomes visually quieter and scrollable. Technical runtime status belongs
outside the learner surface.

## 9. Help and contextual meaning

Use progressive disclosure.

Help opens as a bottom sheet with increasingly explicit support. Word/phrase meaning should
also use a compact native sheet rather than a new dashboard-style page.

All support exposure continues to be recorded by the existing support ledger.

## 10. Recap

Default learner recap should show:

- mission completion
- what went well
- one thing to practise
- retry/transfer actions
- a secondary `See the evidence` entry point

Evidence detail remains sophisticated, but it is secondary depth.

## 11. Progress

Progress is a learning surface, not an analytics dashboard.

Default sections:

- ready to practise
- skills
- phrases
- history

Use restrained labels such as `New`, `Supported`, `Growing`, `Steady`, and
`Worth revisiting`. Do not show pseudo-precise mastery percentages.

## 12. Core component set

Prefer a small reusable system:

- Screen
- RootHeader
- BottomTabs
- HeroMission
- MissionRow
- SkillRow
- PracticeRow
- PrimaryButton
- SecondaryButton
- IconButton
- BottomSheet
- ActionSheet
- SegmentedControl
- ConversationBubble
- VoiceControl
- Section
- Divider
- StatusLabel

Do not solve every screen with a new card variant.

## 13. Navigation flow

Primary phone flow:

`Talk → Mission briefing → Live conversation → Recap`

This must feel like one continuous stack-navigation flow. Secondary content uses sheets.

## 14. Build order

1. App shell + bottom navigation
2. Talk/Home
3. Mission list / rows
4. Mission briefing
5. Live conversation
6. Help / meaning sheets
7. Recap
8. Progress
9. Skill detail / evidence
10. Settings
11. Tablet adaptation
12. Desktop/web adaptation

## 15. Acceptance checks

Every redesigned screen must first be reviewed at **390 × 844**.

Before a screen is considered complete:

- primary action is obvious within one glance
- no essential text is below the governed 12 px floor
- touch targets meet the existing 48 px minimum
- no horizontal overflow at phone width
- secondary information is visually subordinate
- screen works with safe areas
- light/dark theme tokens remain valid
- existing learning/session behavior is preserved
- accessibility labels remain meaningful

## 16. Current branch progress

Implemented in the initial slice:

- mobile-first root header
- simplified phone bottom navigation
- Talk/Home hero-mission hierarchy
- lightweight review/explore rows
- mobile mission browsing
- simplified connected-route presentation

Foundation hardening completed before the next learner-flow screens:

- semantic action colors separated from foreground brand colors
- dark-mode CTA fill remains contrast-safe
- semantic danger colors replace raw red palette usage
- shared buttons, inputs, chips, and segmented controls enforce 48px targets
- hover/focus/pressed states are defined for shared interactive primitives
- breakpoints are canonicalized to phone (<600), tablet (600–1023), desktop (>=1024)
- desktop navigation uses the navigator's responsive left-tab mode
- tab labels follow the selected UI language
- sheets are safe-area-aware on phones and bounded on tablet/web
- Settings is restored as a full settings screen; Privacy & data is secondary
- onboarding, privacy, phrase detail, and recovery are scroll/safe-area robust
- native icon/input props resolve concrete theme colors rather than CSS-variable strings
- product-facing brand title is LearnByRP
- shared typography defaults to the platform/system sans stack

Learner-flow redesign now implemented:

- Mission selection navigates to a full-screen briefing route instead of a modal
- briefing keeps one dominant Start action and moves practice style to a compact sheet
- phrase preview is progressive disclosure; once previewed, the attempt can no longer become cold again
- briefing support previews are persisted as support exposures before the session begins
- Live Conversation is route-native rather than nested inside another modal
- the latest character turn is the visual focus; older transcript is intentionally quiet
- Help and Meaning are compact secondary sheets
- pause is separate from asking for coaching support
- the voice action is dominant; Help / Type / End are the only persistent secondary actions
- Recap is a full learner-facing screen with evidence moved to a secondary sheet
- retry and transfer missions both return through governed mission briefing
- Progress leads with Ready to practise, then Skills / Phrases / History
- skill, phrase, and evidence depth remains available through sheets without dominating list rows
- superseded MissionBriefingModal, RecapModal, and SettingsModal implementations were removed

Next implementation target after source verification: **390 × 844 visual/device QA**, followed by
tablet and 1024/1440 web polish.
