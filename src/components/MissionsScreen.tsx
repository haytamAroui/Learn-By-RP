import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Text } from './AppText';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  MapPin,
  Route,
  Search,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react-native';
import { MissionDefinition, SessionRecord } from '../types';
import type { RoleplayProgram } from '../contracts/program';
import { buildProgramProjection } from '../features/program/projection';
import { useI18n } from '../features/i18n';
import { iconColor } from '../design/iconColor';
import { ELEVATION } from '../design/tokens';
import { NeighborhoodArtwork } from './NeighborhoodArtwork';
import { speakWithBestAvailable } from '../providers/voice/speechOutput';
import { NativeVoiceTransport } from '../providers/voice/nativeVoiceTransport';

const MISSION_TONES: Record<MissionDefinition['category'], { container: string; color: string }> = {
  cafes: { container: 'bg-[#DFF2EA]', color: 'brand' },
  services: { container: 'bg-[#FFE6DD]', color: 'info' },
  transit: { container: 'bg-[#FFF0CF]', color: 'language' },
  lodging: { container: 'bg-[#FFF0CF]', color: 'warning' },
  social: { container: 'bg-[#ECE6FF]', color: 'success' },
  problems: { container: 'bg-[#ECE6FF]', color: 'brand' },
};

interface MissionsScreenProps {
  missions: MissionDefinition[];
  programs: RoleplayProgram[];
  sessions: SessionRecord[];
  onSelectMission: (mission: MissionDefinition) => void;
  onSelectProgram: (program: RoleplayProgram) => void;
}

interface LevelMeta {
  code: string;
  badge: string;
  title: string;
  tagline: string;
  description: string;
}

const LEVEL_METAS: Record<string, LevelMeta> = {
  A1: {
    code: 'A1',
    badge: 'A1',
    title: 'Fase 1–2 · Basis & Eerste Gesprekken',
    tagline: 'Groeten, de/het, o.t.t. en basiswoordvolgorde',
    description: 'Eerste gesprekken, koffie en broodjes bestellen, de/het lidwoorden en beleefde Vlaamse groeten.',
  },
  A2: {
    code: 'A2',
    badge: 'A2',
    title: 'Fase 3–4 · Dagelijkse Zelfstandigheid & Diensten',
    tagline: 'Scheidbare werkwoorden, v.t.t. en bijzinsvolgorde',
    description: 'Pakjespunt, sleuteloverdracht met buren, apotheek, scheidbare werkwoorden (opbellen) en voltooid verleden tijd.',
  },
  B1: {
    code: 'B1',
    badge: 'B1',
    title: 'Fase 5–6 · Vloeiende Gesprekken & Mening',
    tagline: 'Hypothetische zinnen, register en connectoren',
    description: 'Meningsverschillen op het terras, keuzes motiveren, hypothetische constructies ("zou willen") en register (ge/u/je).',
  },
};

const CATEGORY_CHIPS = [
  { id: 'all', label: 'All Settings' },
  { id: 'cafes', label: 'Cafés & Food' },
  { id: 'services', label: 'Shops & Services' },
  { id: 'transit', label: 'Transit & Travel' },
  { id: 'social', label: 'Social & Life' },
];

