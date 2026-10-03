# LearnByRP — Belgian Dutch / Flemish Launch Content V1

**Branch:** `feature/dutch-flemish-content-pack-v1`  
**Target language:** Dutch · `nl`  
**Target locale:** Belgian Dutch / Flemish · `nl-BE`  
**Status:** executable seed content; native Flemish review still required  
**Authority:** `LEARNBYRP_ROLEPLAY_PROGRAM_TODO_V1.md`

## 1. Locale rule

This pack is not generic Netherlands Dutch. Authoring should prefer natural Belgian Dutch where there is a meaningful everyday difference, while remaining broadly understandable across the Dutch language area.

Examples already used deliberately:

- `reservatie` in a Belgian hotel context;
- `namiddag` for afternoon;
- `morgenvoormiddag` for tomorrow morning;
- `pakjespunt` and `afhaalcode`;
- `bijsluiter` in the pharmacy information scene;
- polite `hebt u` alongside normal `u` forms;
- `tegen hoe laat` for a return deadline.

Do not force dialect spelling or regional slang into core beginner content. The target is standard Belgian Dutch with a Flemish service-conversation feel, not a caricature of local speech.

## 2. Core communicative skills

The first Flemish pack uses the same six launch-core skills as the Spanish pack so evidence and transfer behavior remain comparable across languages:

1. `skill-inquire-specifications`
2. `skill-propose-alternative`
3. `skill-request-substitution`
4. `skill-request-repetition`
5. `skill-ask-clarification`
6. `skill-check-understanding`

A skill counts toward launch transfer coverage only when a released `nl-BE` scene contains a reachable authored `SkillOpportunityDefinition`. Mission metadata alone does not count.

Minimum launch rule: **3 genuinely different scenario families per core skill**.

## 3. Executable Flemish mission inventory

| Mission | Scenario family | Learner job |
| --- | --- | --- |
| Koffiebar: Ontbijt onderweg | `counter-ordering` | bestellen, alternatief kiezen, meenemen bevestigen |
| Pakjespunt: Ophalen op een ander moment | `parcel-service` | afhaalcode geven, voorwaarden vragen, nieuw moment voorstellen |
| Bij de buur: De reservesleutel | `neighbour-coordination` | sleutel vragen, praktisch afspreekpunt regelen |
| Metro in Brussel: Richting en perron | `public-transit` | ticketvoorwaarde en route/perron verduidelijken |
| Apotheek: Informatie op verpakking en bijsluiter | `pharmacy-consultation` | officiële productinformatie terugvinden, geen behandeling laten kiezen |
| Restaurant: Een tafel op het terras | `social-dining` | tafel regelen, aanbeveling vragen, keuze aanpassen |
| Hotel: Vroeg aangekomen | `lodging-checkin` | reservatie identificeren, kamerstatus vragen, bagageplan regelen |
| Fietsverhuur: Deze namiddag op pad | `equipment-rental` | fiets huren, alternatief kiezen, terugbrengvoorwaarde vragen |

## 4. Core skill × family coverage target

The authored Flemish scenes intentionally mirror the Spanish launch-depth target:

| Core skill | Expected executable families |
| --- | ---: |
| Inquire about specifications | 8 |
| Propose an alternative | 4 |
| Request a substitution | 4 |
| Request repetition | 4 |
| Ask for clarification | 4 |
| Check understanding | 5 |

This matrix is validated from executable scene opportunities in CI.

## 5. Program paths

### Nederlands in België — Dagelijks leven

1. Koffiebar
2. Pakjespunt
3. Bij de buur
4. Apotheek
5. Restaurant

### Nederlands in België — Onderweg & op reis

1. Koffiebar
2. Metro
3. Hotel
4. Fietsverhuur
5. Restaurant

Both programs remain `draft` until native Flemish review and final-simulation content are complete.

## 6. Repair coverage

Repair challenges are explicit, opt-in and skippable. They never manufacture evidence.

Current Flemish multi-family repair design:

- request repetition: koffiebar, pakjespunt, metro, hotel;
- ask clarification: koffiebar, pakjespunt, metro, fietsverhuur;
- check understanding: koffiebar, buur, metro, hotel, fietsverhuur;
- clarify misunderstanding: buur.

`request-slower-speech` and `paraphrase-when-stuck` remain canonical skills but are not promoted to Flemish launch-core transfer claims until additional reviewed families exist.

## 7. Pharmacy boundary

The apotheek scene is an information-navigation roleplay, not medical decision support.

Allowed learning job:

- ask where official warnings are displayed;
- ask where information appears in the package leaflet;
- ask to compare another package’s official information.

Not allowed as authored character behavior:

- diagnosis;
- individualized dosage instructions;
- choosing treatment for the learner;
- implying that roleplay success means a product is medically appropriate.

## 8. Native Flemish review checklist

Automated validation can verify scene mechanics, not linguistic authenticity. Before `nl-BE` release, a Belgian Dutch reviewer should check:

- vocabulary is natural in Belgium and not accidentally Netherlands-only;
- `u` / `je` register is appropriate to each relationship;
- word order and modal phrasing sound natural aloud;
- service phrases do not sound translated from English or Spanish;
- Brussels contexts remain plausible in Dutch;
- phrases are useful across Belgium, not tied to unnecessary local trivia;
- TTS pronunciation sounds Belgian enough for the intended learning target;
- repair prompts sound like authentic Belgian Dutch conversation rather than test instructions.

## 9. Content authoring rule

For future Flemish missions:

1. start from the communicative job, not from a vocabulary list;
2. choose a real reviewed scenario family;
3. author finite scene truth and completion;
4. add only skills with real reachable opportunities;
5. write Belgian Dutch learner phrases independently;
6. add repair challenges only when deliberate and opt-in;
7. run model checking and launch coverage;
8. keep the program `draft` until native review is recorded.

The objective is roleplay competence in Belgian Dutch, not translation coverage.
