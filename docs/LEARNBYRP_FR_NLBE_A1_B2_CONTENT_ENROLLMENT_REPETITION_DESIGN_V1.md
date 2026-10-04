# LearnByRP — French and Belgian Dutch A1–B2 Content, Enrollment, Repetition and Product Design

**Version:** 1.0 · **Prepared:** 3 October 2026  
**Type:** detailed authoring and implementation blueprint; separate companion to the Complete Learning Architecture V2  
**Locales:** `fr-BE` (standard French with Belgian context) and `nl-BE` (Standard Dutch in Belgium)  
**Audience:** adult learners practicing daily life, social participation and work  
**Platforms:** mobile first; iOS, Android and responsive web  
**Scope:** 48 scenario definitions, 144 scene definitions, 288 localized scene openings and support forms; 36 communicative skill definitions  
**Status:** original authored draft. Localized language, level rubrics, audio and content require expert review and pilot calibration before assessed release.

## Reading guide and authority

This is the complete catalogue of the **proposed program**, not a claim to enumerate every possible A1–B2 situation or to certify completion of CEFR levels. CEFR also covers reading, writing, mediation and broader language competence. This program emphasizes spoken interaction and includes limited input/mediation tasks; it is not a complete exam-preparation syllabus.

The current `LEARNBYRP_COMPLETE_LEARNING_CONTENT_UX_ARCHITECTURE_V2(1).md` was read. Preserve its validator-only evidence writes, scoped support, banded opportunities, separate linguistic observations, and retry/transfer distinction. Names below are authoring aliases to map into canonical repository IDs before implementation.

Every catalogue scene specifies a localized title, character opening, useful help form, objective, skill opportunities, complication and outcome. This is a branching authoring specification, not a verbatim full conversation: learner language must remain open. An actor can improvise wording within authored facts and actions. No review, audio production or code implementation is claimed here.

**A1/A2/B1/B2 labels are proposed authored demand bands.** They are not learner identities and not automatically validated by a title or sample sentence. A mission can contain opportunities at different bands. Review the opportunity rubric and actual input conditions separately.