const NEIGHBORHOOD_LOOP_TITLES: Record<string, Record<string, string>> = {
  es: {
    en: 'Calle del Sol — Connected Neighborhood Loop (Madrid)',
    fr: 'Calle del Sol — Boucle de quartier connectée (Madrid)',
    es: 'Calle del Sol — Bucle de barrio conectado (Madrid)',
    nl: 'Calle del Sol — Verbonden buurtlus (Madrid)',
  },
  fr: {
    en: 'Quartier Saint-Michel — Connected Rive Gauche Loop (Paris)',
    fr: 'Quartier Saint-Michel — Boucle Rive Gauche connectée (Paris)',
    es: 'Quartier Saint-Michel — Bucle Rive Gauche conectado (París)',
    nl: 'Quartier Saint-Michel — Verbonden Rive Gauche-lus (Parijs)',
  },
  de: {
    en: 'Kreuzberg Marktplatz — Connected Neighborhood Loop (Berlin)',
    fr: 'Kreuzberg Marktplatz — Boucle de quartier connectée (Berlin)',
    es: 'Kreuzberg Marktplatz — Bucle de barrio conectado (Berlín)',
    nl: 'Kreuzberg Marktplatz — Verbonden buurtlus (Berlijn)',
  },
  it: {
    en: 'Piazza Santa Croce — Connected Historic District Loop (Florence)',
    fr: 'Piazza Santa Croce — Boucle de quartier historique connectée (Florence)',
    es: 'Piazza Santa Croce — Bucle de distrito histórico conectado (Florencia)',
    nl: 'Piazza Santa Croce — Verbonden historische wijk-lus (Florence)',
  },
  ja: {
    en: 'Yanaka Ginza — Connected Shitamachi Neighborhood Loop (Tokyo)',
    fr: 'Yanaka Ginza — Boucle Shitamachi connectée (Tokyo)',
    es: 'Yanaka Ginza — Bucle Shitamachi conectado (Tokio)',
    nl: 'Yanaka Ginza — Verbonden Shitamachi-buurtlus (Tokio)',
  },
  nl: {
    en: 'Brussels — Belgian Dutch Everyday Loop',
    fr: 'Bruxelles — Parcours quotidien en néerlandais de Belgique',
    es: 'Bruselas — Ruta cotidiana en neerlandés de Bélgica',
    nl: 'Brussel — Verbonden dagelijkse oefenroute in Belgisch Nederlands',
  },
};

function missionAccessibleName(mission: MissionDefinition): string {
  return `${mission.title}. ${mission.character.name}, ${mission.character.role}. ${mission.learnerGoal}`;
}

