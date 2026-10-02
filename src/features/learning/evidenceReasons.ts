import type {
  EvidenceSource,
  SkillEvidenceReasonCode,
  SkillObservation,
  SupportExposure,
  UiLanguage,
} from '../../types';

export interface SkillEvidenceReasonInput {
  retrieval: SkillObservation['retrieval'];
  modality: SkillObservation['modality'];
  evidenceSource: EvidenceSource;
  relevantSupport: SupportExposure[];
  isRehearsalAttempt: boolean;
}

/**
 * Produces stable, deterministic explanation codes from runtime facts.
 *
 * Ordering is intentional: the first code describes the main evidence status,
 * followed by qualifying context such as modality or rehearsal.
 */
export function deriveSkillEvidenceReasonCodes(
  input: SkillEvidenceReasonInput
): SkillEvidenceReasonCode[] {
  const codes: SkillEvidenceReasonCode[] = [];

  if (input.evidenceSource === 'legacy_inferred') {
    codes.push('LEGACY_INFERRED_EVIDENCE');
  } else if (input.retrieval === 'unassisted') {
    codes.push('INDEPENDENT_NO_RELEVANT_SUPPORT');
  } else if (input.retrieval === 'assisted') {
    const kinds = new Set(input.relevantSupport.map(exposure => exposure.kind));

    if (kinds.has('model_phrase_audio')) {
      codes.push('ASSISTED_MODEL_PHRASE_SHOWN');
    } else if (
      input.relevantSupport.some(exposure =>
        exposure.source === 'actor' &&
        (exposure.kind === 'partial_form' || exposure.kind === 'full_form')
      )
    ) {
      codes.push('ASSISTED_RECENT_ASSISTANT_MODELING');
    } else if (kinds.has('briefing_exposure')) {
      codes.push('ASSISTED_BRIEFING_EXPOSURE');
    } else if (kinds.has('typed_example')) {
      codes.push('ASSISTED_TYPED_EXAMPLE_SHOWN');
    } else if (kinds.has('partial_form') || kinds.has('full_form')) {
      codes.push('ASSISTED_FORM_SUPPORT_SHOWN');
    } else {
      codes.push('ASSISTED_RELEVANT_SUPPORT_SHOWN');
    }
  } else {
    codes.push('RETRIEVAL_UNKNOWN_NOT_INDEPENDENT_EVIDENCE');
  }

  if (input.modality === 'typed') {
    codes.push('TYPED_NOT_SPOKEN_EVIDENCE');
  }
  if (input.isRehearsalAttempt) {
    codes.push('REHEARSAL_NOT_COUNTED_FOR_STATUS');
  }

  return [...new Set(codes)];
}

/**
 * Adds post-hoc learner state without mutating the persisted original explanation.
 */
export function evidenceReasonCodesForDisplay(
  observation: SkillObservation
): SkillEvidenceReasonCode[] {
  const persisted = observation.reasonCodes ?? [];
  const codes = persisted.length > 0
    ? [...persisted]
    : deriveSkillEvidenceReasonCodes({
        retrieval: observation.retrieval,
        modality: observation.modality,
        evidenceSource: observation.evidenceSource,
        relevantSupport:
          observation.retrieval === 'assisted'
            ? ([{ kind: 'full_form' }] as SupportExposure[])
            : [],
        isRehearsalAttempt: false,
      });

  if (observation.userDisputed && !codes.includes('DISPUTED_BY_LEARNER')) {
    codes.push('DISPUTED_BY_LEARNER');
  }
  return [...new Set(codes)];
}

/**
 * Maps stable validator checks to learner-facing non-credit explanations.
 *
 * Most validation checks are internal integrity errors and should not be surfaced
 * as pedagogical feedback. Only checks that explain why otherwise plausible
 * evidence did not count receive a learner-facing code here.
 */
export function evidenceReasonCodeForValidationCheck(
  check: string
): SkillEvidenceReasonCode | undefined {
  switch (check) {
    case 'rehearsal_not_independent':
      return 'REHEARSAL_NOT_COUNTED_FOR_STATUS';
    case 'revision_mismatch':
    case 'passage_missing':
      return 'TRANSCRIPT_UNCERTAIN';
    case 'opportunity_not_demonstrated':
      return 'TARGET_SKILL_NOT_DEMONSTRATED';
    default:
      return undefined;
  }
}

export const SKILL_EVIDENCE_REASON_TEXT: Record<
  UiLanguage,
  Record<SkillEvidenceReasonCode, string>
