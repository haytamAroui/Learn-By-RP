# Phase 1H — authored opportunity qualification review list

**Generated:** do not edit by hand. Regenerate with `npx tsx scripts/generate-opportunity-review.mts`.

Derived from the authored scene catalogue, read the same way the runtime reads it. This file lists what a human reviewer still has to decide. It is not evidence that any row has been reviewed.

## Status

- Authored opportunities: **65**
- In scenes not marked `released`: **0**
- Missing `evidenceBand`: **0**
- Missing `assessedChannel`: **0**
- Missing both: **0**
- Authored with a rationale, awaiting a qualified reviewer: **65**
- Accepted by a named reviewer: **0**
- With no stated rationale: **0**

Rubric version: **1**

An authored band is a claim about the opportunity, not about a learner. Until a qualified reviewer accepts it, the runtime reports every observation from that opportunity as `unknown` band and cannot promote, lapse, or backfill on it.

## Release review (1I)

- Recorded reviewer acceptances: **0**
- Bundled audio files: **0**
- Bundled image files: **0**
- No locale, voice, or imagery review has been recorded for any scene.

`SkillOpportunityDefinition` declares `evidenceBand`, `assessedChannel` and `eligibleModalities` as optional, and the scene validator refuses an opportunity that carries dimensions without a `qualification` record. What no script can supply is the reviewer: an authored band stays invisible to promotion until a named person accepts it.

## What a reviewer decides, per opportunity

1. **Evidence band** — the authored demand the rubric actually holds, not the mission display band.
2. **Assessed channel** — normally fixed by the canonical skill, and the scene validator rejects an opportunity that disagrees with it. It decides which performances can qualify, so it is checked rather than authored freely.
3. **Eligible modalities** — whether typed production can satisfy this opportunity at all.

A reviewer who cannot defend the band from the opportunity's own trigger, exposure and rubric should record it as undecided rather than guessing. An undecided band must stay invisible to promotion, which the validators already enforce.

## Review list