export const MissionsScreen: React.FC<MissionsScreenProps> = ({
  missions,
  programs,
  sessions,
  onSelectMission,
  onSelectProgram,
}) => {
  const { t, language: uiLang } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<TextInput>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeView, setActiveView] = useState<'catalog' | 'programs' | 'route'>('catalog');
  const [auditioningMissionId, setAuditioningMissionId] = useState<string | null>(null);
  const voiceTransportRef = useRef<NativeVoiceTransport | null>(null);

  const handleAuditionMission = async (mission: MissionDefinition) => {
    try {
      setAuditioningMissionId(mission.id);
      if (!voiceTransportRef.current) {
        voiceTransportRef.current = new NativeVoiceTransport(() => true);
      }
      const samplePhrase =
        mission.sampleConversation?.find(turn => turn.speaker === 'character')?.nl ||
        mission.usefulPhrases?.[0]?.form ||
        'Goeiemorgen! Welkom bij ons.';

      await speakWithBestAvailable(voiceTransportRef.current, samplePhrase, {
        language: mission.language,
        locale: mission.language === 'nl' ? 'nl-BE' : undefined,
        speed: 1,
        voice: mission.character.voiceName,
        voiceGender: mission.character.voiceGender,
        style: mission.character.voiceStyle,
      });
    } catch (e) {
      console.warn('Catalog voice audition failed:', e);
    } finally {
      setAuditioningMissionId(null);
    }
  };

  const availableLevels = useMemo(() => {
    const set = new Set<string>();
    for (const m of missions) {
      if (m.levelRange) set.add(m.levelRange);
    }
    if (set.size === 0) set.add('A1');
    return Array.from(set).sort();
  }, [missions]);

  const completedMissionIds = useMemo(() => {
    return new Set(
      sessions
        .filter(
          session =>
            session.endReason === 'completed' ||
            session.taskOutcome === 'completed' ||
            session.sceneState?.outcome === 'achieved' ||
            session.state === 'recap_ready'
        )
        .map(session => session.missionId)
    );
  }, [sessions]);

  const query = searchQuery.trim().toLowerCase();
  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      const level = mission.levelRange ?? 'A1';
      const matchesLevel = selectedLevel === 'all' || level === selectedLevel;
      const matchesCategory =
        selectedCategory === 'all' ||
        mission.category === selectedCategory ||
        (selectedCategory === 'transit' && mission.category === 'lodging') ||
        (selectedCategory === 'social' && mission.category === 'problems');
      const matchesSearch =
        !query ||
        mission.title.toLowerCase().includes(query) ||
        mission.setting.toLowerCase().includes(query) ||
        mission.character.name.toLowerCase().includes(query) ||
        level.toLowerCase().includes(query);

      return matchesLevel && matchesCategory && matchesSearch;
    });
  }, [missions, selectedLevel, selectedCategory, query]);

  const levelsToDisplay = useMemo(() => {
    if (selectedLevel !== 'all') {
      return [selectedLevel];
    }
    return availableLevels;
  }, [selectedLevel, availableLevels]);

  const activeLanguage = missions[0]?.language || 'nl';
  const currentLoopTitle =
    NEIGHBORHOOD_LOOP_TITLES[activeLanguage]?.[uiLang] ||
    NEIGHBORHOOD_LOOP_TITLES[activeLanguage]?.en ||
    t.common.connectedLoop;

  const featuredMission = useMemo(() => {
    const candidate = filteredMissions.find(m => !completedMissionIds.has(m.id));
    return candidate || filteredMissions[0] || missions[0];
  }, [filteredMissions, completedMissionIds, missions]);

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        width: '100%',
        maxWidth: 760,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 40,
        gap: 20,
      }}
    >
      {/* View Switcher: Catalog / Programs / Route */}
      <View className="flex-row gap-2">
        {[
          { id: 'catalog' as const, label: t.missions.tabCatalog, Icon: Compass },
          { id: 'programs' as const, label: t.missions.tabPrograms, Icon: BookOpen },
          { id: 'route' as const, label: t.missions.tabRoute, Icon: Route },
        ].map(item => {
          const selected = activeView === item.id;
          const Icon = item.Icon;

          return (
            <Pressable
              key={item.id}
              onPress={() => setActiveView(item.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              className={`min-h-12 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border px-2 hover:bg-surface-hover focus:border-2 focus:border-focus ${
                selected ? 'border-language/20 bg-language-soft' : 'border-transparent bg-surface'
              }`}
            >
              <Icon
                size={16}
                color={selected ? iconColor('language') : iconColor('muted')}
              />
              <Text
                className={`flex-shrink text-center text-xs font-semibold ${
                  selected ? 'text-language' : 'text-body'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeView === 'catalog' ? (
        <View className="gap-5">
          {/* Lingo Atelier Featured Conversation Card */}
          {Boolean(featuredMission && !query) ? (
            <View className="overflow-hidden rounded-[26px] border border-border-interactive/40 bg-surface shadow-sm" style={{ boxShadow: ELEVATION.card }}>
              <View className="relative h-[148px] w-full overflow-hidden bg-[#E2F1E7]">
                <NeighborhoodArtwork />
                <View className="absolute inset-0 bg-black/25" />
                <View className="absolute left-4 top-3 px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-md">
                  <Text className="text-xs font-bold uppercase tracking-wider text-white">
                    YOUR NEXT CONVERSATION
                  </Text>
                </View>
                <View className="absolute right-4 top-3 px-2.5 py-1 rounded-xl bg-lime">
                  <Text className="text-xs font-extrabold text-[#17310F]">
                    {featuredMission.levelRange ?? 'A1'}
                  </Text>
                </View>
                <View className="absolute left-4 bottom-3 right-4">
                  <Text className="font-display text-20 font-bold text-white leading-tight">
                    {featuredMission.title}
                  </Text>
                </View>
              </View>
              <View className="p-4 gap-3 bg-[#FFFBF0]">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    5-MINUTE ROLE-PLAY
                  </Text>
                  <Text className="text-xs font-semibold text-muted">
                    {featuredMission.estimatedMinutes} min
                  </Text>
                </View>
                <Text className="text-14 leading-5 text-body">
                  {featuredMission.learnerGoal}
                </Text>
                <Pressable
                  onPress={() => onSelectMission(featuredMission)}
                  accessibilityRole="button"
                  accessibilityLabel={`Step inside ${featuredMission.title}`}
                  className="min-h-12 flex-row items-center justify-center gap-2 rounded-full bg-lime px-4 py-2 hover:opacity-95 active:scale-[0.98] transition-all"
                >
                  <Text className="text-14 font-extrabold text-[#17310F]">
                    Step inside
                  </Text>
                  <ChevronRight size={16} color="#17310F" />
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* Quick Search Bar */}
          <View className="h-14 flex-row items-center gap-3 rounded-[20px] border border-border-interactive bg-surface px-4">
            <Search size={18} color={iconColor('muted')} />
            <TextInput
              ref={searchRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t.missions.searchPlaceholder}
              placeholderTextColor={iconColor('muted')}
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel={t.missions.searchPlaceholder}
              className="h-full flex-1 text-[15px] text-ink"
            />
            {searchQuery ? (
              <Pressable
                onPress={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                accessibilityRole="button"
                accessibilityLabel={t.common.clear}
                className="h-12 w-12 items-center justify-center rounded-full focus:border-2 focus:border-focus"
              >
                <X size={18} color={iconColor('muted')} />
              </Pressable>
            ) : null}
          </View>

          {/* CEFR Level Segmented Selector Tabs */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-display text-16 font-bold text-ink">
                Organized by Level
              </Text>
              <Text className="text-xs font-semibold text-muted">
                {missions.length} roleplay scenarios
              </Text>
            </View>

            <View className="flex-row gap-2 flex-wrap">
              {/* All Levels Pill */}
              <Pressable
                onPress={() => setSelectedLevel('all')}
                accessibilityRole="tab"
                accessibilityState={{ selected: selectedLevel === 'all' }}
                accessibilityLabel={`All Levels, ${missions.length} scenarios`}
                className={`min-h-12 px-3.5 py-2 rounded-2xl flex-row items-center gap-2 border transition-all ${
                  selectedLevel === 'all'
                    ? 'bg-action border-action'
                    : 'bg-surface border-border-interactive/40 hover:bg-surface-hover'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedLevel === 'all' ? 'text-action-text' : 'text-body'
                  }`}
                >
                  All Levels ({missions.length})
                </Text>
              </Pressable>

              {/* Dynamic Level Pills: A1, A2, etc. */}
              {availableLevels.map(lvl => {
                const isSelected = selectedLevel === lvl;
                const levelCount = missions.filter(m => (m.levelRange ?? 'A1') === lvl).length;
                const meta = LEVEL_METAS[lvl];

                return (
                  <Pressable
                    key={lvl}
                    onPress={() => setSelectedLevel(lvl)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Level ${lvl}, ${levelCount} scenarios`}
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
                      {meta?.title ? meta.title.split('&')[0].trim() : `Level ${lvl}`} ({levelCount})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Quick Situation / Setting Chips */}
          <View className="flex-row gap-2 flex-wrap">
            {CATEGORY_CHIPS.map(chip => {
              const isSelected = selectedCategory === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => setSelectedCategory(chip.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  className={`min-h-12 px-3 py-1.5 rounded-xl flex-row items-center border transition-all ${
                    isSelected
                      ? 'bg-surface-soft border-border-interactive font-bold'
                      : 'bg-surface border-border-subtle/50 hover:bg-surface-hover'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      isSelected ? 'font-bold text-ink' : 'font-medium text-muted'
                    }`}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Active Filter Notice */}
          {Boolean(selectedLevel !== 'all' || selectedCategory !== 'all' || query) ? (
            <View className="flex-row items-center justify-between rounded-2xl bg-surface-soft px-3.5 py-2.5 border border-border-subtle/40">
              <View className="flex-row items-center gap-2 flex-1">
                <Text className="text-xs font-bold text-primary uppercase">Active filter:</Text>
                <Text className="text-13 font-semibold text-ink truncate">
                  {selectedLevel !== 'all' ? `Level ${selectedLevel}` : 'All Levels'}
                  {selectedCategory !== 'all' ? ` · ${CATEGORY_CHIPS.find(c => c.id === selectedCategory)?.label}` : ''}
                  {query ? ` · "${query}"` : ''}
                </Text>
                <Text className="text-xs text-muted">({filteredMissions.length})</Text>
              </View>
              <Pressable
                onPress={() => {
                  setSelectedLevel('all');
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
                className="min-h-12 items-center justify-center px-2"
              >
                <Text className="text-xs font-bold text-language">Clear filter</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Level-Organized Sections */}
          <View className="gap-6">
            {levelsToDisplay.map(lvl => {
              const levelMissions = filteredMissions.filter(m => (m.levelRange ?? 'A1') === lvl);
              if (levelMissions.length === 0) return null;

              const meta = LEVEL_METAS[lvl] ?? {
                code: lvl,
                badge: lvl,
                title: `Level ${lvl}`,
                tagline: 'Scenarios',
                description: 'Curated communicative roleplays.',
              };

              const completedInLevel = levelMissions.filter(m => completedMissionIds.has(m.id)).length;
              const percent = Math.round((completedInLevel / levelMissions.length) * 100);

              return (
                <View key={lvl} className="gap-3">
                  {/* Level Header Banner Card */}
                  <View
                    className="rounded-[24px] bg-surface border border-border-subtle/70 p-4 gap-3 shadow-sm"
                    style={{ boxShadow: ELEVATION.card }}
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
                        <View className="px-2.5 py-1 rounded-xl bg-lime shadow-sm">
                          <Text className="text-xs font-extrabold text-[#17310F]">
                            {meta.badge}
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
                            {completedInLevel} / {levelMissions.length}
                          </Text>
                        </View>
                        <Text className="text-12 font-semibold text-muted mt-0.5">
                          {percent}% done
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar Track */}
                    <View className="h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden">
                      <View
                        className="h-full rounded-full bg-action"
                        style={{ width: `${percent}%` }}
                      />
                    </View>
                  </View>

                  {/* Curated Mission Cards under this Level */}
                  <View className="gap-2.5">
                    {levelMissions.map(mission => {
                      const isCompleted = completedMissionIds.has(mission.id);
                      return (
                        <View
                          key={mission.id}
                          className="min-h-[76px] rounded-[22px] border border-border-subtle/60 bg-surface p-3.5 shadow-sm transition-all"
                          style={{ boxShadow: ELEVATION.card }}
                        >
                          <Pressable
                            onPress={() => onSelectMission(mission)}
                            accessibilityRole="button"
                            accessibilityLabel={missionAccessibleName(mission)}
                            className="flex-row items-center gap-3.5 hover:opacity-95 active:scale-[0.99]"
                          >
                            <View
                              className={`h-11 w-11 items-center justify-center rounded-2xl ${MISSION_TONES[mission.category].container}`}
                            >
                              <Compass size={20} color={iconColor(MISSION_TONES[mission.category].color)} />
                            </View>

                            <View className="flex-1 min-w-0">
                              <View className="flex-row items-center gap-2">
                                <Text className="text-15 font-bold text-ink truncate" numberOfLines={1}>
                                  {mission.title}
                                </Text>
                                <View className="rounded-full bg-lime px-2 py-0.5">
                                  <Text className="text-xs font-extrabold text-[#17310F]">
                                    {mission.levelRange ?? 'A1'}
                                  </Text>
                                </View>
                                {isCompleted ? (
                                  <View className="flex-row items-center gap-1 rounded-full bg-card-sage px-2 py-0.5">
                                    <CheckCircle2 size={12} color="#2A6B47" />
                                    <Text className="text-xs font-bold text-accent-sage">Done</Text>
                                  </View>
                                ) : null}
                              </View>

                              <Text className="text-13 leading-4 text-body truncate mt-0.5" numberOfLines={1}>
                                {mission.learnerGoal}
                              </Text>

                              <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>
                                📍 {mission.neighborhood || mission.setting} · {mission.character.name} ({mission.character.role}) · {mission.estimatedMinutes} min
                              </Text>
                            </View>

                            <ChevronRight size={18} color={iconColor('muted')} />
                          </Pressable>

                          <View className="flex-row items-center justify-between pt-2.5 mt-2 border-t border-border-subtle/30">
                            <Pressable
                              onPress={() => void handleAuditionMission(mission)}
                              accessibilityRole="button"
                              accessibilityLabel={`Beluister stem van ${mission.character.name} (${mission.character.voiceName || 'Stem'})`}
                              className={`min-h-12 px-3 rounded-full flex-row items-center gap-1.5 border transition-all active:scale-95 ${
                                auditioningMissionId === mission.id
                                  ? 'bg-action border-action'
                                  : 'bg-surface-soft border-border-interactive/40 hover:bg-surface-hover'
                              }`}
                            >
                              <Volume2
                                size={13}
                                color={iconColor(
                                  auditioningMissionId === mission.id ? 'white' : 'brand'
                                )}
                              />
                              <Text
                                className={`text-xs font-bold ${
                                  auditioningMissionId === mission.id ? 'text-white' : 'text-ink'
                                }`}
                              >
                                {auditioningMissionId === mission.id
                                  ? 'Aan het spreken…'
                                  : `Stem: ${mission.character.voiceName || 'Beluister'}`}
                              </Text>
                            </Pressable>

                            <Pressable
                              onPress={() => onSelectMission(mission)}
                              accessibilityRole="button"
                              accessibilityLabel={`Start ${mission.title}`}
                              className="min-h-12 px-3.5 rounded-full bg-lime flex-row items-center gap-1 active:scale-95"
                            >
                              <Text className="text-xs font-extrabold text-[#17310F]">
                                {isCompleted ? 'Herhaal ↺' : 'Start ▶'}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {filteredMissions.length === 0 ? (
              <View className="items-center px-6 py-12 rounded-[24px] bg-surface-soft border border-border-subtle/40 gap-3">
                <Text className="text-center text-14 leading-5 text-muted">
                  {t.missions.noMissionsFound}
                </Text>
                <Pressable
                  onPress={() => {
                    setSelectedLevel('all');
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all filters"
                  className="min-h-12 px-4 rounded-full bg-surface border border-border-interactive items-center justify-center"
                >
                  <Text className="text-xs font-bold text-ink">Reset filters</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      ) : activeView === 'programs' ? (
        <View className="gap-4">
          {programs.length === 0 ? (
            <View className="items-center px-6 py-14">
              <Text className="text-center text-sm leading-5 text-muted">
                {t.missions.noProgramsFound}
              </Text>
            </View>
          ) : (
            programs.map(program => {
              const projection = buildProgramProjection(program, sessions);
              const released = program.reviewStatus === 'released';
              return (
                <Pressable
                  key={program.id}
                  onPress={() => onSelectProgram(program)}
                  accessibilityRole="button"
                  accessibilityLabel={program.title}
                  className="min-h-[132px] rounded-[24px] border border-border-subtle/60 bg-surface p-5 hover:bg-surface-hover active:opacity-75 focus:border-2 focus:border-focus"
                  style={{ boxShadow: ELEVATION.card }}
                >
                  <View className="flex-row items-start gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-2xl bg-card-warm">
                      <BookOpen size={20} color={iconColor('brand')} />
                    </View>
                    <View className="flex-1 gap-1">
                      <View className="flex-row flex-wrap items-center gap-2">
                        <Text className="text-xs font-semibold text-primary">
                          {released ? t.missions.programReleased : t.missions.programPreview}
                        </Text>
                        <Text className="text-xs text-muted">{program.targetLocale}</Text>
                      </View>
                      <Text className="text-[17px] font-semibold leading-[22px] text-ink">
                        {program.title}
                      </Text>
                      <Text className="text-[13px] leading-[19px] text-body">
                        {t.missions.programProgress
                          .replace('{done}', String(projection.completedMissionIds.length))
                          .replace('{total}', String(program.missionPlan.length))}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={iconColor('muted')} />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      ) : (
        <View className="gap-5">
          <View className="rounded-[24px] bg-surface-soft p-4">
            <View className="flex-row items-start gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-card-warm">
                <MapPin size={20} color={iconColor('brand')} />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-semibold leading-[21px] text-ink">
                  {currentLoopTitle}
                </Text>
                <Text className="mt-1 text-[13px] leading-[19px] text-body">
                  {t.missions.routeSubtitle}
                </Text>
              </View>
            </View>
          </View>

          <View>
            {missions.map((mission, index) => (
              <View key={mission.id} className="flex-row gap-3">
                <View className="items-center">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-action">
                    <Text className="text-sm font-bold text-action-text">{index + 1}</Text>
                  </View>
                  {index < missions.length - 1 ? (
                    <View className="my-1 w-px flex-1 bg-border-subtle" />
                  ) : null}
                </View>

                <Pressable
                  onPress={() => onSelectMission(mission)}
                  accessibilityRole="button"
                  accessibilityLabel={mission.title}
                  className="mb-5 min-h-[92px] flex-1 rounded-[22px] border border-transparent bg-surface-soft p-4 hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
                >
                  <View className="flex-row items-start gap-3">
                    <View className="flex-1">
                      <Text className="text-[16px] font-semibold leading-[21px] text-ink">
                        {mission.title}
                      </Text>
                      <Text className="mt-1 text-[13px] text-muted">
                        {mission.levelRange} · {mission.estimatedMinutes} {t.common.minutes}
                      </Text>
                      {mission.transferReason ? (
                        <Text className="mt-2 text-[13px] leading-[18px] text-body" numberOfLines={2}>
                          {mission.transferReason}
                        </Text>
                      ) : null}
                    </View>
                    <ChevronRight size={20} color={iconColor('muted')} />
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};
