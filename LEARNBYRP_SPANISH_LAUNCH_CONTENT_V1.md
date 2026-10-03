# LearnByRP — Spanish Launch Content Pack V1

**Branch:** `feature/skills-content-pack-v1`  
**Target language/locale:** Spanish · `es-ES`  
**Status:** executable seed content; native locale review and final simulation still open  
**Authority:** `LEARNBYRP_ROLEPLAY_PROGRAM_TODO_V1.md`

## 1. Product intent

This pack turns the roleplay engine into a coherent first curriculum. Coverage is counted only when a released scene contains an authored, reachable `SkillOpportunityDefinition`. Mission tags or skill labels alone do not count toward transfer.

The initial pack intentionally concentrates on six communicative skills that recur naturally across everyday roleplay:

1. `skill-inquire-specifications`
2. `skill-propose-alternative`
3. `skill-request-substitution`
4. `skill-request-repetition`
5. `skill-ask-clarification`
6. `skill-check-understanding`

Every core skill must have opportunities in at least three distinct reviewed `scenarioFamilyId` values before LearnByRP may treat the content set as transfer-capable.

## 2. Executable mission inventory

| Mission | Scenario family | Main roleplay job |
| --- | --- | --- |
| Café Sol | `counter-ordering` | order, adapt when an option is unavailable, clarify service details |
| Parcel Drop | `parcel-service` | identify a parcel, clarify pickup conditions, reschedule |
| Neighbor's Door | `neighbour-coordination` | ask about a key, coordinate an alternative handover |
| Metro Sol | `public-transit` | clarify ticket conditions and platform/direction |
| Farmacia Sol | `pharmacy-consultation` | ask for official product-label information without diagnosis/treatment advice |
| La Terraza | `social-dining` | request seating, ask for a recommendation, adapt a dish/seat choice |
| Hotel Centro | `lodging-checkin` | identify a booking, clarify check-in conditions, arrange luggage handling |
| Bici Centro | `equipment-rental` | request a rental, choose a substitute, clarify return conditions |

All eight scenes use finite facts, bounded predicates/effects, authored opportunities, model-checked completion, scoped support, and reviewed character knowledge boundaries.

## 3. Core skill × executable family coverage

Coverage is generated from scene opportunities by `validateLaunchContentCoverage()`, not maintained manually.

| Core skill | Executable families |
| --- | ---: |
| Inquire about specifications | 8 |
| Propose an alternative | 4 |
| Request a substitution | 4 |
| Request repetition | 4 |
| Ask for clarification | 4 |
| Check understanding | 5 |

The build fails if any core skill falls below **3 distinct executable scenario families**.

## 4. Program paths

### Spanish Everyday Life

Current five-mission path:

1. Café Sol
2. Parcel Drop
3. Neighbor's Door
4. Farmacia Sol
5. La Terraza

Primary emphasis: practical services, coordination, substitution, clarification and repair in ordinary daily situations.

### Spanish Travel & Getting Around

Current five-mission path:

1. Café Sol
2. Metro Sol
3. Hotel Centro
4. Bici Centro
5. La Terraza

Primary emphasis: transport, lodging, rental/service conditions, practical alternatives and repair while travelling.

Missions may be reused across programs because the reviewed mission is the executable content authority. Reusing a mission in another program does not create additional transfer context.

## 5. Repair content

Repair remains explicit and opt-in. Communication challenges create opportunities; they never create evidence by themselves.

Current multi-family repair coverage includes:

- request repetition: café, parcel, metro, hotel
- ask clarification: café, parcel, metro, rental
- check understanding: café, neighbor, metro, hotel, rental
- clarify misunderstanding: café, neighbor

The remaining repair children are deliberately not promoted to launch-core transfer claims until additional reviewed families exist.

## 6. Skills that remain non-core

These canonical skills exist but are not yet sufficiently covered to drive launch transfer claims:

- `skill-request-slower-speech`
- `skill-clarify-misunderstanding`
- `skill-paraphrase-when-stuck`
- `skill-wayfinding-transit` outside its domain-specific family
- `skill-give-opinion-with-reason`
- `skill-compare-options`
- `skill-make-arrangement`
- `skill-narrate-past-event`

Do not add synthetic variants simply to increase family counts. New coverage must represent genuinely different communicative situations.

## 7. Release gates still open

The content is mechanically executable but the programs remain `draft` until these human/content gates are complete:

- native `es-ES` language and locale review;
- confirm whether five missions per program is sufficient or expand toward 8–10 based on review capacity;
- build one integrated final simulation;
- record reviewer hours and sustainable content throughput;
- calibration fixtures for semantic demonstration/lapse review;
- audience/age release decision.

## 8. Content authoring rule

When adding a mission:

1. choose or review the scenario-family boundary first;
2. choose the exact communicative skills the scene can genuinely expose;
3. author finite world facts and completion before dialogue flavor;
4. author opportunities with positive/negative examples;
5. add repair/pressure only when deliberate, opt-in and capability-compatible;
6. run static validation and the scene model checker;
7. update launch coverage only from executable opportunity data;
8. keep locale/native review separate from automated correctness.

The goal is not a large mission catalog. The goal is enough reviewed roleplay depth for the learner to practise, receive evidence, and transfer the same skill into genuinely different situations.
