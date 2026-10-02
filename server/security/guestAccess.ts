import { createHash, randomBytes } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export type ConsentScope = 'voice' | 'saved_analysis';

export interface ServerConsentDecision {
  scope: ConsentScope;
  granted: boolean;
  version: string;
  decidedAt: string;
}

interface GuestRecord {
  id: string;
  tokenHash: string;
  createdAt: number;
  expiresAt: number;
  consents: Map<ConsentScope, ServerConsentDecision>;
}

export interface GuestAccessRegistry {
  createGuest(): { token: string; guestId: string; expiresAt: string };
  recordConsent(
    token: string,
    decision: Omit<ServerConsentDecision, 'decidedAt'> & { decidedAt?: string }
  ): ServerConsentDecision | null;
  getGuest(token: string): GuestRecord | null;
  requireGuest: RequestHandler;
  requireConsent(scope: ConsentScope): RequestHandler;
}

declare global {
  namespace Express {
    interface Request {
      guestAccess?: {
        guestId: string;
        expiresAt: number;
      };
    }
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function bearerToken(req: Request): string | null {
  const authorization = req.header('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function createGuestAccessRegistry(input?: {
  ttlMs?: number;
  now?: () => number;
}): GuestAccessRegistry {
  const ttlMs = input?.ttlMs ?? 24 * 60 * 60 * 1000;
  const now = input?.now ?? Date.now;
  const guests = new Map<string, GuestRecord>();

  function getGuest(token: string): GuestRecord | null {
    const tokenHash = hashToken(token);
    const record = guests.get(tokenHash);
    if (!record) return null;
    if (record.expiresAt <= now()) {
      guests.delete(tokenHash);
      return null;
    }
    return record;
  }

  function authenticate(req: Request, res: Response): GuestRecord | null {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'guest_access_required' });
      return null;
    }

    const record = getGuest(token);
    if (!record) {
      res.status(401).json({ error: 'guest_access_invalid_or_expired' });
      return null;
    }

    req.guestAccess = {
      guestId: record.id,
      expiresAt: record.expiresAt,
    };
    return record;
  }

  return {
    createGuest() {
      const token = randomBytes(32).toString('base64url');
      const tokenHash = hashToken(token);
      const createdAt = now();
      const record: GuestRecord = {
        id: randomBytes(16).toString('hex'),
        tokenHash,
        createdAt,
        expiresAt: createdAt + ttlMs,
        consents: new Map(),
      };
      guests.set(tokenHash, record);

      return {
        token,
        guestId: record.id,
        expiresAt: new Date(record.expiresAt).toISOString(),
      };
    },

    recordConsent(token, decision) {
      const record = getGuest(token);
      if (!record) return null;

      const normalized: ServerConsentDecision = {
        scope: decision.scope,
        granted: decision.granted,
        version: decision.version,
        decidedAt: decision.decidedAt ?? new Date(now()).toISOString(),
      };
      record.consents.set(decision.scope, normalized);
      return normalized;
    },

    getGuest,

    requireGuest(req: Request, res: Response, next: NextFunction) {
      if (!authenticate(req, res)) return;
      next();
    },

    requireConsent(scope: ConsentScope): RequestHandler {
      return (req, res, next) => {
        const record = authenticate(req, res);
        if (!record) return;

        const consent = record.consents.get(scope);
        if (!consent || consent.granted !== true) {
          res.status(403).json({
            error: 'consent_required',
            scope,
            decided: Boolean(consent),
          });
          return;
        }

        next();
      };
    },
  };
}

export function readBearerToken(req: Request): string | null {
  return bearerToken(req);
}
