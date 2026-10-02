import {
  CommunicativeSkillId,
  UiLanguage,
} from '../types';

export type PracticeSkillId =
  | 'practice-start-conversation'
  | 'practice-keep-it-going'
  | 'practice-explain-idea'
  | 'practice-ask-clarification'
  | 'practice-handle-difficult-moment'
  | 'practice-speak-for-purpose';

export type SkillModality = 'production' | 'comprehension' | 'interaction';
export type SkillEvidenceMode = 'direct' | 'derived';
export type SkillLifecycleStatus = 'active' | 'deprecated';

export interface PracticeSkillDefinition {
  id: PracticeSkillId;
  labels: Record<UiLanguage, string>;
  description: string;
}

export interface CommunicativeSkillDefinition {
  /** Stable content identity. Never reuse a retired id for a different skill. */
  id: CommunicativeSkillId;
  name: string;
  category: string;
  description: string;

  /** Discovery/pedagogy groupings only. PracticeSkill carries no learner status. */
  practiceSkillIds: PracticeSkillId[];

  /** Learner-facing can-do text by supported UI language. */
  canDo: Record<UiLanguage, string>;

  /** Used by reviewers and bounded assessment prompts. */
  positiveExamples: string[];
  negativeExamples: string[];
  boundaryNotes: string[];

  modality: SkillModality;
  typicalOpportunityPatterns: string[];

  /**
   * Direct skills may receive observations.
   * Derived skills are families only and can never be directly evidenced.
   */
  evidenceMode: SkillEvidenceMode;
  parentSkillId?: CommunicativeSkillId;
  childSkillIds?: CommunicativeSkillId[];

  lifecycle: {
    status: SkillLifecycleStatus;
    successorSkillId?: CommunicativeSkillId;
  };

  /**
   * Legacy matching fields retained while old archives are migrated.
   * They are not the authority for new explicit skill evidence.
   */
  patterns: string[];
  samplePhrases: string[];
  associatedMissions: string[];
}

export const PRACTICE_SKILLS_CATALOG: PracticeSkillDefinition[] = [
  {
    id: 'practice-start-conversation',
    labels: {
      en: 'Start a conversation',
      fr: 'Commencer une conversation',
      es: 'Iniciar una conversación',
      nl: 'Een gesprek beginnen',
    },
    description: 'Open an interaction naturally and establish the immediate purpose.',
  },
  {
    id: 'practice-keep-it-going',
    labels: {
      en: 'Keep it going',
      fr: 'Faire avancer la conversation',
      es: 'Mantener la conversación',
      nl: 'Het gesprek gaande houden',
    },
    description: 'Sustain an interaction with relevant responses, follow-ups and turn-taking.',
  },
  {
    id: 'practice-explain-idea',
    labels: {
      en: 'Explain an idea',
      fr: 'Expliquer une idée',
      es: 'Explicar una idea',
      nl: 'Een idee uitleggen',
    },
    description: 'Express, compare or explain information clearly enough for the situation.',
  },
  {
    id: 'practice-ask-clarification',
    labels: {
      en: 'Ask for clarification',
      fr: 'Demander une clarification',
      es: 'Pedir una aclaración',
      nl: 'Om verduidelijking vragen',
    },
    description: 'Repair understanding when something is unclear, missed or misunderstood.',
  },
  {
    id: 'practice-handle-difficult-moment',
    labels: {
      en: 'Handle a difficult moment',
      fr: 'Gérer un moment difficile',
      es: 'Manejar un momento difícil',
      nl: 'Een moeilijk moment aanpakken',
    },
    description: 'Recover, negotiate or keep communicating when the interaction becomes harder.',
  },
  {
    id: 'practice-speak-for-purpose',
    labels: {
      en: 'Speak for a purpose',
      fr: 'Parler avec un objectif',
      es: 'Hablar con un objetivo',
      nl: 'Spreken met een doel',
    },
    description: 'Use language to accomplish a concrete real-world goal.',
  },
];

const repairChildren: CommunicativeSkillId[] = [
  'skill-request-repetition',
  'skill-request-slower-speech',
  'skill-ask-clarification',
  'skill-check-understanding',
  'skill-clarify-misunderstanding',
  'skill-paraphrase-when-stuck',
];

