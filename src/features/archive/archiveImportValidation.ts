import { matchPhraseInText, normalizeText } from '../learning/matching';
import {
  isPhraseProductionSupportRelevant,
  isSkillProductionSupportRelevant,
} from '../learning/supportScope';
import type {
  LearningObservation,
  OpportunityInstance,
  Passage,
  PhraseItem,
  SessionRecord,
  SkillLapse,
  SkillObservation,
  UserPreferences,
  ValidatedLearningObservation,
  ValidatedSkillObservation,
} from '../../types';
import type { PersistableSessionRecord } from './ArchiveRepository.types';

export interface PreparedArchiveImport {
  sessions: PersistableSessionRecord[];
  phrases: PhraseItem[];
  preferences?: Partial<UserPreferences>;
  observationCount: number;
}

export type ArchiveImportValidation =
  | { ok: true; value: PreparedArchiveImport }
  | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}

function quoteAppears(quote: unknown, text: unknown): boolean {
  if (typeof quote !== 'string' || typeof text !== 'string') return false;
  const normalizedQuote = normalizeText(quote);
  const normalizedText = normalizeText(text);
  return normalizedQuote.length > 0 && normalizedText.includes(normalizedQuote);
}

function learnerPassageFor(
  session: Record<string, any>,
  input: {
    passageId: unknown;
    revision: unknown;
    attemptId: unknown;
    quote: unknown;
  }
): Passage | null {
  if (
    typeof input.passageId !== 'string' ||
    typeof input.revision !== 'string' ||
    typeof input.attemptId !== 'string'
  ) {
    return null;
  }

  const passages = Array.isArray(session.passages) ? session.passages : [];
  const passage = passages.find(
    (candidate: any) =>
      candidate?.id === input.passageId &&
      candidate?.speaker === 'user' &&
      candidate?.attemptId === input.attemptId &&
      candidate?.revisionKey === input.revision
  );

  if (!passage || !quoteAppears(input.quote, passage.text)) return null;
  return passage as Passage;
}

function validatePhraseObservation(
  session: Record<string, any>,
  observation: unknown,
  phraseMap: ReadonlyMap<string, PhraseItem>
): ValidatedLearningObservation | null {
  if (!isRecord(observation)) return null;
  if (observation.sessionId !== session.id) return null;
  if (typeof observation.itemId !== 'string') return null;
  const phrase = phraseMap.get(observation.itemId);
  if (!phrase) return null;
  if (
    typeof observation.observationId !== 'string' ||
    typeof observation.candidateForm !== 'string' ||
    typeof observation.modality !== 'string' ||
    typeof observation.retrieval !== 'string' ||
    typeof observation.taskOutcome !== 'string' ||
    typeof observation.recordedAt !== 'string'
  ) {
    return null;
  }

  const passage = learnerPassageFor(session, {
    passageId: observation.sourceTurnId,
    revision: observation.sourceRevision,
    attemptId: observation.attemptId,
    quote: observation.quote,
  });
  if (!passage) return null;

  const semanticMatch = matchPhraseInText(phrase.form, passage.text);
  if (semanticMatch.verdict === 'none' || semanticMatch.verdict === 'ambiguous') {
    return null;
  }
  if (observation.modality === 'typed' && observation.retrieval === 'unassisted') {
    return null;
  }

  const supportExposures = Array.isArray(session.supportExposures)
    ? session.supportExposures
    : [];
  const relevantSupport = supportExposures.filter((exposure: any) =>
    isPhraseProductionSupportRelevant({
      exposure,
      phraseId: observation.itemId,
      passage,
      attemptId: observation.attemptId,
    })
  );
  if (observation.retrieval === 'unassisted' && relevantSupport.length > 0) {
    return null;
  }

  const exposureIds = new Set(
    (Array.isArray(session.supportExposures) ? session.supportExposures : [])
      .map((exposure: any) => exposure?.id)
      .filter((id: unknown): id is string => typeof id === 'string')
  );
  const referencedSupport = Array.isArray(observation.supportExposureIds)
    ? observation.supportExposureIds
    : [];
  if (
    referencedSupport.some(
      (id: unknown) => typeof id !== 'string' || !exposureIds.has(id)
    )
  ) {
    return null;
  }

  return observation as unknown as ValidatedLearningObservation;
}

function opportunityById(
  session: Record<string, any>,
  id: unknown
): OpportunityInstance | null {
  if (typeof id !== 'string') return null;
  const opportunities = Array.isArray(session.opportunityInstances)
    ? session.opportunityInstances
    : [];
  return (
    opportunities.find((candidate: any) => candidate?.id === id) ?? null
  ) as OpportunityInstance | null;
}

