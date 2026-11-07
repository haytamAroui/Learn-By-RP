import type { Request, Response } from 'express';
import { verifyGuestIdentityToken } from './guestIdentity';
import { InMemoryRateLimitStore, type RateLimitStore } from './rateLimitStore';

export type ProviderEndpoint =
  | 'realtime'
  | 'actor'
  | 'coach'
  | 'assessment'
  | 'speech'
  | 'scene';

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
  scene: 120,
};

const WINDOW_MS = 60_000;
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
    const identity = verifyGuestIdentityToken(token);
    if (identity) return { ok: true, status: 200, identity };
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
    endpoint === 'realtime' &&
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

/**
 * Per-identity, per-endpoint quota.
 *
 * State lives in a `RateLimitStore` rather than in this class. It used to be a `Map`
 * here, which enforces the limit correctly for one process and not for two: behind a
 * load balancer every instance kept its own buckets, so a client could send
 * `limit x instances` requests per window and each instance would consider it within
 * quota. The bound looked enforced in tests because a test only ever has one instance.
 *
 * The store is injected so a single process can share one budget with its siblings, and
 * so tests can drive the clock without sleeping.
 */
export class ProviderRateLimiter {
  private readonly store: RateLimitStore;

  /**
   * @param now Clock, injectable so expiry can be tested.
   * @param store Shared quota state. Defaults to per-process, which is correct for one
   *   instance and wrong for many - see `createRateLimitStore`.
   */
  constructor(
    private readonly now: () => number = Date.now,
    store?: RateLimitStore
  ) {
    this.store = store ?? new InMemoryRateLimitStore();
  }

  take(identity: string, endpoint: ProviderEndpoint): boolean {
    return this.store.take(
      `${identity}:${endpoint}`,
      RATE_LIMITS[endpoint],
      WINDOW_MS,
      this.now()
    );
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
    if (!stringWithin(body.missionId, 160, true)) return 'missionId is required';
    if (!Number.isInteger(body.missionVersion) || Number(body.missionVersion) < 1) return 'missionVersion is required';
    if (body.sceneId !== undefined && !stringWithin(body.sceneId, 160, true)) return 'Invalid sceneId';
    if (body.sceneVersion !== undefined && (!Number.isInteger(body.sceneVersion) || Number(body.sceneVersion) < 1)) return 'Invalid sceneVersion';
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

/**
 * Builds the provider middleware guard.
 *
 * Pass a shared `store` when more than one instance serves this deployment; without one
 * each instance enforces its own quota and the effective limit scales with the instance
 * count. `createRateLimitStore()` resolves that from the environment.
 */
export function createProviderGuard(store?: RateLimitStore) {
  const limiter = new ProviderRateLimiter(Date.now, store);

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
