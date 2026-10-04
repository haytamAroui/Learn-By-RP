# LearnByRP — Canonical Skills, Brand, Mission Content and Locale Reconciliation

**Version:** 1.0  
**Prepared:** 4 October 2026, Europe/Brussels  
**Repository:** haytamAroui/Learn-By-RP  
**Verified main snapshot:** `b2c1ad4eca8e140176b7c8e4fb1cb2c71b4f9ef7`  
**Status:** repository-grounded reconciliation proposal; no repository mutation or taxonomy migration performed  
**Purpose:** make the two learning/content blueprints safe to use against the existing product.

## 1. Decision summary

1. Preserve existing canonical skill IDs, evidence policies and recorded history. Authoring aliases describe content; they are not automatically persistable skills.
2. Keep the shipped V4 brand and platform typography as the implementation baseline. The teal palette and Manrope/Source Sans 3 pair are a separate unadopted visual exploration, not an incremental restyling instruction.
3. Restore the communicative goal and interlocutor context in mission discovery. A location description does not explain what the learner needs to accomplish.
4. Treat French/Belgian Dutch as an additive content slice within the six-language product. Preserve existing Spanish, German, Italian and Japanese content and behavior.
5. Normalize artifact filenames and explicitly map authoring locale codes into existing repository contracts.
6. Prioritize content for the four existing direct skills with no associated missions before expanding the assessment taxonomy.

The review correctly identifies integration failures that document-integrity checks do not detect. The original documents were insufficiently grounded in the repository taxonomy and visual identity. Their “reconcile later” warnings did not make a fully specified replacement palette or a 36-alias authoring inventory integration-ready.

## 2. Verified repository baseline

Primary sources are linked in section 11, pinned to the inspected commit.

### 2.1 Skill catalogue

There are **15 canonical skills: 14 direct and one derived family**. The derived family is `skill-communicative-repair`; its six children provide direct evidence. The catalogue defines positive/negative examples and boundary notes. These definitions outrank broad authoring labels.

| Canonical ID | Policy | Catalogue associatedMissions count | Missions declaring ID in primary/secondary fields |
|---|---|---:|---:|
| skill-request-substitution | direct | 14 | 19 |
| skill-propose-alternative | direct | 12 | 13 |
| skill-inquire-specifications | direct | 20 | 32 |
| skill-wayfinding-transit | direct | 6 | 6 |
| skill-communicative-repair | derived | 16 | 25 |
| skill-request-repetition | direct | 8 | 8 |
| skill-request-slower-speech | direct | 1 | 1 |
| skill-ask-clarification | direct | 8 | 8 |
| skill-check-understanding | direct | 10 | 10 |
| skill-clarify-misunderstanding | direct | 3 | 3 |
| skill-paraphrase-when-stuck | direct | 1 | 1 |
| skill-give-opinion-with-reason | direct | 0 | 0 |
| skill-compare-options | direct | 0 | 0 |
| skill-make-arrangement | direct | 0 | 0 |
| skill-narrate-past-event | direct | 0 | 0 |

Counts were extracted from the inspected catalogue and the 32 mission definitions in `missions.ts` plus `missions.nlBE.ts`. Catalogue associations and mission declarations are distinct. Both also differ from released opportunity coverage and actual learner observations. Do not describe association/declaration counts as measured learner evidence.

The review’s repair-family count of 17 does not match this snapshot: its associated list contains 16 IDs; 25 missions declare the family. A different branch, counting method or later snapshot could explain the difference. This document does not claim those lists ought to be identical without a defined indexing policy.

### 2.2 Current design identity

Verified light tokens include:

| Role | Existing token/value |
|---|---|
| Canvas | canvas / #F2EDE4 |
| Surface | surface / #FFFFFF |
| Secondary surface | surfaceSoft / #F4F0E8 |
| Main text | ink / #1C1917 |
| Body text | body / #57534E |
| Brand and CTA | brand, brandButton / #A7442F |
| Language/support accent | language / #246B63 |
| Focus against ordinary background | focus / #246B63 |

Dark mode already has separate foreground and surface roles, with the CTA fill retaining its own token. Preserve these distinctions. `tailwind.config.js` uses platform System/system-ui fonts for sans and display; neither proposed new font family is configured there.

### 2.3 Mission discovery