| Opportunity | Scene | Skill | Band | Channel | Modalities | Qualification |
|---|---|---|---|---|---|---|
| `opp.es.cafe.inquire-specifications.after-item` | `scene.es.cafe.breakfast` | `skill-inquire-specifications` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.cafe.repair.ask-clarification` | `scene.es.cafe.breakfast` | `skill-ask-clarification` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.cafe.repair.check-understanding` | `scene.es.cafe.breakfast` | `skill-check-understanding` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.cafe.repair.clarify-misunderstanding` | `scene.es.cafe.breakfast` | `skill-clarify-misunderstanding` | b1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.cafe.repair.paraphrase-when-stuck` | `scene.es.cafe.breakfast` | `skill-paraphrase-when-stuck` | a2 | production | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.cafe.repair.request-repetition` | `scene.es.cafe.breakfast` | `skill-request-repetition` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.cafe.repair.request-slower-speech` | `scene.es.cafe.breakfast` | `skill-request-slower-speech` | a1 | interaction | spoken | authored, awaiting review (rubric v1) |
| `opp.es.cafe.request-substitution.after-alternative` | `scene.es.cafe.breakfast` | `skill-request-substitution` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.dining.inquire-specifications` | `scene.es.dining.terrace` | `skill-inquire-specifications` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.dining.propose-alternative` | `scene.es.dining.terrace` | `skill-propose-alternative` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.dining.request-substitution` | `scene.es.dining.terrace` | `skill-request-substitution` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.hotel.inquire-specifications` | `scene.es.hotel.checkin` | `skill-inquire-specifications` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.hotel.propose-alternative` | `scene.es.hotel.checkin` | `skill-propose-alternative` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.hotel.repair.check-understanding` | `scene.es.hotel.checkin` | `skill-check-understanding` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.hotel.repair.request-repetition` | `scene.es.hotel.checkin` | `skill-request-repetition` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.metro.inquire-specifications` | `scene.es.metro.ticket-platform` | `skill-inquire-specifications` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.metro.repair.ask-clarification` | `scene.es.metro.ticket-platform` | `skill-ask-clarification` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.metro.repair.check-understanding` | `scene.es.metro.ticket-platform` | `skill-check-understanding` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.metro.repair.request-repetition` | `scene.es.metro.ticket-platform` | `skill-request-repetition` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.metro.wayfinding` | `scene.es.metro.ticket-platform` | `skill-wayfinding-transit` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.neighbor.inquire-specifications` | `scene.es.neighbor.key-handover` | `skill-inquire-specifications` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.neighbor.propose-alternative` | `scene.es.neighbor.key-handover` | `skill-propose-alternative` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.neighbor.repair.check-understanding` | `scene.es.neighbor.key-handover` | `skill-check-understanding` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.neighbor.repair.clarify-misunderstanding` | `scene.es.neighbor.key-handover` | `skill-clarify-misunderstanding` | b1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.parcel.inquire-specifications` | `scene.es.parcel.reschedule` | `skill-inquire-specifications` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.parcel.propose-alternative` | `scene.es.parcel.reschedule` | `skill-propose-alternative` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.parcel.repair.ask-clarification` | `scene.es.parcel.reschedule` | `skill-ask-clarification` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.parcel.repair.request-repetition` | `scene.es.parcel.reschedule` | `skill-request-repetition` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.pharmacy.inquire-specifications.open` | `scene.es.pharmacy.symptom` | `skill-inquire-specifications` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.pharmacy.request-substitution.after-label-comparison` | `scene.es.pharmacy.symptom` | `skill-request-substitution` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.rental.inquire-specifications` | `scene.es.rental.bike` | `skill-inquire-specifications` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.rental.repair.ask-clarification` | `scene.es.rental.bike` | `skill-ask-clarification` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.rental.repair.check-understanding` | `scene.es.rental.bike` | `skill-check-understanding` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.es.rental.request-substitution` | `scene.es.rental.bike` | `skill-request-substitution` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.cafe.inquire-specifications` | `scene.nl-be.cafe.breakfast` | `skill-inquire-specifications` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.cafe.repair.ask-clarification` | `scene.nl-be.cafe.breakfast` | `skill-ask-clarification` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.cafe.repair.check-understanding` | `scene.nl-be.cafe.breakfast` | `skill-check-understanding` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.cafe.repair.request-repetition` | `scene.nl-be.cafe.breakfast` | `skill-request-repetition` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.cafe.request-substitution` | `scene.nl-be.cafe.breakfast` | `skill-request-substitution` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.dining.inquire-specifications` | `scene.nl-be.dining.terrace` | `skill-inquire-specifications` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.dining.propose-alternative` | `scene.nl-be.dining.terrace` | `skill-propose-alternative` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.dining.request-substitution` | `scene.nl-be.dining.terrace` | `skill-request-substitution` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.hotel.inquire-specifications` | `scene.nl-be.hotel.checkin` | `skill-inquire-specifications` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.hotel.propose-alternative` | `scene.nl-be.hotel.checkin` | `skill-propose-alternative` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.hotel.repair.check-understanding` | `scene.nl-be.hotel.checkin` | `skill-check-understanding` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.hotel.repair.request-repetition` | `scene.nl-be.hotel.checkin` | `skill-request-repetition` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.metro.inquire-specifications` | `scene.nl-be.metro.route` | `skill-inquire-specifications` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.metro.repair.ask-clarification` | `scene.nl-be.metro.route` | `skill-ask-clarification` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.metro.repair.check-understanding` | `scene.nl-be.metro.route` | `skill-check-understanding` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.metro.repair.request-repetition` | `scene.nl-be.metro.route` | `skill-request-repetition` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.metro.wayfinding` | `scene.nl-be.metro.route` | `skill-wayfinding-transit` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.neighbor.inquire-specifications` | `scene.nl-be.neighbor.key` | `skill-inquire-specifications` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.neighbor.propose-alternative` | `scene.nl-be.neighbor.key` | `skill-propose-alternative` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.neighbor.repair.check-understanding` | `scene.nl-be.neighbor.key` | `skill-check-understanding` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.neighbor.repair.clarify-misunderstanding` | `scene.nl-be.neighbor.key` | `skill-clarify-misunderstanding` | b1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.parcel.inquire-specifications` | `scene.nl-be.parcel.pickup` | `skill-inquire-specifications` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.parcel.propose-alternative` | `scene.nl-be.parcel.pickup` | `skill-propose-alternative` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.parcel.repair.ask-clarification` | `scene.nl-be.parcel.pickup` | `skill-ask-clarification` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.parcel.repair.request-repetition` | `scene.nl-be.parcel.pickup` | `skill-request-repetition` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.pharmacy.inquire-specifications` | `scene.nl-be.pharmacy.label` | `skill-inquire-specifications` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.pharmacy.request-substitution` | `scene.nl-be.pharmacy.label` | `skill-request-substitution` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.rental.inquire-specifications` | `scene.nl-be.rental.bike` | `skill-inquire-specifications` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.rental.repair.ask-clarification` | `scene.nl-be.rental.bike` | `skill-ask-clarification` | a1 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.rental.repair.check-understanding` | `scene.nl-be.rental.bike` | `skill-check-understanding` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |
| `opp.nl-be.rental.request-substitution` | `scene.nl-be.rental.bike` | `skill-request-substitution` | a2 | interaction | typed, spoken | authored, awaiting review (rubric v1) |

