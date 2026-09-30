import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TalkScreen } from './components/TalkScreen';
import { MissionsScreen } from './components/MissionsScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { MissionBriefingModal } from './components/MissionBriefingModal';
import { LiveSessionView } from './components/LiveSessionView';
import { RecapModal } from './components/RecapModal';
import { SettingsModal } from './components/SettingsModal';
import { DuePhrasesPracticeModal } from './components/DuePhrasesPracticeModal';
import { MISSION_CATALOG } from './data/missions';
import { ArchiveStorage } from './features/archive/storage';
import {
  LanguageCode,
  UiLanguage,
  MissionDefinition,
  Mode,
  PhraseItem,
  SessionRecord,
  UserPreferences,
  LearningObservation
} from './types';
import { I18nProvider, getTranslations } from './features/i18n';
import { ThemeProvider } from './features/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<'talk' | 'missions' | 'progress'>('talk');
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    ArchiveStorage.getPreferences()
  );
  const [sessions, setSessions] = useState<SessionRecord[]>(() =>
    ArchiveStorage.getSessions()
  );
  const [phrases, setPhrases] = useState<PhraseItem[]>(() =>
    ArchiveStorage.getPhrases()
  );
  const [observations, setObservations] = useState<LearningObservation[]>(() =>
    ArchiveStorage.getObservations()
  );

  // Modals & Active Flows
  const [activeMissionBriefing, setActiveMissionBriefing] = useState<MissionDefinition | null>(null);
  const [activeLiveSession, setActiveLiveSession] = useState<{
    mission: MissionDefinition;
    mode: Mode;
    coldAttempt: boolean;
  } | null>(null);
  const [activeRecapSession, setActiveRecapSession] = useState<SessionRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPracticeDueOpen, setIsPracticeDueOpen] = useState<boolean>(false);

  // Filter missions by selected language
  const availableMissions = MISSION_CATALOG.filter(
    m => m.language === preferences.learningLanguage
  );
  const featuredMission = availableMissions[0] || MISSION_CATALOG[0];

  const duePhrases = phrases.filter(p => p.scheduling.due);
  const lastSession = sessions[0];

  const refreshState = () => {
    setSessions(ArchiveStorage.getSessions());
    setPhrases(ArchiveStorage.getPhrases());
    setObservations(ArchiveStorage.getObservations());
  };

  const handleStartBriefing = (mission: MissionDefinition) => {
    setActiveMissionBriefing(mission);
  };

  const handleStartSession = (
    mission: MissionDefinition,
    mode: Mode,
    isColdAttempt: boolean
  ) => {
    setActiveMissionBriefing(null);
    setActiveLiveSession({
      mission,
      mode,
      coldAttempt: isColdAttempt
    });
  };

  const handleEndSession = (session: SessionRecord) => {
    ArchiveStorage.saveSession(session);
    refreshState();
    setActiveLiveSession(null);
    setActiveRecapSession(session);
  };

  const handleDisputeObservation = (obsId: string) => {
    ArchiveStorage.deleteObservation(obsId);
    refreshState();
  };

  const handleHideObservation = (obsId: string) => {
    ArchiveStorage.hideObservation(obsId);
    refreshState();
  };

  const handleClearAllData = () => {
    ArchiveStorage.clearAllLearningData();
    refreshState();
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    const updated = { ...preferences, learningLanguage: lang };
    setPreferences(updated);
    ArchiveStorage.savePreferences(updated);
    refreshState();
  };

  const handleUiLanguageChange = (uiLang: UiLanguage) => {
    const updated = { ...preferences, explanationLanguage: uiLang };
    setPreferences(updated);
    ArchiveStorage.savePreferences(updated);
  };

  const currentUiTranslations = getTranslations(preferences.explanationLanguage);

  return (
    <ThemeProvider>
      <I18nProvider language={preferences.explanationLanguage} setLanguage={handleUiLanguageChange}>
        <div className="min-h-screen bg-canvas text-heading flex flex-col font-sans transition-colors duration-250">
          <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          learningLanguage={preferences.learningLanguage}
          onChangeLanguage={handleLanguageChange}
          uiLanguage={preferences.explanationLanguage}
          onChangeUiLanguage={handleUiLanguageChange}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="flex-1 pb-24 md:pb-16">
          {activeTab === 'talk' && (
            <TalkScreen
              currentLanguageName={currentUiTranslations.languages[preferences.learningLanguage] || preferences.learningLanguage}
              currentMode={preferences.modeDefault}
              featuredMission={featuredMission}
              lastSession={lastSession}
              duePhrases={duePhrases}
              onStartMission={handleStartBriefing}
              onExploreMissions={() => setActiveTab('missions')}
              onPracticeDue={() => setIsPracticeDueOpen(true)}
            />
          )}

          {activeTab === 'missions' && (
            <MissionsScreen
              missions={availableMissions}
              onSelectMission={handleStartBriefing}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressScreen
              phrases={phrases}
              sessions={sessions}
              observations={observations}
              onSelectSession={session => setActiveRecapSession(session)}
              onDisputeObservation={handleDisputeObservation}
              onHideObservation={handleHideObservation}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dueCount={duePhrases.length}
        />

        {/* Mission Briefing Modal */}
        {activeMissionBriefing && (
          <MissionBriefingModal
            mission={activeMissionBriefing}
            initialMode={preferences.modeDefault}
            onClose={() => setActiveMissionBriefing(null)}
            onStartSession={handleStartSession}
          />
        )}

        {/* Full-Screen Live Conversation View */}
        {activeLiveSession && (
          <LiveSessionView
            mission={activeLiveSession.mission}
            mode={activeLiveSession.mode}
            coldAttempt={activeLiveSession.coldAttempt}
            onEndSession={handleEndSession}
            onCancel={() => setActiveLiveSession(null)}
          />
        )}

        {/* Recap / Learning Receipt Modal */}
        {activeRecapSession && (
          <RecapModal
            session={activeRecapSession}
            onClose={() => setActiveRecapSession(null)}
            onNextMission={nextM => {
              setActiveRecapSession(null);
              handleStartBriefing(nextM);
            }}
          />
        )}

        {/* Settings & Privacy Modal */}
        {isSettingsOpen && (
          <SettingsModal
            preferences={preferences}
            onSavePreferences={newPrefs => {
              setPreferences(newPrefs);
              refreshState();
            }}
            onClearAllData={handleClearAllData}
            onDataRestored={() => {
              setPreferences(ArchiveStorage.getPreferences());
              refreshState();
            }}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}

        {/* Due Phrases Spaced Retrieval Drill Modal */}
        {isPracticeDueOpen && (
          <DuePhrasesPracticeModal
            duePhrases={duePhrases}
            onClose={() => setIsPracticeDueOpen(false)}
            onCompleted={() => {
              refreshState();
            }}
          />
        )}
        </div>
      </I18nProvider>
    </ThemeProvider>
  );
}