The inspected `MissionsScreen.tsx` catalogue row shows title, neighbourhood, level/time and `mission.setting`. It does not render `mission.learnerGoal` or character identity in that row. The route view also omits the goal and interlocutor. This establishes the current source-level omission; no fresh rendered visual assessment was performed.

### 2.4 Language contracts

`LanguageCode` is `es | fr | de | it | ja | nl`. The Belgian Dutch catalogue uses `language: 'nl'` with `mission-nl-be-*` IDs. The content blueprint’s `fr-BE` and `nl-BE` codes cannot be inserted directly as current `LanguageCode` values.

The current French mission content includes a Paris/Rive Gauche setting. Belgian French content should be added as a locale/context variant rather than relabelling all existing French content as Belgian.

## 3. Mapping classes

- **Exact reuse:** meaning aligns with an existing direct skill. The opportunity still needs reviewed rubric, trigger, support and membership.
- **Conditional/refine:** broad label can map only after inspecting the specific communicative act. No automatic alias conversion.
- **Content only / extension candidate:** no safe canonical equivalence. Keep as a scene action, teaching objective or reviewed rubric dimension; propose a new skill separately only if needed.
- **Derived display:** organizational parent; never persist direct learner evidence against it.

The recommended classification is **10 exact aliases, 4 conditional aliases and 22 without a safe direct equivalence**. This differs from the review’s 10/3/23 because S04 `ask_information` has useful conditional coverage through existing inquiry/transit skills. That does not make the generic S04 definition equivalent to either skill.

## 4. Complete alias reconciliation table

| Alias | Authoring label | Class | Canonical mapping / treatment |
|---|---|---|---|
| S01 | greet_and_introduce | Content only / candidate | Opening act; no canonical direct greeting/introduction skill |
| S02 | open_interaction | Content only / candidate | Opening act; do not convert to inquiry just because contact began |
| S03 | give_information | Content only / candidate | Information provision; not inquiry or confirmation by default |
| S04 | ask_information | Conditional/refine | Concrete service/decision details → skill-inquire-specifications; actionable transit navigation → skill-wayfinding-transit; unclear prior meaning → skill-ask-clarification; generic questions outside those boundaries remain content-only |
| S05 | make_request | Conditional/refine | Only a genuinely matching act can use skill-request-substitution, skill-propose-alternative or skill-make-arrangement. Generic requests such as asking for an appointment have no blanket equivalent |
| S06 | order_or_purchase | Content only / candidate | Transaction/world act. Ordering alone is not a demonstrated substitution or inquiry |
| S07 | confirm_details | Content only / candidate | Routine confirmation is not always communicative repair. A proposed interpretation requiring verification can be separately authored as S13 / skill-check-understanding |
| S08 | express_preference | Content only / candidate | Preference alone cannot become skill-give-opinion-with-reason |
| S09 | thank_and_close | Content only / candidate | Closing act; no direct canonical closing skill |
| S10 | request_repetition | Exact reuse | skill-request-repetition |
| S11 | request_slower_speech | Exact reuse | skill-request-slower-speech |
| S12 | ask_clarification | Exact reuse | skill-ask-clarification; use its prior-meaning/ambiguity boundary |
| S13 | check_understanding | Exact reuse | skill-check-understanding; learner supplies an interpretation for verification |
| S14 | request_substitution | Exact reuse | skill-request-substitution, subject to item/option versus arrangement boundary |
| S15 | describe_problem | Content only / candidate | Problem description can support a scene but is not automatically narration or repair |
| S16 | describe_routine | Content only / candidate | Routine description; no current direct canonical equivalent |
| S17 | describe_plan | Content only / candidate | Stating a plan is not establishing a mutually actionable arrangement |
| S18 | make_arrangement | Exact reuse | skill-make-arrangement; agreement requires usable next-action details |
| S19 | accept_or_decline | Content only / candidate | Response act; refusal alone is not proposing an alternative |
| S20 | compare_options | Exact reuse | skill-compare-options; compare at least two alternatives on a relevant dimension |
| S21 | give_reason | Conditional/refine | skill-give-opinion-with-reason only when a viewpoint and connected reason are both demonstrated; causal explanation alone has no exact home |
| S22 | describe_past_event | Conditional/refine | skill-narrate-past-event only when an understandable sequence and context exist; one disconnected past fact does not suffice |
| S23 | explain_sequence | Content only / candidate | Procedure sequencing is not past narration. Past-event sequencing may contribute to a separately authored narrate-past-event opportunity |
| S24 | ask_follow_up | Content only / candidate | Interaction move; map a concrete follow-up only if it independently matches S04’s canonical boundary |
| S25 | paraphrase_when_stuck | Exact reuse | skill-paraphrase-when-stuck |
| S26 | clarify_misunderstanding | Exact reuse | skill-clarify-misunderstanding |
| S27 | propose_alternative | Exact reuse | skill-propose-alternative; repairing an existing arrangement, not simple replacement of an item |
| S28 | agree_or_disagree_politely | Content only / candidate | Stance/register act; can contribute to opinion evidence only through a separate matching opportunity |
| S29 | handle_complaint | Content only / candidate | Complex scene outcome or candidate skill; no blanket canonical equivalent |
| S30 | hold_the_floor | Content only / candidate | Turn-management move; no current direct canonical equivalent |
| S31 | summarize | Content only / candidate | Summary/mediation act; not automatically narration |
| S32 | relay_information | Content only / candidate | Mediation act; do not infer a canonical skill from successful message delivery |
| S33 | negotiate_constraints | Content only / candidate | Composite outcome involving potentially several canonical opportunities; avoid a broad shortcut skill |
| S34 | qualify_claim | Content only / candidate | Discourse quality / extension candidate; no direct current mapping |
| S35 | defend_position | Content only / candidate | Larger discourse act; author opinion-with-reason/comparison opportunities where applicable rather than equating all defenses |
| S36 | adapt_register | Content only / candidate | Initially a reviewed performance dimension rather than automatically a new direct skill |

