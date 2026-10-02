# LearnByRP Design System V4 — Implementation TODO

**Version:** 4.0  
**Status:** active UI/UX implementation authority on `main`  
**Primary target:** mobile first  
**Canonical phone review:** **390 × 844**

This document supersedes:

- `MISSION_COACH_UI_UX_DESIGN_SYSTEM_v2.md`
- `MISSION_COACH_MOBILE_FIRST_DESIGN_SYSTEM_V3.md`

It does **not** supersede the Master Product Architecture, evidence rules, archive model,
scene runtime, mission semantics, or session state machine. Roleplay/program/pedagogy execution
status belongs to `LEARNBYRP_ROLEPLAY_PROGRAM_TODO_V1.md`; V4 owns UI/UX work only.

---

# 0. Authority and working rule

Use this precedence when implementation documents disagree:

- [x] Master Product Architecture remains product/invariant authority.
- [x] Learning/evidence runtime remains evidence-truth authority.
- [x] Scene reducer remains authoritative for scene truth.
- [x] Archive repository remains persistence authority.
- [x] V4 is the active UI/UX implementation authority.
- [x] Archive V2/V3 as historical references.
- [x] Add a short notice at the top of V2/V3 pointing readers to V4.

**Working rule:** do not add a new screen-specific visual system. Reuse the V4 primitives,
tokens, spacing, states, navigation and responsive rules.

---

# 1. Product direction

LearnByRP must feel like a **consumer language-learning app**, not an admin/dashboard tool.

- [x] Design phone first.
- [x] Use 360–430 px as the phone design range.
- [x] Use **390 × 844** as the canonical implementation review viewport.
- [x] Keep one dominant action per screen.
- [x] Put learning content before analytics.
- [x] Keep technical/evidence detail as secondary depth.
- [x] Prefer whitespace, typography and rows over card-inside-card layouts.
- [x] Use full-screen routes for Briefing, Live Conversation and Recap.
- [x] Use sheets for secondary contextual actions.
- [x] Keep the mission/conversation as the product focus.
- [ ] Re-check every remaining legacy screen against these rules before release.

---

# 2. Canonical responsive system

Use width tiers only. Do not branch on device names such as `isTablet`.

## Breakpoints

- [x] Phone: `< 600`
- [x] Tablet: `600–1023`
- [x] Desktop: `>= 1024`

## Width contracts

- [x] Phone horizontal gutter: 16 px.
- [x] App maximum width: 1200 px.
- [x] Conversation maximum width: 720 px.
- [x] Reading/recap maximum width: 720 px.
- [x] Catalog maximum width: 1200 px.
- [x] Bottom navigation on phone/tablet.
- [x] Left navigation on desktop.
- [ ] Audit 600, 768, 840 and 1024 px transition behavior on real layouts.
- [ ] Audit 1200 and 1440 px whitespace and column density.
- [ ] Verify no desktop screen is only a stretched phone card.

---

# 3. Navigation

Primary destinations are exactly:

`Talk · Missions · Progress`

- [x] Keep exactly three root destinations.
- [x] Settings is not a tab.
- [x] Settings is reachable from root headers.
- [x] Phrases live under Progress, not as a fourth destination.
- [x] Characters remain mission participants, not root navigation.
- [x] Bottom tabs retain labels on compact layouts.
- [x] Hide root navigation during the live-session flow.
- [ ] Verify Android hardware Back behavior across every full-screen route.
- [ ] Verify iOS edge-swipe/back gesture does not destroy a live session.
- [ ] Verify all root destinations restore expected scroll/focus state.

---

# 4. Visual tokens

`src/design/tokens.ts` is the single color authority.

## Brand and semantics

- [x] Warm off-white canvas.
- [x] Dark high-contrast typography.
- [x] Terracotta primary action.
- [x] Teal for language-learning semantics.
- [x] Green only for verified positive evidence/success.
- [x] Amber for assisted/pending/degraded states.
- [x] Red for destructive/error states.
- [x] Light/dark semantic token sets exist.
- [x] Shared button action colors are separate from foreground brand colors.
- [x] Raw red palette usage was removed from shared controls.
- [ ] Run a final raw-color audit before release.
- [ ] Verify every semantic color against all surfaces it appears on.

## Elevation

