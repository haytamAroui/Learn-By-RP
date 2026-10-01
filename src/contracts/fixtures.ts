/**
 * Contract fixtures: the shared regression suite for the learning core and the
 * scene reducer (§17.2, §18.5).
 *
 * These are the 15 required scenarios from the specification, expressed as data
 * so the same cases run against the client validator and the server reducer.
 * Adding a case here adds it to the suite for both.
 */

export interface TranscriptCase {
  id: string;
  /** The spec scenario number this covers. */
  spec: number;
  title: string;
  language: 'es' | 'fr' | 'de' | 'it' | 'ja';
  /** Curated target phrase, with its phrase id. */
  target: { id: string; form: string; meaning: string };
  /** Alternative curated phrase that must NOT be credited. */
  distractor?: { id: string; form: string; meaning: string };
  /** What the learner said, as the recogniser heard it. */
  learnerUtterance: string;
  modality?: 'spoken' | 'typed';
  /** Support the learner was shown before the turn. */
  exposures?: Array<{
    source: 'briefing' | 'actor' | 'coach' | 'caption' | 'retry';
    kind: 'intent_hint' | 'meaning' | 'partial_form' | 'full_form' | 'repeat';
    /** Minutes ago, used for the modeling window. */
    minutesAgo?: number;
  }>;
  isColdAttempt?: boolean;
  isRehearsalAttempt?: boolean;
  /** What the deterministic core is expected to conclude. */
  expect: {
    credited: boolean;
    retrieval: 'assisted' | 'unassisted' | 'unknown';
    reason: string;
  };
}