“Content only” does not mean omit the behavior from roleplay. It means the behavior cannot currently receive official skill credit under an invented ID. A successful order, greeting or summary still changes the scene and can appear in an honest activity recap.

## 5. Preserve the three missing canonical anchors

Add canonical anchors to the authoring inventory rather than forcing them into broad aliases.

| Anchor | Canonical ID | Policy | Authoring instruction |
|---|---|---|---|
| C01 | skill-inquire-specifications | direct | Ask for decision-relevant price, conditions, requirements or recommendation; distinguish from repetition and clarification of prior meaning |
| C02 | skill-wayfinding-transit | direct | Request actionable route/platform/travel information; not simply naming a destination |
| C03 | skill-communicative-repair | derived | Keep as a discoverable family and aggregate from validated specific children; never attach a direct evidence opportunity to this parent |

### 5.1 Catalogue repair examples

| Draft scenes | Current risk | Reconciliation |
|---|---|---|
| A1-02.3 café price; A1-03.3 market total | Broad S04 may orphan inquiry | Author C01 opportunity when the learner requests the concrete price |
| A1-05.1 tram route; A2-04.2 replacement route | Broad S04/S14 obscures navigation | Author C02 route opportunity; substitution credit only for a separate qualifying act |
| A1-04.2 repeating directions | Repair family omitted from authoring inventory | Direct credit S10; C03 organizes the resulting child evidence |
| A2-02.2 changing appointment | S14 may be misused for an arrangement | Asking for an alternative slot needs a reviewed boundary decision; proposing a changed arrangement can use S27; establishing an agreement can use S18 through a distinct act |
| B1-07.1 recommending an activity | S21 could credit a bare reason | Require a viewpoint plus connected reason under canonical opinion rubric |
| B1-09.1–3 experience narrative | S22 could credit one past fact | Elicit sequence/context and author a canonical narration opportunity |
| A1-06.3 appointment confirmation | S07 may be miscredited as repair | Use content outcome unless a genuine interpretation-check opportunity is authored |

Never double-credit the same act across a hierarchy parent/child. Preserve the repository’s most-specific evidence and passage-credit policies.

## 6. Content priorities before new taxonomy

| Existing direct skill with no associated missions | Draft content to review first | Required additions |
|---|---|---|
| skill-make-arrangement | A1-06, A1-10, A2-02, A2-09 | Actual mutually actionable agreement opportunity; primary/secondary membership; reviewed association |
| skill-compare-options | A2-04, A2-07, A2-12, B1-02 | At least two options and a meaningful difference; completion alone insufficient |
| skill-give-opinion-with-reason | B1-07, B2-02, B2-08 | Viewpoint + relevant reason; distinguish comparison and causal report |
| skill-narrate-past-event | B1-01, B1-06, B1-09 | Sequence/context and an attributable learner passage |