export const COMMUNICATIVE_SKILLS_CATALOG: CommunicativeSkillDefinition[] = [
  {
    id: 'skill-request-substitution',
    name: 'Requesting a Substitution & Dietary Needs',
    category: 'Transaction & Service',
    description:
      'Politely inquire whether an alternative option, ingredient replacement, or dietary adaptation is available.',
    practiceSkillIds: ['practice-speak-for-purpose', 'practice-handle-difficult-moment'],
    canDo: {
      en: 'I can ask for an alternative when the first option does not work for me.',
      fr: 'Je peux demander une autre option lorsque la première ne me convient pas.',
      es: 'Puedo pedir una alternativa cuando la primera opción no me conviene.',
      nl: 'Ik kan om een alternatief vragen wanneer de eerste optie niet voor mij werkt.',
    },
    positiveExamples: [
      'Asks for a viable replacement after learning the preferred option is unavailable.',
      'States a relevant dietary or service constraint and asks for an alternative.',
    ],
    negativeExamples: [
      'Repeats the unavailable option without adapting.',
      'Asks a generic question without requesting an alternative.',
    ],
    boundaryNotes: [
      'Use skill-propose-alternative when the learner proposes a new arrangement rather than requesting a replacement from the other person.',
      'Use skill-inquire-specifications when the learner is only gathering information.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: [
      'preferred option unavailable',
      'dietary or product constraint discovered',
      'service option must be changed',
    ],
    evidenceMode: 'direct',
    lifecycle: { status: 'active' },
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
    ],
  },
  {
    id: 'skill-propose-alternative',
    name: 'Proposing Alternative Arrangements & Seating',
    category: 'Coordination & Negotiation',
    description:
      'Suggest an alternative time, meeting slot, place or arrangement when the default does not work.',
    practiceSkillIds: ['practice-speak-for-purpose', 'practice-handle-difficult-moment'],
    canDo: {
      en: 'I can suggest another time, place or arrangement.',
      fr: 'Je peux proposer un autre moment, lieu ou arrangement.',
      es: 'Puedo proponer otra hora, lugar o arreglo.',
      nl: 'Ik kan een ander tijdstip, een andere plaats of regeling voorstellen.',
    },
    positiveExamples: [
      'Proposes a concrete alternative time after rejecting the original time.',
      'Suggests another meeting place or arrangement that can be accepted or negotiated.',
    ],
    negativeExamples: [
      'Only rejects the original option without proposing another one.',
      'Requests that the other person provide an alternative instead.',
    ],
    boundaryNotes: [
      'Use skill-request-substitution when the learner asks the other person to supply a replacement option.',
      'Use skill-make-arrangement when the main act is jointly fixing logistics rather than repairing an unavailable option.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: [
      'original time unavailable',
      'meeting place must change',
      'default seating or arrangement is unsuitable',
    ],
    evidenceMode: 'direct',
    lifecycle: { status: 'active' },
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
    ],
  },
  {
    id: 'skill-inquire-specifications',
    name: 'Inquiring About Specifications & Recommendations',
    category: 'Clarification & Inquiry',
    description:
      'Ask for concrete specifications, conditions or recommendations before deciding or acting.',
    practiceSkillIds: ['practice-ask-clarification', 'practice-speak-for-purpose'],
    canDo: {
      en: 'I can ask for the details I need before I decide.',
      fr: 'Je peux demander les détails dont j’ai besoin avant de décider.',
      es: 'Puedo pedir los detalles que necesito antes de decidir.',
      nl: 'Ik kan de details vragen die ik nodig heb voordat ik beslis.',
    },
    positiveExamples: [
      'Asks a concrete follow-up about ingredients, conditions, price, dosage or recommendations.',
      'Narrows a broad choice by requesting a relevant specification.',
    ],
    negativeExamples: [
      'Makes a generic comment that does not seek information.',
      'Asks for repetition because the previous utterance was not heard.',
    ],
    boundaryNotes: [
      'Use skill-ask-clarification when the issue is understanding what the other person meant.',
      'Use skill-wayfinding-transit for route/platform/navigation questions in transit contexts.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: [
      'decision needs one missing detail',
      'product or service conditions are unknown',
      'learner requests a recommendation',
    ],
    evidenceMode: 'direct',
    lifecycle: { status: 'active' },
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
    ],
  },
  {
    id: 'skill-wayfinding-transit',
    name: 'Wayfinding & Navigating Transit',
    category: 'Mobility & Wayfinding',
    description:
      'Ask for directions, platforms, ticket conditions or travel duration on public transit networks.',
    practiceSkillIds: ['practice-speak-for-purpose', 'practice-ask-clarification'],
    canDo: {
      en: 'I can ask for the route, platform or transit detail I need.',
      fr: 'Je peux demander l’itinéraire, le quai ou l’information de transport dont j’ai besoin.',
      es: 'Puedo preguntar por la ruta, el andén o el dato de transporte que necesito.',
      nl: 'Ik kan vragen naar de route, het perron of de vervoersinformatie die ik nodig heb.',
    },
    positiveExamples: [
      'Asks which platform, line or direction reaches the intended destination.',
      'Checks a transit-specific ticket or validation condition.',
    ],
    negativeExamples: [
      'Asks a non-transit product specification question.',
      'Only states the destination without asking for navigation help.',
    ],
    boundaryNotes: [
      'Use skill-inquire-specifications for non-wayfinding service details.',
      'A clarification request about a misunderstood direction belongs to the relevant repair child skill.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: [
      'platform or line unknown',
      'route direction uncertain',
      'ticket validation or travel duration must be clarified',
    ],
    evidenceMode: 'direct',
    lifecycle: { status: 'active' },
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
    ],
  },
  {
    id: 'skill-communicative-repair',
    name: 'Communicative Repair',
    category: 'Repair & Clarification',
    description:
      'Derived family for recovering when understanding or expression breaks down. It is never directly evidenced.',
    practiceSkillIds: ['practice-ask-clarification', 'practice-handle-difficult-moment'],
    canDo: {
      en: 'I can repair a conversation when understanding or expression breaks down.',
      fr: 'Je peux réparer la conversation lorsqu’un problème de compréhension ou d’expression apparaît.',
      es: 'Puedo reparar la conversación cuando falla la comprensión o la expresión.',
      nl: 'Ik kan een gesprek herstellen wanneer begrip of formulering vastloopt.',
    },
    positiveExamples: [
      'Uses one of the specific repair strategies represented by this family’s child skills.',
    ],
    negativeExamples: [
      'A generic service question with no communication breakdown.',
    ],
    boundaryNotes: [
      'This is a roll-up family only. Persist evidence on the most-specific child skill.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: [
      'learner did not hear',
      'learner did not understand',
      'learner suspects misunderstanding',
      'learner cannot retrieve the intended wording',
    ],
    evidenceMode: 'derived',
    childSkillIds: repairChildren,
    lifecycle: { status: 'active' },
    patterns: [],
    samplePhrases: [],
    associatedMissions: [
      'mission-es-metro-station',
      'mission-es-neighbors-door',
      'mission-fr-kiosque',
      'mission-de-ubahn',
      'mission-it-stazione',
      'mission-ja-izakaya',
    ],
  },
  {
    id: 'skill-request-repetition',
    name: 'Request Repetition',
    category: 'Repair & Clarification',
    description: 'Ask the other person to repeat an utterance that was not heard or captured.',
    practiceSkillIds: ['practice-ask-clarification', 'practice-handle-difficult-moment'],
    canDo: {
      en: 'I can ask someone to repeat what they said.',
      fr: 'Je peux demander à quelqu’un de répéter ce qu’il a dit.',
      es: 'Puedo pedirle a alguien que repita lo que ha dicho.',
      nl: 'Ik kan iemand vragen te herhalen wat die zei.',
    },
    positiveExamples: [
      'Explicitly asks the speaker to say the previous utterance again.',
      'Politely signals that the previous turn was not heard and requests repetition.',
    ],
    negativeExamples: [
      'Asks what a word means.',
      'Asks the speaker to talk more slowly without asking for repetition.',
    ],
    boundaryNotes: [
      'Use skill-request-slower-speech when speed, not audibility, is the problem.',
      'Use skill-ask-clarification when the words were heard but the meaning is unclear.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: ['missed utterance', 'inaudible detail', 'one-shot information was not heard'],
    evidenceMode: 'direct',
    parentSkillId: 'skill-communicative-repair',
    lifecycle: { status: 'active' },
    patterns: [],
    samplePhrases: ['Could you repeat that?', 'Sorry, could you say that again?'],
    associatedMissions: [],
  },
  {
    id: 'skill-request-slower-speech',
    name: 'Request Slower Speech',
    category: 'Repair & Clarification',
    description: 'Ask the other person to reduce speaking speed so the interaction can continue.',
    practiceSkillIds: ['practice-ask-clarification', 'practice-handle-difficult-moment'],
    canDo: {
      en: 'I can ask someone to speak more slowly.',
      fr: 'Je peux demander à quelqu’un de parler plus lentement.',
      es: 'Puedo pedirle a alguien que hable más despacio.',
      nl: 'Ik kan iemand vragen langzamer te spreken.',
    },
    positiveExamples: [
      'Explicitly asks for slower speech after a fast turn.',
    ],
    negativeExamples: [
      'Asks for the whole utterance to be repeated without mentioning speed.',
      'Uses the app’s slow-audio control instead of communicating with the character.',
    ],
    boundaryNotes: [
      'This requires a learner communicative act; tapping an accessibility or playback control is not evidence.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: ['character speaks quickly', 'speed makes continued interaction difficult'],
    evidenceMode: 'direct',
    parentSkillId: 'skill-communicative-repair',
    lifecycle: { status: 'active' },
    patterns: [],
    samplePhrases: ['Could you speak a little more slowly?'],
    associatedMissions: [],
  },
  {
    id: 'skill-ask-clarification',
    name: 'Ask for Clarification',
    category: 'Repair & Clarification',
    description: 'Ask what an unclear statement, term or instruction means.',
    practiceSkillIds: ['practice-ask-clarification', 'practice-keep-it-going'],
    canDo: {
      en: 'I can ask for clarification when I heard the words but do not understand the meaning.',
      fr: 'Je peux demander une clarification lorsque j’ai entendu les mots mais pas compris le sens.',
      es: 'Puedo pedir una aclaración cuando oí las palabras pero no entendí el significado.',
      nl: 'Ik kan om verduidelijking vragen wanneer ik de woorden hoorde maar de betekenis niet begrijp.',
    },
    positiveExamples: [
      'Asks what a specific statement, instruction or term means.',
      'Requests a clearer explanation of an ambiguous message.',
    ],
    negativeExamples: [
      'Asks the speaker only to repeat the same words.',
      'Checks whether the learner’s own interpretation is correct.',
    ],
    boundaryNotes: [
      'Use skill-check-understanding when the learner states an interpretation and asks whether it is correct.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: ['ambiguous instruction', 'unknown term', 'meaning remains unclear after hearing the turn'],
    evidenceMode: 'direct',
    parentSkillId: 'skill-communicative-repair',
    lifecycle: { status: 'active' },
    patterns: [],
    samplePhrases: ['What do you mean by that?', 'Could you explain what that means?'],
    associatedMissions: [],
  },
  {
    id: 'skill-check-understanding',
    name: 'Check Understanding',
    category: 'Repair & Clarification',
    description: 'State an interpretation and ask the other person to confirm or correct it.',
    practiceSkillIds: ['practice-ask-clarification', 'practice-keep-it-going'],
    canDo: {
      en: 'I can check that I understood someone correctly.',
      fr: 'Je peux vérifier que j’ai bien compris quelqu’un.',
      es: 'Puedo comprobar que entendí correctamente a alguien.',
      nl: 'Ik kan controleren of ik iemand goed heb begrepen.',
    },
    positiveExamples: [
      'Paraphrases the understood meaning and asks for confirmation.',
    ],
    negativeExamples: [
      'Asks only for repetition.',
      'Asks a new factual question unrelated to the previous turn.',
    ],
    boundaryNotes: [
      'This is about confirming the learner’s interpretation of the other person’s message.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: ['important instruction', 'ambiguous logistics', 'consequence depends on correct interpretation'],
    evidenceMode: 'direct',
    parentSkillId: 'skill-communicative-repair',
    lifecycle: { status: 'active' },
    patterns: [],
    samplePhrases: ['So you mean I should come back tomorrow, right?'],
    associatedMissions: [],
  },
  {
    id: 'skill-clarify-misunderstanding',
    name: 'Clarify a Misunderstanding',
    category: 'Repair & Clarification',
    description: 'Correct the other person when they misunderstood the learner’s meaning or intention.',
    practiceSkillIds: ['practice-handle-difficult-moment', 'practice-keep-it-going'],
    canDo: {
      en: 'I can correct a misunderstanding about what I meant.',
      fr: 'Je peux corriger un malentendu sur ce que je voulais dire.',
      es: 'Puedo corregir un malentendido sobre lo que quise decir.',
      nl: 'Ik kan een misverstand over wat ik bedoelde rechtzetten.',
    },
    positiveExamples: [
      'Explicitly corrects the other person’s mistaken interpretation and restates the intended meaning.',
    ],
    negativeExamples: [
      'Simply repeats the same wording after the other person misunderstood.',
      'Changes topic without resolving the misunderstanding.',
    ],
    boundaryNotes: [
      'Use skill-paraphrase-when-stuck when the learner changes wording because they cannot retrieve or make the original wording work.',
    ],
    modality: 'interaction',
    typicalOpportunityPatterns: ['character deliberately misinterprets detail', 'wrong item or time is inferred'],
    evidenceMode: 'direct',
    parentSkillId: 'skill-communicative-repair',
    lifecycle: { status: 'active' },
    patterns: [],
    samplePhrases: ['No, I meant tomorrow morning, not this evening.'],
    associatedMissions: [],
  },
  {
    id: 'skill-paraphrase-when-stuck',
    name: 'Paraphrase When Stuck',
    category: 'Repair & Clarification',
    description: 'Keep communicating by reformulating an idea when the intended word or expression is unavailable.',
    practiceSkillIds: ['practice-explain-idea', 'practice-handle-difficult-moment'],
    canDo: {
      en: 'I can explain an idea another way when I cannot find the exact word.',
      fr: 'Je peux expliquer une idée autrement lorsque je ne trouve pas le mot exact.',
      es: 'Puedo explicar una idea de otra manera cuando no encuentro la palabra exacta.',
      nl: 'Ik kan een idee op een andere manier uitleggen wanneer ik het juiste woord niet vind.',
    },
    positiveExamples: [
      'Uses a description, synonym or reformulation to keep the interaction moving.',
    ],
    negativeExamples: [
      'Stops speaking and waits for the answer.',
      'Repeats the same failed form without reformulating.',
    ],
    boundaryNotes: [
      'This concerns the learner repairing their own expression, not asking the other person to clarify.',
    ],
    modality: 'production',
    typicalOpportunityPatterns: ['target word unavailable', 'first formulation fails', 'character indicates non-understanding'],
    evidenceMode: 'direct',
    parentSkillId: 'skill-communicative-repair',
    lifecycle: { status: 'active' },
    patterns: [],
    samplePhrases: ['It is the thing you use to…', 'I mean… another way to say it is…'],
    associatedMissions: [],
  },
  {
    id: 'skill-give-opinion-with-reason',
    name: 'Give an Opinion with a Reason',
    category: 'Explanation & Argument',
    description: 'State a preference or opinion and support it with at least one relevant reason.',
    practiceSkillIds: ['practice-explain-idea', 'practice-speak-for-purpose'],
    canDo: {
      en: 'I can give my opinion and explain why.',
      fr: 'Je peux donner mon avis et expliquer pourquoi.',
      es: 'Puedo dar mi opinión y explicar por qué.',
      nl: 'Ik kan mijn mening geven en uitleggen waarom.',
    },
    positiveExamples: ['States an opinion and supplies a relevant reason.'],
    negativeExamples: ['States only a preference with no reason.'],
    boundaryNotes: ['A factual explanation with no opinion belongs to a different explanatory skill.'],
    modality: 'production',
    typicalOpportunityPatterns: ['preference question', 'decision discussion', 'opinion prompt'],
    evidenceMode: 'direct',
    lifecycle: { status: 'active' },
    patterns: [],
    samplePhrases: ['I prefer this option because it is more flexible.'],
    associatedMissions: [],
  },
  {
    id: 'skill-compare-options',
    name: 'Compare Options',
    category: 'Explanation & Decision',
    description: 'Compare two or more options using relevant similarities, differences or trade-offs.',
    practiceSkillIds: ['practice-explain-idea', 'practice-speak-for-purpose'],
    canDo: {
      en: 'I can compare options and explain an important difference.',
      fr: 'Je peux comparer des options et expliquer une différence importante.',
      es: 'Puedo comparar opciones y explicar una diferencia importante.',
      nl: 'Ik kan opties vergelijken en een belangrijk verschil uitleggen.',
    },
    positiveExamples: ['Contrasts at least two available options on a relevant dimension.'],
    negativeExamples: ['Describes one option without comparing it to another.'],
    boundaryNotes: ['Use skill-give-opinion-with-reason when the main act is choosing and justifying a preference.'],
    modality: 'production',
    typicalOpportunityPatterns: ['two offers presented', 'choice between alternatives', 'trade-off discussion'],
    evidenceMode: 'direct',
    lifecycle: { status: 'active' },
    patterns: [],
    samplePhrases: ['This one is cheaper, but the other one is faster.'],
    associatedMissions: [],
  },
  {
    id: 'skill-make-arrangement',
    name: 'Make an Arrangement',
    category: 'Coordination & Negotiation',
    description: 'Coordinate practical details until both sides have a workable time, place or plan.',
    practiceSkillIds: ['practice-speak-for-purpose', 'practice-keep-it-going'],
    canDo: {
      en: 'I can agree the practical details of a plan with someone.',
      fr: 'Je peux convenir avec quelqu’un des détails pratiques d’un plan.',
      es: 'Puedo acordar con alguien los detalles prácticos de un plan.',
      nl: 'Ik kan met iemand de praktische details van een plan afspreken.',
    },
    positiveExamples: ['Negotiates and confirms a time, place or next step with the other person.'],
    negativeExamples: ['Mentions a preferred time without reaching or seeking agreement.'],
    boundaryNotes: ['Use skill-propose-alternative for the narrower act of suggesting a replacement option after the default fails.'],
    modality: 'interaction',
    typicalOpportunityPatterns: ['schedule coordination', 'meeting logistics', 'handover plan'],
    evidenceMode: 'direct',
    lifecycle: { status: 'active' },
    patterns: [],
    samplePhrases: ['Can we meet at ten by the station? Yes, that works for me.'],
    associatedMissions: [],
  },
  {
    id: 'skill-narrate-past-event',
    name: 'Narrate a Past Event',
    category: 'Narration & Explanation',
    description: 'Describe a past event in an understandable sequence with enough context for the listener.',
    practiceSkillIds: ['practice-explain-idea', 'practice-keep-it-going'],
    canDo: {
      en: 'I can describe what happened in the past in a clear sequence.',
      fr: 'Je peux raconter clairement ce qui s’est passé dans le passé.',
      es: 'Puedo contar claramente lo que ocurrió en el pasado.',
      nl: 'Ik kan duidelijk vertellen wat er in het verleden is gebeurd.',
    },
    positiveExamples: ['Gives a past sequence with at least one event relationship or ordering cue.'],
    negativeExamples: ['Lists isolated past facts with no understandable sequence.'],
    boundaryNotes: ['This is narration, not merely answering a single factual past-tense question.'],
    modality: 'production',
    typicalOpportunityPatterns: ['experience question', 'incident explanation', 'tell me what happened'],
    evidenceMode: 'direct',
    lifecycle: { status: 'active' },
    patterns: [],
    samplePhrases: ['First I spoke to the customer, then I checked the order and fixed the problem.'],
    associatedMissions: [],
  },
];

/**
 * Ids removed from the active catalog stay reserved forever.
 * Add an id here before deleting its final deprecated definition.
 */
export const RETIRED_COMMUNICATIVE_SKILL_IDS: readonly CommunicativeSkillId[] = [];

const practiceIds = new Set(PRACTICE_SKILLS_CATALOG.map(skill => skill.id));
const skillById = new Map(COMMUNICATIVE_SKILLS_CATALOG.map(skill => [skill.id, skill]));

export function communicativeSkillById(
  skillId: CommunicativeSkillId
): CommunicativeSkillDefinition | undefined {
  return skillById.get(skillId);
}

export function isDirectlyEvidencedSkill(skillId: CommunicativeSkillId): boolean {
  return communicativeSkillById(skillId)?.evidenceMode === 'direct';
}

export function isAncestorSkill(
  ancestorId: CommunicativeSkillId,
  descendantId: CommunicativeSkillId
): boolean {
  if (ancestorId === descendantId) return false;

  const visited = new Set<CommunicativeSkillId>();
  let current = communicativeSkillById(descendantId);

  while (current?.parentSkillId) {
    if (visited.has(current.id)) return false;
    visited.add(current.id);

    if (current.parentSkillId === ancestorId) return true;
    current = communicativeSkillById(current.parentSkillId);
  }

  return false;
}

/** Keep unrelated skills, but remove an ancestor whenever a more-specific descendant is present. */
export function selectMostSpecificSkillIds(
  skillIds: readonly CommunicativeSkillId[]
): CommunicativeSkillId[] {
  const unique = [...new Set(skillIds)];

  return unique.filter(
    candidate => !unique.some(other => isAncestorSkill(candidate, other))
  );
}

export function validateSkillCatalog(): string[] {
  const errors: string[] = [];
  const supportedUiLanguages: UiLanguage[] = ['en', 'fr', 'es', 'nl'];

  if (practiceIds.size !== PRACTICE_SKILLS_CATALOG.length) {
    errors.push('PracticeSkill ids must be unique');
  }

  const ids = COMMUNICATIVE_SKILLS_CATALOG.map(skill => skill.id);
  if (new Set(ids).size !== ids.length) {
    errors.push('CommunicativeSkill ids must be unique');
  }

  const retiredIds = new Set(RETIRED_COMMUNICATIVE_SKILL_IDS);
  for (const skill of COMMUNICATIVE_SKILLS_CATALOG) {
    if (!/^skill-[a-z0-9-]+$/.test(skill.id)) {
      errors.push(`Invalid stable skill id: ${skill.id}`);
    }

    if (retiredIds.has(skill.id)) {
      errors.push(`Retired skill id reused by active catalog: ${skill.id}`);
    }

    for (const practiceSkillId of skill.practiceSkillIds) {
      if (!practiceIds.has(practiceSkillId)) {
        errors.push(`${skill.id} references unknown PracticeSkill ${practiceSkillId}`);
      }
    }

    for (const language of supportedUiLanguages) {
      if (!skill.canDo[language]?.trim()) {
        errors.push(`${skill.id} is missing a ${language} can-do statement`);
      }
    }

    if (skill.positiveExamples.length === 0) {
      errors.push(`${skill.id} must define at least one positive example`);
    }
    if (skill.negativeExamples.length === 0) {
      errors.push(`${skill.id} must define at least one negative example`);
    }
    if (skill.boundaryNotes.length === 0) {
      errors.push(`${skill.id} must define boundary notes`);
    }
    if (skill.typicalOpportunityPatterns.length === 0) {
      errors.push(`${skill.id} must define typical opportunity patterns`);
    }

    if (skill.parentSkillId) {
      const parent = skillById.get(skill.parentSkillId);
      if (!parent) {
        errors.push(`${skill.id} references unknown parent ${skill.parentSkillId}`);
      } else if (!parent.childSkillIds?.includes(skill.id)) {
        errors.push(`${skill.id} parent ${skill.parentSkillId} does not list it as a child`);
      }
    }

    for (const childId of skill.childSkillIds ?? []) {
      const child = skillById.get(childId);
      if (!child) {
        errors.push(`${skill.id} references unknown child ${childId}`);
      } else if (child.parentSkillId !== skill.id) {
        errors.push(`${skill.id} child ${childId} does not point back to its parent`);
      }
    }

    if (skill.evidenceMode === 'derived' && !(skill.childSkillIds?.length)) {
      errors.push(`${skill.id} is derived but has no child skills`);
    }

    if (skill.lifecycle.status === 'deprecated') {
      if (!skill.lifecycle.successorSkillId) {
        errors.push(`${skill.id} is deprecated but has no successor`);
      } else if (!skillById.has(skill.lifecycle.successorSkillId)) {
        errors.push(`${skill.id} successor ${skill.lifecycle.successorSkillId} is unknown`);
      }
    }
  }

  for (const skill of COMMUNICATIVE_SKILLS_CATALOG) {
    const seen = new Set<CommunicativeSkillId>([skill.id]);
    let current = skill;
    while (current.parentSkillId) {
      if (seen.has(current.parentSkillId)) {
        errors.push(`Skill hierarchy cycle detected at ${current.parentSkillId}`);
        break;
      }
      seen.add(current.parentSkillId);
      const parent = skillById.get(current.parentSkillId);
      if (!parent) break;
      current = parent;
    }
  }

  return errors;
}

const catalogErrors = validateSkillCatalog();
if (catalogErrors.length > 0) {
  throw new Error(`Invalid communicative skill catalog:\n- ${catalogErrors.join('\n- ')}`);
}
