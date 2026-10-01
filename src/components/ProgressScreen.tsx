import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronRight, Clock3 } from 'lucide-react-native';
import {
  LanguageCode,
  LearningObservation,
  PhraseItem,
  SessionRecord,
  SkillProjectionV2,
} from '../types';
import {
  COMMUNICATIVE_SKILLS_CATALOG,
  CommunicativeSkillMeta,
  MISSION_CATALOG,
} from '../data/missions';
import { useI18n } from '../features/i18n';
import {
  inferLegacySkillEvidence,
  projectSkillsV2,
} from '../features/learning/skillProjection';
import { Button, EmptyState, SectionLabel } from './ui';
import { Sheet } from './Sheet';
import { iconColor } from '../design/iconColor';

interface ProgressScreenProps {
  phrases: PhraseItem[];
  sessions: SessionRecord[];
  observations: LearningObservation[];
  learningLanguage: LanguageCode;
  onPracticeDue: () => void;
  onSelectSession: (session: SessionRecord) => void;
  onDisputeObservation: (obsId: string) => void;
  onHideObservation: (obsId: string) => void;
}

type ProgressTab = 'skills' | 'phrases' | 'history';

const PATTERN_INDEX: Record<LanguageCode, number> = {
  es: 0,
  fr: 1,
  de: 2,
  it: 3,
  ja: 4,
};