These candidates do not become launch-visible merely by updating associatedMissions. Review content, compile opportunity definitions, check mission membership, support/capability compatibility and actual release eligibility.

### Taxonomy expansion workflow

For each proposed new direct skill: define distinct observable behavior, positives/negatives, boundaries, hierarchy, modality, opportunity patterns, locale content, assessment fixtures and migration implications. Add a stable ID only after review. Never reuse or silently broaden an existing stable ID to absorb unrelated behaviors.

Do not require all 22 unmatched aliases to become canonical skills. Many are scene actions or discourse-quality dimensions. Prioritize a new evidence skill only when a product decision actually needs its independent projection.

## 7. Explicit visual decision: keep V4

**Reconciliation baseline:** preserve the existing brick-red identity and platform font stack. Retain the useful scene-led layout, concise copy, contextual illustration and accessible help-sheet principles from the content blueprint.

Replace the content blueprint’s normative palette/font instructions with semantic references to existing `LIGHT`, `DARK`, `TYPE`, `SPACE`, `RADIUS`, focus and motion tokens. Archive its teal/Manrope/Source Sans proposal as an optional rebrand exploration, clearly outside the implementation baseline.

Do not copy the old alternative palette’s contrast validation into the retained-brand design. Test the real token pairs and rendered states with existing design checks and appropriate accessibility verification. The fact that seven alternative pairs passed does not validate the current implementation or justify a rebrand.

A future rebrand is a separate explicit product/design decision with concrete mockups, token mapping, native/web dark-mode review, accessibility checks and approval of the visual result. This document makes no such change.

## 8. Missions content restoration contract

Catalogue and route previews must answer:

1. What situation is this?
2. What do I need to accomplish?
3. Who am I speaking with?

### Compact row specification

- Title.
- Goal: short usable form of `mission.learnerGoal`, not a generic location description.
- Character/context: `mission.character.name` and role where useful.
- Secondary metadata: authored band and duration.
- Optional neighbourhood/setting detail on expansion or briefing.

Avoid adding every field into a taller bordered card. Remove or demote the current long setting line to make room for the communicative job. Goals should wrap when necessary; large text must not hide the task through one-line truncation. Shorten through a reviewed goal summary field where needed, rather than stripping meaning.

Accessibility name/hint should include the action context. Search by goal and character can be considered because the current filter only searches title, setting and character name.

Verification: mission data with long goals, all UI translations, small/large phones, large text, screen reader, route/catalog variants and keyboard navigation on web. Rendered QA is still outstanding.

## 9. Six-language preservation and locale mapping

| Existing language | Existing context | New slice treatment |
|---|---|---|
| es | Spanish content | Preserve missions, evidence, discovery and voice compatibility |
| fr | French content, including Paris context | Preserve; add Belgian-context variants without relabelling history |
| de | German content | Preserve |
| it | Italian content | Preserve |
| ja | Japanese content | Preserve |
| nl | Belgian Dutch missions with nl-be IDs | Extend under an explicit locale adapter |

For current contracts, authoring `nl-BE` maps to runtime language `nl` plus explicit locale provenance where supported. Authoring `fr-BE` maps to `fr` plus reviewed Belgian locale/context metadata; it does not imply existing `fr` evidence was obtained in Belgium.

If the repository lacks a suitable locale field at a particular boundary, propose and review that contract extension. Never smuggle locale strings into the language union or merge histories incorrectly.

Acceptance additions:

- [ ] Existing es/fr/de/it/ja/nl catalogue entries remain reachable and retain IDs.
- [ ] Existing histories and support semantics remain intact.
- [ ] French Belgian variants preserve existing French missions.
- [ ] New locale mapping is explicit at runtime/provider/content boundaries.
- [ ] Missing new-slice assets do not hide existing reviewed content.
- [ ] UI language and target-language variety remain distinct.

## 10. Document patch plan and compiler behavior

### Required document changes

| Document location | Change |
|---|---|
| Complete Architecture V2, design authority | Explicitly name existing token/type sources as default; refer to this reconciliation |
| Content blueprint intro | Remove download suffix from the canonical companion filename |
| Content blueprint skill catalogue | Add mapping classes and C01/C02/C03; distinguish authoring acts from canonical evidence |
| Content blueprint scene tables | Resolve every evidence-bearing alias at the opportunity level; correct arrangement/substitution and inquiry/navigation cases |
| Content blueprint palette/type section | Keep V4; move alternate design into a clearly separate exploration |
| Content blueprint locale scope/checklist | State additive two-locale slice and preserve all six existing language codes |
| Both Missions contracts | Require goal and interlocutor context with compact layout rules |

