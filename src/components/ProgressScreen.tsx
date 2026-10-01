import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronRight, Clock } from "lucide-react-native";
import { PhraseItem, SessionRecord, LearningObservation } from "../types";
import {
  COMMUNICATIVE_SKILLS_CATALOG,
  CommunicativeSkillMeta,
} from "../data/missions";
import { useI18n } from "../features/i18n";
import { SKILL_POLICY } from "../features/learning/policy";
import {
  inferLegacySkillEvidence,
  projectSkillsV2,
} from "../features/learning/skillProjection";
import { SkillProjectionV2 } from "../types";
import { Button, Card, EmptyState, SectionLabel } from "./ui";
import { Sheet } from "./Sheet";
import { iconColor } from "../design/iconColor";

interface ProgressScreenProps {
  phrases: PhraseItem[];
  sessions: SessionRecord[];
  observations: LearningObservation[];
  onSelectSession: (session: SessionRecord) => void;
  onDisputeObservation: (obsId: string) => void;
  onHideObservation: (obsId: string) => void;
}

/** `skills` leads: action before analytics. `Ready to practise` sits above these. */
type ProgressTab = "skills" | "phrases" | "history";

const SKILL_STATUS_TONE = {
  steady: "bg-card-sage border-accent-sage/20 text-accent-sage",
  growing: "bg-card-sky border-accent-sky/20 text-accent-sky",
  supported: "bg-card-warm border-primary/20 text-primary",
  new: "border-border-subtle bg-surface text-muted",
} as const;

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  phrases,
  sessions,
  observations,
  onSelectSession,
  onDisputeObservation,
  onHideObservation,
}) => {
  const { t } = useI18n();
  const [selectedTab, setSelectedTab] = useState<ProgressTab>("skills");
  const [selectedPhrase, setSelectedPhrase] = useState<PhraseItem | null>(null);
  const [selectedSkill, setSelectedSkill] =
    useState<CommunicativeSkillMeta | null>(null);

  const duePhrases = useMemo(
    () => phrases.filter((p) => p.scheduling.due),
    [phrases],
  );

  const phraseObservations = useMemo(() => {
    if (!selectedPhrase) return [];
    const form = selectedPhrase.form.toLowerCase();
    return observations.filter(
      (o) =>
        o.itemId === selectedPhrase.id ||
        o.candidateForm.toLowerCase() === form,
    );
  }, [observations, selectedPhrase]);

  /**
   * Skill evidence comes from the validated contract, not from matching the
   * learner's words against a skill's sample phrases. Histories recorded before
   * that contract existed are carried through as `legacy_inferred`, which is shown
   * but can never on its own mark a skill steady.
   */
  const skillEvidence = useMemo(() => {
    if (!selectedSkill) return [];
    return inferLegacySkillEvidence(observations).filter(
      (o) => o.skillId === selectedSkill.id,
    );
  }, [observations, selectedSkill]);

  const skillStats = useMemo(() => {
    const map = new Map<string, SkillProjectionV2>();
    for (const projection of projectSkillsV2(
      inferLegacySkillEvidence(observations),
    )) {
      map.set(projection.skillId, projection);
    }
    return map;
  }, [observations]);

  const tabs: Array<{
    id: ProgressTab;
    label: string;
    /** Compact label for the tab strip; `label` is the accessible full name. */
    short: string;
    count: number;
  }> = [
    {
      id: "phrases",
      label: t.progress.tabPhrases,
      short: t.progress.tabPhrasesShort,
      count: phrases.length,
    },
    {
      id: "skills",
      label: t.progress.tabSkills,
      short: t.progress.tabSkillsShort,
      count: COMMUNICATIVE_SKILLS_CATALOG.length,
    },
    {
      id: "history",
      label: t.progress.tabHistory,
      short: t.progress.tabHistoryShort,
      count: sessions.length,
    },
  ];

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 28, gap: 18 }}
      >
        <View className="gap-1">
          <Text className="font-display text-2xl font-medium tracking-tight text-ink">
            {t.progress.heading}
          </Text>
          <Text className="text-xs text-body">{t.progress.subheading}</Text>
        </View>

        {/*
          Ready to practise sits above the tabs, not inside one.

          It used to render only within the Phrases tab and below the strip, so a
          learner opening Progress on its default Skills tab with work due saw no
          prompt at all. The tab strip answers "what can I look at"; this answers
          "what should I do now", and it is the reason to be on the screen.
        */}
        {duePhrases.length > 0 && (
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Clock size={14} color={iconColor("brand")} />
              <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
                {t.progress.readyToPractise} ({duePhrases.length})
              </Text>
            </View>

            {duePhrases.slice(0, 3).map((phrase) => (
              <Pressable
                key={phrase.id}
                onPress={() => {
                  setSelectedTab("phrases");
                  setSelectedPhrase(phrase);
                }}
                accessibilityRole="button"
                className="gap-3 rounded-2xl border border-primary/20 bg-card-warm p-4 active:opacity-80"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-semibold text-ink">
                      "{phrase.form}"
                    </Text>
                    <Text className="mt-0.5 text-xs text-muted">
                      {phrase.meaning}
                    </Text>
                  </View>
                  <View className="shrink-0 rounded-lg bg-primary px-2 py-0.5">
                    <Text className="text-xs font-semibold text-white">
                      {t.progress.reviewDue}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}

            {duePhrases.length > 3 && (
              <Pressable
                onPress={() => setSelectedTab("phrases")}
                accessibilityRole="button"
                className="self-start py-1"
              >
                <Text className="text-xs font-semibold text-primary">
                  {`+ ${duePhrases.length - 3} more`}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <View
          accessibilityRole="tablist"
          className="flex-row gap-1 border-b border-border-subtle"
        >
          {tabs.map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setSelectedTab(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                // The full name is what gets announced; the visible label is short
                // enough not to truncate at 390px.
                accessibilityLabel={`${tab.label} (${tab.count})`}
                className={`flex-1 border-b-2 px-1 pb-2.5 ${
                  isActive ? "border-primary" : "border-transparent"
                }`}
              >
                <Text
                  numberOfLines={1}
                  className={`text-center text-xs ${
                    isActive
                      ? "font-semibold text-ink"
                      : "font-medium text-muted"
                  }`}
                >
                  {tab.short} ({tab.count})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedTab === "phrases" ? (
          <View className="gap-6">
            <View className="gap-3">
              <SectionLabel>
                {t.common.allTrackedVocabulary} ({phrases.length})
              </SectionLabel>

              {phrases.map((phrase) => (
                <Pressable
                  key={phrase.id}
                  onPress={() => setSelectedPhrase(phrase)}
                  accessibilityRole="button"
                  className="flex-row items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface p-4 active:opacity-80"
                >
                  <View className="flex-1 gap-1">
                    <View className="flex-row flex-wrap items-center gap-1.5">
                      <Text className="text-sm font-medium text-ink">
                        "{phrase.form}"
                      </Text>
                      <Text className="text-muted">·</Text>
                      <Text
                        className="flex-1 text-xs text-body"
                        numberOfLines={1}
                      >
                        {phrase.meaning}
                      </Text>
                    </View>
                    {phrase.stats.unassistedCount > 0 ? (
                      <Text className="text-xs font-medium text-accent-sage">
                        {t.progress.spokenCount.replace(
                          "{count}",
                          String(phrase.stats.unassistedCount),
                        )}
                      </Text>
                    ) : phrase.stats.assistedCount > 0 ? (
                      <Text className="text-xs text-muted">
                        {t.progress.supportedTitle} (
                        {phrase.stats.assistedCount})
                      </Text>
                    ) : (
                      <Text className="text-xs text-muted">
                        {t.progress.newTitle}
                      </Text>
                    )}
                  </View>

                  <View className="items-end gap-1">
                    <Text className="text-xs font-medium capitalize text-ink">
                      {phrase.recallStatus}
                    </Text>
                    <Text className="text-xs text-muted">
                      {phrase.scheduling.intervalDays}d
                    </Text>
                    <ChevronRight size={16} color={iconColor("muted")} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {selectedTab === "skills" ? (
          <View className="gap-3">
            <View className="rounded-2xl border border-border-subtle bg-surface p-4">
              <Text className="text-xs text-body">
                <Text className="font-medium text-ink">
                  {t.progress.communicativeSkillsTitle}:{" "}
                </Text>
                {t.progress.subheading}
              </Text>
            </View>

            {COMMUNICATIVE_SKILLS_CATALOG.map((skill) => {
              const projection = skillStats.get(skill.id);

              // Status comes from the projection, never from a count rendered next
              // to it. A skill with one observation is not an ability, and the row
              // says what is still missing rather than implying a level.
              const status = (projection?.status ??
                "new") as keyof typeof SKILL_STATUS_TONE;

              const contextCount = projection?.independentContexts.length ?? 0;
              const dayCount = projection?.independentDays.length ?? 0;

              /*
  The badge must not reuse the sentence printed directly above it.
  This branch used `observedAcross` with a hardcoded 0, so a skill associated with 8
  missions rendered "Observed across 8 connected scenes" on one line and "Observed
  Across 0 Connected Scenes" in the badge beneath it. `newTitle` is the intended
  label and is already translated in every locale.
*/
              const statusLabel =
                status === "steady"
                  ? t.progress.steadyTitle.split(" ")[0]
                  : status === "growing"
                    ? t.progress.growingTitle.split(" ")[0]
                    : status === "supported"
                      ? t.progress.supportedTitle.split(" ")[0]
                      : t.progress.newTitle.split(" ")[0];

              return (
                <Pressable
                  key={skill.id}
                  onPress={() => setSelectedSkill(skill)}
                  accessibilityRole="button"
                  className="flex-row items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface p-4 active:opacity-80"
                >
                  <View className="flex-1 gap-1.5">
                    <View className="flex-row flex-wrap items-center gap-1.5">
                      <Text className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {skill.category}
                      </Text>
                      <Text className="text-muted">·</Text>
                      <Text className="text-xs text-body">
                        {t.progress.observedAcross.replace(
                          "{count}",
                          String(skill.associatedMissions.length),
                        )}
                      </Text>
                    </View>

                    <Text className="font-display text-base font-semibold text-ink">
                      {skill.name}
                    </Text>
                    <Text className="text-xs leading-relaxed text-body">
                      {skill.description}
                    </Text>

                    <View className="flex-row flex-wrap items-center gap-1.5 pt-1">
                      <Text className="text-xs text-muted">
                        {t.progress.samplePatterns}
                      </Text>
                      {skill.patterns.map((pattern, idx) => (
                        <View
                          key={`${pattern}-${idx}`}
                          className="rounded-md border border-border-subtle bg-surface-sunken px-1.5 py-0.5"
                        >
                          <Text className="font-mono text-xs text-ink">
                            {pattern}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View className="items-end gap-1">
                    <View
                      className={`rounded-lg border px-2 py-1 ${SKILL_STATUS_TONE[status]}`}
                    >
                      <Text className="text-xs font-semibold capitalize">
                        {statusLabel}
                      </Text>
                    </View>
                    <Text className="text-xs text-muted">
                      {status === "new"
                        ? t.common.noEvidenceYet
                        : status === "steady"
                          ? `${contextCount} ${t.common.contextsLower} · ${dayCount} ${t.common.daysLower}`
                          : `${contextCount}/${SKILL_POLICY.growingMinContexts} ${t.common.contextsLower}`}
                    </Text>
                    {/*
                      A legacy-only history is weaker evidence and says so. Without
                      this the learner cannot tell a reconstructed record from an
                      observed one.
                    */}
                    {projection?.legacyInferredCount &&
                    projection.validatedCount === 0 ? (
                      <Text className="text-xs text-muted">
                        {t.common.inferredFromHistory}
                      </Text>
                    ) : null}
                    {projection?.reviewDue ? (
                      <Text className="text-xs text-warning">
                        {t.common.reviewDue}
                      </Text>
                    ) : null}
                    <ChevronRight size={16} color={iconColor("muted")} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {selectedTab === "history" ? (
          <View className="gap-3">
            {sessions.length === 0 ? (
              <EmptyState message={t.progress.noReceiptsYet} />
            ) : (
              sessions.map((session) => (
                <Pressable
                  key={session.id}
                  onPress={() => onSelectSession(session)}
                  accessibilityRole="button"
                  className="flex-row items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface p-4 active:opacity-80"
                >
                  <View className="flex-1 gap-1">
                    <View className="flex-row flex-wrap items-center gap-1.5">
                      <Text className="text-xs text-muted">
                        {new Date(session.startedAt).toLocaleDateString()}
                      </Text>
                      <Text className="text-muted">·</Text>
                      <Text className="text-xs capitalize text-muted">
                        {t.modes[session.mode] || session.mode}
                      </Text>
                      <Text className="text-muted">·</Text>
                      <Text className="text-xs text-muted">
                        {session.passages.length} {t.common.turns}
                      </Text>
                      {session.coldAttempt ? (
                        <Text className="text-xs font-medium text-accent-sage">
                          · {t.progress.coldAttempt}
                        </Text>
                      ) : null}
                    </View>

                    <Text className="font-display text-base font-semibold text-ink">
                      {session.missionId
                        .replace("mission-es-", "Café / ")
                        .replace("-", " ")}
                    </Text>

                    <Text className="text-xs text-body">
                      {t.recap.communicativeOutcome}:{" "}
                      <Text className="font-medium capitalize text-ink">
                        {session.taskOutcome.replace("_", " ")}
                      </Text>
                      {session.observations.length > 0
                        ? ` · ${session.observations.length} ${t.common.evidence.toLowerCase()}`
                        : ""}
                    </Text>
                  </View>

                  <View className="items-end gap-1">
                    <Text className="text-xs font-semibold text-primary">
                      {t.progress.viewReceipt}
                    </Text>
                    <ChevronRight size={16} color={iconColor("brand")} />
                  </View>
                </Pressable>
              ))
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
          <>
            <View className="gap-1">
              <Text className="font-display text-2xl font-bold text-ink">
                "{selectedPhrase.form}"
              </Text>
              <Text className="text-sm text-body">
                {selectedPhrase.meaning}
              </Text>
            </View>

            <View className="gap-1.5 rounded-xl border border-border-subtle bg-surface-sunken p-4">
              <Text className="text-xs text-body">
                <Text className="font-semibold text-ink">Usage Note: </Text>
                {selectedPhrase.usageNote}
              </Text>
              <Text className="text-xs text-body">
                <Text className="font-semibold text-ink">Recall State: </Text>
                <Text className="font-semibold capitalize text-ink">
                  {selectedPhrase.recallStatus}
                </Text>
              </Text>
              <Text className="text-xs text-body">
                <Text className="font-semibold text-ink">
                  Current Interval:{" "}
                </Text>
                {selectedPhrase.scheduling.intervalDays} days
              </Text>
            </View>

            <View className="gap-3">
              <SectionLabel>{t.recap.validatedEvidence}</SectionLabel>

              {phraseObservations.length === 0 ? (
                <Text className="text-xs text-muted">
                  {t.recap.noPhrasesValidated}
                </Text>
              ) : (
                phraseObservations.map((obs) => (
                  <View
                    key={obs.observationId}
                    className="gap-2 rounded-xl border border-border-subtle bg-surface-sunken p-3"
                  >
                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="flex-1 text-xs font-medium text-ink">
                        "{obs.quote}"
                      </Text>
                      <View
                        className={`rounded-md px-1.5 py-0.5 ${
                          obs.retrieval === "unassisted"
                            ? "bg-card-sage"
                            : "bg-card-warm"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            obs.retrieval === "unassisted"
                              ? "text-accent-sage"
                              : "text-primary"
                          }`}
                        >
                          {obs.retrieval === "unassisted"
                            ? t.recap.unassisted
                            : t.recap.assisted}{" "}
                          ({obs.modality})
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="text-xs text-muted">
                        {new Date(obs.recordedAt).toLocaleString()}
                      </Text>
                      <View className="flex-row gap-3">
                        <Button
                          label={t.progress.hideEvidence}
                          onPress={() => onHideObservation(obs.observationId)}
                          variant="ghost"
                          size="sm"
                        />
                        <Button
                          label={t.progress.disputeEvidence}
                          onPress={() =>
                            onDisputeObservation(obs.observationId)
                          }
                          variant="ghost"
                          size="sm"
                        />
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            <Button
              label={t.common.close}
              onPress={() => setSelectedPhrase(null)}
            />
          </>
        ) : null}
      </Sheet>

      <Sheet
        visible={Boolean(selectedSkill)}
        onClose={() => setSelectedSkill(null)}
        title={selectedSkill?.category}
      >
        {selectedSkill ? (
          <>
            <View className="gap-1">
              <Text className="font-display text-2xl font-bold text-ink">
                {selectedSkill.name}
              </Text>
              <Text className="text-xs text-body">
                {selectedSkill.description}
              </Text>
            </View>

            <View className="gap-1.5 rounded-xl border border-border-subtle bg-surface-sunken p-4">
              <Text className="text-xs font-semibold text-ink">
                {t.progress.samplePatterns}
              </Text>
              {selectedSkill.patterns.map((pattern, idx) => (
                <Text
                  key={`${pattern}-${idx}`}
                  className="font-mono text-xs text-ink"
                >
                  • {pattern}
                </Text>
              ))}
            </View>

            <View className="gap-3">
              <SectionLabel>{t.recap.validatedEvidence}</SectionLabel>

              {skillEvidence.length === 0 ? (
                <EmptyState
                  message={t.progress.noReceiptsYet}
                  className="py-6"
                />
              ) : (
                skillEvidence.map((obs) => (
                  <View
                    key={obs.id}
                    className="gap-2 rounded-xl border border-border-subtle bg-surface p-3"
                  >
                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="flex-1 text-xs font-medium text-ink">
                        "{obs.quote}"
                      </Text>
                      <View
                        className={`rounded-md px-1.5 py-0.5 ${
                          obs.retrieval === "unassisted"
                            ? "bg-card-sage"
                            : "bg-card-warm"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            obs.retrieval === "unassisted"
                              ? "text-accent-sage"
                              : "text-primary"
                          }`}
                        >
                          {obs.retrieval === "unassisted"
                            ? t.recap.unassisted
                            : t.recap.assisted}{" "}
                          ({obs.modality})
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-muted">
                      {new Date(obs.recordedAt).toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <Button
              label={t.common.close}
              onPress={() => setSelectedSkill(null)}
            />
          </>
        ) : null}
      </Sheet>
    </View>
  );
};