- [x] Prefer tonal hierarchy over heavy shadows.
- [x] Avoid decorative shadow on routine content.
- [ ] Audit every card-like surface and remove unnecessary borders.
- [ ] Ensure interactive cards have a visible interaction boundary/state.
- [ ] Ensure floating sheets/dialogs remain visually distinct in dark mode.

---

# 5. Typography

Current implementation authority is the platform/system sans stack.

- [x] Use system/platform UI typography.
- [x] Do not force a Latin display face onto target-language/script content.
- [x] Critical learner text can wrap.
- [x] No essential text below 12 px.
- [x] Latest character turn uses a large conversation role.
- [ ] Verify large Dynamic Type / font scaling on all full-screen flows.
- [ ] Verify Japanese text wrapping and line-height.
- [ ] Verify mixed Latin + non-Latin content.
- [ ] Verify no essential target-language text truncates.

---

# 6. Spacing, radius and touch

- [x] Primary controls are at least 48 px tall.
- [x] Large primary actions may use 56 px height.
- [x] Shared inputs enforce touch-safe height.
- [x] Shared chips/segmented controls enforce touch-safe targets.
- [x] Use semantic shared radii rather than per-screen arbitrary values.
- [ ] Audit all icon-only actions for a 48 × 48 hit target.
- [ ] Audit adjacent live controls for enough separation.
- [ ] Remove any remaining arbitrary one-off spacing values that do not serve safe areas.

---

# 7. Shared component philosophy

Prefer a small reusable learner-facing system.

## Current/common primitives

- [x] Button
- [x] Icon button patterns
- [x] Input
- [x] Chip
- [x] Segmented control
- [x] Sheet
- [x] Root header/navigation shell
- [x] Mission row/hero patterns
- [x] Progress rows
- [x] Conversation surfaces

## TODO

- [ ] Formalize semantic `Screen` wrapper.
- [ ] Formalize semantic `RootHeader`.
- [ ] Formalize `StatusLabel`.
- [ ] Formalize `LoadingState`.
- [ ] Formalize `RecoverableError`.
- [ ] Formalize `EmptyState`.
- [ ] Formalize `VoiceActivity` state component.
- [ ] Avoid introducing new card variants unless an existing primitive cannot express the job.

---

# 8. Talk

The question this screen must answer:

**What should I practise now?**

- [x] Mobile-first root header.
- [x] One hero mission.
- [x] One dominant Start conversation action.
- [x] Lightweight review row.
- [x] Lightweight browse row.
- [x] Hide implementation IDs and engine metadata.
- [x] Avoid dashboard charts.
- [ ] Verify returning-user Continue state.
- [ ] Verify empty state when no recommendation is available.
- [ ] Verify due-practice state with long localized copy.
- [ ] Verify dark mode on a real phone.
- [ ] Verify 360 px width.

---

# 9. Missions

The question this screen must answer:

**What do I want to practise?**

- [x] Browsable mission presentation.
- [x] Search.
- [x] Category chips.
- [x] Simple mission rows.
- [x] Connected-route presentation kept secondary.
- [x] Avoid dense filter matrices.
- [ ] Verify long mission titles at 360 px.
- [ ] Verify search keyboard avoidance on Android/iOS.
- [ ] Verify tablet layout.
- [ ] Verify desktop catalog layout up to 1200 px.
- [ ] Decide whether Focus / Situations / Exams from V2 remain required product views.
- [ ] If those views remain required, implement them without reintroducing dashboard density.

---

# 10. Mission Briefing

The question this screen must answer:

**What am I about to do?**

- [x] Full-screen route.
- [x] Safe-area-aware.
- [x] Back action has touch-safe target.
- [x] Mission/scene identity is clear.
- [x] Character is visible without dominating navigation.
- [x] Goal is visible.
- [x] Stretch/secondary goal is available.
- [x] Practice focus is concise.
- [x] Useful phrases are hidden by default.
- [x] Revealing phrases permanently makes the attempt non-cold.
- [x] Visible phrase previews are persisted as support exposure.
- [x] Practice-style detail moved into a sheet.
- [x] Sticky Start mission CTA.
- [x] Missing-mission state is localized and touch-safe.
- [x] Communicative skill labels are localized.
- [ ] Verify keyboard/safe-area behavior on physical Android/iPhone.
- [ ] Verify dynamic text with the sticky CTA.
- [ ] Verify screen-reader order.
- [ ] Verify phrase-preview ledger on native SQLite in a device run.