export const EVIDENCE_CASES: TranscriptCase[] = [
  {
    id: 'case-1-clear-paraphrase',
    spec: 1,
    title: 'Clear paraphrase advances the task; no exact wording needed',
    language: 'es',
    target: { id: 'phrase.es.cafe_leche', form: 'Un café con leche', meaning: 'A coffee with milk' },
    learnerUtterance: 'quisiera café con leche por favor',
    isColdAttempt: true,
    expect: {
      credited: true,
      retrieval: 'unassisted',
      reason: 'Equivalent wording is real production and counts.',
    },
  },
  {
    id: 'case-1b-wrong-item-perfect-sentence',
    spec: 1,
    title: 'A perfect sentence asking for the wrong item does not count',
    language: 'es',
    target: { id: 'phrase.es.cafe_leche', form: 'Un café con leche', meaning: 'A coffee with milk' },
    distractor: { id: 'phrase.es.otro', form: 'Quisiera la cuenta, por favor', meaning: 'The bill, please' },
    learnerUtterance: 'quisiera un té verde por favor',
    isColdAttempt: true,
    expect: {
      credited: false,
      retrieval: 'unassisted',
      reason: 'The learner did not produce the target form.',
    },
  },
  {
    id: 'case-4-briefing-exposure',
    spec: 4,
    title: 'Help used in the briefing is reflected as assisted',
    language: 'es',
    target: { id: 'phrase.es.cafe_leche', form: 'Un café con leche', meaning: 'A coffee with milk' },
    learnerUtterance: 'un café con leche por favor',
    isColdAttempt: false,
    exposures: [{ source: 'briefing', kind: 'full_form', minutesAgo: 5 }],
    expect: {
      credited: true,
      retrieval: 'assisted',
      reason: 'The form was visible in the briefing before the attempt.',
    },
  },
  {
    id: 'case-12-hinted-repetition',
    spec: 12,
    title: 'A hinted repetition cannot raise independent recall',
    language: 'es',
    target: { id: 'phrase.es.cafe_leche', form: 'Un café con leche', meaning: 'A coffee with milk' },
    learnerUtterance: 'un café con leche',
    isColdAttempt: true,
    isRehearsalAttempt: true,
    exposures: [{ source: 'coach', kind: 'full_form', minutesAgo: 1 }],
    expect: {
      credited: true,
      retrieval: 'assisted',
      reason: 'A rehearsal after seeing the answer is never independent evidence.',
    },
  },
  {
    id: 'case-12b-intent-hint-only',
    spec: 12,
    title: 'An intent hint alone does not expose the form, so it does not downgrade',
    language: 'es',
    target: { id: 'phrase.es.cafe_leche', form: 'Un café con leche', meaning: 'A coffee with milk' },
    learnerUtterance: 'quiero un café con leche',
    isColdAttempt: true,
    exposures: [{ source: 'coach', kind: 'intent_hint', minutesAgo: 0 }],
    expect: {
      credited: true,
      retrieval: 'unassisted',
      reason: 'An intent hint says what to communicate without revealing the words.',
    },
  },
  {
    id: 'case-13-typed-spontaneous',
    spec: 13,
    title: 'A spontaneously typed answer is recorded as typed, not spoken evidence',
    language: 'es',
    target: { id: 'phrase.es.cafe_leche', form: 'Un café con leche', meaning: 'A coffee with milk' },
    learnerUtterance: 'un café con leche por favor',
    modality: 'typed',
    isColdAttempt: true,
    expect: {
      credited: true,
      retrieval: 'unknown',
      reason: 'Written retrieval is real recall but is not spoken production.',
    },
  },
  {
    id: 'case-11-slow-thinking',
    spec: 11,
    title: 'Slow thinking is silence, not a lapse',
    language: 'es',
    target: { id: 'phrase.es.cafe_leche', form: 'Un café con leche', meaning: 'A coffee with milk' },
    learnerUtterance: '',
    isColdAttempt: true,
    expect: {
      credited: false,
      retrieval: 'unassisted',
      reason: 'No speech means unknown, never a lapse and never a failure.',
    },
  },
  {
    id: 'case-5-interrupted-modeling-window',
    spec: 5,
    title: 'Assistant modeled the form inside the window, so use is assisted',
    language: 'es',
    target: { id: 'phrase.es.cafe_leche', form: 'Un café con leche', meaning: 'A coffee with milk' },
    learnerUtterance: 'un café con leche',
    isColdAttempt: true,
    exposures: [{ source: 'actor', kind: 'repeat', minutesAgo: 1 }],
    expect: {
      credited: true,
      retrieval: 'assisted',
      reason: 'The form was just played, so this is not independent recall.',
    },
  },
  {
    id: 'case-5b-stale-modeling',
    spec: 5,
    title: 'Modeling long before the turn does not downgrade',
    language: 'es',
    target: { id: 'phrase.es.cafe_leche', form: 'Un café con leche', meaning: 'A coffee with milk' },
    learnerUtterance: 'un café con leche por favor',
    isColdAttempt: true,
    exposures: [{ source: 'actor', kind: 'repeat', minutesAgo: 60 }],
    expect: {
      credited: true,
      retrieval: 'unassisted',
      reason: 'The modeling window has passed.',
    },
  },
  {
    id: 'case-7-retry-is-rehearsal',
    spec: 7,
    title: 'A retry after seeing the answer is marked rehearsal',
    language: 'es',
    target: { id: 'phrase.es.cafe_leche', form: 'Un café con leche', meaning: 'A coffee with milk' },
    learnerUtterance: 'un café con leche',
    isColdAttempt: true,
    isRehearsalAttempt: true,
    expect: {
      credited: true,
      retrieval: 'assisted',
      reason: 'Rehearsal is labelled, not hidden.',
    },
  },
  {
    id: 'case-fr-paraphrase',
    spec: 1,
    title: 'French paraphrase with a contraction',
    language: 'fr',
    target: { id: 'phrase.fr.cafe', form: 'Je voudrais un café', meaning: 'I would like a coffee' },
    learnerUtterance: 'je voudrais bien un café s’il vous plaît',
    isColdAttempt: true,
    expect: {
      credited: true,
      retrieval: 'unassisted',
      reason: 'Contractions and politeness markers do not change the production.',
    },
  },
  {
    id: 'case-de-paraphrase',
    spec: 1,
    title: 'German paraphrase with different politeness frame',
    language: 'de',
    target: { id: 'phrase.de.brötchen', form: 'Ich möchte ein Brötchen', meaning: 'I would like a roll' },
    learnerUtterance: 'ein Brötchen bitte',
    isColdAttempt: true,
    expect: {
      credited: false,
      retrieval: 'unassisted',
      reason:
        'Only one content word overlaps; ambiguous equivalence is recorded as unknown for review, not credited.',
    },
  },
  {
    id: 'case-ja-exact',
    spec: 1,
    title: 'Japanese exact match',
    language: 'ja',
    target: { id: 'phrase.ja.bento', form: 'お弁当をお願いします', meaning: 'A bento please' },
    learnerUtterance: 'お弁当をお願いします',
    isColdAttempt: true,
    expect: {
      credited: true,
      retrieval: 'unassisted',
      reason: 'Non-latin scripts tokenize and match correctly.',
    },
  },
];

