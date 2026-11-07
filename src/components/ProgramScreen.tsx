import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Flag,
  LockKeyhole,
  Play,
  RotateCcw,
  Route,
  Sparkles,
} from 'lucide-react-native';
import type { RoleplayProgram } from '../contracts/program';
import type { MissionDefinition, SessionRecord } from '../types';
import { MISSION_CATALOG } from '../data/missions';
import { buildProgramProjection, isProgramCoreComplete } from '../features/program/projection';
import {
  isProgramActivatable,
  validateMissionForProgramRelease,
} from '../features/program/releaseGates';
import { useI18n } from '../features/i18n';
import { Button, EmptyState, Pill, SectionLabel } from './ui';
import { iconColor } from '../design/iconColor';
import { NeighborhoodArtwork } from './NeighborhoodArtwork';
import { ELEVATION } from '../design/tokens';

const MISSION_TONES: Record<MissionDefinition['category'], { container: string; color: string }> = {
  cafes: { container: 'bg-[#DFF2EA]', color: 'brand' },
  services: { container: 'bg-[#FFE6DD]', color: 'info' },
  transit: { container: 'bg-[#FFF0CF]', color: 'language' },
  lodging: { container: 'bg-[#FFF0CF]', color: 'warning' },
  social: { container: 'bg-[#ECE6FF]', color: 'success' },
  problems: { container: 'bg-[#ECE6FF]', color: 'brand' },
};

const PROGRAM_STAGE_METAS: Record<string, { title: string; subtitle: string; description: string }> = {
  A1: {
    title: 'Stage 1 · Level A1 Foundation & Morning Routine',
    subtitle: 'Basis & Eerste Gesprekken',
    description: 'Essential morning coffee ordering, requesting ingredient substitutes, and polite Flemish greetings.',
  },
  A2: {
    title: 'Stage 2 · Level A2 Everyday Independence & Services',
    subtitle: 'Dagelijkse Zelfstandigheid & Diensten',
    description: 'Handling parcel rescheduling, neighbour coordination, medication leaflets, and dining on the terrace.',
  },
  B1: {
    title: 'Stage 3 · Level B1 Spontaneous Discussion & Opinions',
    subtitle: 'Vloeiende Gesprekken',
    description: 'Complex choices, defending opinions, and spontaneous repair across diverse interactions.',
  },
};

const PROGRAM_RECOMMENDATION_COPY = {
  en: {
    exact: 'Recommended for your goal',
    closest: 'Closest reviewed path',
    observe: 'Your first step is Observe: watch a short model scene before you speak.',
    guided: 'Your first step is Guided: start with visible support, then reduce it.',
    warmup: 'Your first step is a short warm-up to find the right point in this path.',
  },
  fr: {
    exact: 'Recommandé pour votre objectif',
    closest: 'Parcours examiné le plus proche',
    observe: 'Première étape : Observer une courte scène modèle avant de parler.',
    guided: 'Première étape : Guidé, avec une aide visible qui diminue ensuite.',
    warmup: 'Première étape : un court échauffement pour trouver le bon point d’entrée.',
  },
  es: {
    exact: 'Recomendado para tu objetivo',
    closest: 'Ruta revisada más cercana',
    observe: 'Primer paso: Observar una escena modelo breve antes de hablar.',
    guided: 'Primer paso: Guiado, con ayuda visible que se reducirá después.',
    warmup: 'Primer paso: un calentamiento breve para encontrar el punto adecuado.',
  },
  nl: {
    exact: 'Aanbevolen voor je doel',
    closest: 'Dichtstbijzijnde beoordeelde leerpad',
    observe: 'Je eerste stap is Observeren: bekijk een korte voorbeeldscène voordat je spreekt.',
    guided: 'Je eerste stap is Begeleid: start met zichtbare hulp en bouw die daarna af.',
    warmup: 'Je eerste stap is een korte opwarming om het juiste startpunt in dit leerpad te vinden.',
  },
} as const;

interface ProgramScreenProps {
  program: RoleplayProgram;
  sessions: SessionRecord[];
  recommendation?: {
    entryMode: 'observe_first' | 'guided_first' | 'warmup_first';
    match: 'exact' | 'closest';
  };
  onBack: () => void;
  onStartMission: (
    mission: MissionDefinition,
    options?: { finalSimulation?: boolean; standalone?: boolean }
  ) => void;
}

