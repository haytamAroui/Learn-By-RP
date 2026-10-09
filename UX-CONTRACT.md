# LearnByRP UI contract

The maintained behavior authority is
`docs/LEARNBYRP_COMPLETE_LEARNING_CONTENT_UX_ARCHITECTURE_V2.md`, reconciled in
`docs/ARCHITECTURE_V2_IMPLEMENTATION.md`. This document records shared UI ownership
for the reference-design adaptation; visual intent lives in `DESIGN.md`.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Form | `src/components/ui.tsx` Field/ChipRow, route-owned preference forms | V2 architecture and authored preference contracts | settings / onboarding / typed learner input | typecheck, E2E keyboard and consent checks |
| Select/Listbox | `ui.tsx` ChipRow | i18n language policy and preference contracts | inline single selection; no popup | E2E locale/theme checks |
| Scrollbar | React Native ScrollView, platform scrollbar | existing Expo/RN layout and safe-area ownership | content scroll / bounded sheet | E2E narrow layout and keyboard recovery |

Talk / Missions / Progress remains the main navigation. Cards link only to
implemented routes. Primary session actions preserve the durable session and
attempt identities. Cancel/recover retains learner turns; stopping controls and
text input stay available when voice or a provider fails.

Scene completion, support exposure, phrase recall, and skill evidence remain
separate. The design reference's scores, dots, and completion marks are not learning
truth. Interface choices are EN/FR/NL; active practice is nl-BE. Old sessions remain
readable. Permission, consent, deletion, and evidence writes retain their existing
I/O boundaries. No change to destructive operations is part of this redesign.

Live-session suggested replies appear in a collapsible card in the speaking dock and start collapsed. Opening them persists exact
authored phrase `full_form` exposures before displaying the text. Tapping a phrase
persists `typed_example`, prepares the draft, and leaves sending to the learner.
Audio attempts use the existing speech adapter with mission locale and authored
voice presentation. Attempted model audio is conservatively recorded as uncertain
before playback, so failures never claim a completed listening exposure. Delayed
audio cannot play after attempt ownership or consent changes. Inline translations
reuse the existing meaning-exposure handler. Scene checkpoint counts are progress
in the scene, not learner mastery. Missing localized phrase translations stay hidden.


The current visual reference is the user-selected Lingo 2027 HTML. AppText owns
cross-route typography; ReferenceArtwork owns static, decorative source vectors.
Shared selections use teal and wrap long localized labels. The compact conversation
shows final durable turns in chronological order, with older turns available by
explicit disclosure. Caption support tracks the actually rendered history slice.
The speaking dock scrolls within a height bound so large text or a small visual
viewport cannot strand typing, help, or stopping. Activity cards count durable
active-language records; they do not infer mastery, study time, streaks, or bands.