function validateSkillObservation(
  session: Record<string, any>,
  observation: unknown
): ValidatedSkillObservation | null {
  if (!isRecord(observation)) return null;
  if (
    observation.sessionId !== session.id ||
    typeof observation.id !== 'string' ||
    typeof observation.skillId !== 'string' ||
    typeof observation.attemptId !== 'string' ||
    typeof observation.sourcePassageId !== 'string' ||
    typeof observation.sourceRevision !== 'string' ||
    typeof observation.quote !== 'string' ||
    typeof observation.recordedAt !== 'string' ||
    observation.demonstration !== 'demonstrated' ||
    !isRecord(observation.contextKey) ||
    typeof observation.contextKey.domainId !== 'string' ||
    typeof observation.contextKey.scenarioFamilyId !== 'string'
  ) {
    return null;
  }

  const passage = learnerPassageFor(session, {
    passageId: observation.sourcePassageId,
    revision: observation.sourceRevision,
    attemptId: observation.attemptId,
    quote: observation.quote,
  });
  if (!passage) return null;
  if (observation.modality === 'typed' && observation.retrieval === 'unassisted') {
    return null;
  }

  const relevantSupport = (Array.isArray(session.supportExposures)
    ? session.supportExposures
    : []
  ).filter((exposure: any) =>
    isSkillProductionSupportRelevant({
      exposure,
      passage,
      attemptId: observation.attemptId,
      skillId: observation.skillId,
      opportunityInstanceId: observation.opportunityInstanceId,
    })
  );
  if (observation.retrieval === 'unassisted' && relevantSupport.length > 0) {
    return null;
  }

  if (observation.evidenceSource === 'validated_explicit') {
    const opportunity = opportunityById(session, observation.opportunityInstanceId);
    if (
      !opportunity ||
      opportunity.attemptId !== observation.attemptId ||
      opportunity.skillId !== observation.skillId ||
      opportunity.status !== 'taken' ||
      opportunity.detection !== 'validated' ||
      opportunity.demonstration !== 'demonstrated' ||
      opportunity.learnerAttemptPassageId !== observation.sourcePassageId ||
      opportunity.learnerAttemptRevision !== observation.sourceRevision
    ) {
      return null;
    }
  } else if (observation.evidenceSource !== 'legacy_inferred') {
    return null;
  }

  return observation as unknown as ValidatedSkillObservation;
}

function validateSkillLapse(
  session: Record<string, any>,
  lapse: unknown
): SkillLapse | null {
  if (!isRecord(lapse)) return null;
  if (
    lapse.sessionId !== session.id ||
    typeof lapse.id !== 'string' ||
    typeof lapse.skillId !== 'string' ||
    typeof lapse.attemptId !== 'string' ||
    typeof lapse.sourcePassageId !== 'string' ||
    typeof lapse.sourceRevision !== 'string' ||
    lapse.demonstration !== 'attempted_not_demonstrated' ||
    lapse.basis !== 'cold_attempt_failed' ||
    !isRecord(lapse.contextKey)
  ) {
    return null;
  }

  const passage = learnerPassageFor(session, {
    passageId: lapse.sourcePassageId,
    revision: lapse.sourceRevision,
    attemptId: lapse.attemptId,
    // A lapse does not carry a quote. Requiring the cited learner passage itself
    // is enough; use its own text only to prove the passage is non-empty.
    quote:
      (Array.isArray(session.passages)
        ? session.passages.find((p: any) => p?.id === lapse.sourcePassageId)?.text
        : '') ?? '',
  });
  if (!passage) return null;

  const opportunity = opportunityById(session, lapse.opportunityInstanceId);
  if (
    !opportunity ||
    opportunity.attemptId !== lapse.attemptId ||
    opportunity.skillId !== lapse.skillId ||
    opportunity.status !== 'taken' ||
    opportunity.detection !== 'validated' ||
    opportunity.demonstration !== 'attempted_not_demonstrated' ||
    opportunity.failureReason ||
    opportunity.learnerAttemptPassageId !== lapse.sourcePassageId ||
    (opportunity.learnerAttemptRevision &&
      opportunity.learnerAttemptRevision !== lapse.sourceRevision)
  ) {
    return null;
  }

  return lapse as SkillLapse;
}

function basicSessionShape(session: unknown): session is Record<string, any> {
  return (
    isRecord(session) &&
    typeof session.id === 'string' &&
    typeof session.missionId === 'string' &&
    typeof session.missionVersion === 'number' &&
    typeof session.language === 'string' &&
    typeof session.mode === 'string' &&
    typeof session.state === 'string' &&
    typeof session.startedAt === 'string' &&
    Array.isArray(session.passages) &&
    Array.isArray(session.supportExposures) &&
    Array.isArray(session.observations) &&
    isRecord(session.sceneState)
  );
}