**Source notation:** [S#] links to the source register. Standards inform constraints; colors, fonts, layouts and curriculum choices are LearnByRP proposals. There is no universal official “2026 palette”. Current official guidance was checked on 3 October 2026; some JavaScript-only design pages exposed limited content. No unsupported trend claim is used as a design requirement.

## Contents

1. The visible product and learning process
2. Enrollment, placement and program assembly
3. Repetition, transfer and spaced return
4. A1–B2 demand and language-support matrix
5. Complete skill catalogue
6. Scenario and scene catalogue
7. Content contracts, review and asset production
8. Page architecture and feature access
9. Concrete visual system and responsive behavior
10. Complete learner journeys and acceptance checks
11. Implementation priorities and source register

---

## 1. The visible product and learning process

### 1.1 What the learner should feel

“I am entering a situation. I know what I need to do. Someone is responding to me. I can ask for help without leaving. My words change what happens. I can see what I can do more independently.”

The product is a small living world with a practical speaking interface. It should not open on a wall of course descriptions, statistics or equally weighted cards.

### 1.2 The full process

| Phase | Learner sees | Engine does | Authoring requirement |
|---|---|---|---|
| Enroll | Language, purpose, starting comfort | Creates preference and placement hypotheses | Supported locale and goal coverage |
| Enter | One situation and one clear goal | Selects compatible reviewed scene | Compact localized briefing |
| Prepare | Optional observation or small input bridge | Logs exact answer exposure | Reviewed model and meaning asset |
| Act | Character, input control, goal, help | Runs bounded scene and opens opportunities | Roles, private facts, actions and rubrics |
| Recover | Accessible help sheet | Records target-scoped support | Intention, stem, phrase and audio |
| Finish | Natural ending | Records world outcome separately | Completion and exit predicates |
| Reflect | One useful success and one improvement | Validates evidence, proposes form observation | Passage-grounded recap recipes |
| Repeat | Retry this moment or same task | Creates new immutable attempt | Retry checkpoint and changeable facts |
| Transfer | Same job in another family | Checks reviewed family relationship | Transfer target opportunity |
| Return | Familiar capability after time | Selects eligible due review | Cold reviewed variant |
| Stretch | One extra demand | Applies versioned progression policy | Explicit demand change |

### 1.3 The unit of learning

A scene is a narrow communicative event. A scenario groups three related scenes. A program selects scenes from several scenarios according to the goal and evidence. An arc supplies narrative continuity. A scenario family describes a meaningfully distinct task setting for transfer.

Do not treat these as synonyms. Three café episodes remain one family. A new city or actor name does not manufacture transfer.

### 1.4 The useful completion loop

`try → use support if needed → finish → apply one improvement → repeat → retrieve later → use in another family`

The learner may stop after any completed scene. A longer Dive is optional. Reading a model and repeating it back is practice; later eligible independent use is a different observation.

## 2. Enrollment, placement and program assembly

### 2.1 Enrollment screens

| Screen | Information collected | FR label example | NL label example | Constraint |
|---|---|---|---|---|
| E01 Language | Target locale and explanation language | Quelle langue voulez-vous pratiquer ? | Welke taal wil je oefenen? | Explain Belgian variety; no forced account wall where guest flow is feasible |
| E02 Purpose | Everyday life, social life, work, interview, travel or custom | Dans quelles situations voulez-vous parler ? | In welke situaties wil je spreken? | Choose one; advanced detail optional |
| E03 Comfort | New, some experience, comfortable, unsure | Comment voulez-vous commencer ? | Hoe wil je beginnen? | Not a proficiency diagnosis |
| E04 First scene | Recommended opening situation | Votre première situation | Je eerste situatie | Two short briefing sentences |
| E05 Entry mode | Observe, guided or try directly | Observer / Essayer | Eerst kijken / Proberen | Exposure logged |
| E06 Voice entry | Voice or supported typed practice | Activer le micro | Microfoon inschakelen | Permission at point of use |
| E07 Recap/save | Optional account and voluntary schedule | Garder ma progression | Mijn voortgang bewaren | Reminders opt-in after value is experienced |

No mandatory avatar builder, ten-question survey or grammar placement exam before the first meaningful scene. Optional interests can be collected later when they improve scene choice.

### 2.2 Placement

A self-reported comfort setting selects an entry hypothesis. Experienced learners can take two or three short cold probes spanning basic information, explanation and negotiation. Actual start difficulty depends on observed performance and support, with uncertainty retained.

Placement evidence may guide scene choice but cannot establish Growing/Steady, transfer qualification or durable band-up. A failure to speak due to noise, permission or recognition uncertainty is not a language failure.

### 2.3 Program assembly

| Goal | First recommended route | Later breadth | Integrated simulation |
|---|---|---|---|
| Everyday Belgium | A1 café, directions, shops, transport | A2 appointments/housing; B1 service repair | Resolve a practical day with changed plans |
| Social participation | Introductions, invitations, interests | Opinions, group decisions, mediation | Organize a small shared activity |
| Work | Colleague introduction, availability | Task clarification, progress report, deadlines | Coordinate a task with a constraint |
| Interview | Introduction and role facts | Experience, project explanation, follow-up | Reviewed interview simulation |
| Travel | Transport, hotel, restaurant | Booking change, complaint, disruption | Recover an interrupted trip |
| Custom | Map goal into approved capabilities/families | Show coverage gaps honestly | Only offer reviewed compatible final tasks |

Programs can mix bands across skills. Someone may negotiate well but still need listening support for times or prices. A whole program cannot be labelled a reliable learner-level diagnosis.

### 2.4 Enrollment persistence

Proposed record: target locale, explanation language, chosen goal, modality preferences, accessibility preferences, starting hypotheses, optional schedule and consented continuity alias. Separate it from evidence and from private narrative facts. Store deadlines only if volunteered; they do not override readiness.

### 2.5 Return after absence

Offer a familiar scene or a new one. Do not erase capabilities because of absence. Review due indicates an opportunity to check retrieval, not proof of forgetting. Avoid reset screens that force enrollment again.

## 3. Repetition, transfer and spaced return

### 3.1 Distinct modes

| Mode | Same scene/family? | Support allowed? | Job | May count as transfer? |
|---|---|---|---|---|
| Moment retry | Same checkpoint | Yes, tracked | Improve one difficult turn | No |
| Full retry | Same communicative job | Yes, tracked | Apply feedback and reduce planning burden | No |
| Controlled variation | Same family, changed facts | Yes, tracked | Avoid memorizing a single script | No |
| Cold later return | Same or another reviewed family | Rescue available, not pre-exposed | Test independent retrieval after time | Only if different-family rules also hold |
| Transfer | Different reviewed family, same capability | Available, affecting evidence | Use capability outside original setting | Yes, when eligibility is met |
| Stretch | Harder condition, often same family | Per authored policy | Robustness under a changed demand | Not by itself |

### 3.2 Initial spacing proposal

An initial configurable schedule can use immediate retry, a short return on a later day, another return approximately a week later, and a later maintenance opportunity. These are product defaults to test, not universal optimum intervals [S7]. Do not force every target through exact day counts or confuse same-day repetition with delayed retention.

Support-heavy performance suggests another guided attempt; eligible independent performance may justify broader context. High uncertainty suggests a cleaner observation rather than remedial labeling.

### 3.3 Review scheduling logic

1. Filter reviewed content by locale, modality and capability.
2. Find due targets relevant to the learner’s goal.
3. Avoid repeatedly selecting the same recent family.
4. Prefer a small scene containing one or two useful targets.
5. Check exposure history: a scene after viewing the exact phrase is not cold for that target.
6. Let the learner change pressure or choose another eligible scene.
7. Record outcome and support; update projections only through validation.

### 3.4 Transfer graph

| Capability | Initial context | Different-family transfer | Later stretch |
|---|---|---|---|
| Ask for information | Café availability | Public transport route | Compare two routes under a constraint |
| Request an alternative | Clothing size | Appointment time | Negotiate a deadline |
| Confirm details | Parcel pickup | Team arrangement | Summarize a negotiated agreement |
| Describe a problem | Faulty purchase | Home maintenance | Explain a recurring technical incident |
| Explain a sequence | Recipe/activity | Workplace handover | Report a multi-step incident |
| Give a reason | Invitation | Service complaint | Defend a project decision |
| Ask for clarification | Directions | Interview follow-up | Clarify an ambiguous meeting instruction |
| Relay information | Neighbour message | Customer request to colleague | Mediate competing group requirements |

Catalogue `transfer_to` fields below are proposed edges, not automatically reviewed equivalences. The target scene must contain a matching eligible opportunity at suitable demand.

### 3.5 How repetition appears in the UI

Recap presents one primary next action: “Try this somewhere new”, “Try again”, or “Return later”. A secondary action opens alternatives. Do not show a scheduler calendar filled with mandatory chores. Saved language includes a direct “Use in a scene” action, not only flashcard recall.

## 4. A1–B2 demand and language-support matrix

### 4.1 Demand bands

| Band | Learner task | Input | Interaction | Planning | Pressure |
|---|---|---|---|---|---|
| A1 | Short familiar exchanges and basic information | Short clear turns with concrete context | Approximately a few functional turns | Optional model/meaning bridge | No countdown by default |
| A2 | Routine exchanges with one complication | Short linked information and natural clear delivery | Follow-up and simple repair | Brief optional preparation | Recoverable constraint |
| B1 | Connected explanations, reasons and practical resolution | Longer turns on familiar topics | Several turns with less predictable follow-ups | Strategic planning available | One significant change |
| B2 | Compare, defend, negotiate and mediate | Richer information, implied constraints, register shifts | Sustained exchange; challenge to a position | Optional notes without model answers | Competing constraints, not artificial panic |

Labels follow an action-oriented interpretation informed by CEFR [S1]. Counts and pacing require pilot calibration. Short B2 opening sentences alone do not create B2 content: sustained reasoning and negotiated outcomes must actually be elicited.

### 4.2 French support progression

| Band | Lexical domains | Useful constructions to support when needed | Pronunciation/listening attention |
|---|---|---|---|
| A1 | Identity, numbers, time, location, familiar food/items | Present of useful verbs; polite requests; basic questions/negation; noun agreement in useful chunks | Intelligible familiar phrases, number/time discrimination, phrase grouping |
| A2 | Availability, routine problems, preferences, appointments | Modal requests; future intention; common past events; comparison; reason with parce que | Connected speech in familiar phrases; clarification rather than accent policing |
| B1 | Events, causes, experiences, tasks and consequences | Past narration and background; connected reasons; conditional proposals; pronoun reference | Longer listening segments, discourse markers, self-repair |
| B2 | Trade-offs, risks, positions, negotiation and mediation | Concession, qualification, hypothetical options, nuanced stance and cohesive reference | Intonation for stance, interruption management, register comprehension |

This is a support menu, not a mandatory grammar sequence or a claim that all French morphology has been taught. Construction targets require local linguistic rubrics.

### 4.3 Belgian Dutch support progression

| Band | Lexical domains | Useful constructions to support when needed | Pronunciation/listening attention |
|---|---|---|---|
| A1 | Identity, time, place, familiar goods and routes | Useful present-tense chunks; questions; word order in familiar main clauses; kan/mag; negation | Intelligibility, vowel contrasts only where meaningful, time/number comprehension |
| A2 | Routine arrangements, availability, substitutions and problems | Separable verbs in useful contexts; past reference; modal request; omdat; comparison | Familiar connected speech and common Belgian usage |
| B1 | Event narration, task sequences, reasons and coordination | Connected clauses; past narration; conditionals; reference and sequencing | Longer turns, clarification of colloquial input where reviewed |
| B2 | Negotiation, stance, risk and mediation | Concession, hypothetical conditions, qualification, nuanced modality and cohesion | Register variation, sustained interaction, intelligibility under richer tasks |

Standard Dutch in Belgium is the baseline [S2]. Do not treat valid Belgian standard variants as errors. Regional/dialect exposure is optional and clearly identified; it does not replace broadly usable standard-language support.

### 4.4 Shared content, separate localization

Reuse world facts, illustration concepts and action graphs when they fit. Re-author actor wording, rescue forms, lexical targets, politeness and constructions separately. Do not translate a grammar target mechanically. French and Dutch skill histories remain separate.

### 4.5 Opportunity bands inside a mission

A B2 negotiation may include A1 greeting, A2 confirmation and B2 qualification. Evidence uses the opportunity’s reviewed band, not the mission display band. Catalogue scene skills identify candidate opportunities; final band and rubric must be assigned individually before release.

## 5. Complete skill catalogue

The IDs are proposed authoring aliases. Reuse existing canonical IDs through a mapping; do not create duplicate skills because labels differ.

| Alias / proposed ID | French label | Belgian Dutch label | Observable behavior | FR / NL starter support |
|---|---|---|---|---|
| S01 / `greet_and_introduce` | Se présenter | Jezelf voorstellen | Provides an identity or relevant role to the interlocutor | Je m’appelle… / Ik heet… |
| S02 / `open_interaction` | Engager un échange | Een gesprek beginnen | Opens contact for a meaningful purpose | Bonjour, je voudrais… / Goedendag, ik wil graag… |
| S03 / `give_information` | Donner une information | Informatie geven | Supplies the relevant missing fact | Voici… / Dit is… |
| S04 / `ask_information` | Demander une information | Informatie vragen | Requests the information needed to act | Où / Quand / Combien… ? / Waar / Wanneer / Hoeveel…? |
| S05 / `make_request` | Faire une demande | Een verzoek doen | Requests a feasible interlocutor action | Est-ce que je peux… ? / Kan ik…? |
| S06 / `order_or_purchase` | Commander ou acheter | Bestellen of kopen | Specifies a usable item or service request | Je voudrais… / Ik wil graag… |
| S07 / `confirm_details` | Confirmer les détails | Details bevestigen | Checks or restates the actionable detail | Donc, c’est… ? / Dus, dat is…? |
| S08 / `express_preference` | Exprimer une préférence | Een voorkeur uitspreken | Communicates a choice relevant to the task | Je préfère… / Ik verkies… |
| S09 / `thank_and_close` | Remercier et terminer | Bedanken en afsluiten | Closes the exchange appropriately | Merci, bonne journée. / Dank u, fijne dag. |
| S10 / `request_repetition` | Demander de répéter | Om herhaling vragen | Requests another hearing of unclear input | Vous pouvez répéter ? / Kunt u dat herhalen? |
| S11 / `request_slower_speech` | Demander de parler plus lentement | Om trager spreken vragen | Requests an input adjustment | Un peu plus lentement, s’il vous plaît. / Wat trager, alstublieft. |
| S12 / `ask_clarification` | Demander une précision | Verduidelijking vragen | Identifies what needs clarification | Que voulez-vous dire par… ? / Wat bedoelt u met…? |
| S13 / `check_understanding` | Vérifier sa compréhension | Begrip controleren | Offers an interpretation for verification | Si je comprends bien… / Als ik het goed begrijp… |
| S14 / `request_substitution` | Demander une autre option | Een andere optie vragen | Requests an alternative to an unavailable/unworkable option | Est-ce qu’il y a une autre possibilité ? / Is er een andere mogelijkheid? |
| S15 / `describe_problem` | Décrire un problème | Een probleem beschrijven | States the problem sufficiently for the next action | Le problème, c’est que… / Het probleem is dat… |
| S16 / `describe_routine` | Décrire une habitude | Een gewoonte beschrijven | Explains a relevant recurring activity | D’habitude, je… / Gewoonlijk… |
| S17 / `describe_plan` | Expliquer un projet | Een plan uitleggen | States intended action and relevant timing | Je compte… / Ik ben van plan om… |
| S18 / `make_arrangement` | Fixer un arrangement | Een afspraak maken | Establishes mutually usable time/place/action | On pourrait se retrouver… / We kunnen afspreken… |
| S19 / `accept_or_decline` | Accepter ou refuser | Aanvaarden of weigeren | Responds clearly and appropriately to an offer | Ça me convient / Ce n’est pas possible. / Dat past / Dat lukt niet. |
| S20 / `compare_options` | Comparer des options | Opties vergelijken | States a relevant difference between options | Cette option est plus… / Deze optie is… dan… |
| S21 / `give_reason` | Donner une raison | Een reden geven | Connects a choice/position to a relevant reason | Parce que… / Omdat… |
| S22 / `describe_past_event` | Raconter un événement | Een gebeurtenis vertellen | Communicates a past event with usable reference | Hier, j’ai… / Gisteren heb ik… |
| S23 / `explain_sequence` | Expliquer des étapes | Stappen uitleggen | Orders actions so another person can follow | D’abord… puis… / Eerst… daarna… |
| S24 / `ask_follow_up` | Poser une question de suivi | Een vervolgvraag stellen | Builds a relevant follow-up from interlocutor information | Et ensuite… ? / En daarna…? |
| S25 / `paraphrase_when_stuck` | Reformuler un mot manquant | Een ontbrekend woord omschrijven | Conveys intended meaning without the unavailable word | C’est un objet qui sert à… / Het is iets waarmee je… |
| S26 / `clarify_misunderstanding` | Corriger un malentendu | Een misverstand rechtzetten | Corrects a specific wrong interpretation | Je voulais dire… / Ik bedoelde… |
| S27 / `propose_alternative` | Proposer une solution | Een alternatief voorstellen | Offers a feasible alternative responsive to a constraint | On pourrait plutôt… / We zouden in plaats daarvan… |
| S28 / `agree_or_disagree_politely` | Exprimer un désaccord | Beleefd van mening verschillen | States agreement/disagreement without losing the exchange | Je comprends, mais… / Ik begrijp het, maar… |
| S29 / `handle_complaint` | Traiter une réclamation | Een klacht behandelen | Acknowledges issue and advances a feasible resolution | Je comprends votre problème. Voici… / Ik begrijp uw probleem. We kunnen… |
| S30 / `hold_the_floor` | Garder la parole | Het woord houden | Maintains a turn long enough to complete a relevant point | Un instant, je termine… / Een ogenblik, ik maak mijn punt af… |
| S31 / `summarize` | Résumer | Samenvatten | Retains essential actionable meaning without distortion | En résumé… / Samengevat… |
| S32 / `relay_information` | Transmettre une information | Informatie doorgeven | Conveys another person’s key information accurately | Elle demande si… / Zij vraagt of… |
| S33 / `negotiate_constraints` | Négocier des contraintes | Over beperkingen onderhandelen | Coordinates competing constraints towards an agreement | Si nous…, est-ce que vous… ? / Als wij…, kunt u dan…? |
| S34 / `qualify_claim` | Nuancer une affirmation | Een uitspraak nuanceren | Limits certainty or scope relevant to the discussion | Cela dépend de… / Dat hangt af van… |
| S35 / `defend_position` | Défendre une position | Een standpunt verdedigen | Answers a challenge with reasons and relevant support | Mon principal argument est… / Mijn belangrijkste argument is… |
| S36 / `adapt_register` | Adapter le registre | Het register aanpassen | Uses language appropriate to role and relationship | Pourriez-vous… ? / Tu peux… ? / Zou u…? / Kun je…? |

### Skill interpretation

A sentence stem is assistance, not a required answer. Accept functionally adequate variants. Skill aliases S08, S16, S33–S36 particularly need reconciliation with the current taxonomy; they may map to existing skills plus rubric dimensions instead of new evidence IDs. Pronunciation, grammatical accuracy and response speed are separate observations, not substitute skill IDs.

For each assessed opportunity: specify trigger, exposure, taken condition, acceptable demonstration, near misses, assistance effects, uncertainty cases and provenance. Functional criteria above are starting definitions, not release-ready psychometric rubrics.

### Repair skills throughout the program

S10–S13 and S25–S26 recur across bands with different demands. Authors create plausible incomplete or ambiguous information; they do not force the actor to misunderstand every incorrect form. If the learner does not take an available repair opportunity, do not infer a lapse from silence alone.

## 6. Scenario and scene catalogue

### 6.1 How to read a scenario

Each scenario has three scenes with distinct communicative jobs, not three mandatory difficulty levels. Scene 1 establishes the exchange, Scene 2 changes a meaningful fact, and Scene 3 resolves or checks an outcome. Full-roleplay repetition reuses the communicative job with changed values; transfer selects a different reviewed family.

Each table row contains:

- A unique scene suffix and localized scene title/intent.
- Original draft actor openings in both locales.
- Candidate skill opportunities.
- A concrete complication or information gap.
- The world outcome predicate to evaluate separately from skill evidence.

**Common authoring rules:** actor knows the service/activity facts but not the learner’s private choice, availability or position until communicated. One opportunity is primary per narrow scene; listed secondary skills require their own rubric. Rescue starts with intention, then the listed skill’s stem, then a contextual phrase and reviewed audio. Any answer exposure is scoped and logged. These openings are not to be displayed before a cold target opportunity when that would reveal its answer.

Scenes inherit locale review, demand profiles, assessment abstention and safe exit requirements from the contract in section 7. An unavailable option can be rejected; successful completion does not force agreement with a fictional character.


### 6.2 A1 scenario pack

#### A1-01 — Rencontrer un voisin / Een buur ontmoeten

**Family:** `social_introduction` · **Roles:** new resident speaking with a neighbour · **Proposed transfer candidates:** A1-11; A1-12.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A1-01.1 · Faire connaissance / Kennismaken | Bonjour, je suis votre voisin. Comment vous appelez-vous ? | Dag, ik ben uw buur. Hoe heet u? | S01 S02 | The neighbour does not know the learner’s name | `relevant_identity_shared` |
| A1-01.2 · Donner son adresse / Je adres geven | Vous habitez à quel étage ? | Op welke verdieping woont u? | S03 S07 | Two residents have similar door numbers | `floor_and_door_confirmed` |
| A1-01.3 · Terminer la rencontre / Het gesprek afsluiten | Je dois partir. À bientôt ! | Ik moet vertrekken. Tot binnenkort! | S09 S19 | A short exchange must end naturally | `mutual_closure_achieved` |

**Scene-2 starter rescue:** FR “Voici…” · NL “Dit is…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A1-02 — Commander au café / Bestellen in het café

**Family:** `counter_order` · **Roles:** customer and café employee · **Proposed transfer candidates:** A1-03; A1-09.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A1-02.1 · Commander une boisson / Een drankje bestellen | Bonjour, qu’est-ce que vous prenez ? | Goedemorgen, wat mag het zijn? | S06 S08 | Choice is private to the learner | `drink_choice_recorded` |
| A1-02.2 · Préciser sa commande / Je bestelling verduidelijken | Sur place ou à emporter ? | Hier of om mee te nemen? | S03 S07 | Service mode is missing | `service_mode_confirmed` |
| A1-02.3 · Demander le prix / De prijs vragen | Votre commande est prête. | Uw bestelling is klaar. | S04 S09 | Price has not been stated | `price_obtained_and_exchange_closed` |

**Scene-2 starter rescue:** FR “Voici…” · NL “Dit is…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A1-03 — Acheter au marché / Boodschappen doen op de markt

**Family:** `grocery_purchase` · **Roles:** buyer and market seller · **Proposed transfer candidates:** A1-02; A1-09.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A1-03.1 · Choisir un produit / Een product kiezen | Bonjour, vous cherchez quoi ? | Dag, wat zoekt u? | S06 S08 | Several familiar items are visible | `item_selected` |
| A1-03.2 · Préciser la quantité / De hoeveelheid aangeven | Combien en voulez-vous ? | Hoeveel wilt u er? | S03 S07 | Quantity is unknown | `quantity_confirmed` |
| A1-03.3 · Vérifier le total / Het totaal controleren | Voilà votre sac. | Hier is uw zak. | S04 S13 | Total is audible only when requested | `total_understood` |

**Scene-2 starter rescue:** FR “Voici…” · NL “Dit is…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A1-04 — Trouver la bibliothèque / De bibliotheek vinden

**Family:** `wayfinding` · **Roles:** pedestrian asking a local resident · **Proposed transfer candidates:** A1-05; A1-08.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A1-04.1 · Demander le chemin / De weg vragen | Bonjour, je peux vous aider ? | Dag, kan ik u helpen? | S04 S02 | Destination not yet known | `destination_requested` |
| A1-04.2 · Faire répéter une direction / Een aanwijzing laten herhalen | À gauche après le parc. | Links na het park. | S10 S11 | One direction is deliberately delivered once | `direction_replayed_if_requested` |
| A1-04.3 · Confirmer le lieu / De plaats bevestigen | C’est près de l’école. | Het is dicht bij de school. | S07 S13 | Two buildings are nearby | `correct_destination_confirmed` |

**Scene-2 starter rescue:** FR “Vous pouvez répéter ?” · NL “Kunt u dat herhalen?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A1-05 — Prendre le tram / De tram nemen

**Family:** `public_transport` · **Roles:** passenger and transport information employee · **Proposed transfer candidates:** A1-04; A1-08.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A1-05.1 · Demander la ligne / Naar de lijn vragen | Où voulez-vous aller ? | Waar wilt u naartoe? | S03 S04 | The employee does not know destination | `route_requested` |
| A1-05.2 · Vérifier le départ / Het vertrek controleren | Le prochain tram part à dix heures. | De volgende tram vertrekt om tien uur. | S07 S10 | Departure detail needs confirmation | `departure_understood` |
| A1-05.3 · Trouver l’arrêt / De halte vinden | L’arrêt est de l’autre côté. | De halte is aan de overkant. | S12 S13 | Side/street referent is ambiguous | `boarding_location_confirmed` |

**Scene-2 starter rescue:** FR “Donc, c’est… ?” · NL “Dus, dat is…?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A1-06 — Fixer un rendez-vous / Een afspraak maken

**Family:** `appointment_booking` · **Roles:** caller and appointment desk employee · **Proposed transfer candidates:** A1-10; A1-11.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A1-06.1 · Demander un rendez-vous / Een afspraak vragen | Bonjour, quel rendez-vous souhaitez-vous ? | Goedendag, waarvoor wilt u een afspraak maken? | S05 S03 | Purpose missing | `appointment_purpose_given` |
| A1-06.2 · Choisir une heure / Een uur kiezen | Mardi matin ou jeudi après-midi ? | Dinsdagvoormiddag of donderdagnamiddag? | S08 S18 | Learner availability is private | `slot_selected` |
| A1-06.3 · Confirmer le rendez-vous / De afspraak bevestigen | C’est noté. Vous avez l’adresse ? | Dat is genoteerd. Hebt u het adres? | S07 S04 | Location omitted | `time_and_place_confirmed` |

**Scene-2 starter rescue:** FR “Je préfère…” · NL “Ik verkies…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A1-07 — Retirer un colis / Een pakje afhalen

**Family:** `parcel_collection` · **Roles:** customer and parcel clerk · **Proposed transfer candidates:** A1-09; A1-08.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A1-07.1 · Expliquer sa demande / Je verzoek uitleggen | Bonjour, que puis-je faire pour vous ? | Dag, wat kan ik voor u doen? | S05 S03 | Clerk does not know pickup purpose | `pickup_requested` |
| A1-07.2 · Donner une référence / Een referentie geven | Vous avez le numéro du colis ? | Hebt u het nummer van het pakje? | S03 S10 | Reference has similar digits | `reference_verified` |
| A1-07.3 · Confirmer la remise / De ontvangst bevestigen | Voici un colis à votre nom. C’est bien celui-ci ? | Hier is een pakje op uw naam. Is dit het juiste? | S07 S09 | Two parcels exist | `correct_parcel_accepted` |

**Scene-2 starter rescue:** FR “Voici…” · NL “Dit is…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A1-08 — Arriver à l’hôtel / Aankomen in het hotel

**Family:** `lodging_checkin` · **Roles:** guest and reception employee · **Proposed transfer candidates:** A1-07; A1-06.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A1-08.1 · Annoncer sa réservation / Je reservering melden | Bonsoir, vous avez une réservation ? | Goedenavond, hebt u een reservering? | S03 S01 | Reservation identity is unknown | `booking_identified` |
| A1-08.2 · Demander une information / Informatie vragen | Voici votre clé. | Hier is uw sleutel. | S04 S12 | Breakfast location/time omitted | `needed_service_detail_obtained` |
| A1-08.3 · Confirmer sa chambre / Je kamer bevestigen | Votre chambre est au deuxième étage. | Uw kamer is op de tweede verdieping. | S07 S13 | Room number still required | `room_and_floor_confirmed` |

**Scene-2 starter rescue:** FR “Où / Quand / Combien… ?” · NL “Waar / Wanneer / Hoeveel…?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A1-09 — Choisir un vêtement / Een kledingstuk kiezen

**Family:** `clothing_purchase` · **Roles:** shopper and clothing assistant · **Proposed transfer candidates:** A1-03; A1-02.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A1-09.1 · Demander un article / Een artikel vragen | Bonjour, vous cherchez un vêtement ? | Dag, zoekt u een kledingstuk? | S06 S08 | Desired item is not known | `item_requested` |
| A1-09.2 · Demander sa taille / Je maat vragen | Quelle taille voulez-vous ? | Welke maat wilt u? | S03 S05 | Available garment has another size | `size_requested` |
| A1-09.3 · Exprimer son choix / Je keuze uitspreken | Vous préférez le bleu ou le noir ? | Verkiest u blauw of zwart? | S08 S19 | Choice remains private | `colour_choice_confirmed` |

**Scene-2 starter rescue:** FR “Voici…” · NL “Dit is…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A1-10 — Parler de sa journée / Over je dag praten

**Family:** `routine_planning` · **Roles:** learner and colleague planning lunch · **Proposed transfer candidates:** A1-06; A1-11.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A1-10.1 · Donner son horaire / Je uurrooster geven | Tu commences à quelle heure ? | Hoe laat begin je? | S03 S16 | Colleague does not know schedule | `start_time_shared` |
| A1-10.2 · Parler de sa pause / Over je pauze praten | Tu manges ici à midi ? | Eet je hier om twaalf uur? | S08 S16 | Lunch habit and location missing | `lunch_preference_shared` |
| A1-10.3 · Fixer une rencontre / Een ontmoeting afspreken | On prend un café ensemble ? | Drinken we samen een koffie? | S18 S19 | A mutually useful time is needed | `meeting_time_agreed` |

**Scene-2 starter rescue:** FR “Je préfère…” · NL “Ik verkies…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A1-11 — Accepter une invitation / Een uitnodiging aanvaarden

**Family:** `social_invitation` · **Roles:** new acquaintance invited to an activity · **Proposed transfer candidates:** A1-10; A1-06.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A1-11.1 · Comprendre l’invitation / De uitnodiging begrijpen | Tu veux venir au parc samedi ? | Wil je zaterdag naar het park komen? | S19 S12 | Activity details incomplete | `invitation_response_given` |
| A1-11.2 · Demander l’heure / Naar het uur vragen | On se retrouve à l’entrée. | We spreken af aan de ingang. | S04 S07 | Time missing | `meeting_time_obtained` |
| A1-11.3 · Confirmer sa présence / Je komst bevestigen | Alors, tu viens ? | Kom je dan? | S19 S09 | Final response needed | `attendance_response_confirmed` |

**Scene-2 starter rescue:** FR “Où / Quand / Combien… ?” · NL “Waar / Wanneer / Hoeveel…?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A1-12 — S’inscrire à une activité / Je voor een activiteit inschrijven

**Family:** `activity_enrollment` · **Roles:** learner and activity receptionist · **Proposed transfer candidates:** A1-01; A1-06.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A1-12.1 · Choisir l’activité / De activiteit kiezen | Vous voulez vous inscrire à quel cours ? | Voor welke cursus wilt u zich inschrijven? | S08 S05 | Course choice missing | `activity_selected` |
| A1-12.2 · Donner ses coordonnées / Je gegevens geven | Quel est votre prénom ? | Wat is uw voornaam? | S01 S03 | Fictional details only, real contact not required | `fictional_registration_details_shared` |
| A1-12.3 · Vérifier le premier jour / De eerste dag controleren | Le cours commence la semaine prochaine. | De cursus begint volgende week. | S07 S04 | Exact date/place missing | `first_session_details_confirmed` |

**Scene-2 starter rescue:** FR “Je m’appelle…” · NL “Ik heet…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.

### 6.3 A2 scenario pack

#### A2-01 — Trouver une autre commande / Een andere bestelling kiezen

**Family:** `counter_order` · **Roles:** customer with an unavailable order · **Proposed transfer candidates:** A2-03; A2-06.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A2-01.1 · Commander avec une préférence / Bestellen met een voorkeur | Qu’est-ce qui vous ferait plaisir aujourd’hui ? | Wat wilt u vandaag graag? | S06 S08 | Learner has one preference | `preferred_order_requested` |
| A2-01.2 · Demander une autre option / Een andere optie vragen | Nous n’avons plus cet article. | Dat artikel hebben we niet meer. | S14 S04 | Preferred item unavailable | `available_alternative_obtained` |
| A2-01.3 · Confirmer le changement / De wijziging bevestigen | Alors, quelle option choisissez-vous ? | Welke optie kiest u dan? | S07 S19 | Substitution must be explicitly accepted | `replacement_order_confirmed` |

**Scene-2 starter rescue:** FR “Est-ce qu’il y a une autre possibilité ?” · NL “Is er een andere mogelijkheid?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A2-02 — Déplacer un rendez-vous / Een afspraak verplaatsen

**Family:** `appointment_booking` · **Roles:** caller with a conflicting appointment · **Proposed transfer candidates:** A2-07; A2-11.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A2-02.1 · Expliquer son indisponibilité / Je onbeschikbaarheid uitleggen | Vous aviez rendez-vous mardi, c’est bien cela ? | U had dinsdag een afspraak, klopt dat? | S15 S21 | Existing slot conflicts with availability | `conflict_explained` |
| A2-02.2 · Demander une autre heure / Een ander uur vragen | Je peux proposer jeudi matin. | Ik kan donderdagvoormiddag voorstellen. | S14 S18 | First alternative is also inconvenient | `workable_slot_requested` |
| A2-02.3 · Vérifier le changement / De wijziging controleren | D’accord, je change votre rendez-vous. | Goed, ik verplaats uw afspraak. | S07 S13 | Date and time must be checked together | `new_slot_confirmed` |

**Scene-2 starter rescue:** FR “Est-ce qu’il y a une autre possibilité ?” · NL “Is er een andere mogelijkheid?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A2-03 — Résoudre un retrait impossible / Een probleem bij het afhalen oplossen

**Family:** `parcel_collection` · **Roles:** customer whose parcel is elsewhere · **Proposed transfer candidates:** A2-01; A2-04.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A2-03.1 · Décrire sa visite / Je bezoek uitleggen | Vous venez pour votre colis ? | Komt u voor uw pakje? | S03 S05 | Reference identifies a parcel at another point | `pickup_purpose_identified` |
| A2-03.2 · Trouver une solution / Een oplossing vinden | Il est dans un autre point de retrait. | Het ligt in een ander afhaalpunt. | S14 S12 | Alternative location unclear | `usable_collection_option_found` |
| A2-03.3 · Confirmer les horaires / De openingsuren bevestigen | Vous pouvez y aller demain. | U kunt er morgen naartoe. | S07 S04 | Exact opening hours omitted | `collection_plan_confirmed` |

**Scene-2 starter rescue:** FR “Est-ce qu’il y a une autre possibilité ?” · NL “Is er een andere mogelijkheid?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A2-04 — Changer de trajet / Je route aanpassen

**Family:** `public_transport` · **Roles:** passenger facing a route interruption · **Proposed transfer candidates:** A2-03; A2-07.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A2-04.1 · Expliquer sa destination / Je bestemming uitleggen | Cette ligne ne circule pas aujourd’hui. | Deze lijn rijdt vandaag niet. | S03 S15 | Usual route unavailable | `destination_and_problem_shared` |
| A2-04.2 · Demander un autre trajet / Een andere route vragen | Il y a un bus, mais il faut marcher un peu. | Er is een bus, maar u moet even wandelen. | S14 S20 | Two alternatives differ in walking/time | `route_options_compared` |
| A2-04.3 · Verifier la correspondance / De overstap controleren | Changez près de la gare. | Stap over dicht bij het station. | S12 S07 | Station side/stop is ambiguous | `connection_details_confirmed` |

**Scene-2 starter rescue:** FR “Est-ce qu’il y a une autre possibilité ?” · NL “Is er een andere mogelijkheid?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A2-05 — Signaler un problème au logement / Een probleem in de woning melden

**Family:** `home_maintenance` · **Roles:** resident and building contact · **Proposed transfer candidates:** A2-06; A2-12.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A2-05.1 · Décrire ce qui ne fonctionne pas / Beschrijven wat niet werkt | Quel est le problème dans votre appartement ? | Wat is het probleem in uw appartement? | S15 S03 | Device/location unknown | `problem_and_location_identified` |
| A2-05.2 · Expliquer depuis quand / Uitleggen sinds wanneer | Cela a commencé quand ? | Wanneer is dat begonnen? | S22 S21 | Duration affects visit planning | `onset_information_shared` |
| A2-05.3 · Fixer une visite / Een bezoek afspreken | Quelqu’un peut venir demain après-midi. | Er kan morgenmiddag iemand komen. | S18 S19 | Learner availability differs | `maintenance_visit_agreed` |

**Scene-2 starter rescue:** FR “Hier, j’ai…” · NL “Gisteren heb ik…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A2-06 — Retourner un achat / Een aankoop terugbrengen

**Family:** `product_return` · **Roles:** customer and shop assistant · **Proposed transfer candidates:** A2-05; A2-03.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A2-06.1 · Expliquer le retour / De terugkeer uitleggen | Pourquoi voulez-vous rapporter cet article ? | Waarom wilt u dit artikel terugbrengen? | S15 S22 | Purchase history needed | `return_problem_explained` |
| A2-06.2 · Choisir une solution / Een oplossing kiezen | Je peux proposer un autre article. | Ik kan een ander artikel voorstellen. | S14 S08 | Offered item may not meet preference | `acceptable_resolution_selected` |
| A2-06.3 · Confirmer la démarche / De volgende stap bevestigen | Il faut passer à l’autre caisse. | U moet naar de andere kassa gaan. | S12 S07 | Procedure incomplete | `next_step_confirmed` |

**Scene-2 starter rescue:** FR “Est-ce qu’il y a une autre possibilité ?” · NL “Is er een andere mogelijkheid?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A2-07 — Modifier une réservation / Een reservering wijzigen

**Family:** `lodging_booking` · **Roles:** guest changing a fictional hotel booking · **Proposed transfer candidates:** A2-02; A2-11.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A2-07.1 · Donner les nouveaux besoins / Nieuwe behoeften doorgeven | Qu’est-ce que vous souhaitez changer ? | Wat wilt u wijzigen? | S17 S03 | New date/room need private | `new_booking_needs_shared` |
| A2-07.2 · Comparer deux possibilités / Twee mogelijkheden vergelijken | Une chambre est libre vendredi, une autre samedi. | Er is vrijdag een kamer vrij en zaterdag een andere. | S20 S08 | Different dates conflict with plans | `booking_options_compared` |
| A2-07.3 · Verifier l’accord / De afspraak controleren | Je note donc votre nouvelle réservation. | Ik noteer uw nieuwe reservering. | S07 S13 | Final date/item must be restated | `changed_booking_confirmed` |

**Scene-2 starter rescue:** FR “Cette option est plus…” · NL “Deze optie is… dan…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A2-08 — Adapter un repas / Een maaltijd aanpassen

**Family:** `restaurant_order` · **Roles:** guest expressing a nonmedical food preference · **Proposed transfer candidates:** A2-01; A2-06.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A2-08.1 · Dire sa préférence / Je voorkeur zeggen | Vous avez choisi votre plat ? | Hebt u uw gerecht gekozen? | S08 S06 | One ingredient is not preferred | `food_preference_shared` |
| A2-08.2 · Demander une adaptation / Een aanpassing vragen | Ce plat contient cet ingrédient. | Dat gerecht bevat dat ingrediënt. | S05 S14 | Original dish does not fit preference | `feasible_adaptation_requested` |
| A2-08.3 · Confirmer la commande / De bestelling bevestigen | Je peux le servir avec une autre garniture. | Ik kan het met een ander bijgerecht serveren. | S07 S19 | Replacement needs acceptance | `adapted_order_confirmed` |

**Scene-2 starter rescue:** FR “Est-ce que je peux… ?” · NL “Kan ik…?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A2-09 — Organiser une sortie / Een uitstap organiseren

**Family:** `social_activity` · **Roles:** friends planning a simple outing · **Proposed transfer candidates:** A2-11; A2-10.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A2-09.1 · Proposer une activité / Een activiteit voorstellen | Qu’est-ce qu’on fait ce week-end ? | Wat doen we dit weekend? | S17 S27 | No activity chosen | `activity_proposal_shared` |
| A2-09.2 · Comparer les préférences / Voorkeuren vergelijken | Je préfère quelque chose à l’intérieur. | Ik doe liever iets binnen. | S20 S21 | Preferences differ | `preference_difference_explained` |
| A2-09.3 · Fixer les détails / Details afspreken | D’accord, où et quand se retrouve-t-on ? | Goed, waar en wanneer spreken we af? | S18 S07 | Time/place missing | `outing_details_agreed` |

**Scene-2 starter rescue:** FR “Cette option est plus…” · NL “Deze optie is… dan…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A2-10 — Clarifier une petite tâche / Een kleine taak verduidelijken

**Family:** `work_instruction` · **Roles:** colleague receiving a simple task · **Proposed transfer candidates:** A2-12; A2-09.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A2-10.1 · Comprendre la demande / De vraag begrijpen | Peux-tu préparer la salle avant midi ? | Kun je de zaal voor twaalf uur klaarmaken? | S12 S13 | Required setup is unspecified | `task_scope_clarified` |
| A2-10.2 · Demander les étapes / Naar de stappen vragen | Il faut déplacer les tables et préparer le matériel. | Je moet de tafels verplaatsen en het materiaal klaarzetten. | S04 S23 | Order/practical details missing | `task_steps_obtained` |
| A2-10.3 · Confirmer sa disponibilité / Je beschikbaarheid bevestigen | Tu peux commencer maintenant ? | Kun je nu beginnen? | S19 S21 | Another routine task conflicts | `start_arrangement_agreed` |

**Scene-2 starter rescue:** FR “Où / Quand / Combien… ?” · NL “Waar / Wanneer / Hoeveel…?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A2-11 — Choisir un horaire de cours / Een cursusuur kiezen

**Family:** `activity_enrollment` · **Roles:** learner and course receptionist · **Proposed transfer candidates:** A2-02; A2-09.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A2-11.1 · Expliquer son objectif / Je doel uitleggen | Pourquoi voulez-vous suivre cette activité ? | Waarom wilt u deze activiteit volgen? | S17 S21 | Desired outcome unknown | `learning_goal_shared` |
| A2-11.2 · Comparer les horaires / Uren vergelijken | Nous avons un groupe le matin et un autre le soir. | We hebben een groep in de ochtend en een andere in de avond. | S20 S08 | Schedule trade-off | `preferred_group_selected` |
| A2-11.3 · Vérifier l’inscription / De inschrijving controleren | Votre première séance sera lundi. | Uw eerste sessie is maandag. | S07 S12 | Materials/location missing | `enrollment_details_confirmed` |

**Scene-2 starter rescue:** FR “Cette option est plus…” · NL “Deze optie is… dan…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### A2-12 — Louer un vélo adapté / Een passende fiets huren

**Family:** `equipment_rental` · **Roles:** customer and rental employee · **Proposed transfer candidates:** A2-06; A2-01.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| A2-12.1 · Préciser son besoin / Je behoefte verduidelijken | Vous voulez un vélo pour combien de temps ? | Voor hoelang wilt u een fiets? | S03 S05 | Duration and intended route unknown | `rental_needs_shared` |
| A2-12.2 · Demander un autre modèle / Een ander model vragen | Le modèle demandé n’est pas disponible. | Het gevraagde model is niet beschikbaar. | S14 S20 | Two substitutes differ | `suitable_model_selected` |
| A2-12.3 · Verifier le retour / Het terugbrengen controleren | Il faut le rapporter cet après-midi. | U moet de fiets vanmiddag terugbrengen. | S07 S12 | Exact return time/place unclear | `rental_return_agreed` |

**Scene-2 starter rescue:** FR “Est-ce qu’il y a une autre possibilité ?” · NL “Is er een andere mogelijkheid?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.

### 6.4 B1 scenario pack

#### B1-01 — Expliquer une réclamation / Een klacht uitleggen

**Family:** `service_complaint` · **Roles:** customer reporting a failed fictional service · **Proposed transfer candidates:** B1-03; B1-04.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B1-01.1 · Raconter ce qui s’est passé / Vertellen wat er gebeurd is | Pouvez-vous m’expliquer ce qui s’est passé ? | Kunt u uitleggen wat er gebeurd is? | S22 S23 | Several events need chronology | `incident_sequence_shared` |
| B1-01.2 · Expliquer les conséquences / De gevolgen uitleggen | Quel problème cela vous pose-t-il maintenant ? | Welk probleem veroorzaakt dat nu voor u? | S15 S21 | Impact not yet understood | `practical_impact_explained` |
| B1-01.3 · Proposer une réparation / Een oplossing voorstellen | Quelle solution vous semblerait acceptable ? | Welke oplossing zou voor u aanvaardbaar zijn? | S27 S07 | A feasible resolution must be agreed | `resolution_and_next_step_agreed` |

**Scene-2 starter rescue:** FR “Le problème, c’est que…” · NL “Het probleem is dat…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B1-02 — Réorganiser un déplacement / Een verplaatsing opnieuw organiseren

**Family:** `travel_disruption` · **Roles:** traveller whose itinerary changed · **Proposed transfer candidates:** B1-05; B1-06.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B1-02.1 · Expliquer le trajet prévu / Je geplande route uitleggen | Quel trajet aviez-vous prévu ? | Welke route had u gepland? | S17 S23 | Destination deadline unknown | `original_plan_explained` |
| B1-02.2 · Comparer les solutions / Oplossingen vergelijken | Une option arrive plus tard, l’autre exige une correspondance. | De ene optie komt later aan, de andere vereist een overstap. | S20 S21 | Competing time/complexity constraints | `route_tradeoff_explained` |
| B1-02.3 · Verifier le nouveau plan / Het nieuwe plan controleren | Résumons les changements avant de continuer. | Laten we de wijzigingen samenvatten voor we verdergaan. | S31 S07 | Several changed details may be confused | `revised_itinerary_confirmed` |

**Scene-2 starter rescue:** FR “Cette option est plus…” · NL “Deze optie is… dan…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B1-03 — Expliquer un incident au logement / Een incident in de woning uitleggen

**Family:** `home_maintenance` · **Roles:** resident and maintenance coordinator · **Proposed transfer candidates:** B1-01; B1-04.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B1-03.1 · Décrire l’évolution / Het verloop beschrijven | Le problème est-il apparu soudainement ? | Is het probleem plots ontstaan? | S22 S15 | Current symptom differs from first symptom | `problem_history_explained` |
| B1-03.2 · Clarifier une interprétation / Een interpretatie verduidelijken | Vous dites donc que tout fonctionne maintenant ? | U zegt dus dat alles nu werkt? | S26 S12 | Actor draws a plausible wrong conclusion | `misinterpretation_corrected` |
| B1-03.3 · Organiser l’intervention / De interventie organiseren | Nous avons besoin d’une plage horaire assez large. | We hebben een vrij ruime tijdsperiode nodig. | S18 S27 | Visit window conflicts with availability | `usable_visit_plan_agreed` |

**Scene-2 starter rescue:** FR “Je voulais dire…” · NL “Ik bedoelde…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B1-04 — Faire comprendre une panne / Een storing uitleggen

**Family:** `technical_support` · **Roles:** user and bounded technical support contact · **Proposed transfer candidates:** B1-03; B1-10.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B1-04.1 · Décrire les symptômes / De symptomen beschrijven | Que se passe-t-il quand vous l’allumez ? | Wat gebeurt er wanneer u het inschakelt? | S15 S23 | Device word may be unfamiliar | `observable_symptoms_shared` |
| B1-04.2 · Reformuler un mot manquant / Een ontbrekend woord omschrijven | De quelle partie de l’appareil parlez-vous ? | Over welk onderdeel van het toestel spreekt u? | S25 S12 | Need identify part without exact term | `relevant_part_identified` |
| B1-04.3 · Confirmer les prochaines étapes / De volgende stappen bevestigen | Voici deux vérifications simples à faire. | Hier zijn twee eenvoudige controles die u kunt uitvoeren. | S13 S31 | Multiple safe steps; no hazardous repair | `next_steps_understood` |

**Scene-2 starter rescue:** FR “C’est un objet qui sert à…” · NL “Het is iets waarmee je…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B1-05 — Faire un point sur une tâche / De stand van een taak bespreken

**Family:** `work_progress` · **Roles:** colleague reporting task progress · **Proposed transfer candidates:** B1-11; B1-02.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B1-05.1 · Présenter l’avancement / De voortgang voorstellen | Où en es-tu dans la tâche ? | Hoe ver sta je met de taak? | S23 S31 | Completed and remaining parts differ | `progress_summary_shared` |
| B1-05.2 · Expliquer un retard / Een vertraging uitleggen | Pourquoi la dernière étape prend-elle plus de temps ? | Waarom duurt de laatste stap langer? | S21 S15 | Dependency caused delay | `delay_and_dependency_explained` |
| B1-05.3 · Proposer un plan / Een plan voorstellen | Que proposes-tu pour terminer ? | Wat stel je voor om af te ronden? | S27 S17 | Original deadline no longer feasible | `revised_work_plan_agreed` |

**Scene-2 starter rescue:** FR “Parce que…” · NL “Omdat…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B1-06 — Parler de son expérience / Over je ervaring praten

**Family:** `interview_experience` · **Roles:** candidate and fictional interviewer · **Proposed transfer candidates:** B1-05; B1-09.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B1-06.1 · Présenter une expérience / Een ervaring voorstellen | Parlez-moi d’une expérience utile pour ce poste. | Vertel me over een ervaring die nuttig is voor deze functie. | S22 S01 | Interviewer lacks context | `relevant_experience_presented` |
| B1-06.2 · Expliquer une difficulté / Een moeilijkheid uitleggen | Quelle difficulté avez-vous rencontrée ? | Welke moeilijkheid hebt u ondervonden? | S15 S21 | Need explain action not only outcome | `challenge_and_action_explained` |
| B1-06.3 · Répondre au suivi / Een vervolgvraag beantwoorden | Qu’avez-vous appris de cette expérience ? | Wat hebt u uit die ervaring geleerd? | S21 S24 | Unexpected follow-up | `learning_and_relevant_followup_shared` |

**Scene-2 starter rescue:** FR “Le problème, c’est que…” · NL “Het probleem is dat…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B1-07 — Donner son avis dans un groupe / Je mening geven in een groep

**Family:** `group_decision` · **Roles:** participant selecting a group activity · **Proposed transfer candidates:** B1-08; B1-12.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B1-07.1 · Présenter sa préférence / Je voorkeur voorstellen | Quelle activité recommanderais-tu ? | Welke activiteit zou je aanbevelen? | S08 S21 | Group criteria not identical | `reasoned_preference_shared` |
| B1-07.2 · Exprimer un désaccord / Een meningsverschil uitspreken | Je ne suis pas convaincu par cette option. | Ik ben niet overtuigd van die optie. | S28 S27 | Another person challenges choice | `disagreement_and_option_expressed` |
| B1-07.3 · Résumer la décision / De beslissing samenvatten | Sur quoi sommes-nous d’accord ? | Waarover zijn we het eens? | S31 S07 | Agreement partially implicit | `group_decision_confirmed` |

**Scene-2 starter rescue:** FR “Je comprends, mais…” · NL “Ik begrijp het, maar…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B1-08 — Organiser avec ses voisins / Met je buren organiseren

**Family:** `community_coordination` · **Roles:** resident coordinating a shared activity · **Proposed transfer candidates:** B1-07; B1-11.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B1-08.1 · Expliquer le projet / Het project uitleggen | Que veux-tu organiser dans le quartier ? | Wat wil je in de buurt organiseren? | S17 S21 | Purpose and participants unknown | `community_plan_explained` |
| B1-08.2 · Prendre en compte un besoin / Met een behoefte rekening houden | Certaines personnes ne peuvent venir que plus tard. | Sommige mensen kunnen pas later komen. | S27 S18 | Time constraint of others | `adapted_arrangement_proposed` |
| B1-08.3 · Transmettre les détails / Details doorgeven | Peux-tu expliquer le plan à une personne absente ? | Kun je het plan uitleggen aan iemand die er niet bij was? | S32 S31 | Absent participant lacks context | `essential_details_relayed` |

**Scene-2 starter rescue:** FR “On pourrait plutôt…” · NL “We zouden in plaats daarvan…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B1-09 — Raconter une expérience / Een ervaring vertellen

**Family:** `personal_narrative` · **Roles:** learner and interested acquaintance · **Proposed transfer candidates:** B1-06; B1-12.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B1-09.1 · Installer le contexte / De context geven | Qu’est-ce qui t’est arrivé ce jour-là ? | Wat is er die dag met je gebeurd? | S22 S03 | Time/place initially unknown | `event_context_shared` |
| B1-09.2 · Garder le fil / De draad vasthouden | Attends, c’était avant ou après ton départ ? | Wacht, was dat voor of na je vertrek? | S23 S30 | Interruption challenges chronology | `sequence_restored` |
| B1-09.3 · Expliquer le résultat / Het resultaat uitleggen | Comment cela s’est-il terminé ? | Hoe is het afgelopen? | S31 S21 | Outcome and interpretation missing | `story_outcome_explained` |

**Scene-2 starter rescue:** FR “D’abord… puis…” · NL “Eerst… daarna…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B1-10 — Transmettre une tâche / Een taak overdragen

**Family:** `work_handover` · **Roles:** colleague briefing another colleague · **Proposed transfer candidates:** B1-04; B1-08.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B1-10.1 · Expliquer les étapes / De stappen uitleggen | Que dois-je faire pendant ton absence ? | Wat moet ik doen terwijl je afwezig bent? | S23 S03 | Receiver does not know procedure | `usable_steps_shared` |
| B1-10.2 · Clarifier un point / Een punt verduidelijken | Donc je fais la dernière étape en premier ? | Dus ik doe de laatste stap eerst? | S26 S12 | Plausible order misunderstanding | `step_order_corrected` |
| B1-10.3 · Verifier la transmission / De overdracht controleren | Je résume : je commence par préparer le matériel. | Ik vat samen: ik begin met het materiaal klaar te zetten. | S13 S07 | Receiver recap may omit one condition | `handover_conditions_confirmed` |

**Scene-2 starter rescue:** FR “Je voulais dire…” · NL “Ik bedoelde…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B1-11 — Proposer un nouveau délai / Een nieuwe termijn voorstellen

**Family:** `deadline_coordination` · **Roles:** colleague discussing an infeasible deadline · **Proposed transfer candidates:** B1-02; B1-08.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B1-11.1 · Expliquer la contrainte / De beperking uitleggen | Peux-tu finir pour demain ? | Kun je het tegen morgen afwerken? | S15 S21 | Dependency makes original request infeasible | `constraint_explained` |
| B1-11.2 · Proposer une autre organisation / Een andere werkwijze voorstellen | Nous avons besoin d’au moins une partie rapidement. | We hebben minstens een deel snel nodig. | S27 S20 | Partial versus full delivery trade-off | `feasible_split_proposed` |
| B1-11.3 · Confirmer l’accord / De afspraak bevestigen | D’accord, précisons qui fait quoi et quand. | Goed, laten we bepalen wie wat doet en wanneer. | S31 S18 | Responsibilities and time unresolved | `revised_delivery_agreed` |

**Scene-2 starter rescue:** FR “On pourrait plutôt…” · NL “We zouden in plaats daarvan…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B1-12 — Transmettre un message utile / Een nuttig bericht doorgeven

**Family:** `information_relay` · **Roles:** participant relaying another person’s request · **Proposed transfer candidates:** B1-10; B1-07.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B1-12.1 · Comprendre la demande / De vraag begrijpen | Dis-leur que je préfère venir après la réunion. | Zeg hun dat ik liever na de vergadering kom. | S12 S13 | Relative time needs clarification | `message_details_understood` |
| B1-12.2 · Transmettre sans déformer / Zonder vervorming doorgeven | Quel message voulait-elle nous transmettre ? | Welk bericht wilde zij ons doorgeven? | S32 S31 | New recipient did not hear source | `essential_message_relayed` |
| B1-12.3 · Clarifier une réponse / Een antwoord verduidelijken | Tu peux lui dire que cela nous convient, sauf mardi. | Je kunt haar zeggen dat dat voor ons past, behalve dinsdag. | S12 S07 | Exception may be lost | `response_exception_confirmed` |

**Scene-2 starter rescue:** FR “Elle demande si…” · NL “Zij vraagt of…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.

### 6.5 B2 scenario pack

#### B2-01 — Négocier un délai réaliste / Over een haalbare termijn onderhandelen

**Family:** `work_negotiation` · **Roles:** project participant and demanding stakeholder · **Proposed transfer candidates:** B2-03; B2-10.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B2-01.1 · Défendre une estimation / Een raming verdedigen | Votre estimation paraît trop longue. Pourquoi ce délai ? | Uw raming lijkt te lang. Waarom die termijn? | S35 S34 | Stakeholder challenges assumptions | `estimate_and_limits_defended` |
| B2-01.2 · Négocier les compromis / Over afwegingen onderhandelen | Je peux accepter un délai plus long si le périmètre change. | Ik kan een langere termijn aanvaarden als de scope verandert. | S33 S20 | Time and scope conflict | `conditional_tradeoff_negotiated` |
| B2-01.3 · Formaliser la décision / De beslissing vastleggen | Précisons les engagements et les points encore incertains. | Laten we de afspraken en de resterende onzekerheden vastleggen. | S31 S07 | Agreement includes unresolved risk | `commitments_and_open_points_confirmed` |

**Scene-2 starter rescue:** FR “Si nous…, est-ce que vous… ?” · NL “Als wij…, kunt u dan…?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B2-02 — Défendre une proposition / Een voorstel verdedigen

**Family:** `project_pitch` · **Roles:** presenter and skeptical decision maker · **Proposed transfer candidates:** B2-06; B2-08.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B2-02.1 · Présenter une proposition / Een voorstel presenteren | Quel problème votre proposition résout-elle vraiment ? | Welk probleem lost uw voorstel echt op? | S35 S21 | Problem/value challenged | `proposal_value_explained` |
| B2-02.2 · Répondre à une objection / Op een bezwaar reageren | L’alternative semble moins coûteuse et plus simple. | Het alternatief lijkt goedkoper en eenvoudiger. | S28 S20 | Competing solution plausible | `objection_addressed_with_comparison` |
| B2-02.3 · Nuancer sa recommandation / Je aanbeveling nuanceren | Dans quelles conditions changeriez-vous d’avis ? | Onder welke voorwaarden zou u van mening veranderen? | S34 S27 | Need identify limits, not absolute certainty | `conditional_recommendation_stated` |

**Scene-2 starter rescue:** FR “Je comprends, mais…” · NL “Ik begrijp het, maar…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B2-03 — Négocier une résolution de litige / Over een geschiloplossing onderhandelen

**Family:** `service_negotiation` · **Roles:** customer and service representative · **Proposed transfer candidates:** B2-01; B2-07.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B2-03.1 · Présenter un dossier clair / Een duidelijk dossier presenteren | Expliquez-moi les faits essentiels et votre demande. | Leg me de belangrijkste feiten en uw verzoek uit. | S31 S22 | Several relevant and irrelevant events | `essential_case_presented` |
| B2-03.2 · Discuter une offre partielle / Een gedeeltelijk aanbod bespreken | Nous pouvons proposer une solution partielle. | We kunnen een gedeeltelijke oplossing voorstellen. | S33 S35 | Offer does not meet all needs | `counterproposal_justified` |
| B2-03.3 · Verifier les engagements / De afspraken controleren | Quelles conditions doivent figurer dans notre accord ? | Welke voorwaarden moeten in onze afspraak staan? | S07 S34 | Conditions and uncertain timing | `resolution_conditions_confirmed` |

**Scene-2 starter rescue:** FR “Si nous…, est-ce que vous… ?” · NL “Als wij…, kunt u dan…?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B2-04 — Réparer une tension au travail / Een spanning op het werk oplossen

**Family:** `work_conflict` · **Roles:** colleague and coworker with competing interpretations · **Proposed transfer candidates:** B2-05; B2-09.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B2-04.1 · Exposer sa perception / Je perspectief uitleggen | J’ai eu l’impression que tu avais ignoré ma demande. | Ik had de indruk dat je mijn vraag had genegeerd. | S26 S34 | Intent and perceived action differ | `perspective_and_intent_clarified` |
| B2-04.2 · Reconnaître sans tout accepter / Erkennen zonder alles te aanvaarden | Pour moi, le problème est surtout la façon de communiquer. | Voor mij is het probleem vooral de manier van communiceren. | S28 S36 | Need appropriate tone without conceding every claim | `respectful_disagreement_expressed` |
| B2-04.3 · Négocier une règle commune / Een gezamenlijke afspraak maken | Comment évitons-nous cela à l’avenir ? | Hoe vermijden we dit in de toekomst? | S33 S27 | Two practical needs must coexist | `future_working_agreement_reached` |

**Scene-2 starter rescue:** FR “Je comprends, mais…” · NL “Ik begrijp het, maar…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B2-05 — Faire avancer une réunion / Een vergadering vooruithelpen

**Family:** `meeting_facilitation` · **Roles:** participant facilitating a small meeting · **Proposed transfer candidates:** B2-04; B2-09.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B2-05.1 · Clarifier les positions / Standpunten verduidelijken | Nous avons deux propositions et peu de temps. Où diffèrent-elles ? | We hebben twee voorstellen en weinig tijd. Waarin verschillen ze? | S20 S31 | Positions are partly implicit | `differences_summarized` |
| B2-05.2 · Gérer une interruption / Een onderbreking beheren | Je voudrais intervenir avant que vous ayez terminé. | Ik wil reageren voordat u klaar bent. | S30 S36 | Need preserve turn and participation | `turn_managed_appropriately` |
| B2-05.3 · Conclure sans faux accord / Afronden zonder schijnakkoord | Qu’avons-nous décidé, et sur quoi ne sommes-nous pas d’accord ? | Wat hebben we beslist en waarover zijn we het niet eens? | S31 S34 | Agreement and dissent coexist | `decisions_and_dissent_recorded` |

**Scene-2 starter rescue:** FR “Un instant, je termine…” · NL “Een ogenblik, ik maak mijn punt af…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B2-06 — Argumenter en entretien / Argumenteren in een sollicitatiegesprek

**Family:** `interview_project` · **Roles:** candidate and technical/nontechnical interviewer · **Proposed transfer candidates:** B2-02; B2-10.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B2-06.1 · Défendre un choix passé / Een eerdere keuze verdedigen | Pourquoi avez-vous choisi cette approche plutôt qu’une autre ? | Waarom koos u die aanpak in plaats van een andere? | S35 S20 | Decision has credible alternatives | `past_choice_defended` |
| B2-06.2 · Reconnaître une limite / Een beperking erkennen | Votre résultat semble bon, mais que n’a-t-il pas résolu ? | Uw resultaat lijkt goed, maar wat heeft het niet opgelost? | S34 S21 | Need avoid overstating success | `limitations_explained` |
| B2-06.3 · Adapter son explication / Je uitleg aanpassen | Expliquez maintenant cela à une personne qui ne connaît pas le domaine. | Leg dat nu uit aan iemand die het vakgebied niet kent. | S25 S36 | Audience knowledge changes | `explanation_adapted_to_audience` |

**Scene-2 starter rescue:** FR “Cela dépend de…” · NL “Dat hangt af van…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B2-07 — Traiter une réclamation complexe / Een complexe klacht behandelen

**Family:** `customer_resolution` · **Roles:** service employee and dissatisfied customer · **Proposed transfer candidates:** B2-03; B2-04.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B2-07.1 · Identifier le besoin réel / De werkelijke behoefte bepalen | Je ne veux pas seulement une excuse, j’ai besoin d’une solution. | Ik wil niet alleen een excuus, ik heb een oplossing nodig. | S29 S24 | Initial demand hides a practical constraint | `actual_need_clarified` |
| B2-07.2 · Proposer sans surpromettre / Voorstellen zonder te veel te beloven | Pouvez-vous me garantir que cela n’arrivera plus ? | Kunt u garanderen dat dit niet meer zal gebeuren? | S34 S27 | Impossible guarantee requested | `bounded_resolution_proposed` |
| B2-07.3 · Confirmer le suivi / De opvolging bevestigen | Qui me recontactera et dans quel délai ? | Wie neemt opnieuw contact op en binnen welke termijn? | S31 S07 | Ownership/time must be explicit | `followup_commitment_confirmed` |

**Scene-2 starter rescue:** FR “Cela dépend de…” · NL “Dat hangt af van…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B2-08 — Débattre d’un choix local / Over een lokale keuze debatteren

**Family:** `public_discussion` · **Roles:** participant in a fictional community discussion · **Proposed transfer candidates:** B2-02; B2-09.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B2-08.1 · Présenter une position / Een standpunt voorstellen | Faut-il changer l’usage de cet espace commun ? | Moeten we het gebruik van deze gemeenschappelijke ruimte veranderen? | S35 S21 | Multiple affected groups | `position_and_reasons_presented` |
| B2-08.2 · Répondre à un contre-argument / Op een tegenargument reageren | Votre proposition risque d’exclure certaines personnes. | Uw voorstel kan sommige mensen uitsluiten. | S28 S34 | Legitimate inclusion concern | `counterargument_addressed` |
| B2-08.3 · Formuler un compromis / Een compromis formuleren | Quelle solution respecterait les besoins des deux groupes ? | Welke oplossing houdt rekening met de behoeften van beide groepen? | S33 S27 | Competing values remain | `workable_compromise_proposed` |

**Scene-2 starter rescue:** FR “Je comprends, mais…” · NL “Ik begrijp het, maar…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B2-09 — Rapprocher deux positions / Twee standpunten dichter bij elkaar brengen

**Family:** `multi_party_mediation` · **Roles:** neutral participant relaying within one target language · **Proposed transfer candidates:** B2-05; B2-08.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B2-09.1 · Reformuler les besoins / Behoeften herformuleren | L’un veut aller vite, l’autre veut plus de vérifications. | De ene wil snel vooruit, de andere wil meer controles. | S32 S31 | Two needs must be represented fairly | `both_needs_relayed` |
| B2-09.2 · Clarifier le désaccord / Het meningsverschil verduidelijken | Pensez-vous qu’ils demandent vraiment des choses incompatibles ? | Denkt u dat hun vragen echt onverenigbaar zijn? | S12 S34 | Positions versus underlying needs differ | `actual_disagreement_clarified` |
| B2-09.3 · Proposer un terrain commun / Gemeenschappelijke grond voorstellen | Quel accord minimal pourrait leur convenir ? | Welke minimale afspraak zou voor beiden kunnen passen? | S33 S27 | Need neither erase dissent nor promise certainty | `shared_basis_proposed` |

**Scene-2 starter rescue:** FR “Que voulez-vous dire par… ?” · NL “Wat bedoelt u met…?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B2-10 — Présenter un risque avec nuance / Een risico genuanceerd presenteren

**Family:** `risk_briefing` · **Roles:** colleague briefing a fictional project group · **Proposed transfer candidates:** B2-01; B2-11.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B2-10.1 · Distinguer faits et hypothèses / Feiten en aannames onderscheiden | Que savons-nous, et qu’est-ce qui reste une hypothèse ? | Wat weten we en wat blijft een aanname? | S34 S31 | Evidence incomplete | `known_and_uncertain_separated` |
| B2-10.2 · Discuter les scénarios / Scenario’s bespreken | Que se passe-t-il si notre hypothèse principale est fausse ? | Wat gebeurt er als onze belangrijkste aanname fout is? | S20 S35 | Need compare plausible outcomes | `alternative_outcomes_explained` |
| B2-10.3 · Recommander une action / Een actie aanbevelen | Quelle action recommandez-vous malgré cette incertitude ? | Welke actie raadt u ondanks die onzekerheid aan? | S27 S34 | Decision required without certainty | `qualified_action_recommended` |

**Scene-2 starter rescue:** FR “Cette option est plus…” · NL “Deze optie is… dan…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B2-11 — Analyser un incident / Een incident analyseren

**Family:** `incident_review` · **Roles:** participant in a nonhazardous service incident review · **Proposed transfer candidates:** B2-10; B2-07.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B2-11.1 · Reconstruire les faits / De feiten reconstrueren | Les récits ne correspondent pas complètement. Que peut-on établir ? | De verslagen komen niet volledig overeen. Wat kunnen we vaststellen? | S22 S34 | Accounts conflict | `supported_sequence_established` |
| B2-11.2 · Discuter les causes / Oorzaken bespreken | Cette cause explique-t-elle vraiment tous les faits ? | Verklaart die oorzaak echt alle feiten? | S35 S28 | Single-cause explanation challenged | `causal_limits_discussed` |
| B2-11.3 · Proposer une amélioration / Een verbetering voorstellen | Comment réduire ce risque sans compliquer tout le travail ? | Hoe beperken we dit risico zonder al het werk ingewikkelder te maken? | S27 S20 | Prevention and effort trade-off | `proportional_improvement_proposed` |

**Scene-2 starter rescue:** FR “Mon principal argument est…” · NL “Mijn belangrijkste argument is…”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.
#### B2-12 — Résoudre une journée compliquée / Een ingewikkelde dag oplossen

**Family:** `integrated_day` · **Roles:** learner coordinating multiple fictional commitments · **Proposed transfer candidates:** B2-01; B2-09.

| Scene / localized intent | Draft actor opening FR | Draft actor opening NL-BE | Skill aliases | Friction / missing information | World completion predicate |
|---|---|---|---|---|---|
| B2-12.1 · Prioriser les contraintes / Beperkingen prioriteren | Deux engagements se chevauchent et une personne attend votre réponse. | Twee afspraken overlappen en iemand wacht op uw antwoord. | S31 S34 | Competing time and responsibility | `priorities_explained` |
| B2-12.2 · Négocier un changement / Een wijziging onderhandelen | Je peux modifier une partie du plan, mais pas tout. | Ik kan een deel van het plan wijzigen, maar niet alles. | S33 S35 | Partial flexibility only | `feasible_plan_negotiated` |
| B2-12.3 · Transmettre le plan final / Het definitieve plan doorgeven | Expliquez le nouvel arrangement aux personnes concernées. | Leg de nieuwe afspraak uit aan de betrokken personen. | S32 S36 | Different audiences need relevant details | `updated_commitments_relayed` |

**Scene-2 starter rescue:** FR “Si nous…, est-ce que vous… ?” · NL “Als wij…, kunt u dan…?”. Author the contextual full form and reference audio before release. **Retry variation:** change the relevant item/time/constraint while preserving the family and communicative job. **End:** accept a feasible agreement or an explicit appropriate decline; let the learner stop.

### 6.6 Coverage and scope checks

This catalogue contains 12 scenarios per demand band, three scenes per scenario. French and Belgian Dutch each get 144 localized scene openings, for 288 total. Each skill alias appears in the catalogue. These are draft content definitions, not 288 produced audio scenes or a statistically validated full CEFR course.

Repair targets S10–S13 need additional authored instances beyond the initial explicit rows when demand rises. S25–S26 require plausible word gaps and misunderstanding opportunities; never assume the learner must fail. Final B2 tasks must elicit sustained comparison, qualification and negotiation; simple greetings are not B2 evidence.

### 6.7 Routes through the catalogue

| Program | A1 route examples | A2 route examples | B1 route examples | B2 route examples |
|---|---|---|---|---|
| Daily life | 01, 02, 04, 05, 07 | 02, 03, 04, 05, 06 | 01, 02, 03, 04 | 03, 08, 09, 12 |
| Social | 01, 10, 11, 12 | 09, 11 | 07, 08, 09, 12 | 04, 05, 08, 09 |
| Work | 01, 10, 06 | 10, 02 | 05, 10, 11, 12 | 01, 02, 04, 05, 10, 11 |
| Interview | 01, 10 | 10, 11 | 06, 09, 05 | 06, 02, 10 |
| Travel | 02, 04, 05, 08 | 04, 07, 08, 12 | 02, 01 | 03, 12 |

Numbers refer to the scenario number within each band. These are selection spaces, not rigid compulsory paths or guaranteed band progression. Insert reviewed transfer and later return based on the targeted capability and actual evidence.

## 7. Content contracts, review and asset production

### 7.1 Contract hierarchy

`program goal → scenario definition → localized scene → authored opportunity → attempt → validator-authorized evidence → frontier → next scene`

A scene inherits a reviewed actor, private learner facts, world facts, permitted actions, completion predicates, support policy, demand profile and content version. Scene-local overrides cannot weaken canonical evidence invariants.

### 7.2 Minimum executable scene record

```yaml
scene_id: nl-BE_A2-03_2
scenario_id: A2-03
family_id: parcel_collection
locale: nl-BE
content_version: 1
status: draft
learner_role: customer collecting a parcel
actor_role: parcel clerk
visible_goal: Find a workable collection option
opening: Het ligt in een ander afhaalpunt.
world_facts:
  available_here: false
  collection_options: authored_fictional_options
actor_knows: [collection_options, opening_hours]
learner_private: [availability, preferred_option]
actions: [ask_option, clarify_location, accept_option, decline_option]
completion_predicate: usable_collection_option_found
candidate_opportunities:
  - proposed_skill: request_substitution
    channel: production
    band: A2
    trigger: known_option_is_unworkable
    rubric_ref: reviewed_rubric_required
support: [intention, stem, contextual_phrase, reviewed_audio, meaning]
assessment: validator_only
```

The example is an authoring proposal, not an exact current TypeScript/schema claim. Compile into canonical contracts after reconciliation.

### 7.3 Assets per localized scene

| Asset | Requirement | Where used |
|---|---|---|
| Title + objective | Concise localized wording; clear task | Catalogue, program, briefing |
| Opening audio/text | Reviewed pronunciation and register | Live scene |
| Intention hint | No target wording when feasible | Rescue rung 1 |
| Phrase stem | Scoped linguistic exposure | Rescue rung 2 |
| Contextual full phrase | Useful example, not the only accepted answer | Rescue rung 3 |
| Model audio | Reviewed example and meaning | Rescue/model |
| Comprehension help | Replay, meaning and slowed version if appropriate | Listening support |
| Lexical set | Approximately 6–12 high-value terms as an authoring starting point | Saved language and optional preparation |
| Pattern note | One or two useful constructions with purpose and example | Checkpoint/recap support |
| Context image | Object/location/info that orients the task | Briefing/live background |
| Rubric fixtures | Success, near miss, assisted, ambiguous, no-opportunity | Content QA and assessment calibration |
| Variant fixtures | Changed fact values within same job | Retry and later return |

The catalogue provides openings, skill-linked stems and scene outcomes. **Full phrase sets, lexical inventories, all audio recordings, illustrations and release rubrics still require production.** Do not claim those assets exist simply because their specification is complete.

### 7.4 Vocabulary and pattern design

Prefer words needed to accomplish the scene. Include lemma, localized meaning, scene example, register, variety, audio reference and target ID. For Dutch, include noun article/plural or verb information where useful; for French, include gender, common forms and useful phrase context. Do not make grammatical metadata fill the live screen.

Example authoring seeds for the parcel scenario:

| Meaning | FR seed | NL-BE seed | Useful scene role |
|---|---|---|---|
| Parcel | un colis | een pakje | State pickup purpose |
| Collection point | un point de retrait | een afhaalpunt | Ask where to collect |
| Reference number | un numéro de référence | een referentienummer | Identify fictional parcel |
| Opening hours | les heures d’ouverture | de openingsuren | Check availability |
| Tomorrow | demain | morgen | Propose a time |
| Another option | une autre possibilité | een andere mogelijkheid | Request alternative |

These are original draft seeds requiring locale review. Further lexical sets should be authored per scenario, not inferred to be complete from this example.

### 7.5 Release pipeline

Draft → skill/taxonomy reconciliation → locale review → level/opportunity review → asset production → runtime compilation → human playtest → assessment fixtures → small learner pilot → reviewed release → calibration.

Each locale has its own reviewer and changelog. A translated scene cannot inherit the other locale’s review status automatically. Keep the authored transcript and pronunciation reference versioned. Synthetic voices also need review.

### 7.6 Branches and endings

Each scene needs a success path, assisted path, appropriate decline/alternative exit and interruption exit. Reject impossible world actions. The actor may ask relevant follow-ups within the selected branch but cannot create official facts or change its own scoring authority.

Completion predicates in the catalogue indicate world outcomes. Some are interaction outcomes such as clarification obtained; none independently establishes skill demonstration. A scene can finish with zero target evidence.

### 7.7 Source use and factual realism

Use fictional prices, schedules and service conditions unless a factual source is maintained and dated. Do not teach invented Belgian administrative requirements. This catalogue intentionally emphasizes general communication rather than legal, medical or financial advice. French materials from TV5MONDE can inform optional input discovery [S3]; link to source content rather than copying or redistributing protected media without permission.


## 8. Page architecture and feature access

### 8.1 Three primary destinations

| Destination | FR label | NL label | Job | Composition |
|---|---|---|---|---|
| Talk | Parler | Spreken | Begin the next useful situation | One scene-led stage and one main action |
| Missions | Situations | Situaties | Explore the program and world | Current arc plus a compact grouped catalogue |
| Progress | Progrès | Voortgang | Understand practical capability | Skill rows with expandable evidence and examples |

Keep canonical route names compatible with existing Talk/Missions/Progress contracts. Learner-facing translations need not sound like military missions. Settings sits behind a predictable profile action. Language switcher stays discoverable in the header outside the live scene.

### 8.2 Secondary feature access

| Feature | Entry outside RP | Entry during RP | Return behavior |
|---|---|---|---|
| Vocabulary | Saved language inside Progress | Help sheet: “Words” | Return to same scene/checkpoint |
| Grammar/patterns | Saved patterns inside Progress | Help sheet: “Useful pattern” | Exposure logged, turn state preserved |
| Meaning | Language-support settings/examples | Character-turn meaning action | Affected comprehension conditions recorded |
| Replay | Attempt history or reviewed model | Character-turn replay | Playback provenance recorded |
| Listen slower | Accessibility/input preferences | Current turn playback controls | Task-condition effects checked |
| Notes | Program/scene preparation | Optional compact notes sheet | No overlay masking core controls |
| Transcript | Attempt history | Optional transcript panel | Answer-containing content treated as exposure |
| Retry | Recap and history | Natural checkpoint action | New attempt/provenance |
| Transfer | Recap/recommended scene | After current scene ends | Eligibility and family change verified |
| Free exploration | Catalogue “Explore” section | End scene first | Clearly unassessed |
| Pressure/duration | Talk alternative action | Pause/settings sheet | Cannot silently reinterpret earlier evidence |

Most commonly used support should be reachable in one or two actions. This is a usability target to verify, not a universal standard. Do not place twelve icon buttons around the microphone.

### 8.3 Talk page — exact hierarchy

1. Compact header: locale switcher, current goal label, profile.
2. A single contextual illustration with the character and location.
3. Scene title and one-sentence task.
4. Main Start/Continue button with a short duration estimate.
5. One plain recommendation explanation.
6. Optional “A shorter scene” or “Choose another situation” text action.
7. Bottom navigation.

Example first screen:

| Element | French | Belgian Dutch |
|---|---|---|
| Context | Votre quartier | Je buurt |
| Title | Un café avant de partir | Een koffie voor je vertrekt |
| Task | Commandez une boisson et vérifiez le prix. | Bestel een drankje en vraag de prijs. |
| Main action | Entrer dans la scène | De scène starten |
| Optional action | Observer d’abord | Eerst kijken |
| Returning reason | Essayez avec moins d’aide cette fois. | Probeer het deze keer met minder hulp. |

Do not display all progress stats on the first screen. A single subtle “next useful job” is more important than level chips, XP, streak, charts and topic grids competing for attention.

### 8.4 Catalogue page

Use a short grouped list of scenarios with thumbnail, localized title, communicative job and availability. Keep family filters accessible in a sheet or short segmented control. Use search only when the catalogue warrants it; do not put a large search field ahead of the recommendation.

One highlighted current arc is allowed. Other scenarios use rows separated by spacing or dividers, not nested bordered cards. Display an authored band as secondary context with explanation; do not imply that browsing B2 makes the learner B2.

### 8.5 Program page

Show the goal and a route of episodes. The current episode is expanded with scene preview and Start; completed ones are compact; future ones show a title and purpose. Let users inspect upcoming situations. Hard locking is reserved for actual prerequisites, content incompatibility or unavailable entitlement, with a clear reason.

Program adaptation changes the recommended route, not the evidence history. Show a short explanation when a transfer or recovery scene is inserted. Do not expose a large graph or engineering vocabulary.

### 8.6 Briefing page

**Default:** one location illustration, learner role, situation, goal and Start. The total briefing should fit a compact phone view with dynamic text; scrolling is allowed when accessibility requires it. The primary action remains obvious.

A1 can offer a short model. B1/B2 can offer a small information sheet or preparation notes, without giving a complete response script. Preparation is logged if it exposes relevant target forms.

### 8.7 Live RP page

**Top:** back/pause, scene title or location, small goal affordance.  
**Middle:** character portrait/context illustration; current turn text when enabled; character speaking/listening status.  
**Bottom:** clear input control, help action and optional text-mode action where supported.  
**Secondary:** transcript/history behind a predictable control, not an always-growing chat wall.

The microphone is a control, not a giant decorative orb covering half the screen. Size around 64–72 logical units is a starting proposal; keep the label and capture state explicit. Support an accessible alternative to hold-to-talk where needed. Respect reduced motion.

**Microcopy states:**

| State | FR | NL |
|---|---|---|
| Learner turn | À vous | Jij bent aan de beurt |
| Recording | Enregistrement en cours | Opname bezig |
| Character speaking | Écoutez | Luister |
| Help | Besoin d’aide ? | Hulp nodig? |
| Processing | Un instant… | Een ogenblik… |
| Recognition uncertain | Je ne suis pas sûr d’avoir bien entendu. | Ik ben niet zeker of ik het goed gehoord heb. |
| Connection paused | La connexion est interrompue. Réessayez. | De verbinding is onderbroken. Probeer opnieuw. |
| Feedback pending | La scène est enregistrée. Le retour arrive bientôt. | De scène is opgeslagen. De feedback volgt binnenkort. |

Do not present simulated character misunderstanding as an ASR failure or vice versa. Technical recognition uncertainty should be transparent and never count as a lapse.

### 8.8 Help sheet

The sheet opens without leaving the RP and preserves microphone/turn state. First show the smallest help suitable for the current target. Separate actions for **what to do**, **how to start**, **full example**, **listen**, and **meaning**. The learner can choose stronger help immediately; there is no mandatory wait timer to unlock rescue.

Use labeled actions rather than cryptic icons or tabs hiding the primary rescue. Example for requesting another parcel collection option:

- Intention: “Ask whether another collection option is possible.”
- FR stem: “Est-ce qu’il y a…”; full example: “Est-ce qu’il y a un autre point de retrait ?”
- NL stem: “Is er…”; full example: “Is er een ander afhaalpunt?”
- Listen: reviewed audio of the exact example.
- Meaning: explanation in the user’s chosen support language.

After help: “Try your own answer” / “Essayez votre réponse” / “Probeer je eigen antwoord”. Never label a model-exposed answer as independent.

### 8.9 Recap page

Lead with the scene result, not a score. Follow with one truthful capability example and one improvement. Indicate help positively and accurately: “You completed the exchange using a phrase example.” Show one main next action, plus stop and alternate practice choices.

If assessment is incomplete, show the activity summary and pending state. Do not fill missing feedback with generic praise presented as evidence.

### 8.10 Progress page

Use practical capability rows with recent examples. Tapping a row reveals where, when, band/channel/modality and support conditions. Saved language and attempt history are directly accessible within this destination.

Keep activity history, narrative milestones and independently demonstrated capability visually distinct. A completion badge should not be styled as mastery or official certification.

### 8.11 Empty and exceptional states

| State | Content | Action |
|---|---|---|
| First user | One first situation, no empty analytics | Start |
| No assessed content for selected goal | Explain current coverage briefly | Choose related reviewed goal or unassessed exploration |
| No saved language | Explain how a scene phrase can be saved | Open relevant scene |
| Microphone denied | Explain setting and modality options | Retry permission or supported typed mode |
| Interrupted attempt | Explain what was saved and what remains unknown | Resume valid checkpoint or new attempt |
| No review due | Offer fresh or voluntary practice | Start an eligible scene |
| B2 content not yet reviewed | Clearly mark draft/unavailable | Choose available reviewed practice |

## 9. Concrete visual system and responsive behavior

### 9.1 Design thesis and reference lock

**Direction: a friendly illustrated neighbourhood, with clear ink typography, an ocean-teal action color and a restrained warm highlight.** The character and setting create emotion; navigation and controls remain precise and familiar.

This is a concrete proposal, not an approved replacement for existing V4 tokens. Reconcile the mapping before code changes. Refero live references were unavailable in the prior design pass; no inspected product screenshot is fabricated. Current sources are official Apple/Material documentation indexes, W3C, font catalogues and the project’s existing architecture [S4–S6, S9].

The 2026 requirement means current standards, platform-aware behavior and rendered verification. It does not mean adding fashionable glass, gradients, giant type or arbitrary animations. Apple and Android can use native navigation conventions while preserving the LearnByRP content identity.

**Preserve:** scene-led composition, readable contrast, clear hierarchy, short copy, predictable controls.  
**Borrow from platform guidance:** familiar navigation, semantic appearance, accessible scaling and state feedback.  
**Reject:** every section inside a card, purple gradient headers by default, decorative text swaps, oversized hero text, endless metric panels, emoji as the only icon system.

### 9.2 Color tokens

| Token | Light value | Dark value | Role |
|---|---|---|---|
| canvas | `#F4F7FA` | `#0E1822` | App background |
| surface | `#FFFFFF` | `#182733` | Sheets and reading surfaces |
| ink | `#172B3A` | `#EDF3F7` | Main text |
| muted ink | `#506270` | `#B4C5D0` | Secondary text |
| primary | `#006A70` | `#63D5CE` | Main actions/selected controls |
| on-primary | `#FFFFFF` | `#0E1822` | Text/icons on main action |
| primary tint | `#E1F2F1` | `#183E40` | Selected background, never body text color |
| highlight | `#FFB84D` | `#FFB84D` | Small scene/story accents with dark text |
| divider | `#D7E1E8` | `#3D5363` | Decorative separation, not sole control boundary |
| focus | `#006A70` | `#63D5CE` | Visible focus indicator against tested backgrounds |
| success | `#146B46` | `#8DDEB6` | Confirmed feedback with text/icon |
| error | `#A62A2A` | `#FFB4AB` | Recoverable system error with explanation |

Use primary for the action, highlight for world details, status colors for status. Do not use CEFR levels as traffic-light colors. Do not use light teal text on white. Illustrations can have a broader palette, but text sits on a tested solid or sufficiently opaque surface.

Contrast numbers for selected text pairs are calculated in the validation section. These checks do not establish full UI accessibility; all interaction states and real rendered contexts still need verification.

### 9.3 Typography

**Brand proposal:** Manrope for short titles and prominent action labels; Source Sans 3 for dialogue, body text and learning explanations [S9]. These are design choices, not officially required 2026 fonts. Both locale character sets must be verified in the chosen font files. Native system fonts are a practical fallback, especially for platform-owned UI and performance/accessibility consistency.

| Role | Starting size / line height | Weight | Rule |
|---|---|---|---|
| Scene/page title | 28 / 34 | 650–700 | Typically one or two lines, no 60px mobile hero |
| Section title | 20 / 27 | 600–650 | Short and functional |
| Dialogue | 18 / 27 | 400–500 | Readable; allow text scaling |
| Body/support | 16 / 24 | 400 | Enough spacing for learning text |
| Button/primary label | 16 / 22 | 600 | Short action verbs |
| Metadata | 13 / 18 | 500 | Noncritical information only |

Use available font weights rather than assuming arbitrary variable weights exist in every asset. Limit loaded families/weights and set robust fallbacks. Self-host permitted font assets if appropriate; check their licenses. Never shrink dialogue to fit a fixed card.

### 9.4 Layout and shape

Use a 4-unit spacing scale: 4, 8, 12, 16, 24, 32. Mobile horizontal content padding starts at 16–20 units. Rows, bands, dividers and intentional whitespace create structure. Reserve raised surfaces for sheets, actionable scene previews and transient panels.

Proposed radius roles: 10–12 for controls; 16–20 for sheets/scene previews; circular only for avatars/input controls. Avoid rounded-pill treatment for every label. Shadow is subtle and limited to genuine elevation.

Desktop can add a side navigation rail and optional transcript/context column. It must not simply stretch a mobile card to 1200 pixels wide. Main reading/dialogue measure stays comfortable, roughly 45–70 characters for explanatory text; live short turns can be narrower.

### 9.5 Illustration and character art

Create original 2D character/location assets with a consistent perspective, line quality and palette. Include enough environmental context to understand the task: counter, tram stop, reception desk or meeting table. Avoid photorealistic generic avatars disconnected from the world.

Asset plan: reusable locations, recurring fictional actors, a small set of expressions, task objects and small outcome states. Expressions must not imply surveillance of the learner’s emotions. Speaker activity comes from actual playback state, not inferred mood.

Use fixed aspect ratios and dimensions to prevent layout shift. Small-phone portrait crops prioritize face/object/goal. In a live scene, reduce background detail so labels and controls remain legible.

### 9.6 Motion and feedback

Use brief transitions to clarify listening, speaking, opening help and scene changes. Motion should never delay input or block a rescue action. Provide reduced-motion equivalents. Avoid continuous pulsing designed to pressure the learner into speaking. Celebration is short, skippable and grounded in the world outcome.

### 9.7 Responsive cases to test

- 320-wide compact phone and approximately 568-high view.
- Common phone portrait, tall large phone, landscape where supported.
- Tablet split view and desktop with keyboard navigation.
- Large text / dynamic type and zoom/reflow on web.
- Safe-area insets, virtual keyboard and microphone permission interruption.
- Long French labels, Dutch compound words and multiline dialogue.
- Reduced motion, screen reader, captions, color perception differences.
- Low bandwidth and delayed assets without blocked navigation.

The Start action should be visible in normal compact entry conditions. When large text requires scrolling, prioritize accessibility rather than forcing everything above the fold.

### 9.8 Design quality gates

- Exactly one primary action per ordinary screen state.
- Core help and exit controls remain discoverable.
- No more than a short task sentence and necessary context before practice.
- Secondary learning explanations live in sheets/details, not home-page paragraphs.
- Focus, pressed, loading, disabled, selected and error states are specified.
- Control boundaries/focus have sufficient contrast, independent of decorative dividers.
- Touch targets generally aim for 44–48 logical units or larger for core mobile controls; WCAG’s web minimum and exceptions are distinct [S6].
- No text hidden by fixed navigation, keyboard or microphone controls.
- Native platform conventions are respected; web keyboard/back/link behavior works.
- Visual implementation is compared against the locked scene composition, not approved from source code alone.

## 10. Complete learner journeys and acceptance checks

### 10.1 Beginner French example

1. Choose French and an explanation language; choose everyday life.
2. Accept A1-02 café and optionally Observe.
3. Hear the opening; order a familiar drink.
4. If stuck, open help, choose a stem or phrase, then answer.
5. Specify service mode and ask/check price.
6. Read a short truthful recap; save one useful phrase if desired.
7. Retry the difficult moment with a new item.
8. On a later return, try A1-03 market for a reviewed purchase/information capability.
9. Track independent retrieval separately from earlier model exposure.

### 10.2 Belgian Dutch learner with some experience

1. Choose `nl-BE`, daily life and optional short warm-up probes.
2. Start A2-02 with appointment-changing needs.
3. Explain the conflict, request another slot and confirm details.
4. Receive one targeted form note only if grounded in the attempt.
5. Later use requesting-an-alternative in A2-12 rental.
6. Keep both attempts’ families, bands, support and modality distinct.
7. A failed transfer scene is not automatically a skill lapse; validate a taken opportunity first.

### 10.3 B1 work learner

Follow B1-05 progress report, then B1-11 delivery arrangement and B1-10 handover. Insert clarification/repair opportunities and a later different-family reason/explanation task. The learner can practise a real work goal without sharing confidential employer information; fictional facts are sufficient.

### 10.4 B2 negotiation learner

Start with a reviewed B2-01 or B2-03 scene. Elicit a defended position, a challenged assumption, conditional trade-offs and an explicit recap. Help remains available but affects evidence. Later use similar capabilities in a genuinely different community or service family. A short fluent answer alone does not establish the B2 target.

### 10.5 Bilingual learner

Switching French/Dutch outside an attempt opens the other locale’s history and next-scene policy. Do not translate a successful French attempt into Dutch evidence. Cross-language familiarity can inform entry choice, but does not establish independent capability in the target language.

### 10.6 Acceptance checklist

- [ ] All 48 scenarios and 144 scenes have stable IDs and locale-specific review status.
- [ ] Every draft scene has localized intent, opening, candidate skills, friction and world completion condition.
- [ ] Each executable scene has completed lexical/pattern/audio/support assets and release rubrics.
- [ ] Every skill alias maps to canonical taxonomy or an explicitly reviewed new skill proposal.
- [ ] Every transfer edge is reviewed and leads to a matching eligible opportunity.
- [ ] A1 speech entry is possible after a tiny meaningful preparation bridge.
- [ ] B2 scenes actually elicit sustained negotiation/qualification at the reviewed demand.
- [ ] Help does not leave the live scene or erase attribution.
- [ ] Exposed forms cannot generate unassisted target credit.
- [ ] Retry and cosmetic variants cannot generate transfer credit.
- [ ] Silence/noise/disconnection cannot automatically create lapses.
- [ ] French/Dutch histories and spoken/typed modalities remain distinct.
- [ ] Placement hypotheses do not confer durable progress.
- [ ] Current scene, saved language, replay and help are reachable through clear controls.
- [ ] Colors and typography meet rendered contrast/scaling checks.
- [ ] Large text and keyboard do not hide input, help or exit controls.
- [ ] Recap distinguishes world result, help, validated behavior and pending assessment.
- [ ] Reminder consent is voluntary; no shame after absence.
- [ ] Narrative rewards do not masquerade as competence.
- [ ] Outcome validation uses unseen tasks and delayed return.

## 11. Implementation priorities and source register

### 11.1 Practical build sequence

| Step | Scope | Result |
|---|---|---|
| 1 | Reconcile architecture and canonical IDs | One evidence/runtime authority |
| 2 | Review a small complete two-locale slice | At least one real retry/transfer/later-return route per chosen capability |
| 3 | Build entry/live/help/recap UX | Learner can act and recover on mobile |
| 4 | Compile programme/catalogue contracts | Pages read localized content and eligibility, not hardcoded mock text |
| 5 | Produce reference/support assets | Reviewed audio and useful language content |
| 6 | Add repetition and cross-family policy | Explainable next-scene behavior |
| 7 | Expand A1/A2 and B1 depth | Broader reviewed coverage |
| 8 | Review and pilot B2 | Nuanced demand and assessment calibration |

Do not ship all draft scenarios as assessed content merely to inflate the catalogue. Ship reviewed routes with complete assets; keep the broader authoring inventory as the production plan.

### 11.2 Page data contracts

| Page | Data projection | Authoritative source |
|---|---|---|
| Enrollment | Supported locale/goal options and preferences | Locale/goal catalogue |
| Talk | One eligible scene and recommendation reason | Next-scene policy + localized metadata |
| Missions | Reviewed available definitions and filters | Versioned content registry |
| Program | Goal, planned episodes and current recommendation | Programme plan + actual attempt history |
| Briefing | Role, premise, visible goal, entry support | Localized scene definition |
| Live | Accepted world state, actor turn, support and transport state | Runtime reducer + adapters |
| Recap | Scene outcome, assessment state, validated summary | Attempt + validator-authorized outputs |
| Progress | Capability projection and evidence details | Versioned evidence projection |
| Saved language | Explicit saves and reviewed target assets | Language-target catalogue + user saves |

Loading, missing-content and assessment-pending states are explicit. Client copy must not invent skill progress from local mission completion.

### 11.3 Source register

**[S1] Council of Europe — CEFR descriptor resources and Companion Volume.** Primary framework for action-oriented demand and multiple language activities; the catalogue’s exact skill mappings are original proposals.  
https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors  
https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-in-the-classroom

**[S2] Taaladvies.net / Team Taaladvies — Standard Dutch in Belgium.** Locale authority for distinguishing accepted standard usage; individual phrases and pronunciation still require review.  
https://taaladvies.net/termen-standaardtaal-in-belgie/  
https://www.vlaanderen.be/team-taaladvies/taaladviezen/woordgebruik/standaardtaal/standaardtaal-verschillen-tussen-belgie-en-nederland

**[S3] TV5MONDE — Apprendre le français.** Public-broadcaster learning resource for optional input discovery and author research. The original scenes in this file are not copied from its exercises.  
https://apprendre.tv5monde.com/fr

**[S4] Apple — Human Interface Guidelines.** Current platform design documentation; typography/color subpages were JavaScript-only in retrieval, so no detailed quotations or unsupported page-specific claims are used. Revisit canonical guidance during implementation.  
https://developer.apple.com/design/human-interface-guidelines  
https://developer.apple.com/design/human-interface-guidelines/typography  
https://developer.apple.com/design/human-interface-guidelines/color

**[S5] Google — Material Design 3.** Current official design-system entry point; expressive components and semantic styling are references, not permission to overload the learning interface. Some page content required JavaScript in retrieval.  
https://m3.material.io/

**[S6] W3C — WCAG 2.2.** Testable web accessibility requirements. Full conformance requires rendered testing beyond token contrast calculations.  
https://www.w3.org/TR/WCAG22/  
https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum

**[S7] Kim & Webb (2022) — The Effects of Spaced Practice on Second Language Learning: A Meta-Analysis.** Supports later retrieval; proposed intervals require product calibration.  
https://doi.org/10.1111/lang.12479

**[S8] Bryfonski & McKay (2019) — TBLT implementation and evaluation: A meta-analysis.** Supports the task-based mechanism, not the effectiveness of this new catalogue or LearnByRP itself.  
https://journals.sagepub.com/doi/10.1177/1362168817744389

**[S9] Google Fonts — font catalogue references.** The selected pair is a LearnByRP visual proposal; verify chosen files, locale glyph coverage, weights and licensing.  
https://fonts.google.com/specimen/Manrope  
https://fonts.google.com/specimen/Source+Sans+3

**[S10] Ryan & Deci (2000) — Self-Determination Theory.** Motivation basis for learner autonomy and credible competence; the specific narrative/return loop needs testing.  
https://selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf

### 11.4 Evidence and design scope

Research sources support mechanisms and standards. They do not endorse this exact color palette, scenario inventory, time schedule, number of scenes or learner outcome claims. A current platform recommendation is not the same as a universal visual fashion. Localized content is original draft authoring, not expert-reviewed instruction. The repository has not been freshly audited for this document.

### 11.5 Document validation

Structural checks: 48 unique scenario IDs; 12 per band; 144 scenes; 288 localized openings; all 36 skill aliases referenced; proposed transfer IDs resolve. These are document-integrity checks, not expert language review or assessment validation.

| Proposed pair | Text | Background | Calculated contrast |
|---|---|---|---|
| Light main text | `#172B3A` | `#FFFFFF` | 14.55:1 |
| Light secondary text | `#506270` | `#FFFFFF` | 6.32:1 |
| Light button | `#FFFFFF` | `#006A70` | 6.37:1 |
| Highlight label | `#172B3A` | `#FFB84D` | 8.46:1 |
| Dark main text | `#EDF3F7` | `#182733` | 13.63:1 |
| Dark secondary text | `#B4C5D0` | `#182733` | 8.60:1 |
| Dark button | `#0E1822` | `#63D5CE` | 10.18:1 |

The calculation uses the standard sRGB relative-luminance contrast ratio for the listed solid colors. Check actual rendering, controls, focus, error states, overlays and disabled states separately.

**Completion criterion:** a learner can enter a purposeful scene, get useful help, repeat without fake progress, and later perform independently in another reviewed setting—through an interface that feels like a welcoming speaking space.
