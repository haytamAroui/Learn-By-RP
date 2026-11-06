/**
 * Avatar readiness.
 *
 * A 3D avatar is an asset that arrives after the session starts. The tutor
 * must not start speaking into an empty frame, and the first line must not be
 * spent on a character the learner cannot see yet.
 *
 * The stage reports when it is on screen, and the session waits for it before
 * the first line. A timeout keeps a slow device from stalling the session: the
 * line is spoken either way, and the mouth catches up when the model arrives.
 */
type ReadinessListener = (ready: boolean) => void;

let ready = false;
const listeners = new Set<ReadinessListener>();

export function isAvatarReady(): boolean {
  return ready;
}

export function setAvatarReady(next: boolean): void {
  if (ready === next) return;
  ready = next;
  for (const listener of [...listeners]) {
    try {
      listener(ready);
    } catch {
      // A failing listener must not stop the session.
    }
  }
}

export function subscribeAvatarReadiness(listener: ReadinessListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Resolves true when the avatar is on screen, false when the wait timed out.
 */
export function waitForAvatarReady(timeoutMs: number): Promise<boolean> {
  if (ready) return Promise.resolve(true);
  return new Promise<boolean>(resolve => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve(value);
    };
    const timer = setTimeout(() => finish(false), Math.max(0, timeoutMs));
    const unsubscribe = subscribeAvatarReadiness(() => finish(true));
  });
}

/** Test hook. */
export function resetAvatarReadiness(): void {
  ready = false;
  listeners.clear();
}
