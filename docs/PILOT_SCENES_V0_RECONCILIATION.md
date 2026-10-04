# Pilot Scenes V0 — reconciliation against this checkout

Date: 4 October 2026. Source draft: *LearnByRP — Pilot Scenes V0 (Dutch, Belgium, A1–A2)*, an unreviewed AI draft.

The draft says it has not seen this repository, and asks that overlapping content
reuse the existing scene id and add only what is missing. That is what this
document does. It records what already exists, what the draft adds, and which
questions need a person rather than another pass of code.

Structural claims here are locked by `src/content/pilotSceneContract.test.ts`.

## 1. All three pilot scenes already exist

| Draft scene | Existing scene id | Family | Opportunities | Status |
|---|---|---|---|---|
| 1 Koffiebar | `scene.nl-be.cafe.breakfast` | `counter-ordering` | 5 | released |
| 2 Pakjespunt | `scene.nl-be.parcel.pickup` | `parcel-service` | 4 | released |
| 3 Fietsverhuur | `scene.nl-be.rental.bike` | `equipment-rental` | 4 | released |

**Answer to open question 3:** all three families are already authored. The pilot
needs no new scenes, and creating parallel ids for the same situations would split
the evidence ledger for no gain.

All three already carry the full action chain the drafts describe — order →
alternative → selection, reference → alternative → arrangement, request →
alternative → selection → confirmation — and each has authored checkpoints and
`achieved` / `partial` completion predicates.

## 2. Opportunity mapping, and the review workload

**Answer to open question 4:** the pilot needs **13 of the 65** opportunities
reviewed, not all of them.

| Draft opportunity | Existing opportunity id | Skill | Band (this repo / draft) |
|---|---|---|---|
| `cafe-request-alternative` | `opp.nl-be.cafe.request-substitution` | `skill-request-substitution` | a2 / A2 ✓ |
| `cafe-polite-request` | *no such skill* | — | — |
| `parcel-request-alternative` | `opp.nl-be.parcel.propose-alternative` | `skill-propose-alternative` | a2 / A2 ✓ |
| `parcel-ask-repetition` | `opp.nl-be.parcel.repair.request-repetition` | `skill-request-repetition` | **a1 / A2 ✗** |
| `bike-request-alternative` | `opp.nl-be.rental.request-substitution` | `skill-request-substitution` | a2 / A2 ✓ |
| `bike-ask-information` | `opp.nl-be.rental.inquire-specifications` | `skill-inquire-specifications` | **a1 / A2 ✗** |
| `bike-polite-request` | *no such skill* | — | — |

Three bands agree. **Two disagree**, and the disagreements are in opposite
directions from a naive reading: the draft rates *harder* than the authored rubric
in both cases.

### The hero skill is two skills here

The draft treats "request an alternative" as one skill appearing in three families
so that transfer is visible. This repository's canonical taxonomy splits it:

- asking what else exists, where options exist → `skill-request-substitution`
  (café, rental);
- proposing a new arrangement, where no option is on the table → `skill-propose-alternative`
  (parcel).

Transfer, delayed retrieval and the Progress projection are all computed **per
skill id**. So under the current taxonomy the pilot's three scenes show the hero
move in three families, but as **two skills**: one in two families, one in one.

This is a real decision, not a defect, and it changes what the primary endpoint
means:

- **(a) Keep the split.** The pilot reports two hero measures. Honest, and it
  matches the taxonomy the rest of the product already uses.
- **(b) Unify into one skill.** Requires a new canonical skill, a migration for
  historical evidence keyed to the old ids, and re-review of every opportunity that
  inherits the new band. Not a pilot-scale change.

Recommendation: (a) for the pilot. Decide (b) only with reviewer capacity to
re-qualify the affected catalogue, which is the same capacity 1H is already
short of.

### "Polite request" is not a skill here

The draft lists "Polite request (A1)" as a skill with its own opportunities in the
café and bike scenes. The canonical catalog has no such skill, and politeness is
not a communicative act that the current rubric would assess separately from the
act it modifies ("Een koffie, alstublieft" is an order with a politeness marker).

Adding it means: a new catalog skill, its modality, its band, its opportunities in
N scenes, and reviewer sign-off. Treating politeness as a scoring dimension
separately from the request is also the kind of thing the blueprint's "linguistic
development stays separate from communicative evidence" rule argues against —
politeness is closer to form than to capability.

Recommendation: keep politeness as *content quality* reviewed per line (see §5),
not as a scored opportunity.

## 3. Counting rules: already authored

The draft's central rule — asking what else exists counts, stating your own
fallback or accepting does not — is already the authored negative-example set:

- café: *"Merely accepts or chooses a substitute that the character has already
  offered."* / *"Repeats the unavailable option without asking for an alternative."*
