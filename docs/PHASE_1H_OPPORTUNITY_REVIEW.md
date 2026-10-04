# Phase 1H — authored opportunity qualification review list

**Generated:** do not edit by hand. Regenerate with `npx tsx scripts/generate-opportunity-review.mts`.

Derived from the authored scene catalogue, read the same way the runtime reads it. This file lists what a human reviewer still has to decide. It is not evidence that any row has been reviewed.

## Status

- Authored opportunities: **65**
- In scenes not marked `released`: **0**
- Missing `evidenceBand`: **65**
- Missing `assessedChannel`: **65**
- Missing both: **65**

`SceneOpportunity` declares `evidenceBand`, `assessedChannel` and `eligibleModalities` as optional, so an unqualified opportunity compiles and runs. Nothing fails until a learner's evidence is judged against it, which is why this cannot be closed by a passing test suite.

## What a reviewer decides, per opportunity

1. **Evidence band** — the authored demand the rubric actually holds, not the mission display band.
2. **Assessed channel** — production, comprehension, or both. Determines which performances can qualify.
3. **Eligible modalities** — whether typed production can satisfy this opportunity at all.

A reviewer who cannot defend the band from the opportunity's own trigger, exposure and rubric should record it as undecided rather than guessing. An undecided band must stay invisible to promotion, which the validators already enforce.

## Review list