Canonical companion name: `LEARNBYRP_COMPLETE_LEARNING_CONTENT_UX_ARCHITECTURE_V2.md`. This filename is normalized from the generated artifact; it was not present in the inspected repository tree. A repository link must point to its actual location after import, not an invented path. `(1)` is a download suffix, not a source identifier.

### Compiler rules

- Resolve exact aliases to known canonical IDs without changing meaning.
- Conditional aliases need explicit per-opportunity reviewer decisions.
- Unmatched behaviors can remain non-evidence scene objectives.
- An unresolved alias marked evidence-bearing fails compilation; never silently drop it or mint a skill at runtime.
- Derived parents cannot receive direct opportunities/evidence.
- A mission can complete with zero supported canonical target evidence.
- Updating the authoring mapping cannot retrospectively reinterpret historical observations.

### Suggested delivery order

1. Land the reconciliation document and explicit brand/locale defaults.
2. Restore mission-preview goal/interlocutor context using existing tokens.
3. Resolve the initial two-locale content slice into canonical opportunity definitions.
4. Give the four empty direct skills their first genuinely reviewed mission coverage.
5. Evaluate whether any additional evidence skills are actually needed.
6. Expand content and run semantic/UX validation.

No code changes, PR creation or merge are part of this artifact.

## 11. Primary repository sources

All links are pinned to the verified snapshot rather than mutable main.

- [Canonical skills, examples, boundaries, policies and launch visibility](https://github.com/haytamAroui/Learn-By-RP/blob/b2c1ad4eca8e140176b7c8e4fb1cb2c71b4f9ef7/src/content/skills.ts).
- [Mission membership and assessor allowlist](https://github.com/haytamAroui/Learn-By-RP/blob/b2c1ad4eca8e140176b7c8e4fb1cb2c71b4f9ef7/src/features/learning/skillMembership.ts).
- [Evidence validation, hierarchy and support boundaries](https://github.com/haytamAroui/Learn-By-RP/blob/b2c1ad4eca8e140176b7c8e4fb1cb2c71b4f9ef7/src/features/learning/skillEvidence.ts).
- [Design tokens and typography roles](https://github.com/haytamAroui/Learn-By-RP/blob/b2c1ad4eca8e140176b7c8e4fb1cb2c71b4f9ef7/src/design/tokens.ts).
- [Web color values](https://github.com/haytamAroui/Learn-By-RP/blob/b2c1ad4eca8e140176b7c8e4fb1cb2c71b4f9ef7/global.css).
- [Configured font stack](https://github.com/haytamAroui/Learn-By-RP/blob/b2c1ad4eca8e140176b7c8e4fb1cb2c71b4f9ef7/tailwind.config.js).
- [Missions catalogue and route implementation](https://github.com/haytamAroui/Learn-By-RP/blob/b2c1ad4eca8e140176b7c8e4fb1cb2c71b4f9ef7/src/components/MissionsScreen.tsx).
- [Existing mission catalogue](https://github.com/haytamAroui/Learn-By-RP/blob/b2c1ad4eca8e140176b7c8e4fb1cb2c71b4f9ef7/src/data/missions.ts).
- [Belgian Dutch missions](https://github.com/haytamAroui/Learn-By-RP/blob/b2c1ad4eca8e140176b7c8e4fb1cb2c71b4f9ef7/src/data/missions.nlBE.ts).
- [Language and mission contracts](https://github.com/haytamAroui/Learn-By-RP/blob/b2c1ad4eca8e140176b7c8e4fb1cb2c71b4f9ef7/src/types/index.ts).

## 12. Verification limits

The 15-skill baseline, policies, association lists, source-level mission declarations, shipped token values, configured fonts, language union and mission-preview omission were inspected directly. Mapping recommendations are semantic interpretations of those definitions and require content review before assessed release. No actual learner archive, deployed application, alternate branch or rendered screen was inspected. No mission-association count proves empirical learner evidence, and no empty association list alone proves an entire skill is impossible to exercise informally.