- rental: *"Merely accepts or chooses a bike the clerk has already offered."*
- parcel: *"Rejects the unavailable time without suggesting another arrangement."*

`pilotSceneContract.test.ts` now fails if any hero opportunity loses that
exclusion, because a learner could otherwise be credited for accepting.

## 4. What the draft adds that does not exist yet

| Draft item | State in this repository | Decision needed |
|---|---|---|
| Default entry **cold**, hidden phrases | `ProgramEntryMode` is `observe_first \| warmup_first \| guided_first`. There is no cold mode; default is guided/warmup | Product decision. "I'm a complete beginner" already maps to the onboarding self-report → `deriveProgramEntryMode` → `observe_first` |
| **Rescue** "I'm lost" | No rescue control. `Help` opens the coach sheet | Phase 2 UX. The ladder it should step through already exists |
| Help ladder **idea → start → full** | Exists as `intent_hint → partial_form → full_form` (+ `explanation`) | Naming only |
| Silence prompts ("Zegt u het maar.", "Ja?") | Not authored. Scene content the Director does not currently produce | Scene authoring + review |
| Scratch prices/times ("drie euro vijftig") | Not authored; the café asks price via `ask_specification` | Scene authoring + review |
| Recap wording templates | Copy is aggregate (`unassisted`, `assisted`, `readyToPractise`), no per-opportunity sentence | Phase 2 UX; see below |
| Next-scene logic | `nextRp.ts` already picks different-family transfer with reason codes | Draft's table is consistent with it |

On the recap: the draft's rules are already satisfied by the existing copy. There
is no score, percentage, or fluency judgement; `noOfficialScore` is stated
explicitly; scene result and skill evidence are separate sections; and the status
vocabulary is New / Supported / Growing / Steady. What is missing is only the
per-opportunity sentence the draft wants ("You asked what else was available, on
your own"), which is a presentation change, not a truth change.

## 5. Band disagreements for the reviewer

Both disagreements are defensible, which is why they belong to the gate and not to
a code change.

**`opp.nl-be.parcel.repair.request-repetition` — repo a1, draft A2.**
The authored rationale is that asking for a repeat is one formulaic clause that
does not vary with the scene. The draft's case is that Dirk's fast delivery plus
six code digits makes the *whole exchange* demanding at A2. Both can be true:
the clause is A1, the scene around it is not. If the reviewer prefers A2, the
rationale should say so rather than reclassify silently.

**`opp.nl-be.rental.inquire-specifications` (and `parcel`/`cafe` peers) — repo a1,
draft A2.**
The authored rationale treats asking a concrete price or return-time question at a
counter as one factual question. The draft rates price and condition questions as
A2. This decision propagates to 16 opportunities across the catalogue, so it is
worth deciding once, deliberately, rather than per scene.

Related: the draft's own skills table rates "Ask for information (A2)" and "Ask for
repetition (A2)" as skill-level bands, while the rubric in
`docs/OPPORTUNITY_QUALIFICATION_RUBRIC_V1.md` rates the turns a1. A reviewer
should resolve skill-level framing versus opportunity-level demand as one question,
because the two answers give different numbers for the same scene.

## 6. Open questions 1, 2 and 5

**Q1 — is a bare "Pardon?" asking for repetition?** Currently yes, and that is a
risk. The authored positive example is a request to repeat the detail; "Pardon?" in
Dutch is ambiguous between *excuse me* and *say that again*, and the validator
would treat it as a repetition request. Either the reviewer accepts the ambiguity
or the opportunity needs an exclusion such as "a bare attention-getter without a
request to repeat".

**Q2 — does a character check that prompts the answer count as independent?**
Currently yes, because character lines are scene content and only recorded support
exposures downgrade retrieval. The draft is right to worry: "Hebt u me verstaan?"
followed by the learner asking for repetition is functionally assisted, because the
character handed over the next move. If a pilot scene authors such a prompt, the
honest options are to record it as support, or to remove it. This is an integrity
decision about what counts as help, and it should be made before any pilot scene
authors a prompting line.

**Q5 — illustrated world in scope?** Still open, and it is the same decision that
blocks 1I. The pilot can run text-and-voice; the blueprint's visual direction
cannot ship without the assets and review that do not exist.

## 7. What was changed in this pass

- `src/content/pilotSceneContract.test.ts` — 10 assertions locking the structural
  properties the pilot depends on: the three families exist and are distinct, each
  carries a hero opportunity, the "accepting is not asking" exclusion survives
  content edits, the two-skill reality is recorded rather than papered over, and
  the pilot's 13 opportunities stay reviewable and unaccepted.
- No authored content, learner-facing copy, entry mode or support behaviour was
  changed. Every one of those requires a reviewer or a product decision listed
  above, and the draft is explicitly unreviewed.