| Opportunity | Scene | Scene review | Skill | Band | Channel | Modalities |
|---|---|---|---|---|---|---|
| `opp.es.cafe.inquire-specifications.after-item` | `scene.es.cafe.breakfast` | released | `skill-inquire-specifications` | — | — | — |
| `opp.es.cafe.repair.ask-clarification` | `scene.es.cafe.breakfast` | released | `skill-ask-clarification` | — | — | — |
| `opp.es.cafe.repair.check-understanding` | `scene.es.cafe.breakfast` | released | `skill-check-understanding` | — | — | — |
| `opp.es.cafe.repair.clarify-misunderstanding` | `scene.es.cafe.breakfast` | released | `skill-clarify-misunderstanding` | — | — | — |
| `opp.es.cafe.repair.paraphrase-when-stuck` | `scene.es.cafe.breakfast` | released | `skill-paraphrase-when-stuck` | — | — | — |
| `opp.es.cafe.repair.request-repetition` | `scene.es.cafe.breakfast` | released | `skill-request-repetition` | — | — | — |
| `opp.es.cafe.repair.request-slower-speech` | `scene.es.cafe.breakfast` | released | `skill-request-slower-speech` | — | — | — |
| `opp.es.cafe.request-substitution.after-alternative` | `scene.es.cafe.breakfast` | released | `skill-request-substitution` | — | — | — |
| `opp.es.dining.inquire-specifications` | `scene.es.dining.terrace` | released | `skill-inquire-specifications` | — | — | — |
| `opp.es.dining.propose-alternative` | `scene.es.dining.terrace` | released | `skill-propose-alternative` | — | — | — |
| `opp.es.dining.request-substitution` | `scene.es.dining.terrace` | released | `skill-request-substitution` | — | — | — |
| `opp.es.hotel.inquire-specifications` | `scene.es.hotel.checkin` | released | `skill-inquire-specifications` | — | — | — |
| `opp.es.hotel.propose-alternative` | `scene.es.hotel.checkin` | released | `skill-propose-alternative` | — | — | — |
| `opp.es.hotel.repair.check-understanding` | `scene.es.hotel.checkin` | released | `skill-check-understanding` | — | — | — |
| `opp.es.hotel.repair.request-repetition` | `scene.es.hotel.checkin` | released | `skill-request-repetition` | — | — | — |
| `opp.es.metro.inquire-specifications` | `scene.es.metro.ticket-platform` | released | `skill-inquire-specifications` | — | — | — |
| `opp.es.metro.repair.ask-clarification` | `scene.es.metro.ticket-platform` | released | `skill-ask-clarification` | — | — | — |
| `opp.es.metro.repair.check-understanding` | `scene.es.metro.ticket-platform` | released | `skill-check-understanding` | — | — | — |
| `opp.es.metro.repair.request-repetition` | `scene.es.metro.ticket-platform` | released | `skill-request-repetition` | — | — | — |
| `opp.es.metro.wayfinding` | `scene.es.metro.ticket-platform` | released | `skill-wayfinding-transit` | — | — | — |
| `opp.es.neighbor.inquire-specifications` | `scene.es.neighbor.key-handover` | released | `skill-inquire-specifications` | — | — | — |
| `opp.es.neighbor.propose-alternative` | `scene.es.neighbor.key-handover` | released | `skill-propose-alternative` | — | — | — |
| `opp.es.neighbor.repair.check-understanding` | `scene.es.neighbor.key-handover` | released | `skill-check-understanding` | — | — | — |
| `opp.es.neighbor.repair.clarify-misunderstanding` | `scene.es.neighbor.key-handover` | released | `skill-clarify-misunderstanding` | — | — | — |
| `opp.es.parcel.inquire-specifications` | `scene.es.parcel.reschedule` | released | `skill-inquire-specifications` | — | — | — |
| `opp.es.parcel.propose-alternative` | `scene.es.parcel.reschedule` | released | `skill-propose-alternative` | — | — | — |
| `opp.es.parcel.repair.ask-clarification` | `scene.es.parcel.reschedule` | released | `skill-ask-clarification` | — | — | — |
| `opp.es.parcel.repair.request-repetition` | `scene.es.parcel.reschedule` | released | `skill-request-repetition` | — | — | — |
| `opp.es.pharmacy.inquire-specifications.open` | `scene.es.pharmacy.symptom` | released | `skill-inquire-specifications` | — | — | — |
| `opp.es.pharmacy.request-substitution.after-label-comparison` | `scene.es.pharmacy.symptom` | released | `skill-request-substitution` | — | — | — |
| `opp.es.rental.inquire-specifications` | `scene.es.rental.bike` | released | `skill-inquire-specifications` | — | — | — |
| `opp.es.rental.repair.ask-clarification` | `scene.es.rental.bike` | released | `skill-ask-clarification` | — | — | — |
| `opp.es.rental.repair.check-understanding` | `scene.es.rental.bike` | released | `skill-check-understanding` | — | — | — |
| `opp.es.rental.request-substitution` | `scene.es.rental.bike` | released | `skill-request-substitution` | — | — | — |
| `opp.nl-be.cafe.inquire-specifications` | `scene.nl-be.cafe.breakfast` | released | `skill-inquire-specifications` | — | — | — |
| `opp.nl-be.cafe.repair.ask-clarification` | `scene.nl-be.cafe.breakfast` | released | `skill-ask-clarification` | — | — | — |
| `opp.nl-be.cafe.repair.check-understanding` | `scene.nl-be.cafe.breakfast` | released | `skill-check-understanding` | — | — | — |
| `opp.nl-be.cafe.repair.request-repetition` | `scene.nl-be.cafe.breakfast` | released | `skill-request-repetition` | — | — | — |
| `opp.nl-be.cafe.request-substitution` | `scene.nl-be.cafe.breakfast` | released | `skill-request-substitution` | — | — | — |
| `opp.nl-be.dining.inquire-specifications` | `scene.nl-be.dining.terrace` | released | `skill-inquire-specifications` | — | — | — |
| `opp.nl-be.dining.propose-alternative` | `scene.nl-be.dining.terrace` | released | `skill-propose-alternative` | — | — | — |
| `opp.nl-be.dining.request-substitution` | `scene.nl-be.dining.terrace` | released | `skill-request-substitution` | — | — | — |
| `opp.nl-be.hotel.inquire-specifications` | `scene.nl-be.hotel.checkin` | released | `skill-inquire-specifications` | — | — | — |
| `opp.nl-be.hotel.propose-alternative` | `scene.nl-be.hotel.checkin` | released | `skill-propose-alternative` | — | — | — |
| `opp.nl-be.hotel.repair.check-understanding` | `scene.nl-be.hotel.checkin` | released | `skill-check-understanding` | — | — | — |
| `opp.nl-be.hotel.repair.request-repetition` | `scene.nl-be.hotel.checkin` | released | `skill-request-repetition` | — | — | — |
| `opp.nl-be.metro.inquire-specifications` | `scene.nl-be.metro.route` | released | `skill-inquire-specifications` | — | — | — |
| `opp.nl-be.metro.repair.ask-clarification` | `scene.nl-be.metro.route` | released | `skill-ask-clarification` | — | — | — |
| `opp.nl-be.metro.repair.check-understanding` | `scene.nl-be.metro.route` | released | `skill-check-understanding` | — | — | — |
| `opp.nl-be.metro.repair.request-repetition` | `scene.nl-be.metro.route` | released | `skill-request-repetition` | — | — | — |
| `opp.nl-be.metro.wayfinding` | `scene.nl-be.metro.route` | released | `skill-wayfinding-transit` | — | — | — |
| `opp.nl-be.neighbor.inquire-specifications` | `scene.nl-be.neighbor.key` | released | `skill-inquire-specifications` | — | — | — |
| `opp.nl-be.neighbor.propose-alternative` | `scene.nl-be.neighbor.key` | released | `skill-propose-alternative` | — | — | — |
| `opp.nl-be.neighbor.repair.check-understanding` | `scene.nl-be.neighbor.key` | released | `skill-check-understanding` | — | — | — |
| `opp.nl-be.neighbor.repair.clarify-misunderstanding` | `scene.nl-be.neighbor.key` | released | `skill-clarify-misunderstanding` | — | — | — |
| `opp.nl-be.parcel.inquire-specifications` | `scene.nl-be.parcel.pickup` | released | `skill-inquire-specifications` | — | — | — |
| `opp.nl-be.parcel.propose-alternative` | `scene.nl-be.parcel.pickup` | released | `skill-propose-alternative` | — | — | — |
| `opp.nl-be.parcel.repair.ask-clarification` | `scene.nl-be.parcel.pickup` | released | `skill-ask-clarification` | — | — | — |
| `opp.nl-be.parcel.repair.request-repetition` | `scene.nl-be.parcel.pickup` | released | `skill-request-repetition` | — | — | — |
| `opp.nl-be.pharmacy.inquire-specifications` | `scene.nl-be.pharmacy.label` | released | `skill-inquire-specifications` | — | — | — |
| `opp.nl-be.pharmacy.request-substitution` | `scene.nl-be.pharmacy.label` | released | `skill-request-substitution` | — | — | — |
| `opp.nl-be.rental.inquire-specifications` | `scene.nl-be.rental.bike` | released | `skill-inquire-specifications` | — | — | — |
| `opp.nl-be.rental.repair.ask-clarification` | `scene.nl-be.rental.bike` | released | `skill-ask-clarification` | — | — | — |
| `opp.nl-be.rental.repair.check-understanding` | `scene.nl-be.rental.bike` | released | `skill-check-understanding` | — | — | — |
| `opp.nl-be.rental.request-substitution` | `scene.nl-be.rental.bike` | released | `skill-request-substitution` | — | — | — |

## Per-scene counts

| Scene | Opportunities |
|---|---:|
| `scene.es.cafe.breakfast` | 8 |
| `scene.es.dining.terrace` | 3 |
| `scene.es.hotel.checkin` | 4 |
| `scene.es.metro.ticket-platform` | 5 |
| `scene.es.neighbor.key-handover` | 4 |
| `scene.es.parcel.reschedule` | 4 |
| `scene.es.pharmacy.symptom` | 2 |
| `scene.es.rental.bike` | 4 |
| `scene.nl-be.cafe.breakfast` | 5 |
| `scene.nl-be.dining.terrace` | 3 |
| `scene.nl-be.hotel.checkin` | 4 |
| `scene.nl-be.metro.route` | 5 |
| `scene.nl-be.neighbor.key` | 4 |
| `scene.nl-be.parcel.pickup` | 4 |
| `scene.nl-be.pharmacy.label` | 2 |
| `scene.nl-be.rental.bike` | 4 |
