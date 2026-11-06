import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
import {
  AlertCircle,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  HelpCircle,
  LifeBuoy,
  MessageCircle,
  MessageSquare,
  MessageSquareQuote,
  NotebookPen,
  RotateCcw,
  Scale,
  Search,
  ShoppingBag,
  Target,
  Users,
  Volume2,
} from 'lucide-react-native';
import {
  LanguageCode,
  LearningObservation,
  PhraseItem,
  SessionRecord,
  SkillLapse,
  SkillObservation,
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
import { FLEMISH_SKILL_PATTERNS } from '../content/skills';
import { Button, EmptyState, SectionLabel } from './ui';
import { Sheet } from './Sheet';
import { iconColor } from '../design/iconColor';
import { summarizeActivity } from '../features/learning/activitySummary';
import { ELEVATION } from '../design/tokens';

interface ProgressScreenProps {
  phrases: PhraseItem[];
  sessions: SessionRecord[];
  observations: LearningObservation[];
  learningLanguage: LanguageCode;
  onPracticeDue: () => void;
  onSelectSession: (session: SessionRecord) => void;
  onDisputeObservation: (obsId: string) => void;
  onHideObservation: (obsId: string) => void;
  onDisputeSkillObservation: (obsId: string) => void;
  onHideSkillObservation: (obsId: string) => void;
}

type ProgressTab = 'skills' | 'phrases' | 'history';
type SkillCategoryFilter = 'all' | 'daily' | 'repair' | 'discussion';

const PATTERN_INDEX: Record<LanguageCode, number> = {
  es: 0,
  fr: 1,
  de: 2,
  it: 3,
  ja: 4,
  nl: 5,
};

const STATUS_SURFACE = {
  steady: { container: 'bg-card-sage', text: 'text-accent-sage' },
  growing: { container: 'bg-card-sky', text: 'text-accent-sky' },
  supported: { container: 'bg-card-warm', text: 'text-primary' },
  new: { container: 'bg-surface-soft', text: 'text-muted' },
  review: { container: 'bg-warning-soft', text: 'text-warning' },
} as const;

const SKILL_ICONS: Record<
  string,
  { Icon: typeof ShoppingBag; tint: string; color: string }
> = {
  'skill-request-substitution': { Icon: ShoppingBag, tint: 'bg-card-warm', color: 'brand' },
  'skill-propose-alternative': { Icon: CalendarCheck, tint: 'bg-card-sky', color: 'info' },
  'skill-inquire-specifications': { Icon: Search, tint: 'bg-language-soft', color: 'language' },
  'skill-wayfinding-transit': { Icon: Compass, tint: 'bg-warning-soft', color: 'warning' },
  'skill-communicative-repair': { Icon: LifeBuoy, tint: 'bg-card-sage', color: 'success' },
  'skill-request-repetition': { Icon: RotateCcw, tint: 'bg-card-sage', color: 'success' },
  'skill-request-slower-speech': { Icon: Volume2, tint: 'bg-card-sage', color: 'success' },
  'skill-ask-clarification': { Icon: HelpCircle, tint: 'bg-card-sage', color: 'success' },
  'skill-check-understanding': { Icon: CheckCircle2, tint: 'bg-card-sage', color: 'success' },
  'skill-clarify-misunderstanding': { Icon: AlertCircle, tint: 'bg-card-sage', color: 'success' },
  'skill-paraphrase-when-stuck': { Icon: MessageSquare, tint: 'bg-card-sage', color: 'success' },
  'skill-give-opinion-with-reason': { Icon: MessageSquareQuote, tint: 'bg-lilac-soft', color: 'lilac' },
  'skill-compare-options': { Icon: Scale, tint: 'bg-lilac-soft', color: 'lilac' },
  'skill-make-arrangement': { Icon: Users, tint: 'bg-card-sky', color: 'info' },
  'skill-narrate-past-event': { Icon: BookOpen, tint: 'bg-lilac-soft', color: 'lilac' },
};

const SKILL_CATEGORIES_MAP: Record<string, SkillCategoryFilter> = {
  'skill-request-substitution': 'daily',
  'skill-inquire-specifications': 'daily',
  'skill-wayfinding-transit': 'daily',
  'skill-communicative-repair': 'repair',
  'skill-request-repetition': 'repair',
  'skill-request-slower-speech': 'repair',
  'skill-ask-clarification': 'repair',
  'skill-check-understanding': 'repair',
  'skill-clarify-misunderstanding': 'repair',
  'skill-paraphrase-when-stuck': 'repair',
  'skill-propose-alternative': 'discussion',
  'skill-give-opinion-with-reason': 'discussion',
  'skill-compare-options': 'discussion',
  'skill-make-arrangement': 'discussion',
  'skill-narrate-past-event': 'discussion',
};

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  phrases,
  sessions,
  observations,
  learningLanguage,
  onPracticeDue,
  onSelectSession,
  onDisputeObservation,
  onHideObservation,
  onDisputeSkillObservation,
  onHideSkillObservation,
}) => {
  const { t, language } = useI18n();
  const [selectedTab, setSelectedTab] = useState<ProgressTab>('skills');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<SkillCategoryFilter>('all');
  const [selectedPhrase, setSelectedPhrase] = useState<PhraseItem | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<CommunicativeSkillMeta | null>(null);
  const activity = useMemo(() => summarizeActivity(sessions, learningLanguage), [sessions, learningLanguage]);

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

  const explicitSkillEvidence = useMemo<SkillObservation[]>(
    () => sessions.flatMap(session => session.skillObservations ?? []),
    [sessions]
  );

  const skillLapses = useMemo<SkillLapse[]>(
    () => sessions.flatMap(session => session.skillLapses ?? []),
    [sessions]
  );

  const sessionsWithExplicitSkillEvidence = useMemo(
    () =>
      new Set(
        sessions
          .filter(session => (session.skillObservations?.length ?? 0) > 0)
          .map(session => session.id)
      ),
    [sessions]
  );

  // Legacy phrase-derived skill evidence is only used for sessions that predate
  // explicit skill observations. This avoids counting the same modern turn twice.
  const legacySkillEvidence = useMemo(
    () =>
      inferLegacySkillEvidence(
        observations.filter(
          observation => !sessionsWithExplicitSkillEvidence.has(observation.sessionId)
        )
      ),
    [observations, sessionsWithExplicitSkillEvidence]
  );

  const allSkillEvidence = useMemo(
    () => [...explicitSkillEvidence, ...legacySkillEvidence],
    [explicitSkillEvidence, legacySkillEvidence]
  );

  const skillEvidence = useMemo(() => {
    if (!selectedSkill) return [];
    return allSkillEvidence.filter(observation => observation.skillId === selectedSkill.id);
  }, [allSkillEvidence, selectedSkill]);

  const skillStats = useMemo(() => {
    const map = new Map<string, SkillProjectionV2>();
    for (const projection of projectSkillsV2(allSkillEvidence, skillLapses)) {
      map.set(projection.skillId, projection);
    }
    return map;
  }, [allSkillEvidence, skillLapses]);

  const demonstratedSkillCount = useMemo(() => {
    let count = 0;
    for (const skill of COMMUNICATIVE_SKILLS_CATALOG) {
      const proj = skillStats.get(skill.id);
      if (proj && proj.status && proj.status !== 'new') {
        count++;
      }
    }
    return count;
  }, [skillStats]);

  const filteredSkills = useMemo(() => {
    if (selectedSkillCategory === 'all') return COMMUNICATIVE_SKILLS_CATALOG;
    return COMMUNICATIVE_SKILLS_CATALOG.filter(
      skill => SKILL_CATEGORIES_MAP[skill.id] === selectedSkillCategory
    );
  }, [selectedSkillCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<SkillCategoryFilter, number> = {
      all: COMMUNICATIVE_SKILLS_CATALOG.length,
      daily: 0,
      repair: 0,
      discussion: 0,
    };
    for (const skill of COMMUNICATIVE_SKILLS_CATALOG) {
      const cat = SKILL_CATEGORIES_MAP[skill.id];
      if (cat) counts[cat]++;
    }
    return counts;
  }, []);

  const skillCategoryLabels: Record<SkillCategoryFilter, string> = {
    all: language === 'nl' ? 'Alles' : language === 'fr' ? 'Tous' : language === 'es' ? 'Todos' : 'All',
    daily: language === 'nl' ? 'Diensten & Vervoer' : language === 'fr' ? 'Services & Transit' : language === 'es' ? 'Servicios y Tránsito' : 'Services & Transit',
    repair: language === 'nl' ? 'Gespreksherstel' : language === 'fr' ? 'Réparation' : language === 'es' ? 'Reparación' : 'Repair & Help',
    discussion: language === 'nl' ? 'Sociaal & Mening' : language === 'fr' ? 'Social & Discussion' : language === 'es' ? 'Social y Discusión' : 'Social & Discussion',
  };

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
      case 'skill-request-repetition':
        return t.skills.requestRepetition;
      case 'skill-ask-clarification':
        return t.skills.askClarification;
      case 'skill-check-understanding':
        return t.skills.checkUnderstanding;
      default: {
        const canDoText =
          (skill.canDo && language in skill.canDo
            ? skill.canDo[language as keyof typeof skill.canDo]
            : undefined) || skill.description;
        return {
          name: skill.name,
          category: skill.category,
          description: canDoText,
        };
      }
    }
  };

  const tabs: Array<{ id: ProgressTab; label: string; short: string }> = [
    { id: 'skills', label: t.progress.tabSkills, short: t.progress.tabSkillsShort },
    { id: 'phrases', label: t.progress.tabPhrases, short: t.progress.tabPhrasesShort },
    { id: 'history', label: t.progress.tabHistory, short: t.progress.tabHistoryShort },
  ];

  const statusLabel = (projection?: SkillProjectionV2): string | null => {
    if (projection?.revisit) return t.progress.statusWorthRevisiting;
    if (projection?.reviewDue) return t.progress.reviewDue;
    switch (projection?.status) {
      case 'steady':
        return t.progress.statusSteady;
      case 'growing':
        return t.progress.statusGrowing;
      case 'supported':
        return t.progress.statusSupported;
      default:
        return null;
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
    if (projection?.revisit || projection?.reviewDue) return STATUS_SURFACE.review;
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
        showsVerticalScrollIndicator={true}
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
        <View className="flex-row gap-2">
          {[
            { label: t.progress.tabHistoryShort, value: activity.sessions, Icon: MessageCircle, tint: 'bg-card-warm', color: 'brand' },
            { label: t.common.turns, value: activity.turns, Icon: Target, tint: 'bg-warning-soft', color: 'warning' },
            { label: t.progress.tabPhrasesShort, value: phrases.length, Icon: NotebookPen, tint: 'bg-lilac-soft', color: 'lilac' },
          ].map(stat => <View key={stat.label} className="min-w-0 flex-1 items-center gap-2 rounded-[24px] bg-surface px-2 py-4" style={{ boxShadow: ELEVATION.card }}>
            <View className={`h-10 w-10 items-center justify-center rounded-[15px] ${stat.tint}`}><stat.Icon size={21} color={iconColor(stat.color)} /></View>
            <Text className="font-display text-[24px] font-bold text-ink">{stat.value}</Text>
            <Text className="text-center text-xs leading-4 text-muted">{stat.label}</Text>
          </View>)}
        </View>
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

        <View className="flex-row rounded-[24px] bg-surface p-1">
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
                    ? 'border-language/20 bg-action'
                    : 'border-transparent'
                } hover:bg-surface-hover focus:border-2 focus:border-focus`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selected ? 'text-action-text' : 'text-muted'
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
          <View className="gap-4">
            {/* Skills Repertoire Header */}
            <View className="p-4 rounded-[24px] bg-surface border border-border-subtle/50 gap-2.5">
              <View className="flex-row items-center justify-between">
                <View className="gap-0.5">
                  <Text className="text-base font-bold text-ink">
                    {demonstratedSkillCount} / {COMMUNICATIVE_SKILLS_CATALOG.length} {t.progress.tabSkills.toLowerCase()}
                  </Text>
                  <Text className="text-xs text-muted">
                    {t.recap.validatedEvidence}
                  </Text>
                </View>
                <View className="px-2.5 py-1 rounded-full bg-surface-soft border border-border-subtle/40">
                  <Text className="text-xs font-bold text-language">
                    {Math.round((demonstratedSkillCount / COMMUNICATIVE_SKILLS_CATALOG.length) * 100)}%
                  </Text>
                </View>
              </View>
              <View className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden">
                <View
                  className="h-full rounded-full bg-action"
                  style={{
                    width: `${Math.max(
                      demonstratedSkillCount > 0 ? 8 : 0,
                      (demonstratedSkillCount / COMMUNICATIVE_SKILLS_CATALOG.length) * 100
                    )}%`,
                  }}
                />
              </View>
            </View>

            {/* Category Filter Pills */}
            <View className="flex-row gap-2 flex-wrap">
              {(['all', 'daily', 'repair', 'discussion'] as SkillCategoryFilter[]).map(catId => {
                const isSelected = selectedSkillCategory === catId;
                const count = categoryCounts[catId];
                return (
                  <Pressable
                    key={catId}
                    onPress={() => setSelectedSkillCategory(catId)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    className={`min-h-12 px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 border transition-all ${
                      isSelected
                        ? 'bg-action border-action'
                        : 'bg-surface border-border-subtle/50 hover:bg-surface-hover'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-action-text' : 'text-body'
                      }`}
                    >
                      {skillCategoryLabels[catId]} ({count})
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Filtered Skills List */}
            <View className="gap-2">
              {filteredSkills.map(skill => {
                const projection = skillStats.get(skill.id);
                const localized = localizeSkill(skill);
                const iconInfo = SKILL_ICONS[skill.id] || {
                  Icon: MessageCircle,
                  tint: 'bg-language-soft',
                  color: 'language',
                };
                const status = statusLabel(projection);

                return (
                  <Pressable
                    key={skill.id}
                    onPress={() => setSelectedSkill(skill)}
                    accessibilityRole="button"
                    accessibilityLabel={`${localized.name}. ${localized.description}`}
                    className="min-h-[76px] flex-row items-center gap-3.5 rounded-2xl border border-border-subtle/50 bg-surface p-3.5 hover:bg-surface-hover active:scale-[0.99] transition-all"
                  >
                    <View
                      className={`h-11 w-11 items-center justify-center rounded-xl ${iconInfo.tint}`}
                    >
                      <iconInfo.Icon size={20} color={iconColor(iconInfo.color)} />
                    </View>

                    <View className="flex-1 min-w-0 gap-0.5">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className="text-[15px] font-bold text-ink truncate"
                          numberOfLines={1}
                        >
                          {localized.name}
                        </Text>
                        {skill.parentSkillId ? (
                          <View className="px-1.5 py-0.5 rounded bg-surface-soft border border-border-subtle/30">
                            <Text className="text-xs font-medium text-muted">
                              Repair
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text
                        className="text-xs leading-4 text-muted"
                        numberOfLines={2}
                      >
                        {localized.description}
                      </Text>
                      {projection?.lastIndependentUseAt ? (
                        <Text className="text-xs text-language font-medium mt-0.5">
                          {t.progress.lastIndependentUse}:{' '}
                          {new Date(projection.lastIndependentUseAt).toLocaleDateString()}
                        </Text>
                      ) : null}
                    </View>

                    <View className="items-end gap-1.5 shrink-0">
                      {status ? (
                        <View
                          className={`rounded-full px-2.5 py-0.5 ${
                            statusTone(projection).container
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              statusTone(projection).text
                            }`}
                            numberOfLines={1}
                          >
                            {status}
                          </Text>
                        </View>
                      ) : null}
                      <ChevronRight size={18} color={iconColor('muted')} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
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

            {(() => {
              const projection = skillStats.get(selectedSkill.id);
              if (!projection) return null;
              return (
                <View className="gap-1 rounded-2xl bg-surface-soft p-4">
                  <Text className="text-sm font-semibold text-ink">
                    {statusLabel(projection)}
                  </Text>
                  <Text className="text-xs leading-5 text-muted">
                    {projection.explanation}
                  </Text>
                  {projection.lastIndependentUseAt ? (
                    <Text className="text-xs text-muted">
                      {t.progress.lastIndependentUse}: {new Date(projection.lastIndependentUseAt).toLocaleDateString()}
                    </Text>
                  ) : null}
                </View>
              );
            })()}

            <View className="gap-2 rounded-2xl bg-surface-soft p-4">
              <SectionLabel>{t.progress.samplePatterns}</SectionLabel>
              <Text className="text-sm leading-5 text-ink">
                • {learningLanguage === 'nl'
                  ? FLEMISH_SKILL_PATTERNS[selectedSkill.id] ?? selectedSkill.patterns[0] ?? '—'
                  : selectedSkill.patterns[PATTERN_INDEX[learningLanguage]] ?? selectedSkill.patterns[0] ?? selectedSkill.samplePhrases[0] ?? '—'}
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
                    {observation.evidenceSource === 'validated_explicit' ? (
                      <View className="mt-2 flex-row flex-wrap gap-1">
                        <Button
                          label={t.progress.hideEvidence}
                          onPress={() => onHideSkillObservation(observation.id)}
                          variant="ghost"
                          size="sm"
                        />
                        <Button
                          label={t.progress.disputeEvidence}
                          onPress={() => onDisputeSkillObservation(observation.id)}
                          variant="ghost"
                          size="sm"
                        />
                      </View>
                    ) : null}
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