---

# 11. Live Conversation

The question this screen must answer:

**What did they say, and what do I do next?**

## Learner UI

- [x] Route-native full-screen flow.
- [x] Latest character turn is the visual hero.
- [x] Older transcript is visually quiet.
- [x] Learner interim/recognized speech is visibly distinct.
- [x] Voice action is dominant.
- [x] Persistent secondary actions are Help / Type / End.
- [x] Pause is separate from asking for support.
- [x] Meaning is a compact sheet.
- [x] Help is a compact progressive-disclosure sheet.
- [x] Meaning reveal records support exposure.
- [x] Slow replay records the correct support state.
- [x] Intent / partial / full-form support remain distinct.
- [x] User close is persisted as intentional end, not interruption.
- [x] Raw internal voice states no longer leak to learner UI.
- [x] Live lifecycle labels are localized.
- [ ] Verify microphone permission denied path on physical device.
- [ ] Verify headset/Bluetooth behavior.
- [ ] Verify background → foreground recovery.
- [ ] Verify call/audio interruption behavior.
- [ ] Verify long conversations and transcript scrolling.
- [ ] Verify landscape does not catastrophically break.
- [ ] Verify screen-reader announcements for listening/speaking/error/reconnect.
- [ ] Verify no animation is essential to understanding state.

---

# 12. Voice and AI provider runtime

Provider choice must not leak into the learner-screen architecture.

## Architecture already implemented

- [x] `ConversationProvider` abstraction.
- [x] `VoiceTransport` abstraction.
- [x] Provider capability discovery.
- [x] OpenAI Realtime conversation adapter.
- [x] HTTP conversation fallback.
- [x] Gemini structured reasoning adapter.
- [x] OpenAI-compatible local/self-hosted structured provider.
- [x] Gemini TTS provider.
- [x] Native OS TTS fallback.
- [x] Locale resolver.
- [x] Best native voice selection.
- [x] Native voice cache.
- [x] Cloud speech audio cache for replay.
- [x] Server-only long-lived API keys.
- [x] Short-lived OpenAI Realtime client secret path.
- [x] Realtime failure falls back to HTTP provider for the session.
- [x] Provider architecture regression tests.
- [x] Provider configuration documented in `PROVIDER_RUNTIME_V1.md`.

## Next provider acceptance tasks

- [x] Add separate `provider-acceptance.yml` workflow.
- [x] Use GitHub secrets `OPENAI_API_KEY` and `GEMINI_API_KEY`.
- [x] Never print secret values.
- [x] Real OpenAI Realtime session creation test.
- [x] Real OpenAI Realtime learner-turn response test.
- [x] Real Gemini TTS generation test.
- [x] Validate returned audio MIME/bytes.
- [x] Real French speech generation sample.
- [x] Real Belgian-Dutch speech generation sample.
  - Verified in GitHub Actions run 36925596885 (OpenAI + Gemini real-provider acceptance).
- [ ] Real Spanish speech generation sample.
- [ ] Real German speech generation sample.
- [ ] Real Italian speech generation sample.
- [ ] Real Japanese speech generation sample.
- [ ] Test OpenAI failure → HTTP fallback.
- [ ] Test Gemini TTS failure → native TTS fallback.
- [ ] Test provider timeout preserves learner transcript.
- [ ] Test typed mode when microphone is unavailable.
- [ ] Add development-only Voice & AI diagnostics screen.
- [ ] Show selected locale, native voice, provider and fallback status.
- [ ] Add provider latency/fallback telemetry separate from learning evidence.
- [x] Do not run paid real-provider acceptance on every normal commit.

## Future voice transports

Do not modify `LiveSessionView` to add these. Add another transport/provider.

- [ ] OpenAI full-duplex WebRTC audio transport.
- [ ] Gemini Live raw-audio transport.
- [ ] Local Whisper/whisper.cpp STT transport.
- [ ] Local/on-device TTS transport.

---

# 13. Native language adaptation

Default target-language locales:

- [x] Spanish → `es-ES`
- [x] French → `fr-FR`
- [x] German → `de-DE`
- [x] Italian → `it-IT`
- [x] Japanese → `ja-JP`
- [x] Dutch → `nl-BE`
- [x] English fallback/support → `en-GB`

Native voice selection priority:

- [x] Exact locale.
- [x] Same base language.
- [x] Enhanced voice quality.
- [x] Local/on-device service.
- [x] OS default as final native fallback.

Device QA:

- [ ] Confirm actual `nl-BE` voice availability on Android.
- [ ] Confirm actual `nl-BE` voice availability on iPhone.
- [ ] Confirm fallback behavior when only `nl-NL` exists.
- [ ] Confirm French voice quality.
- [ ] Confirm Japanese voice selection.
- [ ] Add explicit locale preference support when product requirements need `fr-BE`, `nl-NL`, `es-MX`, etc.

---

# 14. Recap

The question this screen must answer:

**What did I actually use, and what should return later?**

- [x] Full-screen learner recap.
- [x] One success/did-well area.
- [x] One thing to practise.
- [x] Retry remains available.
- [x] Transfer/next mission can be primary.
- [x] Evidence moved to a secondary sheet.
- [x] Retry/transfer returns through governed briefing.
- [x] Share-failure text localized.
- [x] Session ID/evidence continuity preserved.
- [ ] Improve remaining recap wording where `unassisted` is too technical.
- [ ] Verify no recap language implies perfect/fluent/failed.
- [ ] Verify assessment-unavailable state on real provider outage.
- [ ] Verify long evidence/provenance content.
- [ ] Verify native share/export behavior.

---

# 15. Progress

The question this screen must answer:

**What should I practise again, and what evidence do I have?**

- [x] Ready-to-practise hero/action area.
- [x] Skills / Phrases / History tabs.
- [x] Simple learner-facing rows.
- [x] No mastery percentages.
- [x] Skill metadata localized.
- [x] Target-language examples show only the selected learning language.
- [x] Raw task-outcome enums removed.
- [x] Raw recall-status enums removed.
- [x] Learner states use:
  - New
  - Supported
  - Growing
  - Steady
  - Worth revisiting
- [x] Skill and phrase detail remain secondary sheets.
- [ ] Redesign `DuePhrasesPracticeModal` to match V4.
- [ ] Verify empty Skills/Phrases/History states.
- [ ] Verify very large histories.
- [ ] Verify reconstructed/legacy evidence labels.
- [ ] Verify recent lapse renders as review due without erasing historical competence.
- [ ] Verify all progress status colors also have text/icon semantics.

---

# 16. Evidence and support invariants

UI must never imply evidence the archive does not hold.

- [x] Independent and assisted evidence remain distinct.
- [x] Meaning reveal counts as support.
- [x] Background translation fetch alone does not count as support.
- [x] Briefing phrase reveal counts as support exposure.
- [x] Cold attempt is false once useful support is viewed.
- [x] Session/network/silence interruption is not a lapse.
- [x] One durable session ID spans briefing → live → archive → recap.
- [x] Native SQLite preserves cold-attempt/support metadata.
- [ ] Verify legacy/reconstructed evidence UI label everywhere it can appear.
- [ ] Verify corrected transcript revision invalidates derived UI state as required by architecture.
- [ ] Verify skill and phrase evidence never collapse into one generic learned flag.
- [ ] Verify no provider telemetry is stored as learning evidence.

---

# 17. Settings and Privacy

- [x] Settings is a full screen, not a modal.
- [x] Privacy & Data is secondary.
- [x] Appearance controls localized.
- [x] Privacy copy localized EN/FR/ES/NL.
- [x] Consent controls localized.
- [x] Export/erase states localized.
- [x] Touch-safe controls.
- [x] Safe-area/scroll behavior improved.
- [ ] Remove remaining hardcoded learner-facing English anywhere in settings/fallbacks.
- [ ] Verify destructive erase confirmation on native.
- [ ] Verify export/import on physical devices.
- [ ] Verify consent withdrawal immediately updates voice/analysis capabilities.
- [ ] Add provider diagnostics only under development/debug conditions.

---

# 18. Accessibility

Target WCAG 2.2 AA on web with native parity.

