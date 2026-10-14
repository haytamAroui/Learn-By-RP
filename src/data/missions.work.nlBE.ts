import type { MissionDefinition } from '../types';

/**
 * Taalbad Werk pilot: one bounded workplace-communication task.
 * Not a safety-training assessment or an employment-readiness certificate.
 * Professional language and locale review are required before release.
 */
export const NL_BE_WORK_MISSIONS: MissionDefinition[] = [
  {
    id: 'mission-nl-be-work-damaged-delivery',
    version: 1,
    language: 'nl',
    sceneId: 'scene.nl-be.work.damaged-delivery',
    workplaceContextId: 'logistics-warehouse',
    workplaceTaskId: 'work.logistics.report-damaged-delivery',
    taskContract: {
      learnerRole: 'Magazijnmedewerker',
      communicationNeed: 'Meld zichtbare schade en bevestig wat je gaat doen.',
      friction: 'De teamleider weet nog niets van de schade; je moet het gesprek beginnen.',
      consequence: 'De teamleider kan pas reageren nadat de schade gemeld is; zonder controlevraag blijft de instructie niet bevestigd.',
      rescue: 'Je kunt om uitleg, een zinsbegin of langzamere herhaling vragen; dit is hulp, geen zelfstandig bewijs.',
      realWorldBridge: 'Oefen dezelfde vaardigheid later bij een ontbrekend artikel of een vertraagde levering.',
    },
    scenarioFamilyId: 'workplace-incident-handover',
    levelRange: 'A2',
    title: 'Magazijn: Beschadigde levering melden',
    category: 'problems',
    neighborhood: 'Vlaanderen · magazijn',
    setting: 'Bij het uitladen van een levering merkt een medewerker drie beschadigde dozen op. De teamleider wil weten wat er gebeurd is en wat er nu moet gebeuren.',
    aiRole: 'Sofie, teamleider in een magazijn. Duidelijk, professioneel en behulpzaam in Belgisch Nederlands.',
    character: {
      name: 'Sofie',
      role: 'Teamleider',
      voiceStyle: 'Natuurlijk Belgisch Standaardnederlands, duidelijke korte instructies',
      personality: 'Praktisch, rustig en concreet',
      knowledgeBoundary: [
        'Weet welke interne meldingsstappen in deze fictieve oefening zijn afgesproken',
        'Weet niet dat er dozen beschadigd zijn totdat de medewerker dit meldt',
        'Geeft geen echte veiligheids-, juridische of bedrijfsprocedures',
      ],
    },
    learnerGoal: 'Meld de beschadigde dozen, vraag wat je ermee moet doen en bevestig de volgende stap.',
    stretchGoal: 'Controleer in je eigen woorden of je de instructie van je teamleider goed begrepen hebt.',
    targetIntents: ['report_damaged_delivery', 'ask_followup_instruction', 'check_next_step'],
    primarySkillIds: ['skill-report-workplace-problem', 'skill-check-understanding'],
    secondarySkillIds: ['skill-inquire-specifications', 'skill-make-arrangement'],
    usefulPhrases: [
      {
        id: 'phrase.nl-be.work.dozen_beschadigd',
        form: 'Er zijn drie dozen beschadigd.',
        meaning: 'Three boxes are damaged.',
        usageNote: 'Neutrale, duidelijke melding van een concreet probleem.',
        difficulty: 'elementary',
      },
      {
        id: 'phrase.nl-be.work.wat_moet_ik_doen',
        form: 'Wat moet ik met die dozen doen?',
        meaning: 'What should I do with those boxes?',
        usageNote: 'Vraag om een concrete volgende stap, zonder te gokken.',
        difficulty: 'elementary',
      },
      {
        id: 'phrase.nl-be.work.bedoelt_u',
        form: 'Dus ik zet ze apart en meld de schade, klopt dat?',
        meaning: 'So I set them aside and report the damage, is that right?',
        usageNote: 'Een instructie controleren door ze in eigen woorden te herhalen.',
        difficulty: 'intermediate',
      },
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'after_turn',
      allowSlowing: true,
    },
    completionSignals: [
      'Schade duidelijk gemeld',
      'Vervolgstap bevraagd',
      'Vervolgstap expliciet bevestigd',
    ],
    estimatedMinutes: 4,
    tags: ['nl-BE', 'Taalbad Werk', 'logistiek', 'magazijn', 'probleem melden', 'werkvloer'],
    transferPattern: 'Een praktisch probleem melden, instructies verduidelijken en bevestigen',
    transferReason: 'Dezelfde communicatieve handelingen komen terug in andere werksituaties; die transfer moet later afzonderlijk worden geobserveerd.',
  },
];
