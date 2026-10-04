# Opportunity qualification rubric v1

**Status:** authored by an implementation pass, not by a qualified reviewer.

This document is the standard a reviewer is asked to check against, and the
reasoning behind the 65 values currently in the authored catalogue. It exists
because "the band looks about right" is not reviewable, and because a band with no
stated reason cannot be disagreed with.

It is not a validated instrument. Nothing here has been checked by a pedagogy
reviewer, and the values must not be treated as authoritative until one has.

## What a band is

An **evidence band** is the demand the opportunity actually holds when the rubric
is met. It is not:

- the mission's display level (`mission.levelRange`), which is presentation;
- the level of the character, the setting or the locale;
- the learner's placement hypothesis;
- the highest band any evidence in the session happens to carry.

One mission deliberately holds opportunities at more than one band, because a
mission is a setting, not a task. The café scene contains a1 repair turns and an
a2 substitution request; that is the acceptance item "a mission can contain
opportunities at different authored bands", satisfied rather than asserted.

## Authored is not reviewed

`SkillOpportunityDefinition.qualification` records the reasoning and the rubric
version. Releasing those dimensions to affect a learner's progress additionally
requires `status: 'reviewed'` **and** a named `reviewerId` and `reviewedAt`.

Until then the runtime writes `evidenceBand: 'unknown'` and no channel onto every
observation from that opportunity, so it cannot promote a skill, record a lapse,
or backfill a lower band. The performance is still recorded; only the
qualification is withheld.

This split is enforced in `features/learning/opportunityQualification.ts` and
covered by `opportunityQualification.test.ts` in both directions.

## The dimensions a judgement is made on

A simplified reading of the task-demand dimensions in [R5] (SSARC). Deliberately
small: four questions a reviewer can answer about one opportunity.

| Dimension | The question |
|---|---|
| Linguistic resource | Is the turn a fixed clause, or must it be generated for this situation? |
| Cognitive processing | Retrieve a formula, or infer, retain, re-formulate, or negotiate? |
| Interactional risk | Does the learner need a turn that may not be understood, or may need repeating? |
| Counterfactual content | Must the learner carry scene-specific content (a time, a constraint, a correction)? |

## Band rules

### `pre-a1` — not used

Every opportunity in the initial slice requires generating at least one
scene-specific clause, which is above memorized-chunk exchange. Asserting `pre-a1`
here would claim the content assesses something it does not. The band remains
valid in the type for future content that genuinely holds it.

### `a1`

One formulaic turn. High-frequency vocabulary, no adaptation to an unexpected
change, no meaning at stake beyond receiving the information or a single repair.

- Requesting repetition of a detail just delivered. The clause does not vary with
  the scene.
- Asking what one unfamiliar word means. The demand is the request, not the domain.
- Asking for a concrete fact about the object in hand: the price of the drink
  ordered, the size of the bike, whether the neighbour has the key.

### `a2`

Adapting, or re-formulating something already said.

- Carrying a constraint into a request for a different option after the first is
  refused.
- Generating a workable alternative arrangement rather than accepting an offer.
- Retaining a detail, re-formulating it as an interpretation, and turning that
  into a confirmation question.
- Asking a question whose answer is an unfamiliar rule or layout the learner must
  interpret to act: ticket validation, where official package warnings are shown.

### `b1`

Negotiating meaning when the shared understanding is actually wrong.

- Correcting a wrong fact the partner stated. The learner must notice a
  discrepancy, contradict it, specify the correct value, and repair the exchange.
  There is no single formula, and success is not guaranteed by one turn.

### `b2` and above — not used

No opportunity in the initial slice asks the learner to sustain or defend a
position. Claiming a band the content does not reach would make the catalogue
read as more complete than it is.

## Channel

`assessedChannel` is normally fixed by the canonical skill entry in
`content/skills.ts`, and `sceneValidation.ts` rejects an opportunity that
disagrees with it. It is checked rather than authored freely, because the channel
decides which performances can qualify at all.

Authored values follow that taxonomy: `interaction` for the transactional and
repair skills, `production` for `skill-paraphrase-when-stuck`.

`comprehension` is asserted nowhere. No opportunity in the initial slice assesses
the learner's understanding rather than the learner's own utterance, and a
comprehension claim without an authored comprehension rubric would be a category
error rather than a hard question.

## Eligible modalities

`eligibleModalities` decides whether a passage can satisfy the opportunity at all.
It is an integrity constraint, not a competence claim, so it is deliberately
**not** behind the review gate: gating it would let an unreviewed draft quietly
change what a learner may be assessed on.

Default is `['typed', 'spoken']`. The one authored exception is
`opp.es.cafe.repair.request-slower-speech`, which is `['spoken']`: the request
exists to change the audio channel, so a typed turn cannot perform the act the
opportunity assesses.

Typed performance never yields independent credit in any case —
`isIndependentSuccess` requires speech — so widening modality eligibility cannot
manufacture independent evidence.

## What the catalogue currently says

Per-opportunity values and rationales: `docs/PHASE_1H_OPPORTUNITY_REVIEW.md`,
generated from the same scene objects the runtime reads.

| Skill | Authored bands (opportunities) |
|---|---|
| `skill-ask-clarification` | a1 × 8 |
| `skill-check-understanding` | a2 × 10 |
| `skill-clarify-misunderstanding` | b1 × 3 |
| `skill-inquire-specifications` | a1 × 10, a2 × 6 |
| `skill-paraphrase-when-stuck` | a2 × 1 |
| `skill-propose-alternative` | a2 × 8 |
| `skill-request-repetition` | a1 × 8 |
| `skill-request-slower-speech` | a1 × 1 |
| `skill-request-substitution` | a2 × 8 |
| `skill-wayfinding-transit` | a2 × 2 |

65 opportunities: 27 at a1, 35 at a2, 3 at b1.

## What a reviewer does with this

1. Read the opportunity's `sceneCondition`, `relevantActionIds` and
   `positiveExamples` / `negativeExamples`.
2. Decide whether the stated band holds for **this** opportunity under the four
   dimensions above.
3. Accept or correct it. Correcting a band is a normal outcome, not a defect: the
   catalogue was authored by someone without pedagogy review, so disagreement is
   the expected case.
4. Record `status`, `reviewerId` and `reviewedAt` in the scene definition.

A reviewer who cannot defend a band should delete the authored values rather than
guess. Deleting them restores `unknown`, which fails closed and is already
enforced.

Reviewing one opportunity at a time will take longer than reading the table above.
That is the intended cost: the alternative is a band that nobody checked.

## Known weaknesses of this rubric

- `a1` for both "ask a factual question about your drink" and "ask what this word
  means" may be too coarse. Both are single-clause requests, but they are not the
  same demand.
- `a2` for every "propose an alternative" flattens the difference between
  agreeing a pickup time and negotiating a handover under time pressure.
- The b1 decision rests on an argument about repair difficulty, not on measured
  data. It is the judgement most likely to need revision.
- The split is derived from task demand, not from processing-theory evidence about
  this language pair. [R6] argues for language-specific review; none has happened.

These are stated so a reviewer starts by attacking them rather than by confirming
them.