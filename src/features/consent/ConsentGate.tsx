import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useArchive } from '../archive/ArchiveProvider';
import { CONSENT_VERSION } from '../archive/schema';
import type { ConsentRecord } from '../archive/ArchiveRepository.types';

export function consentDecisionsComplete(
  voice: ConsentRecord | null,
  savedAnalysis: ConsentRecord | null
): boolean {
  // null = undecided. A false record is still a valid explicit refusal and must
  // not force the learner back through onboarding.
  return Boolean(voice && savedAnalysis);
}

/**
 * Blocks the app only until both consent scopes have an explicit decision.
 * Grant and refusal are equally valid decisions; feature enforcement happens at
 * the relevant local/server boundary.
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

    if (!consentDecisionsComplete(consent.voice, consent.savedAnalysis)) {
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
