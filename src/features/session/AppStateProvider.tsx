import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SessionProvider } from './SessionProvider';
import { archiveRepository } from '../archive/archiveRepository';

/**
 * Wires the session coordinator to the archive so lifecycle transitions are
 * persisted. Placed above the router because a session outlives any one screen.
 */
export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const persist = useCallback((sessionId: string, sessionState: string) => {
    void archiveRepository.saveSessionState(sessionId, sessionState as never);
  }, []);

  return <SessionProvider onPersist={persist}>{children}</SessionProvider>;
};

/** Consent gate state, shared so every screen reads the same decision. */
interface ConsentState {
  voiceGranted: boolean;
  analysisGranted: boolean;
  version: string;
}

const ConsentStateContext = createContext<ConsentState | null>(null);

export const ConsentStateProvider: React.FC<{
  children: React.ReactNode;
  voiceGranted: boolean;
  analysisGranted: boolean;
  version: string;
}> = ({ children, voiceGranted, analysisGranted, version }) => {
  const value = useMemo(
    () => ({ voiceGranted, analysisGranted, version }),
    [analysisGranted, version, voiceGranted]
  );
  return <ConsentStateContext.Provider value={value}>{children}</ConsentStateContext.Provider>;
};

export function useConsentState(): ConsentState {
  const context = useContext(ConsentStateContext);
  if (!context) {
    return { voiceGranted: false, analysisGranted: false, version: 'unknown' };
  }
  return context;
}

/** Screen-boot gate: shows a splash while the archive opens. */
export const BootGate: React.FC<{ ready: boolean; error: string | null; children: React.ReactNode }> = ({
  ready,
  error,
  children,
}) => {
  const [visible, setVisible] = useState(!ready);

  useEffect(() => {
    if (ready) {
      const timer = setTimeout(() => setVisible(false), 0);
      return () => clearTimeout(timer);
    }
  }, [ready]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf9f5' }}>
        <ActivityIndicator color="#d97757" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#faf9f5' }}>
        <Text style={{ color: '#5e5d59', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  return <>{children}</>;
};
