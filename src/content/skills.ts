import {
  CommunicativeSkillDefinition,
  CommunicativeSkillId,
  PracticeSkillDefinition,
} from '../types';

/**
 * Canonical learning-skill content.
 *
 * Missions may reference these stable ids, but they do not own the definitions.
 * Keep this catalog independent from mission content so skill meaning cannot drift
 * when a mission is edited or versioned.
 */

/**
 * Tombstones for retired ids. Once an id is placed here it must never return to
 * the active catalog for a different meaning.
 */
export const RETIRED_COMMUNICATIVE_SKILL_IDS: readonly CommunicativeSkillId[] = [];

export const PRACTICE_SKILLS: readonly PracticeSkillDefinition[] = [
  {
    id: 'practice-start-conversation',
    name: {
      en: 'Start a conversation',
      fr: 'Commencer une conversation',
      es: 'Iniciar una conversación',
      nl: 'Een gesprek beginnen',
    },
    description: 'Learner-facing discovery label for opening a roleplay naturally.',
  },
  {
    id: 'practice-keep-it-going',
    name: {
      en: 'Keep it going',
      fr: 'Faire durer la conversation',
      es: 'Mantener la conversación',
      nl: 'Het gesprek gaande houden',
    },
    description: 'Learner-facing label for maintaining interaction and repairing breakdowns.',
  },
  {
    id: 'practice-explain-an-idea',
    name: {
      en: 'Explain an idea',
      fr: 'Expliquer une idée',
      es: 'Explicar una idea',
      nl: 'Een idee uitleggen',
    },
    description: 'Learner-facing label for expressing, comparing and developing ideas.',
  },
  {
    id: 'practice-ask-for-clarification',
    name: {
      en: 'Ask for clarification',
      fr: 'Demander une clarification',
      es: 'Pedir una aclaración',
      nl: 'Om verduidelijking vragen',
    },
    description: 'Learner-facing label for understanding and checking meaning.',
  },
  {
    id: 'practice-handle-difficult-moment',
    name: {
      en: 'Handle a difficult moment',
      fr: 'Gérer un moment difficile',
      es: 'Manejar un momento difícil',
      nl: 'Een moeilijk moment aanpakken',
    },
    description: 'Learner-facing label for recovering when communication becomes difficult.',
  },
  {
    id: 'practice-speak-for-purpose',
    name: {
      en: 'Speak for a purpose',
      fr: 'Parler avec un objectif',
      es: 'Hablar con un objetivo',
      nl: 'Spreken met een doel',
    },
    description: 'Learner-facing label for accomplishing a practical goal through conversation.',
  },
] as const;