/**
 * Trusted rehydration boundary for learner-owned archive backups.
 *
 * Import is intentionally not a second evidence creator. It may only restore
 * evidence whose passage/revision/learner provenance is still present inside the
 * same exported session. Invalid evidence rejects the whole import before writes.
 */
export function prepareArchiveImport(parsed: unknown): ArchiveImportValidation {
  if (!isRecord(parsed)) {
    return { ok: false, message: 'Invalid JSON payload format' };
  }
  if (parsed.schemaVersion !== undefined && parsed.schemaVersion !== 1) {
    return {
      ok: false,
      message: `Unsupported archive schema version: ${parsed.schemaVersion}`,
    };
  }
  if (!Array.isArray(parsed.sessions) || !Array.isArray(parsed.phrases)) {
    return { ok: false, message: 'Archive is missing sessions or phrases' };
  }

  const phrases: PhraseItem[] = [];
  const phraseMap = new Map<string, PhraseItem>();
  for (const phrase of parsed.phrases) {
    if (
      !isRecord(phrase) ||
      typeof phrase.id !== 'string' ||
      typeof phrase.form !== 'string' ||
      typeof phrase.meaning !== 'string'
    ) {
      return { ok: false, message: 'Archive contains a malformed phrase' };
    }
    const typedPhrase = phrase as PhraseItem;
    phraseMap.set(phrase.id, typedPhrase);
    phrases.push(typedPhrase);
  }

  const sessions: PersistableSessionRecord[] = [];
  let observationCount = 0;

  for (const rawSession of parsed.sessions) {
    if (!basicSessionShape(rawSession)) {
      return { ok: false, message: 'Archive contains a malformed session' };
    }

    for (const passage of rawSession.passages) {
      if (
        !isRecord(passage) ||
        typeof passage.id !== 'string' ||
        typeof passage.attemptId !== 'string' ||
        (passage.speaker !== 'user' && passage.speaker !== 'assistant') ||
        typeof passage.revisionKey !== 'string' ||
        typeof passage.text !== 'string'
      ) {
        return {
          ok: false,
          message: `Archive session ${rawSession.id} contains a malformed passage`,
        };
      }
    }

    for (const exposure of rawSession.supportExposures) {
      if (
        !isRecord(exposure) ||
        typeof exposure.id !== 'string' ||
        typeof exposure.attemptId !== 'string' ||
        typeof exposure.kind !== 'string' ||
        typeof exposure.recordedAt !== 'string' ||
        !Array.isArray(exposure.targetItemIds)
      ) {
        return {
          ok: false,
          message: `Archive session ${rawSession.id} contains malformed support evidence`,
        };
      }
    }

    const observations: ValidatedLearningObservation[] = [];
    for (const observation of rawSession.observations) {
      const validated = validatePhraseObservation(rawSession, observation, phraseMap);
      if (!validated) {
        return {
          ok: false,
          message: `Archive session ${rawSession.id} contains unverified phrase evidence`,
        };
      }
      observations.push(validated);
    }

    const skillObservations: ValidatedSkillObservation[] = [];
    for (const observation of Array.isArray(rawSession.skillObservations)
      ? rawSession.skillObservations
      : []) {
      const validated = validateSkillObservation(rawSession, observation);
      if (!validated) {
        return {
          ok: false,
          message: `Archive session ${rawSession.id} contains unverified skill evidence`,
        };
      }
      skillObservations.push(validated);
    }

    const skillLapses: SkillLapse[] = [];
    for (const lapse of Array.isArray(rawSession.skillLapses)
      ? rawSession.skillLapses
      : []) {
      const validated = validateSkillLapse(rawSession, lapse);
      if (!validated) {
        return {
          ok: false,
          message: `Archive session ${rawSession.id} contains an unverified skill lapse`,
        };
      }
      skillLapses.push(validated);
    }

    observationCount += observations.length;

    sessions.push({
      ...(rawSession as unknown as SessionRecord),
      coldAttempt: rawSession.coldAttempt !== false,
      observations,
      skillObservations,
      skillLapses,
    } as PersistableSessionRecord);
  }

  return {
    ok: true,
    value: {
      sessions,
      phrases,
      preferences: isRecord(parsed.preferences)
        ? (parsed.preferences as Partial<UserPreferences>)
        : undefined,
      observationCount,
    },
  };
}