> = {
  en: {
    INDEPENDENT_NO_RELEVANT_SUPPORT:
      'You used this skill without relevant production help before this response.',
    ASSISTED_RELEVANT_SUPPORT_SHOWN:
      'Relevant help was available before this response, so this counts as supported use.',
    ASSISTED_FORM_SUPPORT_SHOWN:
      'A partial or full target form was shown before this response, so this counts as supported use.',
    ASSISTED_MODEL_PHRASE_SHOWN:
      'You heard the target phrase before this response, so this counts as supported use.',
    ASSISTED_RECENT_ASSISTANT_MODELING:
      'The other speaker recently modeled the target form, so this counts as supported use.',
    ASSISTED_BRIEFING_EXPOSURE:
      'This target was shown in the briefing within the active support window.',
    ASSISTED_TYPED_EXAMPLE_SHOWN:
      'A typed example of the target was shown before this response.',
    REHEARSAL_NOT_COUNTED_FOR_STATUS:
      'This was a rehearsal attempt, so it does not count as independent status evidence.',
    TYPED_NOT_SPOKEN_EVIDENCE:
      'You typed this response; it does not establish spoken evidence.',
    RETRIEVAL_UNKNOWN_NOT_INDEPENDENT_EVIDENCE:
      'The runtime could not establish independent retrieval for this response.',
    TRANSCRIPT_UNCERTAIN:
      'The transcript was unavailable or changed, so this evidence was not counted.',
    TARGET_SKILL_NOT_DEMONSTRATED:
      'The scene could continue, but this target skill was not demonstrated in that opportunity.',
    LEGACY_INFERRED_EVIDENCE:
      'This evidence was reconstructed from older history and is not treated like directly validated evidence.',
    DISPUTED_BY_LEARNER:
      'You marked this evidence as not right, so it is excluded from your learning projection.',
  },
  fr: {
    INDEPENDENT_NO_RELEVANT_SUPPORT:
      'Vous avez utilisé cette compétence sans aide de production pertinente avant cette réponse.',
    ASSISTED_RELEVANT_SUPPORT_SHOWN:
      'Une aide pertinente était disponible avant cette réponse ; cet usage est donc compté comme assisté.',
    ASSISTED_FORM_SUPPORT_SHOWN:
      'Une forme cible partielle ou complète a été affichée avant cette réponse ; cet usage est donc assisté.',
    ASSISTED_MODEL_PHRASE_SHOWN:
      'Vous avez entendu la phrase cible avant cette réponse ; cet usage est donc assisté.',
    ASSISTED_RECENT_ASSISTANT_MODELING:
      'L’autre interlocuteur a récemment donné un modèle de la forme cible ; cet usage est donc assisté.',
    ASSISTED_BRIEFING_EXPOSURE:
      'Cette cible a été montrée dans le briefing pendant la fenêtre d’aide active.',
    ASSISTED_TYPED_EXAMPLE_SHOWN:
      'Un exemple écrit de la cible a été affiché avant cette réponse.',
    REHEARSAL_NOT_COUNTED_FOR_STATUS:
      'Il s’agissait d’une répétition ; elle ne compte donc pas comme preuve autonome pour le statut.',
    TYPED_NOT_SPOKEN_EVIDENCE:
      'Vous avez écrit cette réponse ; elle ne constitue pas une preuve de production orale.',
    RETRIEVAL_UNKNOWN_NOT_INDEPENDENT_EVIDENCE:
      'Le système n’a pas pu établir un rappel autonome pour cette réponse.',
    TRANSCRIPT_UNCERTAIN:
      'La transcription était indisponible ou a changé ; cette preuve n’a donc pas été comptée.',
    TARGET_SKILL_NOT_DEMONSTRATED:
      'La scène a pu continuer, mais cette compétence cible n’a pas été démontrée dans cette opportunité.',
    LEGACY_INFERRED_EVIDENCE:
      'Cette preuve a été reconstruite à partir d’un historique ancien et n’est pas traitée comme une preuve directement validée.',
    DISPUTED_BY_LEARNER:
      'Vous avez indiqué que cette preuve n’était pas correcte ; elle est exclue de votre projection.',
  },
  es: {
    INDEPENDENT_NO_RELEVANT_SUPPORT:
      'Usaste esta habilidad sin ayuda de producción relevante antes de esta respuesta.',
    ASSISTED_RELEVANT_SUPPORT_SHOWN:
      'Había ayuda relevante antes de esta respuesta, así que cuenta como uso con apoyo.',
    ASSISTED_FORM_SUPPORT_SHOWN:
      'Se mostró una forma objetivo parcial o completa antes de esta respuesta, así que cuenta como uso con apoyo.',
    ASSISTED_MODEL_PHRASE_SHOWN:
      'Oíste la frase objetivo antes de esta respuesta, así que cuenta como uso con apoyo.',
    ASSISTED_RECENT_ASSISTANT_MODELING:
      'La otra persona modeló recientemente la forma objetivo, así que cuenta como uso con apoyo.',
    ASSISTED_BRIEFING_EXPOSURE:
      'Este objetivo se mostró en la introducción dentro de la ventana de apoyo activa.',
    ASSISTED_TYPED_EXAMPLE_SHOWN:
      'Se mostró un ejemplo escrito del objetivo antes de esta respuesta.',
    REHEARSAL_NOT_COUNTED_FOR_STATUS:
      'Este fue un intento de ensayo, por lo que no cuenta como evidencia independiente para el estado.',
    TYPED_NOT_SPOKEN_EVIDENCE:
      'Escribiste esta respuesta; no establece evidencia de producción oral.',
    RETRIEVAL_UNKNOWN_NOT_INDEPENDENT_EVIDENCE:
      'El sistema no pudo establecer una recuperación independiente para esta respuesta.',
    TRANSCRIPT_UNCERTAIN:
      'La transcripción no estaba disponible o cambió, así que esta evidencia no se contó.',
    TARGET_SKILL_NOT_DEMONSTRATED:
      'La escena pudo continuar, pero esta habilidad objetivo no se demostró en esa oportunidad.',
    LEGACY_INFERRED_EVIDENCE:
      'Esta evidencia se reconstruyó a partir de historial antiguo y no se trata como evidencia validada directamente.',
    DISPUTED_BY_LEARNER:
      'Marcaste esta evidencia como incorrecta, así que se excluye de tu proyección de aprendizaje.',
  },
  nl: {
    INDEPENDENT_NO_RELEVANT_SUPPORT:
      'Je gebruikte deze vaardigheid zonder relevante productiehulp vóór dit antwoord.',
    ASSISTED_RELEVANT_SUPPORT_SHOWN:
      'Er was relevante hulp beschikbaar vóór dit antwoord, dus dit telt als ondersteund gebruik.',
    ASSISTED_FORM_SUPPORT_SHOWN:
      'Een gedeeltelijke of volledige doelvorm was zichtbaar vóór dit antwoord, dus dit telt als ondersteund gebruik.',
    ASSISTED_MODEL_PHRASE_SHOWN:
      'Je hoorde de doelzin vóór dit antwoord, dus dit telt als ondersteund gebruik.',
    ASSISTED_RECENT_ASSISTANT_MODELING:
      'De andere spreker modelleerde kort daarvoor de doelvorm, dus dit telt als ondersteund gebruik.',
    ASSISTED_BRIEFING_EXPOSURE:
      'Dit doel werd in de briefing getoond binnen het actieve ondersteuningsvenster.',
    ASSISTED_TYPED_EXAMPLE_SHOWN:
      'Een getypt voorbeeld van het doel werd vóór dit antwoord getoond.',
    REHEARSAL_NOT_COUNTED_FOR_STATUS:
      'Dit was een oefenpoging en telt daarom niet als zelfstandig bewijs voor de status.',
    TYPED_NOT_SPOKEN_EVIDENCE:
      'Je typte dit antwoord; het geldt niet als bewijs van gesproken productie.',
    RETRIEVAL_UNKNOWN_NOT_INDEPENDENT_EVIDENCE:
      'Het systeem kon voor dit antwoord geen zelfstandige ophaling vaststellen.',
    TRANSCRIPT_UNCERTAIN:
      'Het transcript was niet beschikbaar of veranderde, daarom werd dit bewijs niet meegeteld.',
    TARGET_SKILL_NOT_DEMONSTRATED:
      'De scène kon doorgaan, maar deze doelvaardigheid werd in die kans niet aangetoond.',
    LEGACY_INFERRED_EVIDENCE:
      'Dit bewijs is uit oudere geschiedenis gereconstrueerd en wordt niet hetzelfde behandeld als direct gevalideerd bewijs.',
    DISPUTED_BY_LEARNER:
      'Je gaf aan dat dit bewijs niet klopt, dus het wordt uit je leerprojectie uitgesloten.',
  },
};

export function renderSkillEvidenceReason(
  code: SkillEvidenceReasonCode,
  language: UiLanguage
): string {
  return SKILL_EVIDENCE_REASON_TEXT[language][code];
}