const STATUS_SURFACE = {
  steady: { container: 'bg-card-sage', text: 'text-accent-sage' },
  growing: { container: 'bg-card-sky', text: 'text-accent-sky' },
  supported: { container: 'bg-card-warm', text: 'text-primary' },
  new: { container: 'bg-surface-soft', text: 'text-muted' },
  review: { container: 'bg-warning-soft', text: 'text-warning' },
} as const;

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  phrases,
  sessions,
  observations,
  learningLanguage,
  onPracticeDue,
  onSelectSession,
  onDisputeObservation,
  onHideObservation,
}) => {
  const { t } = useI18n();
  const [selectedTab, setSelectedTab] = useState<ProgressTab>('skills');
  const [selectedPhrase, setSelectedPhrase] = useState<PhraseItem | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<CommunicativeSkillMeta | null>(null);

  const duePhrases = useMemo(
    () => phrases.filter(phrase => phrase.scheduling.due),
    [phrases]
  );

  const phraseObservations = useMemo(() => {
    if (!selectedPhrase) return [];
    const form = selectedPhrase.form.toLowerCase();
    return observations.filter(
      observation =>
        observation.itemId === selectedPhrase.id ||
        observation.candidateForm.toLowerCase() === form
    );
  }, [observations, selectedPhrase]);

  const legacySkillEvidence = useMemo(
    () => inferLegacySkillEvidence(observations),
    [observations]
  );

  const skillEvidence = useMemo(() => {
    if (!selectedSkill) return [];
    return legacySkillEvidence.filter(observation => observation.skillId === selectedSkill.id);
  }, [legacySkillEvidence, selectedSkill]);

  const skillStats = useMemo(() => {
    const map = new Map<string, SkillProjectionV2>();
    for (const projection of projectSkillsV2(legacySkillEvidence)) {
      map.set(projection.skillId, projection);
    }
    return map;
  }, [legacySkillEvidence]);

  const localizeSkill = (skill: CommunicativeSkillMeta) => {
    switch (skill.id) {
      case 'skill-request-substitution':
        return t.skills.requestSubstitution;
      case 'skill-propose-alternative':
        return t.skills.proposeAlternative;
      case 'skill-inquire-specifications':
        return t.skills.inquireSpecifications;
      case 'skill-wayfinding-transit':
        return t.skills.wayfindingTransit;
      case 'skill-communicative-repair':
        return t.skills.communicativeRepair;
      default:
        return {
          name: skill.name,
          category: skill.category,
          description: skill.description,
        };
    }
  };

  const tabs: Array<{ id: ProgressTab; label: string; short: string }> = [
    { id: 'skills', label: t.progress.tabSkills, short: t.progress.tabSkillsShort },
    { id: 'phrases', label: t.progress.tabPhrases, short: t.progress.tabPhrasesShort },
    { id: 'history', label: t.progress.tabHistory, short: t.progress.tabHistoryShort },
  ];

  const statusLabel = (projection?: SkillProjectionV2) => {
    if (projection?.reviewDue) return t.progress.statusWorthRevisiting;
    switch (projection?.status) {
      case 'steady':
        return t.progress.statusSteady;
      case 'growing':
        return t.progress.statusGrowing;
      case 'supported':
        return t.progress.statusSupported;
      default:
        return t.progress.statusNew;
    }
  };

  const phraseStatusLabel = (phrase: PhraseItem) => {
    if (phrase.scheduling.due) return t.progress.statusWorthRevisiting;
    switch (phrase.recallStatus) {
      case 'steady':
        return t.progress.statusSteady;
      case 'growing':
        return t.progress.statusGrowing;
      case 'supported':
        return t.progress.statusSupported;
      default:
        return t.progress.statusNew;
    }
  };

  const outcomeLabel = (outcome: SessionRecord['taskOutcome']) => {
    switch (outcome) {
      case 'completed':
        return t.progress.outcomeCompleted;
      case 'partly_completed':
        return t.progress.outcomePartlyCompleted;
      case 'changed_direction':
        return t.progress.outcomeChangedDirection;
      default:
        return t.progress.outcomeUnknown;
    }
  };

  const statusTone = (projection?: SkillProjectionV2) => {
    if (projection?.reviewDue) return STATUS_SURFACE.review;
    switch (projection?.status) {
      case 'steady':
        return STATUS_SURFACE.steady;
      case 'growing':
        return STATUS_SURFACE.growing;
      case 'supported':
        return STATUS_SURFACE.supported;
      default:
        return STATUS_SURFACE.new;
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 36,
          gap: 24,
        }}
      >
        {duePhrases.length > 0 ? (
          <View className="gap-4 rounded-[28px] bg-card-warm p-5">
            <View className="flex-row items-start gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface/70">
                <Clock3 size={22} color={iconColor('brand')} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t.progress.readyToPractise}
                </Text>
                <Text className="mt-1 text-[20px] font-semibold leading-[26px] text-ink">
                  {t.talk.reviewButton.replace('{count}', String(duePhrases.length))}
                </Text>
                <Text className="mt-1 text-sm leading-5 text-body">
                  {t.talk.practiseDueTitle} · ~{Math.max(2, duePhrases.length)} {t.common.minutes}
                </Text>
              </View>
            </View>

            <Button
              label={t.talk.reviewButton.replace('{count}', String(duePhrases.length))}
              onPress={onPracticeDue}
              size="lg"
            />
          </View>
        ) : null}

        <View className="flex-row rounded-2xl bg-surface-soft p-1">
          {tabs.map(tab => {
            const selected = selectedTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setSelectedTab(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={tab.label}
                className={`min-h-12 flex-1 items-center justify-center rounded-xl border px-2 ${
                  selected
                    ? 'border-primary/20 bg-surface'
                    : 'border-transparent'
                } hover:bg-surface-hover focus:border-2 focus:border-focus`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selected ? 'text-ink' : 'text-muted'
                  }`}
                  numberOfLines={1}
                >
                  {tab.short}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedTab === 'skills' ? (
          <View>
            {COMMUNICATIVE_SKILLS_CATALOG.map((skill, index) => {
              const projection = skillStats.get(skill.id);
              const localized = localizeSkill(skill);
              return (
                <React.Fragment key={skill.id}>
                  <Pressable
                    onPress={() => setSelectedSkill(skill)}
                    accessibilityRole="button"
                    className="min-h-[82px] flex-row items-center gap-3 rounded-2xl border border-transparent py-3 hover:bg-surface-hover active:opacity-75 focus:border-2 focus:border-focus"
                  >
                    <View className="flex-1">
                      <Text className="text-[16px] font-semibold leading-[21px] text-ink">
                        {localized.name}
                      </Text>
                      <Text className="mt-1 text-[13px] leading-[18px] text-muted" numberOfLines={2}>
                        {localized.description}
                      </Text>
                    </View>

                    <View className="items-end gap-2">
                      <View className={`rounded-full px-2.5 py-1 ${statusTone(projection).container}`}>
                        <Text
                          className={`text-xs font-semibold ${statusTone(projection).text}`}
                          numberOfLines={1}
                        >
                          {statusLabel(projection)}
                        </Text>
                      </View>
                      <ChevronRight size={18} color={iconColor('muted')} />
                    </View>
                  </Pressable>
                  {index < COMMUNICATIVE_SKILLS_CATALOG.length - 1 ? (
                    <View className="h-px bg-border-subtle" />
                  ) : null}
                </React.Fragment>
              );
            })}
          </View>
        ) : null}

        {selectedTab === 'phrases' ? (
          <View>
            {phrases.length === 0 ? (
              <EmptyState message={t.common.noEvidenceYet} />
            ) : (
              phrases.map((phrase, index) => (
                <React.Fragment key={phrase.id}>
                  <Pressable
                    onPress={() => setSelectedPhrase(phrase)}
                    accessibilityRole="button"
                    className="min-h-[76px] flex-row items-center gap-3 rounded-2xl border border-transparent py-3 hover:bg-surface-hover active:opacity-75 focus:border-2 focus:border-focus"
                  >
                    <View className="flex-1">
                      <Text className="text-[15px] font-semibold leading-[21px] text-ink">
                        “{phrase.form}”
                      </Text>
                      <Text className="mt-1 text-[13px] leading-[18px] text-muted" numberOfLines={1}>
                        {phrase.meaning}
                      </Text>
                    </View>

                    <View className="items-end gap-1">
                      <Text className="text-xs font-semibold capitalize text-primary">
                        {phraseStatusLabel(phrase)}
                      </Text>
                      <ChevronRight size={18} color={iconColor('muted')} />
                    </View>
                  </Pressable>
                  {index < phrases.length - 1 ? <View className="h-px bg-border-subtle" /> : null}
                </React.Fragment>
              ))
            )}
          </View>
        ) : null}

        {selectedTab === 'history' ? (
          <View>
            {sessions.length === 0 ? (
              <EmptyState message={t.progress.noReceiptsYet} />
            ) : (
              sessions.map((session, index) => {
                const mission = MISSION_CATALOG.find(item => item.id === session.missionId);
                return (
                  <React.Fragment key={session.id}>
                    <Pressable
                      onPress={() => onSelectSession(session)}
                      accessibilityRole="button"
                      className="min-h-[78px] flex-row items-center gap-3 rounded-2xl border border-transparent py-3 hover:bg-surface-hover active:opacity-75 focus:border-2 focus:border-focus"
                    >
                      <View className="flex-1">
                        <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>
                          {mission?.title ?? session.missionId}
                        </Text>
                        <Text className="mt-1 text-[13px] text-muted">
                          {new Date(session.startedAt).toLocaleDateString()} · {session.passages.length} {t.common.turns}
                        </Text>
                      </View>

                      <View className="items-end gap-1">
                        <Text className="text-xs font-semibold capitalize text-primary">
                          {outcomeLabel(session.taskOutcome)}
                        </Text>
                        <ChevronRight size={18} color={iconColor('muted')} />
                      </View>
                    </Pressable>
                    {index < sessions.length - 1 ? <View className="h-px bg-border-subtle" /> : null}
                  </React.Fragment>
                );
              })
            )}
          </View>
        ) : null}
      </ScrollView>

      <Sheet
        visible={Boolean(selectedPhrase)}
        onClose={() => setSelectedPhrase(null)}
        title={t.common.targetPhrase}
      >
        {selectedPhrase ? (
          <View className="gap-5">
            <View className="gap-1">
              <Text className="text-2xl font-semibold text-ink">“{selectedPhrase.form}”</Text>
              <Text className="text-sm leading-5 text-body">{selectedPhrase.meaning}</Text>
            </View>

            {selectedPhrase.usageNote ? (
              <View className="rounded-2xl bg-surface-soft p-4">
                <Text className="text-sm leading-6 text-body">{selectedPhrase.usageNote}</Text>
              </View>
            ) : null}

            <View className="gap-3">
              <SectionLabel>{t.recap.validatedEvidence}</SectionLabel>
              {phraseObservations.length === 0 ? (
                <EmptyState message={t.recap.noPhrasesValidated} />
              ) : (
                phraseObservations.map(observation => (
                  <View key={observation.observationId} className="gap-2 rounded-2xl bg-surface-soft p-4">
                    <Text className="text-sm font-medium text-ink">“{observation.quote}”</Text>
                    <Text className="text-xs text-muted">
                      {observation.retrieval === 'unassisted'
                        ? t.recap.unassisted
                        : t.recap.assisted}
                    </Text>
                    <View className="flex-row flex-wrap gap-1">
                      <Button
                        label={t.progress.hideEvidence}
                        onPress={() => onHideObservation(observation.observationId)}
                        variant="ghost"
                        size="sm"
                      />
                      <Button
                        label={t.progress.disputeEvidence}
                        onPress={() => onDisputeObservation(observation.observationId)}
                        variant="ghost"
                        size="sm"
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : null}
      </Sheet>

      <Sheet
        visible={Boolean(selectedSkill)}
        onClose={() => setSelectedSkill(null)}
        title={selectedSkill ? localizeSkill(selectedSkill).category : undefined}
      >
        {selectedSkill ? (
          <View className="gap-5">
            <View className="gap-1">
              <Text className="text-2xl font-semibold text-ink">
                {localizeSkill(selectedSkill).name}
              </Text>
              <Text className="text-sm leading-6 text-body">
                {localizeSkill(selectedSkill).description}
              </Text>
            </View>

            <View className="gap-2 rounded-2xl bg-surface-soft p-4">
              <SectionLabel>{t.progress.samplePatterns}</SectionLabel>
              <Text className="text-sm leading-5 text-ink">
                • {selectedSkill.patterns[PATTERN_INDEX[learningLanguage]]}
              </Text>
            </View>

            <View className="gap-3">
              <SectionLabel>{t.recap.validatedEvidence}</SectionLabel>
              {skillEvidence.length === 0 ? (
                <EmptyState message={t.common.noEvidenceYet} />
              ) : (
                skillEvidence.map(observation => (
                  <View key={observation.id} className="rounded-2xl bg-surface-soft p-4">
                    <Text className="text-sm font-medium text-ink">“{observation.quote}”</Text>
                    <Text className="mt-1 text-xs text-muted">
                      {observation.retrieval === 'unassisted'
                        ? t.recap.unassisted
                        : t.recap.assisted}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : null}
      </Sheet>
    </View>
  );
};