- [x] Shared touch-target minimum is 48 px.
- [x] Typed fallback exists for voice interaction.
- [x] Light/dark semantic tokens exist.
- [x] Interactive shared components expose focus/pressed states.
- [ ] Run full contrast verification against every used foreground/background pair.
- [ ] Verify keyboard focus is never hidden by sticky UI.
- [ ] Verify web at 200% zoom.
- [ ] Verify 320 CSS px viewport.
- [ ] Verify large Dynamic Type on Android/iOS.
- [ ] Verify screen-reader navigation order.
- [ ] Announce listening.
- [ ] Announce character speaking.
- [ ] Announce pause.
- [ ] Announce connection lost/reconnected.
- [ ] Announce microphone unavailable.
- [ ] Do not announce decorative animation changes.
- [ ] Verify no state is communicated by color alone.

---

# 19. Reduced motion

- [ ] Centralize reduced-motion preference if not already fully centralized.
- [ ] Listening pulse becomes static state when reduced motion is enabled.
- [ ] Sheet spring becomes short fade.
- [ ] Press-scale animation becomes color/border state.
- [ ] Looping waveform becomes static meter.
- [ ] Pause continuous decorative animation when app backgrounds.
- [ ] Verify no essential information depends on motion.

---

# 20. RTL readiness

RTL remains a design-system requirement even if Arabic UI is not yet a release language.

- [ ] Audit semantic layouts for left/right assumptions.
- [ ] Prefer start/end spacing/alignment where semantic.
- [ ] Mirror directional navigation icons in RTL.
- [ ] Do not mirror non-directional icons.
- [ ] Verify mixed target-language text + Latin metadata/numerals.
- [ ] Add at least one RTL layout regression case before RTL release.

---

# 21. Persistence and recovery

Screens depend on `ArchiveRepository`.

- [x] Native persistence uses SQLite.
- [x] Web persistence uses IndexedDB.
- [x] Session retrieval by durable ID exists.
- [x] Native cold-attempt persistence fixed.
- [x] Native support-exposure persistence fixed.
- [x] Intentional user end is not treated as recoverable interruption.
- [ ] Update `e2e/transcript-survival.spec.ts` to seed a persisted `SessionRecord`.
- [ ] Verify transcript recovery after app restart on Android.
- [ ] Verify transcript recovery after app restart on iOS.
- [ ] Verify malformed import cannot partially mutate archive.
- [ ] Verify archive delete is transactional.
- [ ] Review native reconstruction of `sceneState.learnerKnows` / `characterKnows`.
- [ ] Consider direct native `getSessionById` query instead of filtering all sessions.

---

# 22. Error, loading and empty states

Every learner route needs an intentional state.

- [x] Briefing mission-unavailable state.
- [x] Session loading state.
- [x] Session mission-unavailable state.
- [x] Touch-safe fallback back actions.
- [x] Localized route fallback copy.
- [ ] Standardize all loading states through one semantic component.
- [ ] Standardize recoverable network/provider errors.
- [ ] Standardize empty states.
- [ ] Verify Talk no-recommendation state.
- [ ] Verify Missions no-results state.
- [ ] Verify Progress empty state.
- [ ] Verify Recap not-found state.
- [ ] Verify offline startup state.
- [ ] Verify provider degraded state remains learner-friendly and non-technical.

---

# 23. Tablet and desktop polish

Do this only after the phone experience remains stable.

## Tablet 600–1023

- [ ] Audit 600 px.
- [ ] Audit 768 px.
- [ ] Audit 840 px.
- [ ] Verify sheets are bounded and not oversized.
- [ ] Verify mission browsing uses extra width without becoming a dashboard.
- [ ] Verify Progress does not become an analytics grid.
- [ ] Verify keyboard behavior with split/floating keyboards where possible.

## Desktop >=1024

- [x] Left navigation exists.
- [ ] Audit 1024 px.
- [ ] Audit 1200 px.
- [ ] Audit 1440 px.
- [ ] Verify bounded whitespace.
- [ ] Verify catalog does not exceed 1200 px.
- [ ] Verify conversation does not exceed 720 px.
- [ ] Verify hover is enhancement only.
- [ ] Verify keyboard-only navigation.
- [ ] Verify focus rings on all primary controls.

---

# 24. Visual regression

