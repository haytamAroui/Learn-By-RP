import express, { Request, Response } from 'express';
import {
  applySceneAction,
  closeHostedSession,
  createHostedSession,
  forkScene,
  getHostedSession,
  getSceneSnapshot,
  listAbandonedSessions,
  reconcileHostedSession,
} from '../../src/features/roleplay/sceneStore';
import { getScene, SCENES } from '../../src/content/scenes';
import { MISSION_CATALOG } from '../../src/data/missions';
import {
  SCENE_CONTRACT_VERSION,
  type SceneActionProposal,
  type SceneForkRequest,
} from '../../src/features/roleplay/runtime';

/**
 * Hosted session + scene runtime (§11.9, §14).
 *
 * The backend owns scene truth. The client holds a mirror for presentation and
 * reconciles against these routes; it never decides what is true in the scene.
 *
 * Scene state is durable, so an abandoned session is reconciled by a recovery
 * worker rather than vanishing when the process dies.
 */
export const roleplayRouter = express.Router();

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw Object.assign(new Error(`${field} is required`), { status: 400 });
  }
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw Object.assign(new Error(`${field} must be a number`), { status: 400 });
  }
  return value;
}

function requireInteger(
  value: unknown,
  field: string,
  minimum = 0
): number {
  const number = requireNumber(value, field);
  if (!Number.isInteger(number) || number < minimum) {
    throw Object.assign(
      new Error(`${field} must be an integer >= ${minimum}`),
      { status: 400 }
    );
  }
  return number;
}

/** Every handler is async; this keeps the error mapping in one place. */
function wrap(handler: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response) => {
    handler(req, res).catch((error: any) => {
      const status = error?.status ?? 500;
      if (status >= 500) {
        console.error('Scene runtime error:', error);
      }
      res.status(status).json({ error: error?.message ?? 'Scene runtime failure' });
    });
  };
}

// ------------------------------------------------------------------- lifecycle

roleplayRouter.post(
  '/v1/voice/sessions',
  wrap(async (req, res) => {
    const {
      sessionId,
      sceneId,
      sceneVersion,
      missionId,
      missionVersion,
      attemptId,
    } = req.body ?? {};

    const id = requireString(sessionId, 'sessionId');
    const scene = getScene(requireString(sceneId, 'sceneId'));

    if (!scene) {
      res.status(404).json({ error: `Unknown scene: ${sceneId}` });
      return;
    }

    // Idempotent create: re-posting the same sessionId returns the existing
    // record rather than starting a second one.
    const existing = await getHostedSession(id);
    if (existing) {
      res.status(200).json({
        sessionId: existing.sessionId,
        state: existing.state,
        contractVersion: SCENE_CONTRACT_VERSION,
        created: false,
      });
      return;
    }

    const pinnedMissionId = requireString(missionId ?? scene.missionId, 'missionId');
    const mission = MISSION_CATALOG.find(item => item.id === pinnedMissionId);
    if (!mission) {
      res.status(404).json({ error: `Unknown mission: ${pinnedMissionId}` });
      return;
    }

    const requestedSceneVersion =
      sceneVersion === undefined ? scene.version : requireNumber(sceneVersion, 'sceneVersion');
    const requestedMissionVersion =
      missionVersion === undefined
        ? mission.version
        : requireNumber(missionVersion, 'missionVersion');

    if (requestedSceneVersion !== scene.version) {
      res.status(409).json({ error: 'sceneVersion does not match released scene' });
      return;
    }
    if (requestedMissionVersion !== mission.version) {
      res.status(409).json({ error: 'missionVersion does not match released mission' });
      return;
    }

    const record = await createHostedSession({
      sessionId: id,
      sceneId: scene.id,
      sceneVersion: requestedSceneVersion,
      missionId: pinnedMissionId,
      missionVersion: requestedMissionVersion,
      attemptId: typeof attemptId === 'string' ? attemptId : undefined,
    });

    res.status(201).json({
      sessionId: record.sessionId,
      state: record.state,
      contractVersion: SCENE_CONTRACT_VERSION,
      created: true,
    });
  })
);

roleplayRouter.get(
  '/v1/voice/sessions/:id',
  wrap(async (req, res) => {
    const record = await getHostedSession(req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Unknown session' });
      return;
    }
    res.json({
      sessionId: record.sessionId,
      state: record.state,
      attempts: record.attempts,
      createdAt: record.createdAt,
      closedAt: record.closedAt ?? null,
      reconciledAt: record.reconciledAt ?? null,
    });
  })
);

roleplayRouter.post(
  '/v1/voice/sessions/:id/close',
  wrap(async (req, res) => {
    // Close is idempotent; a second call returns the same closed session.
    const record = await closeHostedSession(req.params.id);
    res.json({ sessionId: record.sessionId, closed: true, closedAt: record.closedAt });
  })
);