export const ProgramScreen: React.FC<ProgramScreenProps> = ({
  program,
  sessions,
  recommendation,
  onBack,
  onStartMission,
}) => {
  const { t, language } = useI18n();
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const recommendationCopy = PROGRAM_RECOMMENDATION_COPY[language];
  const projection = useMemo(
    () => buildProgramProjection(program, sessions),
    [program, sessions]
  );
  const completed = new Set(projection.completedMissionIds);
  const canExecute = isProgramActivatable(program);
  const coreComplete = isProgramCoreComplete(program, projection);

  const plan = useMemo(
    () =>
      program.missionPlan
        .map(ref => ({
          ref,
          mission: MISSION_CATALOG.find(
            candidate => candidate.id === ref.missionId && candidate.version === ref.missionVersion
          ),
        }))
        .filter(
          (entry): entry is typeof entry & { mission: MissionDefinition } =>
            Boolean(entry.mission)
        ),
    [program]
  );

  const planWithAvailability = useMemo(
    () =>
      plan.map(entry => ({
        ...entry,
        individuallyAvailable: validateMissionForProgramRelease(entry.mission).ready,
      })),
    [plan]
  );

  const availableLevels = useMemo(() => {
    const set = new Set<string>();
    for (const item of planWithAvailability) {
      set.add(item.mission.levelRange ?? 'A1');
    }
    return Array.from(set).sort();
  }, [planWithAvailability]);

  const stagesToRender = useMemo(() => {
    if (selectedStage !== 'all') {
      return [selectedStage];
    }
    return availableLevels;
  }, [selectedStage, availableLevels]);

  const completedCount = projection.completedMissionIds.length;
  const totalCount = program.missionPlan.length;
  const overallPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const finalMission = program.finalSimulation
    ? MISSION_CATALOG.find(
        mission =>
          mission.id === program.finalSimulation?.mission.missionId &&
          mission.version === program.finalSimulation?.mission.missionVersion
      )
    : undefined;

  return (
    <View className="flex-1 bg-canvas">
      {/* Top Navigation Bar */}
      <View
        className="w-full self-center flex-row items-center gap-3 px-4 py-2"
        style={{ maxWidth: 760 }}
      >
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          className="h-12 w-12 items-center justify-center rounded-full bg-surface hover:bg-surface-hover active:opacity-70 border border-border-interactive/40 focus:border-2 focus:border-focus"
        >
          <ArrowLeft size={20} color={iconColor('ink')} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t.missions.tabPrograms}
          </Text>
          <Text className="text-16 font-bold text-ink truncate">
            {program.title}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 48,
          gap: 20,
        }}
      >
        {/* Lingo Atelier Hero Journey Header Card */}
        <View
          className="overflow-hidden rounded-[26px] border border-border-interactive/40 bg-surface shadow-sm"
          style={{ boxShadow: ELEVATION.card }}
        >
          <View className="relative h-[156px] w-full overflow-hidden bg-[#E2F1E7]">
            <NeighborhoodArtwork />
            <View className="absolute inset-0 bg-black/30" />
            
            {/* Top Level Journey Pill */}
            <View className="absolute left-4 top-3 px-2.5 py-1 rounded-xl bg-black/55 backdrop-blur-md flex-row items-center gap-1.5">
              <Sparkles size={12} color="#CBF37C" />
              <Text className="text-xs font-bold uppercase tracking-wider text-white">
                CURATED LEARNING PATH
              </Text>
            </View>

            <View className="absolute right-4 top-3 px-2.5 py-1 rounded-xl bg-lime">
              <Text className="text-xs font-extrabold text-[#17310F]">
                {availableLevels.join(' ➔ ')}
              </Text>
            </View>

            <View className="absolute left-4 bottom-3 right-4">
              <Text className="font-display text-24 font-bold text-white leading-tight">
                {program.title}
              </Text>
              <Text className="text-xs text-white/85 mt-0.5">
                {program.targetLocale} · {planWithAvailability.length} authentic Belgian Dutch scenarios
              </Text>
            </View>
          </View>

          {/* Overall Progress Banner */}
          <View className="p-4 gap-3 bg-[#FFFBF0]">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  JOURNEY PROGRESS
                </Text>
                <Pill
                  label={canExecute ? t.missions.programReleased : t.missions.programPreview}
                  tone={canExecute ? 'sage' : 'warm'}
                />
              </View>
              <Text className="text-xs font-bold text-ink">
                {completedCount} of {totalCount} completed ({overallPercent}%)
              </Text>
            </View>

            {/* Overall Progress Track */}
            <View className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden">
              <View
                className="h-full rounded-full bg-action"
                style={{ width: `${overallPercent}%` }}
              />
            </View>
          </View>
        </View>

        {/* Recommendation Notice */}
        {recommendation ? (
          <View className="gap-2 rounded-[22px] bg-card-sky p-4 border border-accent-sky/20">
            <Text className="text-xs font-semibold uppercase tracking-wider text-accent-sky">
              {recommendation.match === 'exact'
                ? recommendationCopy.exact
                : recommendationCopy.closest}
            </Text>
            <Text className="text-sm leading-5 text-body">
              {recommendation.entryMode === 'observe_first'
                ? recommendationCopy.observe
                : recommendation.entryMode === 'guided_first'
                  ? recommendationCopy.guided
                  : recommendationCopy.warmup}
            </Text>
          </View>
        ) : null}

        {/* Stage / Level Selector Tabs */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-display text-16 font-bold text-ink">
              Milestone Stages
            </Text>
            <Text className="text-xs font-semibold text-muted">
              Organized by CEFR level
            </Text>
          </View>

          <View className="flex-row gap-2 flex-wrap">
            <Pressable
              onPress={() => setSelectedStage('all')}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedStage === 'all' }}
              className={`min-h-12 px-3.5 py-2 rounded-2xl flex-row items-center gap-1.5 border transition-all ${
                selectedStage === 'all'
                  ? 'bg-action border-action'
                  : 'bg-surface border-border-interactive/40 hover:bg-surface-hover'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedStage === 'all' ? 'text-action-text' : 'text-body'
                }`}
              >
                All Stages ({planWithAvailability.length})
              </Text>
            </Pressable>

            {availableLevels.map(lvl => {
              const isSelected = selectedStage === lvl;
              const count = planWithAvailability.filter(
                p => (p.mission.levelRange ?? 'A1') === lvl
              ).length;
              const meta = PROGRAM_STAGE_METAS[lvl];

              return (
                <Pressable
                  key={lvl}
                  onPress={() => setSelectedStage(lvl)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  className={`min-h-12 px-3.5 py-2 rounded-2xl flex-row items-center gap-2 border transition-all ${
                    isSelected
                      ? 'bg-action border-action'
                      : 'bg-surface border-border-interactive/40 hover:bg-surface-hover'
                  }`}
                >
                  <View className="px-1.5 py-0.5 rounded-lg bg-lime">
                    <Text className="text-xs font-extrabold text-[#17310F]">
                      {lvl}
                    </Text>
                  </View>
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-action-text' : 'text-body'
                    }`}
                  >
                    {meta?.title ? meta.title.split('·')[1]?.trim() : `Level ${lvl}`} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Milestone Stages Roadmap */}
        {planWithAvailability.length === 0 ? (
          <EmptyState message={t.missions.noMissionsFound} />
        ) : (
          <View className="gap-6">
            {stagesToRender.map(lvl => {
              const stageMissions = planWithAvailability.filter(
                item => (item.mission.levelRange ?? 'A1') === lvl
              );
              if (stageMissions.length === 0) return null;

              const stageCompletedCount = stageMissions.filter(item =>
                completed.has(item.ref.missionId)
              ).length;
              const stagePercent = Math.round(
                (stageCompletedCount / stageMissions.length) * 100
              );
              const meta = PROGRAM_STAGE_METAS[lvl] ?? {
                title: `Stage · Level ${lvl}`,
                subtitle: 'Scenarios',
                description: 'Curated progressive missions.',
              };

              return (
                <View key={lvl} className="gap-3">
                  {/* Stage Header Banner */}
                  <View
                    className="rounded-[24px] bg-surface border border-border-subtle/70 p-4 gap-3 shadow-sm"
                    style={{ boxShadow: ELEVATION.card }}
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
                        <View className="px-2.5 py-1 rounded-xl bg-lime shadow-sm">
                          <Text className="text-xs font-extrabold text-[#17310F]">
                            {lvl}
                          </Text>
                        </View>
                        <View className="flex-1 min-w-0">
                          <Text className="font-display text-16 font-bold text-ink truncate">
                            {meta.title}
                          </Text>
                          <Text className="text-xs text-muted truncate">
                            {meta.description}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end flex-shrink-0">
                        <View className="px-2 py-0.5 rounded-full bg-surface-soft border border-border-subtle/50">
                          <Text className="text-xs font-bold text-primary">
                            {stageCompletedCount} / {stageMissions.length}
                          </Text>
                        </View>
                        <Text className="text-12 font-semibold text-muted mt-0.5">
                          {stagePercent}% done
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar Track */}
                    <View className="h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden">
                      <View
                        className="h-full rounded-full bg-action"
                        style={{ width: `${stagePercent}%` }}
                      />
                    </View>
                  </View>

                  {/* Connected Step Cards in this Stage */}
                  <View className="gap-3 pl-1">
                    {stageMissions.map(({ ref, mission, individuallyAvailable }, index) => {
                      const done = completed.has(ref.missionId);
                      const current = projection.currentMissionId === ref.missionId;
                      const unlocked = canExecute
                        ? done || current
                        : individuallyAvailable;

                      return (
                        <View key={ref.missionId} className="flex-row gap-3">
                          {/* Stepper Node */}
                          <View className="items-center">
                            <View
                              className={`h-10 w-10 items-center justify-center rounded-full border shadow-sm ${
                                done
                                  ? 'border-accent-sage/30 bg-card-sage'
                                  : current
                                    ? 'border-language/30 bg-lime'
                                    : 'border-border-subtle bg-surface-soft'
                              }`}
                            >
                              {done ? (
                                <Check size={18} color={iconColor('success')} />
                              ) : current ? (
                                <Route size={18} color="#17310F" />
                              ) : (
                                <LockKeyhole size={16} color={iconColor('muted')} />
                              )}
                            </View>
                            {index < stageMissions.length - 1 ? (
                              <View className="my-1 w-px flex-1 bg-border-subtle" />
                            ) : null}
                          </View>

                          {/* Mission Card */}
                          <Pressable
                            disabled={!unlocked}
                            onPress={() =>
                              onStartMission(mission, { standalone: !canExecute })
                            }
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !unlocked }}
                            accessibilityLabel={`${mission.title}. ${mission.learnerGoal}`}
                            className={`mb-3 min-h-[96px] flex-1 rounded-[22px] border p-4 transition-all focus:border-2 focus:border-focus ${
                              current
                                ? 'border-primary/30 bg-[#FFFBF0] shadow-sm'
                                : 'border-border-subtle/60 bg-surface'
                            } ${unlocked ? 'hover:bg-surface-hover active:scale-[0.99]' : 'opacity-65'}`}
                            style={{ boxShadow: ELEVATION.card }}
                          >
                            <View className="flex-row items-start gap-3">
                              <View
                                className={`h-10 w-10 items-center justify-center rounded-xl ${
                                  MISSION_TONES[mission.category]?.container ?? 'bg-surface-soft'
                                }`}
                              >
                                <Compass
                                  size={19}
                                  color={iconColor(MISSION_TONES[mission.category]?.color ?? 'brand')}
                                />
                              </View>

                              <View className="flex-1 min-w-0 gap-1">
                                <View className="flex-row items-center gap-2">
                                  <Text
                                    className="text-15 font-bold text-ink truncate"
                                    numberOfLines={1}
                                  >
                                    {mission.title}
                                  </Text>
                                  <View className="rounded-full bg-lime px-2 py-0.5">
                                    <Text className="text-xs font-extrabold text-[#17310F]">
                                      {mission.levelRange ?? 'A1'}
                                    </Text>
                                  </View>
                                  {done ? (
                                    <View className="flex-row items-center gap-1 rounded-full bg-card-sage px-2 py-0.5">
                                      <CheckCircle2 size={12} color="#2A6B47" />
                                      <Text className="text-xs font-bold text-accent-sage">
                                        Done
                                      </Text>
                                    </View>
                                  ) : current ? (
                                    <View className="rounded-full bg-language-soft px-2 py-0.5">
                                      <Text className="text-xs font-bold text-language">
                                        Next
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>

                                <Text
                                  className="text-13 leading-4 text-body truncate"
                                  numberOfLines={2}
                                >
                                  {mission.learnerGoal}
                                </Text>

                                <View className="flex-row items-center justify-between pt-1">
                                  <Text className="text-xs text-muted" numberOfLines={1}>
                                    {mission.character.name} ({mission.character.role}) · {mission.estimatedMinutes} min
                                  </Text>

                                  {unlocked ? (
                                    <View className="flex-row items-center gap-1">
                                      <Text
                                        className={`text-xs font-bold ${
                                          current ? 'text-primary' : 'text-language'
                                        }`}
                                      >
                                        {current ? 'Start step ▶' : done ? 'Replay ↺' : 'Enter'}
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>
                              </View>
                            </View>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Final Capstone Simulation Card */}
        {program.finalSimulation ? (
          <View className="gap-3 rounded-[26px] bg-surface-soft p-5 border border-border-interactive/30">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-card-sage">
                <Flag size={20} color={iconColor('success')} />
              </View>
              <View className="flex-1">
                <Text className="text-[17px] font-semibold text-ink">
                  {t.missions.finalSimulation}
                </Text>
                <Text className="mt-1 text-[13px] leading-[18px] text-body">
                  {t.missions.finalSimulationDesc}
                </Text>
              </View>
            </View>
            <Button
              label={t.missions.startFinalSimulation}
              disabled={!canExecute || !coreComplete || !finalMission}
              onPress={() => finalMission && onStartMission(finalMission, { finalSimulation: true })}
              variant={coreComplete ? 'primary' : 'secondary'}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};