Current automated gate is **not yet** the full V2 snapshot matrix.

## Already enforced

- [x] TypeScript.
- [x] Unit/design/session/provider tests.
- [x] Expo web export.
- [x] Chromium installation.
- [x] 390 × 844 light mobile learner-flow smoke.
- [x] No horizontal overflow in canonical mobile smoke.

## Required next

Regenerate V4 baselines intentionally on one canonical CI platform:

- [ ] Talk — 390 light.
- [ ] Talk — 390 dark.
- [ ] Missions — 390 light.
- [ ] Missions — 390 dark.
- [ ] Briefing — 390 light.
- [ ] Briefing — 390 dark.
- [ ] Live — 390 light.
- [ ] Live — 390 dark.
- [ ] Recap — 390 light.
- [ ] Recap — 390 dark.
- [ ] Progress — 390 light.
- [ ] Progress — 390 dark.

Then expand:

- [ ] Repeat six screens at 840 px light/dark.
- [ ] Repeat six screens at 1440 px light/dark.
- [ ] Reach the full **36-snapshot** visual gate.
- [ ] Remove/replace obsolete Windows pre-V3 snapshots.
- [ ] Make snapshot platform canonical and deterministic.

---

# 25. Physical-device QA

Automated browser QA does not replace this.

## Android

- [ ] Expo/dev build launch.
- [ ] Microphone grant.
- [ ] Microphone deny.
- [ ] Native STT selected locale.
- [ ] Gemini TTS playback.
- [ ] Native TTS fallback.
- [ ] Keyboard open/close.
- [ ] Safe areas.
- [ ] Bottom navigation.
- [ ] Sheets.
- [ ] Back button.
- [ ] Background/foreground.
- [ ] Network interruption.
- [ ] Headset/Bluetooth if available.

## iPhone

- [ ] Development build launch.
- [ ] Microphone grant.
- [ ] Microphone deny.
- [ ] Native STT selected locale.
- [ ] Gemini TTS playback.
- [ ] Native TTS fallback.
- [ ] Keyboard open/close.
- [ ] Notch/safe-area handling.
- [ ] Sheet gestures.
- [ ] Edge-swipe/back.
- [ ] Background/foreground.
- [ ] Network interruption.
- [ ] Headset/Bluetooth if available.

---

# 26. Provider telemetry

Keep operational telemetry separate from learner evidence.

- [ ] Record conversation provider ID.
- [ ] Record conversation model.
- [ ] Record speech provider ID.
- [ ] Record speech model.
- [ ] Record STT provider/transport.
- [ ] Record selected locale.
- [ ] Record conversation latency.
- [ ] Record TTS latency.
- [ ] Record fallback used.
- [ ] Record fallback reason.
- [ ] Never use provider failure as a learning lapse.
- [ ] Never use provider telemetry to infer mastery.
- [ ] Decide retention/privacy policy before production persistence.

---

# 27. Anti-pattern checklist

Do not merge UI that introduces any of these:

- [ ] Purple AI gradient.
- [ ] Chat-messenger visual identity.
- [ ] Character avatar as root navigation.
- [ ] Fourth primary tab.
- [ ] Multiple competing primary CTAs in one region.
- [ ] Color-only status.
- [ ] Essential text below 12 px.
- [ ] Dashboard tables for normal learner flows.
- [ ] Full-screen modal for routine stack navigation.
- [ ] Arbitrary screen-specific brand colors/radii.
- [ ] Skill mastery inferred from phrase substring matching.
- [ ] Opaque ability score/mastery percentage.
- [ ] Certification claims.
- [ ] Hidden/obscure Help.
- [ ] Ambiguous microphone state.
- [ ] Accidental Back destroying an active session.
- [ ] Network/silence/disconnect recorded as a lapse.
- [ ] One failure visually erasing demonstrated competence.

Any checked anti-pattern is a blocker.

---

# 28. Learning-product work after V4 hardening

Roleplay/pedagogy implementation is now tracked in
`LEARNBYRP_ROLEPLAY_PROGRAM_TODO_V1.md`. That checklist is the execution authority
for Goal → Program → Mission → Attempt → Evidence → Next RP work. V4 remains the UI/UX
authority and must not duplicate the roleplay runtime contracts.

