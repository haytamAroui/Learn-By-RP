import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';

export type ProviderEndpoint =
  | 'realtime'
  | 'actor'
  | 'coach'
  | 'assessment'
  | 'speech';

type ConsentState = 'granted' | 'denied' | 'unknown';

export interface ProviderAccessDecision {
  ok: boolean;
  status: number;
  error?: string;
  identity?: string;
}

const RATE_LIMITS: Record<ProviderEndpoint, number> = {
  realtime: 12,
  actor: 60,
  coach: 30,
  assessment: 12,
  speech: 60,
};

const WINDOW_MS = 60_000;
const GUEST_ID = /^guest-[a-z0-9][a-z0-9._:-]{7,127}$/i;

function headerValue(req: Pick<Request, 'header'>, name: string): string {
  return (req.header(name) || '').trim();
}

function consent(req: Pick<Request, 'header'>, name: string): ConsentState {
  const value = headerValue(req, name).toLowerCase();
  return value === 'granted' || value === 'denied' ? value : 'unknown';
}

export function resolveProviderIdentity(
  req: Pick<Request, 'header'>
): ProviderAccessDecision {
  const authorization = headerValue(req, 'authorization');
  if (/^Bearer\s+\S+/i.test(authorization)) {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return {
      ok: true,
      status: 200,
      identity: `auth:${createHash('sha256').update(token).digest('hex').slice(0, 32)}`,
    };
  }

  const guestId = headerValue(req, 'x-learnbyrp-client-id');
  if (GUEST_ID.test(guestId)) {
    return { ok: true, status: 200, identity: `guest:${guestId}` };
  }

  return {
    ok: false,
    status: 401,
    error: 'A bounded guest or authenticated client identity is required',
  };
}

export function checkProviderAccess(
  req: Pick<Request, 'header'>,
  endpoint: ProviderEndpoint
): ProviderAccessDecision {
  const identity = resolveProviderIdentity(req);
  if (!identity.ok) return identity;

  if (
    (endpoint === 'realtime' || endpoint === 'speech') &&
    consent(req, 'x-learnbyrp-consent-voice') !== 'granted'
  ) {
    return {
      ok: false,
      status: 403,
      error: 'Voice processing consent is required',
      identity: identity.identity,
    };
  }

  if (
    endpoint === 'assessment' &&
    consent(req, 'x-learnbyrp-consent-saved-analysis') !== 'granted'
  ) {
    return {
      ok: false,
      status: 403,
      error: 'Saved-analysis consent is required',
      identity: identity.identity,
    };
  }

  return identity;
}

interface RateBucket {
  startedAt: number;
  count: number;
}

export class ProviderRateLimiter {
  private readonly buckets = new Map<string, RateBucket>();

  constructor(private readonly now: () => number = Date.now) {}

  take(identity: string, endpoint: ProviderEndpoint): boolean {
    const key = `${identity}:${endpoint}`;
    const time = this.now();
    const existing = this.buckets.get(key);
    const limit = RATE_LIMITS[endpoint];

    if (!existing || time - existing.startedAt >= WINDOW_MS) {
      this.buckets.set(key, { startedAt: time, count: 1 });
      return true;
    }

    if (existing.count >= limit) return false;
    existing.count += 1;
    return true;
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringWithin(value: unknown, max: number, required = false): boolean {
  if (value === undefined || value === null) return !required;
  return typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
}

function arrayWithin(value: unknown, max: number): boolean {
  return value === undefined || (Array.isArray(value) && value.length <= max);
}

export function validateProviderBody(
  endpoint: ProviderEndpoint,
  body: unknown
): string | null {
  if (!record(body)) return 'Request body must be a JSON object';

  if (endpoint === 'realtime') {
    if (!stringWithin(body.targetLanguage, 64)) return 'Invalid targetLanguage';
    if (!stringWithin(body.explanationLanguage, 64)) return 'Invalid explanationLanguage';
    if (!stringWithin(body.instructions, 2_000)) return 'Instructions are too long';
    if (!stringWithin(body.voice, 128)) return 'Invalid voice';
    return null;
  }

  if (endpoint === 'actor') {
    if (!stringWithin(body.userMessage, 4_000, true)) return 'userMessage is required and must be at most 4000 characters';
    if (!stringWithin(body.setting, 2_000)) return 'setting is too long';
    if (!stringWithin(body.learnerGoal, 1_000)) return 'learnerGoal is too long';
    if (!stringWithin(body.targetLanguage, 64)) return 'Invalid targetLanguage';
    if (!stringWithin(body.explanationLanguage, 64)) return 'Invalid explanationLanguage';
    if (!arrayWithin(body.allowedActions, 32)) return 'Too many allowedActions';
    if (!arrayWithin(body.recentPassages, 40)) return 'Too many recentPassages';
    if (body.sceneFacts !== undefined && !record(body.sceneFacts)) return 'sceneFacts must be an object';
    return null;
  }

  if (endpoint === 'coach') {
    if (!stringWithin(body.missionId, 160, true)) return 'missionId is required';
    if (!stringWithin(body.targetSkillId, 160, true)) return 'targetSkillId is required';
    if (!stringWithin(body.lastAssistantLine, 4_000)) return 'lastAssistantLine is too long';
    if (!stringWithin(body.learnerGoal, 1_000)) return 'learnerGoal is too long';
    if (!['intent_hint', 'partial_form', 'full_form', 'explanation'].includes(String(body.step ?? 'intent_hint'))) {
      return 'Invalid coach hint step';
    }
    return null;
  }

  if (endpoint === 'assessment') {
    if (!stringWithin(body.sessionId, 160, true)) return 'sessionId is required';
    if (!stringWithin(body.attemptId, 160, true)) return 'attemptId is required';
    if (!stringWithin(body.missionId, 160)) return 'Invalid missionId';
    if (!arrayWithin(body.passages, 200)) return 'Too many passages';
    if (!arrayWithin(body.usefulPhrases, 120)) return 'Too many usefulPhrases';
    if (!arrayWithin(body.opportunityInstances, 120)) return 'Too many opportunityInstances';
    return null;
  }

  if (!stringWithin(body.text, 2_000, true)) return 'text is required and must be at most 2000 characters';
  if (!stringWithin(body.language, 64)) return 'Invalid language';
  if (!stringWithin(body.locale, 64)) return 'Invalid locale';
  if (!stringWithin(body.voice, 128)) return 'Invalid voice';
  return null;
}

export function createProviderGuard() {
  const limiter = new ProviderRateLimiter();

  return function guard(
    req: Request,
    res: Response,
    endpoint: ProviderEndpoint
  ): boolean {
    const access = checkProviderAccess(req, endpoint);
    if (!access.ok || !access.identity) {
      res.status(access.status).json({ error: access.error });
      return false;
    }

    const bodyError = validateProviderBody(endpoint, req.body);
    if (bodyError) {
      res.status(400).json({ error: bodyError });
      return false;
    }

    if (!limiter.take(access.identity, endpoint)) {
      res.status(429).json({ error: 'Too many requests. Try again shortly.' });
      return false;
    }

    return true;
  };
}
