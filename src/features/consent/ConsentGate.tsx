import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../components/AppText';
import { useRouter, useSegments } from 'expo-router';
import { useArchive } from '../archive/ArchiveProvider';
import { CONSENT_VERSION } from '../archive/schema';

/**
 * Blocks the app until the learner has made an explicit, recorded decision about
 * voice processing and saved-history analysis. The two scopes are separate, and
 * neither defaults to granted: the archive seeds both to false.
 */
export const ConsentGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();
  const { ready, error, consent } = useArchive();
  const [redirected, setRedirected] = useState(false);

  const onOnboarding = segments[0] === 'onboarding';
  const onRecovery = segments[0] === 'recovery';

  useEffect(() => {
    if (!ready || redirected || onOnboarding || onRecovery) return;

    if (error) return;

    if (!consent.voice || !consent.savedAnalysis) {
      router.replace('/onboarding');
      setRedirected(true);
    }
  }, [ready, error, onOnboarding, onRecovery, consent.voice, consent.savedAnalysis, redirected, router]);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <Text className="text-xs text-muted">Opening your archive…</Text>
      </View>
    );
  }

  return <>{children}</>;
};

export { CONSENT_VERSION };
