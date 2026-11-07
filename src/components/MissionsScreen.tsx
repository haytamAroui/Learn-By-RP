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
  ChevronRight,
  Compass,
  MapPin,
  Route,
  Search,
  Sparkles,
  X,
} from 'lucide-react-native';
import { MissionDefinition, SessionRecord } from '../types';
import type { RoleplayProgram } from '../contracts/program';
import { buildProgramProjection } from '../features/program/projection';
import { useI18n } from '../features/i18n';
import { iconColor } from '../design/iconColor';
import { ELEVATION } from '../design/tokens';
import { NeighborhoodArtwork } from './NeighborhoodArtwork';

const MISSION_TONES: Record<MissionDefinition['category'], { container: string; color: string }> = {
  cafes: { container: 'bg-card-warm', color: 'brand' },
  services: { container: 'bg-card-sky', color: 'info' },
  transit: { container: 'bg-language-soft', color: 'language' },
  lodging: { container: 'bg-warning-soft', color: 'warning' },
  social: { container: 'bg-card-sage', color: 'success' },
  problems: { container: 'bg-card-warm', color: 'brand' },
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

/**
 * The mission card's accessible name.
 *
 * `accessibilityLabel` replaces the card's inner text for assistive technology, so
 * naming the card after its title alone hides both the communicative job and the
 * interlocutor from anyone not looking at the screen.
 *
 * The goal has to be in the name rather than in `accessibilityHint`, because
 * react-native-web discards `accessibilityHint` entirely: on the rendered page the
 * card carries `aria-label` and nothing else - no `aria-describedby`, no
 * `aria-description`, no `title`. A hint that is silently dropped is worse than no
 * hint, because the source reads as though the task is exposed and it is not.
 *
 * Order is deliberate: the title first because it is what makes the name unique across
 * a 32-entry list, then who the learner is speaking to, then the task itself.
 */
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

  const activeLanguage = missions[0]?.language || 'es';
  const currentLoopTitle =
    NEIGHBORHOOD_LOOP_TITLES[activeLanguage]?.[uiLang] ||
    NEIGHBORHOOD_LOOP_TITLES[activeLanguage]?.en ||
    t.common.connectedLoop;

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        width: '100%',
        maxWidth: 760,
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 36,
        gap: 22,
      }}
    >
      <Text className="max-w-[620px] text-[15px] leading-[22px] text-body">
        {t.missions.subheading}
      </Text>

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
              className={`min-h-12 flex-1 flex-row items-center justify-center gap-1 rounded-full border px-2 hover:bg-surface-hover focus:border-2 focus:border-focus ${
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
          {!query && selectedCategory === 'all' && filteredMissions[0] ? (
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
                    {filteredMissions[0].levelRange ?? 'A1'}
                  </Text>
                </View>
                <View className="absolute left-4 bottom-3 right-4">
                  <Text className="font-display text-20 font-bold text-white leading-tight">
                    {filteredMissions[0].title}
                  </Text>
                </View>
              </View>
              <View className="p-4 gap-3 bg-[#FFFBF0]">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    5-MINUTE ROLE-PLAY
                  </Text>
                  <Text className="text-xs font-semibold text-muted">
                    {filteredMissions[0].estimatedMinutes} min
                  </Text>
                </View>
                <Text className="text-14 leading-5 text-body">
                  {filteredMissions[0].learnerGoal}
                </Text>
                <Pressable
                  onPress={() => onSelectMission(filteredMissions[0])}
                  accessibilityRole="button"
                  accessibilityLabel={`Step inside ${filteredMissions[0].title}`}
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
              <Pressable onPress={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                accessibilityRole="button" accessibilityLabel={t.common.clear}
                className="h-12 w-12 items-center justify-center rounded-full focus:border-2 focus:border-focus">
                <X size={18} color={iconColor('muted')} />
              </Pressable>
            ) : null}
          </View>

          <View className="flex-row items-center justify-between pt-1">
            <Text className="font-display text-18 font-bold text-ink">
              Choose a setting
            </Text>
            <Text className="text-xs font-semibold text-muted">
              {filteredMissions.length} {filteredMissions.length === 1 ? 'scenario' : 'scenarios'}
            </Text>
          </View>

          {/*
            Category filters wrap instead of scrolling horizontally.

            This was a horizontal ScrollView with its indicator hidden, so the last chip
            was cut mid-word at the right edge in both themes with nothing to indicate it
            could be scrolled. On a phone that is a defensible pattern; at 840 and 1440 it
            hid filters while leaving a wide empty margin beside them, so a learner had to
            discover a scroll to reach "Social & Neighborhood".

            Six chips wrapping to two or three lines is a small cost, and it makes every
            filter visible and reachable without a gesture. Both blueprints rule this out
            anyway: "avoid horizontal scrolling for ordinary screens" and "keep family
            filters accessible in a sheet or short segmented control".
          */}
          <View className="flex-row flex-wrap gap-2">
            {categories.map(category => {
              const selected = selectedCategory === category.id;

              return (
                <Pressable
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={`min-h-12 justify-center rounded-full border px-4 hover:bg-surface-hover focus:border-2 focus:border-focus ${
                    selected ? 'border-action bg-action' : 'border-transparent bg-surface-soft'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selected ? 'text-action-text' : 'text-body'
                    }`}
                  >
                    {category.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="gap-3">
            {filteredMissions.map(mission => (
              <React.Fragment key={mission.id}>
                <Pressable
                  onPress={() => onSelectMission(mission)}
                  accessibilityRole="button"
                  accessibilityLabel={missionAccessibleName(mission)}
                  className="min-h-[104px] flex-row items-center gap-3 rounded-[20px] border border-border-subtle/60 bg-surface px-4 py-4 hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
                  style={{ boxShadow: ELEVATION.card }}
                >
                  <View className={`h-12 w-12 items-center justify-center rounded-[15px] ${MISSION_TONES[mission.category].container}`}>
                    <Compass size={21} color={iconColor(MISSION_TONES[mission.category].color)} />
                  </View>

                  {/*
                    The row answers what situation this is, what the learner has to
                    accomplish, and who they will be speaking with.

                    It used to show `mission.setting` instead, which is a description of
                    the place rather than of the task: "A bustling neighbourhood cafe
                    with morning commuters" tells a learner nothing about what they are
                    meant to do there, and it was truncated to one line, so even the
                    context it did give was usually cut mid-sentence. `learnerGoal` and
                    the character are the decision-relevant fields, and both blueprints
                    require them in mission discovery.

                    Neighbourhood and setting are not lost - the briefing renders both -
                    so this row stays a summary rather than a second briefing.
                  */}
                  <View className="flex-1">
                    <Text className="text-[17px] font-semibold leading-[22px] text-ink">
                      {mission.title}
                    </Text>
                    {/*
                      No `numberOfLines` here on purpose. Goals run 61-113 characters
                      across the 32 authored missions, and truncating one hides the task
                      the learner is being asked to judge. Wrapping keeps the whole
                      communicative job readable, including at large text sizes.
                    */}
                    <Text className="mt-1 text-[14px] leading-5 text-body">
                      {mission.learnerGoal}
                    </Text>
                    <Text className="mt-1 text-[13px] leading-[18px] text-muted">
                      {mission.character.name} · {mission.character.role} ·{' '}
                      {mission.levelRange} · {mission.estimatedMinutes} {t.common.minutes}
                    </Text>
                  </View>

                  <ChevronRight size={21} color={iconColor('muted')} />
                </Pressable>
              </React.Fragment>
            ))}

            {filteredMissions.length === 0 ? (
              <View className="items-center px-6 py-14">
                <Text className="text-center text-sm leading-5 text-muted">
                  {t.missions.noMissionsFound}
                </Text>
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