Do not let UI/provider hardening indefinitely block product learning features, but complete
the correctness gates in the roleplay-program TODO before implementing Transfer/Recovery UI.

## Next learning sequence

- [ ] Cold → Guided → Transfer loop.
- [ ] Transfer Mission.
- [ ] Transfer Chains.
- [ ] Retry from a specific failed moment.
- [ ] Skill Recovery Missions.
- [ ] Keep Retry and Transfer semantically distinct.
- [ ] Define recovery lapse strictly as a failed **cold opportunity**.
- [ ] Never create a lapse from silence.
- [ ] Never create a lapse from noise.
- [ ] Never create a lapse from disconnect.
- [ ] Recommendation layer consumes governed evidence, not opaque scores.

---

# 29. Immediate execution order

Work in this order.

## P0 — real provider/device confidence

Cloud-provider acceptance is complete on CI. Remaining P0 work requires physical-device validation.

- [x] Add `provider-acceptance.yml`.
- [x] Real OpenAI Realtime acceptance.
- [x] Real Gemini TTS acceptance.
- [x] FR/NL real speech checks.
- [x] Repository secrets confirmed by live workflow and masked in logs.
- [ ] Android native voice/STT test.
- [ ] iPhone native voice/STT test.
- [ ] Verify cloud → native fallback on a physical device.

## P1 — mobile release hardening

- [ ] Redesign `DuePhrasesPracticeModal`.
- [ ] Update transcript-survival E2E.
- [ ] Finish loading/error/empty-state system.
- [ ] Accessibility pass.
- [ ] Reduced-motion pass.
- [ ] Dark-mode phone pass.
- [ ] Dynamic Type pass.

## P2 — responsive finish

- [ ] Tablet QA.
- [ ] Desktop 1024/1200/1440 polish.
- [ ] Keyboard/focus-only desktop QA.

## P3 — visual gate

- [ ] Regenerate 390/840/1440 × light/dark baselines.
- [ ] Enable 36-snapshot PR-blocking gate.

## P4 — next learning intelligence

Execution details live in `LEARNBYRP_ROLEPLAY_PROGRAM_TODO_V1.md`.

- [ ] Complete roleplay-program P0.5 learning-correctness gate.
- [ ] Complete roleplay-program P1 scene/mission runtime hardening.
- [ ] Complete roleplay-program P2 evidence loop.
- [ ] Then implement Cold → Guided → Transfer.
- [ ] Transfer Chains.
- [ ] Retry from moment.
- [ ] Skill Recovery Missions.

---

# 30. V4 release definition of done

**Last verified cloud-provider milestone:** Provider Acceptance R1 merged to `main` at `fd7ea554521e33143763f18117d00e1e14f71389`.

V4 is complete only when:

- [x] Root navigation is exactly Talk / Missions / Progress.
- [x] Mobile-first Talk/Missions/Briefing/Live/Recap/Progress architecture is implemented.
- [x] One durable session ID spans the governed learner flow.
- [x] Meaning/phrase support is ledger-aware.
- [x] Provider runtime is vendor-neutral.
- [x] Gemini TTS has native TTS fallback.
- [x] OpenAI Realtime has HTTP fallback.
- [x] Local OpenAI-compatible structured providers can be configured.
- [x] Native voice selection follows target locale.
- [x] Real OpenAI provider acceptance passes.
- [x] Real Gemini TTS provider acceptance passes.
- [ ] FR and NL native-device voice acceptance passes.
- [ ] Android physical-device learner flow passes.
- [ ] iPhone physical-device learner flow passes.
- [ ] Accessibility release checklist passes.
- [ ] Reduced-motion checklist passes.
- [ ] Tablet/desktop QA passes.
- [ ] 36-snapshot V4 visual regression gate is active.
- [ ] Remaining legacy learner UI is visually consistent with V4.
- [ ] No V2/V3 contradiction remains active in implementation docs.

---

# 31. Maintenance rule

When a task above is completed:

1. change `[ ]` to `[x]`;
2. add a short implementation reference only when useful;
3. do not rewrite completed history into a new design document;
4. add new requirements here unless they belong to higher product/evidence architecture;
5. keep this file executable as a checklist rather than turning it back into a design essay.

---

**End of V4 TODO.**
