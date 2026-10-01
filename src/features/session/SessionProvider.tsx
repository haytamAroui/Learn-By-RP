import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  LifecycleEvent,
  LifecycleState,
  isTerminal,
  reduceLifecycle,
  toSessionState,
} from './lifecycle';

/**
 * Session coordinator.
 *
 * Owns the lifecycle reducer, persists each transition to the archive so an
 * app kill leaves a recoverable state, and refuses to retry while a hosted
 * creation might already have been billed.
 */
interface SessionCoordinator {
  state: LifecycleState;
  sessionId: string | null;
  lastError: string | null;
  reconnectAttempts: number;

  dispatch: (event: LifecycleEvent) => void;
  start: (sessionId: string) => void;
  reset: () => void;
}

const SessionContext = createContext<SessionCoordinator | null>(null);

export const SessionProvider: React.FC<{
  children: React.ReactNode;
  onPersist?: (sessionId: string, sessionState: string) => void;
}> = ({ children, onPersist }) => {
  const [state, setState] = useState<LifecycleState>('created');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const start = useCallback((id: string) => {
    setSessionId(id);
    setState('created');
    setReconnectAttempts(0);
    setLastError(null);
  }, []);

  const reset = useCallback(() => {
    setSessionId(null);
    setState('created');
    setReconnectAttempts(0);
    setLastError(null);
  }, []);

  const dispatch = useCallback(
    (event: LifecycleEvent) => {
      setState(current => {
        const next = reduceLifecycle(current, event);

        if (next === current) {
          return current;
        }

        if (event === 'CONNECTION_LOST') {
          setReconnectAttempts(attempts => attempts + 1);
        }
        if (next === 'live' || next === 'ended') {
          setReconnectAttempts(0);
        }

        if (sessionId && !isTerminal(next)) {
          onPersist?.(sessionId, toSessionState(next));
        }

        return next;
      });
    },
    [onPersist, sessionId]
  );

  const value = useMemo<SessionCoordinator>(
    () => ({ state, sessionId, lastError, reconnectAttempts, dispatch, start, reset }),
    [dispatch, lastError, reconnectAttempts, reset, sessionId, start, state]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export function useSessionCoordinator(): SessionCoordinator {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionCoordinator must be used within a SessionProvider');
  }
  return context;
}