## Stated rationale

| Opportunity | Rationale |
|---|---|
| `opp.es.cafe.inquire-specifications.after-item` | A single factual question about the item just ordered — price, size, or an ingredient the counter can name. |
| `opp.es.cafe.repair.ask-clarification` | One formulaic clause asking what a single unfamiliar word means. The demand is the request itself, not the domain it happens in, so the setting does not raise the band. |
| `opp.es.cafe.repair.check-understanding` | The learner must retain the detail just delivered, re-formulate it as an interpretation, and turn it into a confirmation question. The reformulated clause is generated rather than recalled, and a wrong restatement has to be noticed. |
| `opp.es.cafe.repair.clarify-misunderstanding` | The partner has mis-stated an order detail. The learner must detect the discrepancy, contradict it, give the correct value, and re-establish agreement — a negotiation of meaning, not a formula. |
| `opp.es.cafe.repair.paraphrase-when-stuck` | The learner has to re-formulate the same intent in different wording after the partner failed to understand it once. Generating an alternative phrasing under breakdown is the demand. |
| `opp.es.cafe.repair.request-repetition` | One formulaic repair clause asking for the just-delivered detail again. No scene-specific content has to be generated and no meaning is at stake beyond hearing it a second time. |
| `opp.es.cafe.repair.request-slower-speech` | One formulaic clause regulating how fast the partner speaks. Typed production cannot satisfy it: the request exists to change the audio channel, so only speech can carry it. |
| `opp.es.cafe.request-substitution.after-alternative` | The learner must actively request another option rather than accept what was offered, after an earlier alternative has already been refused. |
| `opp.es.dining.inquire-specifications` | Asking for a recommendation plus an ingredient or dietary check combines obtaining advice with narrowing a choice. |
| `opp.es.dining.propose-alternative` | The preferred terrace table is unavailable and the learner produces a workable alternative. |
| `opp.es.dining.request-substitution` | A dietary condition identified earlier has to be carried into a request for another dish. |
| `opp.es.hotel.inquire-specifications` | A concrete question about the room, deposit, or another check-in condition. |
| `opp.es.hotel.propose-alternative` | The learner generates and holds a workable alternative arrangement during check-in. |
| `opp.es.hotel.repair.check-understanding` | The learner must retain the detail just delivered, re-formulate it as an interpretation, and turn it into a confirmation question. The reformulated clause is generated rather than recalled, and a wrong restatement has to be noticed. |
| `opp.es.hotel.repair.request-repetition` | One formulaic repair clause asking for the just-delivered detail again. No scene-specific content has to be generated and no meaning is at stake beyond hearing it a second time. |
| `opp.es.metro.inquire-specifications` | Ticket validation is an unfamiliar institutional rule the learner must interpret to know whether the ticket is usable. |
| `opp.es.metro.repair.ask-clarification` | One formulaic clause asking what a single unfamiliar word means. The demand is the request itself, not the domain it happens in, so the setting does not raise the band. |
| `opp.es.metro.repair.check-understanding` | The learner must retain the detail just delivered, re-formulate it as an interpretation, and turn it into a confirmation question. The reformulated clause is generated rather than recalled, and a wrong restatement has to be noticed. |
| `opp.es.metro.repair.request-repetition` | One formulaic repair clause asking for the just-delivered detail again. No scene-specific content has to be generated and no meaning is at stake beyond hearing it a second time. |
| `opp.es.metro.wayfinding` | The learner specifies a destination and must extract an actionable platform and direction from the reply. |
| `opp.es.neighbor.inquire-specifications` | A direct question about one shared object, the spare key. |
| `opp.es.neighbor.propose-alternative` | A handover point has to be generated while the neighbour is leaving, so the proposal is produced under time pressure rather than chosen from options. |
| `opp.es.neighbor.repair.check-understanding` | The learner must retain the detail just delivered, re-formulate it as an interpretation, and turn it into a confirmation question. The reformulated clause is generated rather than recalled, and a wrong restatement has to be noticed. |
| `opp.es.neighbor.repair.clarify-misunderstanding` | The partner states the wrong meeting place. The learner tracks the discrepancy, contradicts it, specifies the correct one, and repairs shared understanding. |
| `opp.es.parcel.inquire-specifications` | A concrete question about pickup hours or another collection condition at the counter. |
| `opp.es.parcel.propose-alternative` | The learner generates a workable alternative time after the original is refused and must see it through to confirmation. |
| `opp.es.parcel.repair.ask-clarification` | One formulaic clause asking what a single unfamiliar word means. The demand is the request itself, not the domain it happens in, so the setting does not raise the band. |
| `opp.es.parcel.repair.request-repetition` | One formulaic repair clause asking for the just-delivered detail again. No scene-specific content has to be generated and no meaning is at stake beyond hearing it a second time. |
| `opp.es.pharmacy.inquire-specifications.open` | The learner asks where official warning and usage information is displayed and must interpret the answer to locate it. Health-related information with a less predictable layout. |
| `opp.es.pharmacy.request-substitution.after-label-comparison` | The request for another package carries a reason that depends on the earlier label comparison having happened. |
| `opp.es.rental.inquire-specifications` | A concrete question about bike size, helmet, or price at the rental counter. |
| `opp.es.rental.repair.ask-clarification` | One formulaic clause asking what a single unfamiliar word means. The demand is the request itself, not the domain it happens in, so the setting does not raise the band. |
| `opp.es.rental.repair.check-understanding` | The learner must retain the detail just delivered, re-formulate it as an interpretation, and turn it into a confirmation question. The reformulated clause is generated rather than recalled, and a wrong restatement has to be noticed. |
| `opp.es.rental.request-substitution` | A constraint rules out the first choice, so the request has to be adapted to what is actually available. |
| `opp.nl-be.cafe.inquire-specifications` | A single factual question about the drink already in hand — price, size, or an ingredient the counter can name. Nothing has to be adapted or inferred. |
| `opp.nl-be.cafe.repair.ask-clarification` | One formulaic clause asking what a single unfamiliar word means. The demand is the request itself, not the domain it happens in, so the setting does not raise the band. |
| `opp.nl-be.cafe.repair.check-understanding` | The learner must retain the detail just delivered, re-formulate it as an interpretation, and turn it into a confirmation question. The reformulated clause is generated rather than recalled, and a wrong restatement has to be noticed. |
| `opp.nl-be.cafe.repair.request-repetition` | One formulaic repair clause asking for the just-delivered detail again. No scene-specific content has to be generated and no meaning is at stake beyond hearing it a second time. |
| `opp.nl-be.cafe.request-substitution` | The learner carries a constraint (a plant-based drink) into a request for a different option after learning the first is unavailable. Adapting the request to an unexpected change is the demand, not ordering. |
| `opp.nl-be.dining.inquire-specifications` | Asking for a recommendation plus an ingredient or dietary check combines obtaining advice with narrowing a choice, which is more than a single factual question. |
| `opp.nl-be.dining.propose-alternative` | The preferred terrace table is unavailable and the learner produces a workable alternative arrangement rather than simply accepting. |
| `opp.nl-be.dining.request-substitution` | A dietary condition identified earlier in the scene has to be carried into a request for another dish. The constraint drives the request. |
| `opp.nl-be.hotel.inquire-specifications` | A concrete question about the room, deposit, or another check-in condition the learner is currently inside of. |
| `opp.nl-be.hotel.propose-alternative` | The learner has to generate and defend a workable alternative arrangement during check-in, which requires proposing rather than selecting. |
| `opp.nl-be.hotel.repair.check-understanding` | The learner must retain the detail just delivered, re-formulate it as an interpretation, and turn it into a confirmation question. The reformulated clause is generated rather than recalled, and a wrong restatement has to be noticed. |
| `opp.nl-be.hotel.repair.request-repetition` | One formulaic repair clause asking for the just-delivered detail again. No scene-specific content has to be generated and no meaning is at stake beyond hearing it a second time. |
| `opp.nl-be.metro.inquire-specifications` | Ticket validation is an unfamiliar institutional rule. The learner has to ask about it and interpret the answer to know whether their ticket is usable; naming a destination does not satisfy the opportunity. |
| `opp.nl-be.metro.repair.ask-clarification` | One formulaic clause asking what a single unfamiliar word means. The demand is the request itself, not the domain it happens in, so the setting does not raise the band. |
| `opp.nl-be.metro.repair.check-understanding` | The learner must retain the detail just delivered, re-formulate it as an interpretation, and turn it into a confirmation question. The reformulated clause is generated rather than recalled, and a wrong restatement has to be noticed. Here the detail is a direction or platform, which is easy to restate wrongly without noticing. |
| `opp.nl-be.metro.repair.request-repetition` | One formulaic repair clause asking for the just-delivered detail again. No scene-specific content has to be generated and no meaning is at stake beyond hearing it a second time. |
| `opp.nl-be.metro.wayfinding` | The learner specifies a destination and has to extract an actionable platform and direction from the reply. Route language is not self-evident from the question alone. |
| `opp.nl-be.neighbor.inquire-specifications` | A direct yes/no question about one shared object, the spare key. The whole request fits a single high-frequency question word. |
| `opp.nl-be.neighbor.propose-alternative` | The learner must generate a workable handover point while the partner is in a hurry, so the proposal has to be produced under time pressure rather than chosen from options. |
| `opp.nl-be.neighbor.repair.check-understanding` | The learner must retain the detail just delivered, re-formulate it as an interpretation, and turn it into a confirmation question. The reformulated clause is generated rather than recalled, and a wrong restatement has to be noticed. |
| `opp.nl-be.neighbor.repair.clarify-misunderstanding` | The partner has stated a wrong meeting place. The learner must hold the discrepancy between what was said and what was meant, contradict it, specify the correct value, and repair the shared understanding. There is no single formula for that, and success is not guaranteed by one turn. |
| `opp.nl-be.parcel.inquire-specifications` | A concrete question about pickup hours or another collection condition at the counter the learner is standing at. The answer is a fact, not a rule to interpret. |
| `opp.nl-be.parcel.propose-alternative` | The learner must generate a workable alternative time after learning the original is unavailable, and hold the exchange until it is confirmed. Proposing differs from selecting an offered option. |
| `opp.nl-be.parcel.repair.ask-clarification` | One formulaic clause asking what a single unfamiliar word means. The demand is the request itself, not the domain it happens in, so the setting does not raise the band. |
| `opp.nl-be.parcel.repair.request-repetition` | One formulaic repair clause asking for the just-delivered detail again. No scene-specific content has to be generated and no meaning is at stake beyond hearing it a second time. |
| `opp.nl-be.pharmacy.inquire-specifications` | The learner asks where official warning and leaflet information is shown on a package and must interpret the answer to find it. This is product-safety information with a less predictable layout than a counter service. |
| `opp.nl-be.pharmacy.request-substitution` | The learner asks to compare another package after reviewing the official information, so the request carries a reason and depends on the earlier step having happened. |
| `opp.nl-be.rental.inquire-specifications` | A concrete question about bike size, helmet, or price at the rental counter. Familiar service vocabulary in a routine transaction. |
| `opp.nl-be.rental.repair.ask-clarification` | One formulaic clause asking what a single unfamiliar word means. The demand is the request itself, not the domain it happens in, so the setting does not raise the band. |
| `opp.nl-be.rental.repair.check-understanding` | The learner must retain the detail just delivered, re-formulate it as an interpretation, and turn it into a confirmation question. The reformulated clause is generated rather than recalled, and a wrong restatement has to be noticed. |
| `opp.nl-be.rental.request-substitution` | The learner asks for a different bike or accessory after a constraint rules out the first choice, which requires adapting the request to what is actually available. |

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