export const COMMUNICATIVE_SKILLS_CATALOG: readonly CommunicativeSkillDefinition[] = [
  {
    id: 'skill-request-substitution',
    name: 'Requesting a substitution',
    category: 'Transaction & Service',
    description: 'Ask for an alternative option, ingredient replacement, or adaptation.',
    canDo: {
      en: 'I can ask for a different option when the first one does not work for me.',
      fr: 'Je peux demander une autre option lorsque la première ne me convient pas.',
      es: 'Puedo pedir otra opción cuando la primera no me conviene.',
      nl: 'Ik kan om een andere optie vragen wanneer de eerste niet voor mij werkt.',
    },
    positiveExamples: [
      'Requests an available substitute after learning the preferred option is unavailable.',
      'States the relevant constraint and asks for an alternative that satisfies it.',
    ],
    negativeExamples: [
      'Repeats the unavailable option without adapting.',
      'Asks only for factual information without requesting a replacement.',
    ],
    boundaryNotes: [
      'Use propose-alternative when the learner suggests a new arrangement rather than replacing an item.',
      'Use inquire-specifications when the learner is only seeking information.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: [
      'preferred item unavailable',
      'dietary or practical constraint requires a replacement',
    ],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: [
      '¿Tiene [X] en vez de [Y]?',
      'Est-ce que vous avez [X] au lieu de [Y] ?',
      'Haben Sie [X] statt [Y]?',
      'È possibile avere [X] invece di [Y]?',
      '[X] の代わりに [Y] はありますか？',
    ],
    samplePhrases: [
      '¿Tiene leche de avena?',
      'Est-ce que vous avez des pastilles qui ne font pas dormir ?',
      'Haben Sie Hafermilch?',
      'È possibile averlo senza formaggio o latticini?',
      '眠くならない薬はありますか？',
    ],
    associatedMissions: [
      'mission-es-cafe-sol',
      'mission-es-farmacia-sol',
      'mission-fr-boulangerie',
      'mission-fr-pharmacie',
      'mission-de-baeckerei',
      'mission-de-apotheke',
      'mission-it-farmacia',
      'mission-ja-yakkyoku',
      'mission-es-bike-rental',
      'mission-es-la-terraza',
      'mission-nl-be-koffiebar',
      'mission-nl-be-apotheek',
      'mission-nl-be-terras',
      'mission-nl-be-fietsverhuur',
    ],
  },
  {
    id: 'skill-propose-alternative',
    name: 'Proposing an alternative',
    category: 'Coordination & Negotiation',
    description: 'Suggest a different time, place, arrangement, or option when the default is not suitable.',
    canDo: {
      en: 'I can suggest a different arrangement when the first plan does not work.',
      fr: 'Je peux proposer un autre arrangement lorsque le premier plan ne convient pas.',
      es: 'Puedo proponer otro plan cuando el primero no funciona.',
      nl: 'Ik kan een andere afspraak voorstellen wanneer het eerste plan niet werkt.',
    },
    positiveExamples: [
      'Suggests another time or place in response to a constraint.',
      'Offers a workable alternative rather than only refusing the original plan.',
    ],
    negativeExamples: [
      'Rejects the original plan without suggesting another option.',
      'Requests a substitute item rather than proposing an arrangement.',
    ],
    boundaryNotes: [
      'Use request-substitution for replacing a product or ingredient.',
      'Use make-arrangement when establishing a plan from scratch rather than repairing an existing one.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: [
      'proposed time is unavailable',
      'default seating or meeting place is unsuitable',
    ],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: [
      'Prefiero pasar [tiempo]',
      'Une table pour deux en [zone], s’il vous plaît',
      'Einen Tisch für zwei [Ort], bitte',
      'Avete un tavolo per due [luogo]?',
      '[場所] の席は空いていますか？',
    ],
    samplePhrases: [
      'Prefiero pasar mañana por la mañana.',
      'Une table pour deux en terrasse, s’il vous plaît.',
      'Einen Tisch für zwei Personen draußen im Garten, bitte.',
      'Avete un tavolo per due all’aperto, per favore?',
      '二人ですが、カウンター席は空いていますか？',
    ],
    associatedMissions: [
      'mission-es-parcel-counter',
      'mission-es-neighbors-door',
      'mission-es-la-terraza',
      'mission-fr-bistro',
      'mission-de-gasthaus',
      'mission-it-trattoria',
      'mission-ja-izakaya',
      'mission-es-hotel-checkin',
      'mission-nl-be-pakjespunt',
      'mission-nl-be-buur-sleutel',
      'mission-nl-be-terras',
      'mission-nl-be-hotel',
    ],
  },
  {
    id: 'skill-inquire-specifications',
    name: 'Inquiring about specifications',
    category: 'Clarification & Inquiry',
    description: 'Ask for concrete information about conditions, recommendations, requirements, or details.',
    canDo: {
      en: 'I can ask for the specific information I need before I decide or act.',
      fr: 'Je peux demander les informations précises dont j’ai besoin avant de décider ou d’agir.',
      es: 'Puedo pedir la información concreta que necesito antes de decidir o actuar.',
      nl: 'Ik kan om de specifieke informatie vragen die ik nodig heb voordat ik beslis of handel.',
    },
    positiveExamples: [
      'Asks a concrete question about price, ingredients, dosage, conditions, or requirements.',
      'Requests a recommendation relevant to the current decision.',
    ],
    negativeExamples: [
      'Requests repetition because the previous utterance was not heard.',
      'Checks whether their own interpretation is correct.',
    ],
    boundaryNotes: [
      'Use ask-clarification when the difficulty is the meaning of what was just said.',
      'Use check-understanding when the learner proposes an interpretation and asks for confirmation.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: [
      'missing product or service detail',
      'decision requires a condition, recommendation, or requirement',
    ],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: [
      '¿Qué nos recomienda para [ocasión]?',
      'Qu’est-ce que vous nous recommandez...?',
      'Was können Sie uns heute empfehlen?',
      'Che piatto ci consiglia stasera?',
      '今日のおすすめは何ですか？',
    ],
    samplePhrases: [
      '¿Qué nos recomienda para cenar hoy?',
      'Qu’est-ce que vous nous recommandez comme plat du jour ?',
      'Was können Sie uns heute Abend empfehlen?',
      'Che piatto di pasta ci consiglia stasera?',
      '今日のおすすめの焼き鳥は何ですか？',
    ],
    associatedMissions: [
      'mission-es-la-terraza',
      'mission-fr-bistro',
      'mission-de-gasthaus',
      'mission-it-trattoria',
      'mission-ja-izakaya',
      'mission-es-hotel-checkin',
      'mission-es-bike-rental',
      'mission-es-cafe-sol',
      'mission-es-parcel-counter',
      'mission-es-neighbors-door',
      'mission-es-metro-station',
      'mission-es-farmacia-sol',
      'mission-nl-be-koffiebar',
      'mission-nl-be-pakjespunt',
      'mission-nl-be-buur-sleutel',
      'mission-nl-be-metro',
      'mission-nl-be-apotheek',
      'mission-nl-be-terras',
      'mission-nl-be-hotel',
      'mission-nl-be-fietsverhuur',
    ],
  },
  {
    id: 'skill-wayfinding-transit',
    name: 'Wayfinding and navigating transit',
    category: 'Mobility & Wayfinding',
    description: 'Ask for route, platform, validation, or travel information needed to navigate transit.',
    canDo: {
      en: 'I can ask for the route, platform, or travel information I need to get somewhere.',
      fr: 'Je peux demander l’itinéraire, le quai ou les informations de trajet nécessaires pour arriver quelque part.',
      es: 'Puedo preguntar por la ruta, el andén o la información de viaje que necesito para llegar a un lugar.',
      nl: 'Ik kan naar de route, het perron of de reisinformatie vragen die ik nodig heb om ergens te komen.',
    },
    positiveExamples: [
      'Asks which platform, direction, line, or route reaches the destination.',
      'Clarifies a transit-specific validation or travel-time requirement.',
    ],
    negativeExamples: [
      'Asks a generic specification unrelated to navigation.',
      'Simply names a destination without asking for actionable navigation information.',
    ],
    boundaryNotes: [
      'Use inquire-specifications for non-navigation service details.',
      'Use ask-clarification when repairing understanding of a previous utterance.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: [
      'route or platform not yet known',
      'ticket validation or transit condition needs clarification',
    ],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: [
      '¿Por qué andén sale...?',
      'Quelle direction dois-je prendre...?',
      'Von welchem Gleis fährt...?',
      'Da quale binario parte il treno?',
      '[場所] に行くには、何番線ですか？',
    ],
    samplePhrases: [
      '¿Por qué andén sale el metro hacia Atocha?',
      'Quelle direction dois-je prendre pour aller à Montparnasse ?',
      'Von welchem Gleis fährt die U-Bahn zum Alexanderplatz?',
      'Da quale binario parte il treno?',
      '東京駅に行くには、何番線ですか？',
    ],
    associatedMissions: [
      'mission-es-metro-station',
      'mission-fr-kiosque',
      'mission-de-ubahn',
      'mission-it-stazione',
      'mission-ja-eki',
      'mission-nl-be-metro',
    ],
  },
  {
    id: 'skill-communicative-repair',
    name: 'Communicative repair',
    category: 'Repair',
    description: 'Derived family for specific strategies used to repair a communication breakdown.',
    canDo: {
      en: 'I can repair a conversation when communication breaks down.',
      fr: 'Je peux réparer la conversation lorsqu’un problème de communication survient.',
      es: 'Puedo reparar la conversación cuando surge un problema de comunicación.',
      nl: 'Ik kan een gesprek herstellen wanneer de communicatie misloopt.',
    },
    positiveExamples: [
      'A specific child repair skill is demonstrated in a validated opportunity.',
    ],
    negativeExamples: [
      'Generic success in a difficult scene without a specific repair act.',
    ],
    boundaryNotes: [
      'This is a derived family and is never directly evidenced.',
      'Credit exactly one most-specific repair child for one communicative act.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: ['derived from validated child repair observations'],
    evidencePolicy: 'derived',
    deprecated: null,
    patterns: [],
    samplePhrases: [],
    associatedMissions: [
      'mission-es-metro-station',
      'mission-es-neighbors-door',
      'mission-fr-kiosque',
      'mission-de-ubahn',
      'mission-it-stazione',
      'mission-ja-izakaya',
      'mission-es-cafe-sol',
      'mission-es-parcel-counter',
      'mission-es-hotel-checkin',
      'mission-es-bike-rental',
      'mission-nl-be-koffiebar',
      'mission-nl-be-pakjespunt',
      'mission-nl-be-buur-sleutel',
      'mission-nl-be-metro',
      'mission-nl-be-hotel',
      'mission-nl-be-fietsverhuur',
    ],
  },
  {
    id: 'skill-request-repetition',
    parentSkillId: 'skill-communicative-repair',
    name: 'Request repetition',
    category: 'Repair',
    description: 'Ask the other person to repeat an utterance that was not heard or caught.',
    canDo: {
      en: 'I can ask someone to repeat what they said.',
      fr: 'Je peux demander à quelqu’un de répéter ce qu’il a dit.',
      es: 'Puedo pedirle a alguien que repita lo que dijo.',
      nl: 'Ik kan iemand vragen te herhalen wat die heeft gezegd.',
    },
    positiveExamples: ['Asks the speaker to say the previous utterance again.'],
    negativeExamples: ['Asks what a word means rather than requesting repetition.'],
    boundaryNotes: ['Use request-slower-speech when the request is specifically about speed.'],
    modality: 'interaction',
    typicalOpportunityPatterns: ['missed or unheard character utterance'],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: ['Could you say that again?'],
    samplePhrases: ['Could you say that again?', '¿Puede repetirlo?', 'Kunt u dat herhalen?'],
    associatedMissions: [
      'mission-es-cafe-sol',
      'mission-es-parcel-counter',
      'mission-es-metro-station',
      'mission-es-hotel-checkin',
      'mission-nl-be-koffiebar',
      'mission-nl-be-pakjespunt',
      'mission-nl-be-metro',
      'mission-nl-be-hotel',
    ],
  },
  {
    id: 'skill-request-slower-speech',
    parentSkillId: 'skill-communicative-repair',
    name: 'Request slower speech',
    category: 'Repair',
    description: 'Ask the other person to speak more slowly so the conversation can continue.',
    canDo: {
      en: 'I can ask someone to speak more slowly.',
      fr: 'Je peux demander à quelqu’un de parler plus lentement.',
      es: 'Puedo pedirle a alguien que hable más despacio.',
      nl: 'Ik kan iemand vragen langzamer te spreken.',
    },
    positiveExamples: ['Explicitly asks the speaker to slow down.'],
    negativeExamples: ['Requests simple repetition without asking for a slower pace.'],
    boundaryNotes: ['Use request-repetition when speed is not part of the request.'],
    modality: 'interaction',
    typicalOpportunityPatterns: ['fast character delivery causes a comprehension breakdown'],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: ['Could you speak more slowly?'],
    samplePhrases: ['Could you speak more slowly?', '¿Puede hablar más despacio?', 'Kunt u wat langzamer spreken?'],
    associatedMissions: ['mission-es-cafe-sol'],
  },
  {
    id: 'skill-ask-clarification',
    parentSkillId: 'skill-communicative-repair',
    name: 'Ask for clarification',
    category: 'Repair',
    description: 'Ask what an unclear word, statement, condition, or intention means.',
    canDo: {
      en: 'I can ask for clarification when I do not understand what someone means.',
      fr: 'Je peux demander une clarification lorsque je ne comprends pas ce que quelqu’un veut dire.',
      es: 'Puedo pedir una aclaración cuando no entiendo lo que alguien quiere decir.',
      nl: 'Ik kan om verduidelijking vragen wanneer ik niet begrijp wat iemand bedoelt.',
    },
    positiveExamples: ['Identifies the unclear point and asks the speaker to explain it.'],
    negativeExamples: ['Requests verbatim repetition without asking for clarification.'],
    boundaryNotes: [
      'Use inquire-specifications when seeking new factual information rather than repairing meaning.',
      'Use check-understanding when the learner offers an interpretation for confirmation.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: ['ambiguous term, condition, or instruction in the character turn'],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: ['What do you mean by [X]?'],
    samplePhrases: ['What do you mean by that?', '¿Qué quiere decir con eso?', 'Wat bedoelt u daarmee?'],
    associatedMissions: [
      'mission-es-cafe-sol',
      'mission-es-parcel-counter',
      'mission-es-metro-station',
      'mission-es-bike-rental',
      'mission-nl-be-koffiebar',
      'mission-nl-be-pakjespunt',
      'mission-nl-be-metro',
      'mission-nl-be-fietsverhuur',
    ],
  },
  {
    id: 'skill-check-understanding',
    parentSkillId: 'skill-communicative-repair',
    name: 'Check understanding',
    category: 'Repair',
    description: 'State an interpretation and ask the other person to confirm whether it is correct.',
    canDo: {
      en: 'I can check that I understood someone correctly.',
      fr: 'Je peux vérifier que j’ai bien compris quelqu’un.',
      es: 'Puedo comprobar que entendí correctamente a alguien.',
      nl: 'Ik kan controleren of ik iemand goed begrepen heb.',
    },
    positiveExamples: ['Paraphrases the understood meaning and asks for confirmation.'],
    negativeExamples: ['Asks an open clarification question without proposing an interpretation.'],
    boundaryNotes: ['Use ask-clarification when no interpretation is proposed.'],
    modality: 'interaction',
    typicalOpportunityPatterns: ['instruction or condition where confirmation prevents a mistake'],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: ['So you mean [X], right?'],
    samplePhrases: ['So you mean tomorrow morning, right?', 'Dus u bedoelt morgen ochtend, toch?'],
    associatedMissions: [
      'mission-es-cafe-sol',
      'mission-es-neighbors-door',
      'mission-es-metro-station',
      'mission-es-hotel-checkin',
      'mission-es-bike-rental',
      'mission-nl-be-koffiebar',
      'mission-nl-be-buur-sleutel',
      'mission-nl-be-metro',
      'mission-nl-be-hotel',
      'mission-nl-be-fietsverhuur',
    ],
  },
  {
    id: 'skill-clarify-misunderstanding',
    parentSkillId: 'skill-communicative-repair',
    name: 'Clarify a misunderstanding',
    category: 'Repair',
    description: 'Correct the other person when they have misunderstood the learner’s intention or information.',
    canDo: {
      en: 'I can correct a misunderstanding and make my intended meaning clear.',
      fr: 'Je peux corriger un malentendu et préciser ce que je voulais dire.',
      es: 'Puedo corregir un malentendido y dejar claro lo que quería decir.',
      nl: 'Ik kan een misverstand rechtzetten en duidelijk maken wat ik bedoelde.',
    },
    positiveExamples: ['Explicitly corrects the mistaken interpretation and restates the intended meaning.'],
    negativeExamples: ['Simply repeats the same wording without addressing the misunderstanding.'],
    boundaryNotes: ['Use paraphrase-when-stuck when the learner changes wording because expression is difficult, not because the listener misunderstood.'],
    modality: 'interaction',
    typicalOpportunityPatterns: ['character acts on an incorrect interpretation of learner intent'],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: ['No, I meant [X].'],
    samplePhrases: ['No, I meant tomorrow, not today.', 'Nee, ik bedoelde morgen, niet vandaag.'],
    associatedMissions: [
      'mission-es-cafe-sol',
      'mission-es-neighbors-door',
      'mission-nl-be-buur-sleutel',
    ],
  },
  {
    id: 'skill-paraphrase-when-stuck',
    parentSkillId: 'skill-communicative-repair',
    name: 'Paraphrase when stuck',
    category: 'Repair',
    description: 'Re-express an idea using different words when the preferred wording is unavailable.',
    canDo: {
      en: 'I can explain the same idea another way when I cannot find the word I want.',
      fr: 'Je peux exprimer la même idée autrement lorsque je ne trouve pas le mot voulu.',
      es: 'Puedo expresar la misma idea de otra manera cuando no encuentro la palabra que quiero.',
      nl: 'Ik kan hetzelfde idee anders uitleggen wanneer ik het juiste woord niet vind.',
    },
    positiveExamples: ['Uses a description, synonym, or simpler construction to preserve the intended meaning.'],
    negativeExamples: ['Abandons the communicative goal or switches topics.'],
    boundaryNotes: ['Use clarify-misunderstanding when the trigger is the listener’s incorrect interpretation.'],
    modality: 'production',
    typicalOpportunityPatterns: ['target word unavailable but communicative goal remains achievable'],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: ['It is the thing you use for [purpose].'],
    samplePhrases: ['It is the thing you use to open the door.'],
    associatedMissions: ['mission-es-cafe-sol'],
  },
  {
    id: 'skill-give-opinion-with-reason',
    name: 'Give an opinion with a reason',
    category: 'Ideas & Discussion',
    description: 'State a viewpoint and support it with at least one relevant reason.',
    canDo: {
      en: 'I can give my opinion and explain why I think that.',
      fr: 'Je peux donner mon avis et expliquer pourquoi je pense ainsi.',
      es: 'Puedo dar mi opinión y explicar por qué pienso así.',
      nl: 'Ik kan mijn mening geven en uitleggen waarom ik dat vind.',
    },
    positiveExamples: ['States a position and gives a connected reason.'],
    negativeExamples: ['States only a preference without explaining why.'],
    boundaryNotes: ['Use compare-options when the core act is weighing two or more alternatives.'],
    modality: 'production',
    typicalOpportunityPatterns: ['character asks for a view, preference, or recommendation with justification'],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: ['I think [X] because [Y].'],
    samplePhrases: ['I think this option is better because it is more flexible.'],
    associatedMissions: [],
  },
  {
    id: 'skill-compare-options',
    name: 'Compare options',
    category: 'Ideas & Discussion',
    description: 'Compare two or more alternatives using relevant similarities, differences, or trade-offs.',
    canDo: {
      en: 'I can compare options and explain an important difference between them.',
      fr: 'Je peux comparer des options et expliquer une différence importante entre elles.',
      es: 'Puedo comparar opciones y explicar una diferencia importante entre ellas.',
      nl: 'Ik kan opties vergelijken en een belangrijk verschil tussen hen uitleggen.',
    },
    positiveExamples: ['Contrasts at least two options on a relevant dimension.'],
    negativeExamples: ['Describes only one option without comparison.'],
    boundaryNotes: ['Use give-opinion-with-reason when the main act is defending one viewpoint rather than comparing alternatives.'],
    modality: 'production',
    typicalOpportunityPatterns: ['choice between alternatives with different costs, benefits, or conditions'],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: ['[X] is more [quality] than [Y], but [Y]...'],
    samplePhrases: ['The first option is cheaper, but the second is more flexible.'],
    associatedMissions: [],
  },
  {
    id: 'skill-make-arrangement',
    name: 'Make an arrangement',
    category: 'Coordination & Negotiation',
    description: 'Establish a time, place, or next action that both participants can act on.',
    canDo: {
      en: 'I can make a clear arrangement about when, where, or what happens next.',
      fr: 'Je peux convenir clairement du moment, du lieu ou de la prochaine étape.',
      es: 'Puedo acordar claramente cuándo, dónde o qué sucede después.',
      nl: 'Ik kan duidelijke afspraken maken over wanneer, waar of wat er daarna gebeurt.',
    },
    positiveExamples: ['Proposes or confirms actionable time/place details and reaches an arrangement.'],
    negativeExamples: ['Mentions availability without establishing an agreed next step.'],
    boundaryNotes: ['Use propose-alternative when repairing an already proposed arrangement.'],
    modality: 'interaction',
    typicalOpportunityPatterns: ['participants need to agree a meeting, handover, call, or next action'],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: ['Shall we meet at [place] at [time]?'],
    samplePhrases: ['Shall we meet downstairs tomorrow at ten?'],
    associatedMissions: [],
  },
  {
    id: 'skill-narrate-past-event',
    name: 'Narrate a past event',
    category: 'Ideas & Discussion',
    description: 'Relate a past event in an understandable sequence with enough context to follow what happened.',
    canDo: {
      en: 'I can describe what happened in the past in a clear sequence.',
      fr: 'Je peux raconter clairement ce qui s’est passé dans le passé.',
      es: 'Puedo contar claramente lo que pasó en el pasado.',
      nl: 'Ik kan in een duidelijke volgorde vertellen wat er in het verleden is gebeurd.',
    },
    positiveExamples: ['Gives a sequence of past actions or events with enough context to understand the outcome.'],
    negativeExamples: ['Lists disconnected facts without a temporal relationship.'],
    boundaryNotes: ['Use explain-an-idea skills when the learner is reasoning about a concept rather than recounting an event.'],
    modality: 'production',
    typicalOpportunityPatterns: ['interviewer or character asks what happened in a previous experience'],
    evidencePolicy: 'direct',
    deprecated: null,
    patterns: ['First [past event], then [past event], and finally [outcome].'],
    samplePhrases: ['First I spoke to the customer, then I checked the order, and finally we solved the problem.'],
    associatedMissions: [],
  },
] as const;

const SKILL_BY_ID = new Map<CommunicativeSkillId, CommunicativeSkillDefinition>(
  COMMUNICATIVE_SKILLS_CATALOG.map(skill => [skill.id, skill])
);

export function communicativeSkillFor(
  skillId: CommunicativeSkillId
): CommunicativeSkillDefinition | undefined {
  return SKILL_BY_ID.get(skillId);
}

export function isKnownCommunicativeSkill(skillId: CommunicativeSkillId): boolean {
  return SKILL_BY_ID.has(skillId);
}

export function isDirectlyEvidencedSkill(skillId: CommunicativeSkillId): boolean {
  const skill = communicativeSkillFor(skillId);
  return Boolean(skill && skill.evidencePolicy === 'direct' && skill.deprecated === null);
}

/**
 * Whether the skill currently has reviewed mission content behind it.
 *
 * The canonical catalog may contain future direct skills before launch content is
 * authored. Progress/discovery should not expose empty skills merely because the
 * stable id already exists.
 */
export function isLaunchVisibleCommunicativeSkill(
  skillId: CommunicativeSkillId
): boolean {
  const skill = communicativeSkillFor(skillId);
  return Boolean(skill && skill.deprecated === null && skill.associatedMissions.length > 0);
}

export function isAncestorSkill(
  possibleAncestorId: CommunicativeSkillId,
  possibleDescendantId: CommunicativeSkillId
): boolean {
  if (possibleAncestorId === possibleDescendantId) return false;

  const visited = new Set<CommunicativeSkillId>();
  let current = communicativeSkillFor(possibleDescendantId);

  while (current?.parentSkillId) {
    if (visited.has(current.id)) return false;
    visited.add(current.id);
    if (current.parentSkillId === possibleAncestorId) return true;
    current = communicativeSkillFor(current.parentSkillId);
  }

  return false;
}

/**
 * Removes any proposed ancestor when a descendant is present.
 *
 * This is content-hierarchy logic only. The evidence validator additionally
 * scopes it to the same communicative act so unrelated acts in one passage may
 * still evidence different skills.
 */
export function mostSpecificSkillIds(
  skillIds: readonly CommunicativeSkillId[]
): CommunicativeSkillId[] {
  const unique = [...new Set(skillIds)].filter(isKnownCommunicativeSkill);
  return unique.filter(
    skillId => !unique.some(other => isAncestorSkill(skillId, other))
  );
}
