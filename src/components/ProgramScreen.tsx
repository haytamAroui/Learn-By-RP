import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Flag,
  LockKeyhole,
  Route,
} from 'lucide-react-native';
import type { RoleplayProgram } from '../contracts/program';
import type { MissionDefinition, SessionRecord } from '../types';
import { MISSION_CATALOG } from '../data/missions';
import { buildProgramProjection, isProgramCoreComplete } from '../features/program/projection';
import { isProgramActivatable } from '../features/program/releaseGates';
import { useI18n } from '../features/i18n';
import { Button, EmptyState, Pill, SectionLabel } from './ui';
import { iconColor } from '../design/iconColor';

interface ProgramScreenProps {
  program: RoleplayProgram;
  sessions: SessionRecord[];
  onBack: () => void;
  onStartMission: (mission: MissionDefinition, options?: { finalSimulation?: boolean }) => void;
}

export const ProgramScreen: React.FC<ProgramScreenProps> = ({
  program,
  sessions,
  onBack,
  onStartMission,
}) => {
  const { t } = useI18n();
  const projection = useMemo(
    () => buildProgramProjection(program, sessions),
    [program, sessions]
  );
  const completed = new Set(projection.completedMissionIds);
  const canExecute = isProgramActivatable(program);
  const coreComplete = isProgramCoreComplete(program, projection);

  const plan = program.missionPlan
    .map(ref => ({
      ref,
      mission: MISSION_CATALOG.find(
        candidate => candidate.id === ref.missionId && candidate.version === ref.missionVersion
      ),
    }))
    .filter((entry): entry is typeof entry & { mission: MissionDefinition } => Boolean(entry.mission));

  const finalMission = program.finalSimulation
    ? MISSION_CATALOG.find(
        mission =>
          mission.id === program.finalSimulation?.mission.missionId &&
          mission.version === program.finalSimulation?.mission.missionVersion
      )
    : undefined;

  return (
    <View className="flex-1 bg-canvas">
      <View
        className="w-full self-center flex-row items-center gap-2 px-2 py-2"
        style={{ maxWidth: 1200 }}
      >
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          className="h-12 w-12 items-center justify-center rounded-full border border-transparent hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
        >
          <ArrowLeft size={21} color={iconColor('ink')} />
        </Pressable>
        <Text className="text-sm font-semibold text-muted">{t.missions.tabPrograms}</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 40,
          gap: 26,
        }}
      >
        <View className="gap-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <Pill
              label={canExecute ? t.missions.programReleased : t.missions.programPreview}
              tone={canExecute ? 'sage' : 'warm'}
            />
            <Text className="text-xs font-semibold text-muted">
              {program.targetLocale}
            </Text>
          </View>
          <Text className="text-[28px] font-semibold leading-[34px] tracking-tight text-ink">
            {program.title}
          </Text>
          <Text className="text-[15px] leading-[22px] text-body">
            {t.missions.programProgress
              .replace('{done}', String(projection.completedMissionIds.length))
              .replace('{total}', String(program.missionPlan.length))}
          </Text>
          {!canExecute ? (
            <Text className="rounded-2xl bg-card-warm px-4 py-3 text-sm leading-5 text-body">
              {t.missions.programUnavailable}
            </Text>
          ) : null}
        </View>

        <View className="gap-3">
          <SectionLabel>{t.missions.tabRoute}</SectionLabel>

          {plan.length === 0 ? (
            <EmptyState message={t.missions.noMissionsFound} />
          ) : (
            <View>
              {plan.map(({ ref, mission }, index) => {
                const done = completed.has(ref.missionId);
                const current = projection.currentMissionId === ref.missionId;
                const unlocked = canExecute && (done || current);

                return (
                  <View key={ref.missionId} className="flex-row gap-3">
                    <View className="items-center">
                      <View
                        className={`h-10 w-10 items-center justify-center rounded-full border ${
                          done
                            ? 'border-accent-sage/20 bg-card-sage'
                            : current
                              ? 'border-primary/20 bg-card-warm'
                              : 'border-border-subtle bg-surface-soft'
                        }`}
                      >
                        {done ? (
                          <Check size={18} color={iconColor('success')} />
                        ) : current ? (
                          <Route size={18} color={iconColor('brand')} />
                        ) : (
                          <LockKeyhole size={16} color={iconColor('muted')} />
                        )}
                      </View>
                      {index < plan.length - 1 ? (
                        <View className="my-1 w-px flex-1 bg-border-subtle" />
                      ) : null}
                    </View>

                    <Pressable
                      disabled={!unlocked}
                      onPress={() => onStartMission(mission)}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !unlocked }}
                      accessibilityLabel={mission.title}
                      className={`mb-5 min-h-[104px] flex-1 rounded-[22px] border p-4 focus:border-2 focus:border-focus ${
                        current
                          ? 'border-primary/20 bg-card-warm'
                          : 'border-transparent bg-surface-soft'
                      } ${unlocked ? 'hover:bg-surface-hover active:opacity-75' : 'opacity-60'}`}
                    >
                      <View className="flex-row items-start gap-3">
                        <View className="flex-1 gap-1">
                          <Text className="text-xs font-semibold text-muted">
                            {mission.neighborhood} · {mission.levelRange}
                          </Text>
                          <Text className="text-[17px] font-semibold leading-[22px] text-ink">
                            {mission.title}
                          </Text>
                          <Text className="text-[13px] leading-[19px] text-body" numberOfLines={2}>
                            {mission.learnerGoal}
                          </Text>
                        </View>
                        {unlocked ? <ChevronRight size={20} color={iconColor('muted')} /> : null}
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {program.finalSimulation ? (
          <View className="gap-3 rounded-[24px] bg-surface-soft p-5">
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
