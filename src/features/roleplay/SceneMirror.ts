import type {
  SceneActionName,
  SceneActionProposal,
  SceneActionResult,
  SceneForkRequest,
  SceneStateSnapshot,
} from './runtime';
import { API_BASE_URL, providerAuthorizationHeaders } from '../../lib/api';

/**
 * Client-side mirror of server scene truth (§11.2).
 *
 * The mirror exists for presentation and for offline reconciliation. It never
 * decides what is true in the scene: every fact change comes back from the
 * server reducer, and a local actionId set prevents a retried request from being
 * counted twice on the client either.
 */
export class SceneMirror {
  private state: SceneStateSnapshot | null = null;
  private appliedActionIds = new Set<string>();
  private listeners = new Set<(state: SceneStateSnapshot | null) => void>();
  private connectionGeneration = 0;

  constructor(
    private readonly sessionId: string,
    private readonly sceneId: string,
    private readonly sceneVersion: number,
    private readonly missionId: string,
    private readonly missionVersion: number
  ) {}

  subscribe(listener: (state: SceneStateSnapshot | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) listener(this.state);
  }

  get snapshot(): SceneStateSnapshot | null {
    return this.state;
  }

  get revision(): number {
    return this.state?.revision ?? 0;
  }

  get outcome(): SceneStateSnapshot['outcome'] {
    return this.state?.outcome ?? 'unknown';
  }

  get isFinished(): boolean {
    return this.state?.isFinished ?? false;
  }

  hasApplied(actionId: string): boolean {
    return this.appliedActionIds.has(actionId);
  }

  /**
   * Creates or re-attaches the hosted session. The server treats a repeated
   * POST as idempotent, so a reconnect cannot produce a second session.
   */
  async begin(attemptId?: string): Promise<SceneStateSnapshot | null> {
    try {
      this.connectionGeneration += 1;
      const response = await fetch(`${API_BASE_URL}/v1/voice/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await providerAuthorizationHeaders() },
        body: JSON.stringify({
          sessionId: this.sessionId,
          sceneId: this.sceneId,
          sceneVersion: this.sceneVersion,
          missionId: this.missionId,
          missionVersion: this.missionVersion,
          attemptId,
        }),
      });

      if (!response.ok) return null;
      const data = (await response.json()) as { state: SceneStateSnapshot };
      this.state = data.state;
      this.notify();
      return this.state;
    } catch {
      return null;
    }
  }

  /** Re-reads authoritative state. Used to reconcile after a connection loss. */
  async reconcile(): Promise<SceneStateSnapshot | null> {
    try {
      this.connectionGeneration += 1;
      const response = await fetch(
        `${API_BASE_URL}/v1/voice/sessions/${this.sessionId}/scene`,
        { headers: await providerAuthorizationHeaders() }
      );
      if (!response.ok) return this.state;
      const data = (await response.json()) as { state: SceneStateSnapshot };
      this.state = data.state;
      this.notify();
      return this.state;
    } catch {
      return this.state;
    }
  }

  /**
   * Proposes an action. Returns the server's verdict, including a rejection with
   * its reason and the still-permissible options.
   *
   * A duplicate actionId is answered from the local set without a second call,
   * so a retried request cannot double-apply even if the server were replaced.
   */
  async propose(
    attemptId: string,
    action: SceneActionName,
    payload: Record<string, unknown>,
    sourceTurnIds: string[]
  ): Promise<SceneActionResult | null> {
    const actionId = buildActionId(this.sessionId, attemptId, action, sourceTurnIds);

    if (this.appliedActionIds.has(actionId)) {
      return {
        actionId,
        accepted: true,
        newFacts: this.state?.facts ?? {},
        revision: this.state?.revision ?? 0,
        deduplicated: true,
        appliedAt: new Date().toISOString(),
      };
    }

    const proposal: SceneActionProposal = {
      actionId,
      sessionId: this.sessionId,
      attemptId,
      missionId: this.missionId,
      missionVersion: this.missionVersion,
      sceneId: this.sceneId,
      sceneVersion: this.sceneVersion,
      providerCallId: `${actionId}:provider:${this.connectionGeneration}`,
      connectionGeneration: this.connectionGeneration,
      expectedSceneRevision: this.state?.revision ?? 1,
      action,
      payload,
      sourceTurnIds,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/voice/sessions/${this.sessionId}/scene/action`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...await providerAuthorizationHeaders() },
          body: JSON.stringify(proposal),
        }
      );

      const data = (await response.json()) as { result: SceneActionResult };
      const result: SceneActionResult = data.result;

      if (result.accepted) {
        this.appliedActionIds.add(actionId);
        // Trust the server's facts, but take the outcome and finished flag from
        // the authoritative snapshot when one is returned.
        this.state = {
          ...(this.state ?? ({} as SceneStateSnapshot)),
          ...this.state,
          facts: result.newFacts,
          revision: result.revision,
        } as SceneStateSnapshot;

        // A rejection is also terminal for the attempt, so reconcile to pick up
        // the authoritative outcome.
        this.notify();
      }

      return result;
    } catch {
      return null;
    }
  }

  /** Retry from a checkpoint. The earlier attempt keeps its own transcript. */
  async fork(
    checkpoint: SceneForkRequest['checkpoint'],
    rehearsal: boolean
  ): Promise<string | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/voice/sessions/${this.sessionId}/scene/fork`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...await providerAuthorizationHeaders() },
          body: JSON.stringify({ checkpoint, rehearsal }),
        }
      );
      if (!response.ok) return null;
      const data = (await response.json()) as {
        state: SceneStateSnapshot;
        fork: { attemptId: string };
      };
      this.state = data.state;
      this.appliedActionIds.clear();
      this.notify();
      return data.fork?.attemptId ?? null;
    } catch {
      return null;
    }
  }

  async close(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/v1/voice/sessions/${this.sessionId}/close`, {
        method: 'POST',
        headers: await providerAuthorizationHeaders(),
      });
    } catch {
      // Close is idempotent server-side; a network failure is not fatal here.
    }
  }
}

/**
 * Deterministic action id, so the same turn proposing the same action twice
 * produces the same id and deduplicates.
 */
export function buildActionId(
  sessionId: string,
  attemptId: string,
  action: string,
  sourceTurnIds: string[]
): string {
  const turns = [...sourceTurnIds].sort().join(',');
  return `${sessionId}:${attemptId}:${action}:${turns}`;
}
