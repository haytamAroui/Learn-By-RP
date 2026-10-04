import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  LifecycleEvent,
  LifecycleState,
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

  dispatch: (event: LifecycleEvent) => Promise<void>;
  start: (sessionId: string, state?: LifecycleState) => void;
  reset: () => void;
}

const SessionContext = createContext<SessionCoordinator | null>(null);

export const SessionProvider: React.FC<{
  children: React.ReactNode;
  onPersist?: (sessionId: string, sessionState: string) => Promise<void>;
}> = ({ children, onPersist }) => {
  const [state, setState] = useState<LifecycleState>('created');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const currentRef = useRef({ id: null as string | null, state: 'created' as LifecycleState });
  const persistTail = useRef(Promise.resolve());

  const start = useCallback((id: string, initialState: LifecycleState = 'created') => {
    currentRef.current = { id, state: initialState };
    setSessionId(id);
    setState(initialState);
    setReconnectAttempts(0);
    setLastError(null);
  }, []);

  const reset = useCallback(() => {
    currentRef.current = { id: null, state: 'created' };
    setSessionId(null);
    setState('created');
    setReconnectAttempts(0);
    setLastError(null);
  }, []);

  const dispatch = useCallback(
    (event: LifecycleEvent) => {
        const { id, state: current } = currentRef.current;
        const next = reduceLifecycle(current, event);
        if (next === current) return persistTail.current;
        currentRef.current = { id, state: next };
        setState(next);

        if (event === 'CONNECTION_LOST') {
          setReconnectAttempts(attempts => attempts + 1);
        }
        if (next === 'live' || next === 'ended') {
          setReconnectAttempts(0);
        }

        const write = persistTail.current.then(async () => {
          if (id) await onPersist?.(id, toSessionState(next));
        });
        persistTail.current = write.catch(error => {
          setLastError(error instanceof Error ? error.message : 'Could not save session state');
        });
        return write;
    },
    [onPersist]
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
