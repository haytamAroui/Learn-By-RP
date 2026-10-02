import type { RequestHandler } from 'express';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

type Validator = (body: unknown) => ValidationResult;

function objectBody(body: unknown): Record<string, any> | null {
  return body && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, any>)
    : null;
}

function requiredString(
  body: Record<string, any>,
  key: string,
  errors: string[],
  maxLength: number
): string | null {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${key} must be a non-empty string`);
    return null;
  }
  if (value.length > maxLength) {
    errors.push(`${key} exceeds ${maxLength} characters`);
    return null;
  }
  return value;
}

function optionalString(
  body: Record<string, any>,
  key: string,
  errors: string[],
  maxLength: number
): void {
  const value = body[key];
  if (value === undefined || value === null) return;
  if (typeof value !== 'string') {
    errors.push(`${key} must be a string`);
    return;
  }
  if (value.length > maxLength) {
    errors.push(`${key} exceeds ${maxLength} characters`);
  }
}

function arrayField(
  body: Record<string, any>,
  key: string,
  errors: string[],
  maxItems: number,
  required = false
): any[] {
  const value = body[key];
  if (value === undefined && !required) return [];
  if (!Array.isArray(value)) {
    errors.push(`${key} must be an array`);
    return [];
  }
  if (value.length > maxItems) {
    errors.push(`${key} exceeds ${maxItems} items`);
  }
  return value;
}

function boundedJsonObject(
  value: unknown,
  label: string,
  errors: string[],
  maxBytes: number
): void {
  if (value === undefined || value === null) return;
  if (typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  try {
    if (JSON.stringify(value).length > maxBytes) {
      errors.push(`${label} is too large`);
    }
  } catch {
    errors.push(`${label} is not serializable`);
  }
}

function validatePassage(passage: any, index: number, errors: string[]): void {
  if (!passage || typeof passage !== 'object' || Array.isArray(passage)) {
    errors.push(`passages[${index}] must be an object`);
    return;
  }
  for (const key of ['id', 'revisionKey', 'speaker', 'text']) {
    if (typeof passage[key] !== 'string') {
      errors.push(`passages[${index}].${key} must be a string`);
    }
  }
  if (
    typeof passage.speaker === 'string' &&
    passage.speaker !== 'user' &&
    passage.speaker !== 'assistant'
  ) {
    errors.push(`passages[${index}].speaker is invalid`);
  }
  if (typeof passage.text === 'string' && passage.text.length > 8000) {
    errors.push(`passages[${index}].text exceeds 8000 characters`);
  }
}

export const validateRealtimeSessionRequest: Validator = body => {
  const value = objectBody(body);
  const errors: string[] = [];
  if (!value) return { ok: false, errors: ['body must be an object'] };

  optionalString(value, 'targetLanguage', errors, 32);
  optionalString(value, 'explanationLanguage', errors, 32);
  optionalString(value, 'instructions', errors, 6000);
  optionalString(value, 'voice', errors, 80);
  optionalString(value, 'safetyIdentifier', errors, 200);
  return { ok: errors.length === 0, errors };
};

export const validateActorRequest: Validator = body => {
  const value = objectBody(body);
  const errors: string[] = [];
  if (!value) return { ok: false, errors: ['body must be an object'] };

  requiredString(value, 'missionId', errors, 160);
  requiredString(value, 'userMessage', errors, 4000);
  optionalString(value, 'setting', errors, 1000);
  optionalString(value, 'learnerGoal', errors, 1000);
  optionalString(value, 'mode', errors, 32);
  optionalString(value, 'targetLanguage', errors, 80);
  optionalString(value, 'explanationLanguage', errors, 80);
  boundedJsonObject(value.character, 'character', errors, 12000);
  boundedJsonObject(value.sceneFacts, 'sceneFacts', errors, 16000);

  const recentPassages = arrayField(value, 'recentPassages', errors, 40);
  recentPassages.forEach((passage, index) =>
    validatePassage(passage, index, errors)
  );

  const actions = arrayField(value, 'allowedActions', errors, 32);
  actions.forEach((action, index) => {
    if (typeof action !== 'string' || !action || action.length > 120) {
      errors.push(`allowedActions[${index}] must be a short string`);
    }
  });

  return { ok: errors.length === 0, errors };
};

const COACH_STEPS = new Set([
  'intent_hint',
  'partial_form',
  'full_form',
  'explanation',
]);

export const validateCoachRequest: Validator = body => {
  const value = objectBody(body);
  const errors: string[] = [];
  if (!value) return { ok: false, errors: ['body must be an object'] };

  const step = value.step ?? 'intent_hint';
  if (typeof step !== 'string' || !COACH_STEPS.has(step)) {
    errors.push('step is invalid');
  }

  requiredString(value, 'missionId', errors, 160);
  requiredString(value, 'targetSkillId', errors, 160);
  optionalString(value, 'targetLanguage', errors, 80);
  optionalString(value, 'explanationLanguage', errors, 80);
  optionalString(value, 'characterName', errors, 160);
  optionalString(value, 'lastAssistantLine', errors, 4000);
  optionalString(value, 'learnerGoal', errors, 1000);
  optionalString(value, 'targetOpportunityId', errors, 200);
  optionalString(value, 'targetPhraseId', errors, 200);
  optionalString(value, 'targetPhraseForm', errors, 1500);

  return { ok: errors.length === 0, errors };
};

export const validateAssessmentRequest: Validator = body => {
  const value = objectBody(body);
  const errors: string[] = [];
  if (!value) return { ok: false, errors: ['body must be an object'] };

  requiredString(value, 'sessionId', errors, 160);
  requiredString(value, 'attemptId', errors, 160);
  optionalString(value, 'missionId', errors, 160);
  optionalString(value, 'language', errors, 32);

  const passages = arrayField(value, 'passages', errors, 200, true);
  passages.forEach((passage, index) =>
    validatePassage(passage, index, errors)
  );

  const phrases = arrayField(value, 'usefulPhrases', errors, 100);
  phrases.forEach((phrase, index) => {
    if (!phrase || typeof phrase !== 'object' || Array.isArray(phrase)) {
      errors.push(`usefulPhrases[${index}] must be an object`);
      return;
    }
    for (const key of ['id', 'form', 'meaning']) {
      if (typeof phrase[key] !== 'string') {
        errors.push(`usefulPhrases[${index}].${key} must be a string`);
      }
    }
    if (typeof phrase.form === 'string' && phrase.form.length > 1500) {
      errors.push(`usefulPhrases[${index}].form is too long`);
    }
  });

  const opportunities = arrayField(
    value,
    'opportunityInstances',
    errors,
    100
  );
  opportunities.forEach((opportunity, index) => {
    if (!opportunity || typeof opportunity !== 'object') {
      errors.push(`opportunityInstances[${index}] must be an object`);
      return;
    }
    for (const key of ['id', 'opportunityId', 'skillId', 'status', 'detection']) {
      if (typeof opportunity[key] !== 'string') {
        errors.push(
          `opportunityInstances[${index}].${key} must be a string`
        );
      }
    }
  });

  return { ok: errors.length === 0, errors };
};

export const validateSpeechRequest: Validator = body => {
  const value = objectBody(body);
  const errors: string[] = [];
  if (!value) return { ok: false, errors: ['body must be an object'] };

  requiredString(value, 'text', errors, 4000);
  optionalString(value, 'language', errors, 32);
  optionalString(value, 'locale', errors, 32);
  optionalString(value, 'voice', errors, 80);
  optionalString(value, 'voiceName', errors, 80);
  optionalString(value, 'style', errors, 1000);

  if (
    value.speed !== undefined &&
    (typeof value.speed !== 'number' ||
      !Number.isFinite(value.speed) ||
      value.speed < 0.5 ||
      value.speed > 1.5)
  ) {
    errors.push('speed must be a finite number between 0.5 and 1.5');
  }

  return { ok: errors.length === 0, errors };
};

export function validateBody(validator: Validator): RequestHandler {
  return (req, res, next) => {
    const result = validator(req.body);
    if (!result.ok) {
      res.status(400).json({
        error: 'invalid_request',
        details: result.errors,
      });
      return;
    }
    next();
  };
}