// ------------------------------------------------------------------ scene truth

roleplayRouter.get(
  '/v1/voice/sessions/:id/scene',
  wrap(async (req, res) => {
    const snapshot = await getSceneSnapshot(req.params.id);
    if (!snapshot) {
      res.status(404).json({ error: 'Unknown session' });
      return;
    }
    res.json({ state: snapshot });
  })
);

roleplayRouter.post(
  '/v1/voice/sessions/:id/scene/action',
  wrap(async (req, res) => {
    const body = req.body ?? {};

    const proposal: SceneActionProposal = {
      actionId: requireString(body.actionId, 'actionId'),
      sessionId: requireString(body.sessionId ?? req.params.id, 'sessionId'),
      attemptId: requireString(body.attemptId, 'attemptId'),
      missionId: requireString(body.missionId, 'missionId'),
      missionVersion: requireNumber(body.missionVersion, 'missionVersion'),
      sceneId: requireString(body.sceneId, 'sceneId'),
      sceneVersion: requireNumber(body.sceneVersion, 'sceneVersion'),
      providerCallId: requireString(body.providerCallId, 'providerCallId'),
      connectionGeneration: requireNumber(
        body.connectionGeneration,
        'connectionGeneration'
      ),
      expectedSceneRevision: requireNumber(body.expectedSceneRevision, 'expectedSceneRevision'),
      action: requireString(body.action, 'action'),
      payload: body.payload ?? {},
      sourceTurnIds: Array.isArray(body.sourceTurnIds) ? body.sourceTurnIds : [],
    };

    if (proposal.sessionId !== req.params.id) {
      res.status(400).json({ error: 'Proposal sessionId does not match the route' });
      return;
    }

    // The reducer's verdict is returned verbatim. A rejection carries a reason
    // and the still-permissible options; actor speech cannot override it.
    const result = await applySceneAction(proposal);
    res.status(result.accepted ? 200 : 409).json({ result });
  })
);

roleplayRouter.post(
  '/v1/voice/sessions/:id/scene/fork',
  wrap(async (req, res) => {
    const rawCheckpoint = req.body?.checkpoint ?? {};
    if (
      !Array.isArray(rawCheckpoint.completedOpportunityIds) ||
      rawCheckpoint.completedOpportunityIds.some(
        (id: unknown) => typeof id !== 'string' || !id
      )
    ) {
      throw Object.assign(
        new Error('checkpoint.completedOpportunityIds must be an array of ids'),
        { status: 400 }
      );
    }

    const request: SceneForkRequest = {
      checkpoint: {
        id: requireString(rawCheckpoint.id, 'checkpoint.id'),
        sceneRevision: requireInteger(
          rawCheckpoint.sceneRevision,
          'checkpoint.sceneRevision',
          1
        ),
        passageIndex: requireInteger(
          rawCheckpoint.passageIndex,
          'checkpoint.passageIndex'
        ),
        supportLedgerHighWaterMark: requireInteger(
          rawCheckpoint.supportLedgerHighWaterMark,
          'checkpoint.supportLedgerHighWaterMark'
        ),
        completedOpportunityIds: rawCheckpoint.completedOpportunityIds,
      },
      rehearsal: Boolean(req.body?.rehearsal),
    };

    const fork = await forkScene(req.params.id, request);
    const state = await getSceneSnapshot(req.params.id);
    res.json({ fork, state });
  })
);

// -------------------------------------------------------------------- recovery

roleplayRouter.get(
  '/v1/voice/sessions-abandoned',
  wrap(async (_req, res) => {
    const abandoned = await listAbandonedSessions();
    res.json({ abandoned });
  })
);

roleplayRouter.post(
  '/v1/voice/sessions/:id/reconcile',
  wrap(async (req, res) => {
    // Idempotent: replaying the same accepted verdicts yields the same snapshot.
    const record = await reconcileHostedSession(req.params.id);
    res.json({
      sessionId: record.sessionId,
      reconciledAt: record.reconciledAt,
      state: record.state,
    });
  })
);

// -------------------------------------------------------------------- catalog

roleplayRouter.get(
  '/v1/scenes',
  wrap(async (_req, res) => {
    res.json({
      scenes: Object.values(SCENES).map(scene => ({
        id: scene.id,
        version: scene.version,
        missionId: scene.missionId,
        language: scene.language,
        reviewStatus: scene.reviewStatus,
        completionSignals: scene.completion.map(c => c.name),
      })),
    });
  })
);

roleplayRouter.get(
  '/v1/scenes/:sceneId/:version',
  wrap(async (req, res) => {
    const scene = getScene(req.params.sceneId);
    if (!scene) {
      res.status(404).json({ error: 'Unknown scene' });
      return;
    }
    if (String(scene.version) !== req.params.version) {
      res.status(404).json({ error: 'Unknown scene version' });
      return;
    }
    res.json({ scene });
  })
);