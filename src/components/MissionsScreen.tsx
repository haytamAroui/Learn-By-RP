import React, { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Text } from './AppText';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Coffee,
  Compass,
  MapPin,
  Route,
  Search,
  ShoppingBag,
  Sparkles,
  Train,
  Users,
  X,
} from 'lucide-react-native';
import { MissionDefinition, SessionRecord } from '../types';
import type { RoleplayProgram } from '../contracts/program';
import { buildProgramProjection } from '../features/program/projection';
import { useI18n } from '../features/i18n';
import { iconColor } from '../design/iconColor';
import { ELEVATION } from '../design/tokens';
import { NeighborhoodArtwork } from './NeighborhoodArtwork';
import { Button } from './ui';

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAllScenarios, setShowAllScenarios] = useState(false);
  const [activeView, setActiveView] = useState<'catalog' | 'programs' | 'route'>('catalog');

  const categories = [
    { id: 'all', label: t.missions.filterAll },
    { id: 'cafes', label: t.missions.filterCafes },
    { id: 'services', label: t.missions.filterServices },
    { id: 'transit', label: t.missions.filterTransit },
    { id: 'problems', label: t.missions.filterProblems },
    { id: 'social', label: t.missions.filterSocial },
  ];

  const query = searchQuery.trim().toLowerCase();
  const filteredMissions = missions.filter(mission => {
    const matchesSearch =
      !query ||
      mission.title.toLowerCase().includes(query) ||
      mission.setting.toLowerCase().includes(query) ||
      mission.character.name.toLowerCase().includes(query);
    const matchesCategory =
      selectedCategory === 'all' || mission.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const activeLanguage = missions[0]?.language || 'nl';
  const currentLoopTitle =
    NEIGHBORHOOD_LOOP_TITLES[activeLanguage]?.[uiLang] ||
    NEIGHBORHOOD_LOOP_TITLES[activeLanguage]?.en ||
    t.common.connectedLoop;

  // Curated Setting Hubs matching Lingo Atelier
  const settingHubs = [
    {
      id: 'cafes',
      name: 'Coffee & Bakeries',
      tagline: 'Order breakfast, pastries, and drinks politely',
      count: missions.filter(m => m.category === 'cafes').length,
      tint: 'bg-[#DFF2EA]',
      iconColor: '#0E8F7E',
      Icon: Coffee,
    },
    {
      id: 'services',
      name: 'Shops & Markets',
      tagline: 'Pharmacies, parcel pick-up, and everyday services',
      count: missions.filter(m => m.category === 'services').length,
      tint: 'bg-[#FFE6DD]',
      iconColor: '#E4533C',
      Icon: ShoppingBag,
    },
    {
      id: 'transit',
      name: 'Out & About · Travel',
      tagline: 'Metro platforms, hotel check-in, and directions',
      count: missions.filter(m => m.category === 'transit' || m.category === 'lodging').length,
      tint: 'bg-[#FFF0CF]',
      iconColor: '#B7791F',
      Icon: Train,
    },
    {
      id: 'social',
      name: 'Neighbours & Social Life',
      tagline: 'Meet neighbours, terrace small talk, and repair',
      count: missions.filter(m => m.category === 'social' || m.category === 'problems').length,
      tint: 'bg-[#ECE6FF]',
      iconColor: '#7A63E0',
      Icon: Users,
    },
  ];

  const featuredMission = filteredMissions[0] ?? missions[0];
  const isDefaultHubView = !query && selectedCategory === 'all' && !showAllScenarios;
  const displayedMissions = isDefaultHubView ? filteredMissions.slice(0, 3) : filteredMissions;

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
                size={17}
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
          {featuredMission ? (
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
            <Search size={19} color={iconColor('muted')} />
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

          {/* LINGO ATELIER: 4 Curated Setting Hubs */}
          {!query && selectedCategory === 'all' && (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-display text-18 font-bold text-ink">
                  Choose a setting
                </Text>
                <Text className="text-xs font-semibold text-muted">
                  4 authentic Flemish environments
                </Text>
              </View>

              <View className="gap-2.5">
                {settingHubs.map(hub => {
                  const Icon = hub.Icon;
                  return (
                    <Pressable
                      key={hub.id}
                      onPress={() => setSelectedCategory(hub.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${hub.name}. ${hub.tagline}`}
                      className="min-h-14 flex-row items-center gap-3.5 rounded-[22px] border border-border-subtle/50 bg-surface p-3.5 shadow-sm hover:bg-surface-hover active:scale-[0.99] transition-all"
                    >
                      <View
                        className="h-11 w-11 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: hub.tint ? undefined : '#F0F7F4' }}
                      >
                        <View className={`h-11 w-11 items-center justify-center rounded-2xl ${hub.tint}`}>
                          <Icon size={20} color={hub.iconColor} />
                        </View>
                      </View>

                      <View className="flex-1 min-w-0">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-15 font-bold text-ink truncate">
                            {hub.name}
                          </Text>
                          <View className="rounded-full bg-surface-soft px-2 py-0.5 border border-border-subtle/30">
                            <Text className="text-xs font-semibold text-muted">
                              {hub.count}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs text-muted truncate mt-0.5">
                          {hub.tagline}
                        </Text>
                      </View>

                      <ChevronRight size={18} color={iconColor('muted')} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Active Filter or Search State Notice */}
          {(selectedCategory !== 'all' || query) && (
            <View className="flex-row items-center justify-between rounded-2xl bg-surface-soft px-3.5 py-2.5 border border-border-subtle/40">
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-bold text-primary uppercase">Filtered by:</Text>
                <Text className="text-13 font-semibold text-ink">
                  {categories.find(c => c.id === selectedCategory)?.label || 'All'}
                  {query ? ` · "${query}"` : ''}
                </Text>
                <Text className="text-xs text-muted">({filteredMissions.length})</Text>
              </View>
              <Pressable
                onPress={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear filter"
                className="min-h-12 items-center justify-center px-2"
              >
                <Text className="text-xs font-bold text-language">Clear filter</Text>
              </Pressable>
            </View>
          )}

          {/* Scenarios Section Header */}
          <View className="flex-row items-center justify-between pt-1">
            <Text className="font-display text-18 font-bold text-ink">
              {isDefaultHubView ? 'Up next for you' : 'Roleplay scenarios'}
            </Text>
            <Text className="text-xs font-semibold text-muted">
              {displayedMissions.length} of {filteredMissions.length}
            </Text>
          </View>

          {/* Curated, Bite-Sized Mission Cards */}
          <View className="gap-2.5">
            {displayedMissions.map(mission => (
              <Pressable
                key={mission.id}
                onPress={() => onSelectMission(mission)}
                accessibilityRole="button"
                accessibilityLabel={missionAccessibleName(mission)}
                className="min-h-[76px] flex-row items-center gap-3.5 rounded-[22px] border border-border-subtle/60 bg-surface p-3.5 shadow-sm hover:bg-surface-hover active:scale-[0.99] transition-all"
                style={{ boxShadow: ELEVATION.card }}
              >
                <View className={`h-11 w-11 items-center justify-center rounded-2xl ${MISSION_TONES[mission.category].container}`}>
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
                  </View>

                  <Text className="text-13 leading-4 text-body truncate mt-0.5" numberOfLines={1}>
                    {mission.learnerGoal}
                  </Text>

                  <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>
                    {mission.character.name} ({mission.character.role}) · {mission.estimatedMinutes} min
                  </Text>
                </View>

                <ChevronRight size={18} color={iconColor('muted')} />
              </Pressable>
            ))}

            {filteredMissions.length === 0 ? (
              <View className="items-center px-6 py-12">
                <Text className="text-center text-14 leading-5 text-muted">
                  {t.missions.noMissionsFound}
                </Text>
              </View>
            ) : null}

            {/* Toggle to show all scenarios when on default view */}
            {isDefaultHubView && filteredMissions.length > 3 && (
              <Pressable
                onPress={() => setShowAllScenarios(true)}
                accessibilityRole="button"
                accessibilityLabel={`Browse all ${filteredMissions.length} scenarios`}
                className="min-h-12 flex-row items-center justify-center gap-2 rounded-full border border-border-interactive/40 bg-surface px-4 py-2 hover:bg-surface-hover active:scale-95 transition-all mt-1"
              >
                <Text className="text-13 font-bold text-primary">
                  Browse all {filteredMissions.length} scenarios
                </Text>
                <ChevronDown size={16} color={iconColor('brand')} />
              </Pressable>
            )}

            {!isDefaultHubView && showAllScenarios && selectedCategory === 'all' && (
              <Pressable
                onPress={() => setShowAllScenarios(false)}
                accessibilityRole="button"
                accessibilityLabel="Show fewer scenarios"
                className="min-h-12 flex-row items-center justify-center gap-2 rounded-full border border-border-interactive/40 bg-surface px-4 py-2 hover:bg-surface-hover active:scale-95 transition-all mt-1"
              >
                <Text className="text-13 font-bold text-muted">
                  Show fewer
                </Text>
                <ChevronUp size={16} color={iconColor('muted')} />
              </Pressable>
            )}
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