// ---------------------------------------------------------------- scene cases

export interface SceneCase {
  id: string;
  spec: number;
  title: string;
  sceneId: string;
  /** Applied in order; the last one is the assertion target. */
  steps: Array<{
    actionId: string;
    action: string;
    payload: Record<string, unknown>;
    expectedSceneRevision: number;
  }>;
  expect: {
    accepted: boolean;
    reasonContains?: string;
    outcome?: 'achieved' | 'partial' | 'unknown';
  };
}

export const SCENE_CASES: SceneCase[] = [
  {
    id: 'scene-1-achieved-requires-two-facts',
    spec: 1,
    title: 'An item alone is partial; item plus service mode is achieved',
    sceneId: 'scene.es.cafe.breakfast',
    steps: [
      {
        actionId: 'a1',
        action: 'confirm_order_item',
        payload: { item: 'café con leche' },
        expectedSceneRevision: 1,
      },
      {
        actionId: 'a2',
        action: 'confirm_takeaway',
        payload: { takeaway: true },
        expectedSceneRevision: 2,
      },
    ],
    expect: { accepted: true, outcome: 'achieved' },
  },
  {
    id: 'scene-2-unsupported-action',
    spec: 2,
    title: 'An unsupported action is rejected with permissible options',
    sceneId: 'scene.es.cafe.breakfast',
    steps: [
      {
        actionId: 'b1',
        action: 'hand_over_free_coffee',
        payload: {},
        expectedSceneRevision: 1,
      },
    ],
    expect: { accepted: false, reasonContains: 'not permitted' },
  },
  {
    id: 'scene-3-double-request',
    spec: 3,
    title: 'A repeated actionId produces one transition',
    sceneId: 'scene.es.cafe.breakfast',
    steps: [
      {
        actionId: 'c1',
        action: 'confirm_order_item',
        payload: { item: 'café con leche' },
        expectedSceneRevision: 1,
      },
      {
        actionId: 'c1',
        action: 'confirm_order_item',
        payload: { item: 'café con leche' },
        expectedSceneRevision: 1,
      },
    ],
    expect: { accepted: true, outcome: 'partial' },
  },
  {
    id: 'scene-6-stale-revision',
    spec: 6,
    title: 'A proposal built against a superseded revision is refused',
    sceneId: 'scene.es.cafe.breakfast',
    steps: [
      {
        actionId: 'd1',
        action: 'confirm_order_item',
        payload: { item: 'café' },
        expectedSceneRevision: 1,
      },
      {
        actionId: 'd2',
        action: 'confirm_takeaway',
        payload: { takeaway: true },
        expectedSceneRevision: 1,
      },
    ],
    expect: { accepted: false, reasonContains: 'stale scene revision' },
  },
];
