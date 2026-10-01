import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ChevronRight,
  Compass,
  MapPin,
  Route,
  Search,
} from 'lucide-react-native';
import { MissionDefinition } from '../types';
import { useI18n } from '../features/i18n';
import { iconColor } from '../design/iconColor';

interface MissionsScreenProps {
  missions: MissionDefinition[];
  onSelectMission: (mission: MissionDefinition) => void;
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
};

export const MissionsScreen: React.FC<MissionsScreenProps> = ({
  missions,
  onSelectMission,
}) => {
  const { t, language: uiLang } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeView, setActiveView] = useState<'catalog' | 'route'>('catalog');

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
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        width: '100%',
        maxWidth: 760,
        alignSelf: 'center',
        paddingHorizontal: 16,
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
              className={`min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full px-4 ${
                selected ? 'bg-ink' : 'bg-surface-soft'
              }`}
            >
              <Icon
                size={17}
                color={selected ? iconColor('surface') : iconColor('muted')}
              />
              <Text
                className={`text-sm font-semibold ${
                  selected ? 'text-surface' : 'text-body'
                }`}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeView === 'catalog' ? (
        <View className="gap-18">
          <View className="h-12 flex-row items-center gap-3 rounded-2xl bg-surface-soft px-4">
            <Search size={19} color={iconColor('muted')} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t.missions.searchPlaceholder}
              placeholderTextColor={iconColor('muted')}
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel={t.missions.searchPlaceholder}
              className="h-full flex-1 text-[15px] text-ink"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 12 }}
          >
            {categories.map(category => {
              const selected = selectedCategory === category.id;

              return (
                <Pressable
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={`min-h-10 justify-center rounded-full px-4 ${
                    selected ? 'bg-primary' : 'bg-surface-soft'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selected ? 'text-white' : 'text-body'
                    }`}
                  >
                    {category.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View>
            {filteredMissions.map((mission, index) => (
              <React.Fragment key={mission.id}>
                <Pressable
                  onPress={() => onSelectMission(mission)}
                  accessibilityRole="button"
                  accessibilityLabel={mission.title}
                  className="min-h-[104px] flex-row items-center gap-3 py-4 active:opacity-70"
                >
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-card-warm">
                    <Compass size={21} color={iconColor('brand')} />
                  </View>

                  <View className="flex-1">
                    <Text className="text-[17px] font-semibold leading-[22px] text-ink">
                      {mission.title}
                    </Text>
                    <Text className="mt-1 text-[13px] leading-[18px] text-muted" numberOfLines={1}>
                      {mission.neighborhood} · {mission.levelRange} · {mission.estimatedMinutes}{' '}
                      {t.common.minutes}
                    </Text>
                    <Text className="mt-1 text-[14px] leading-5 text-body" numberOfLines={1}>
                      {mission.setting}
                    </Text>
                  </View>

                  <ChevronRight size={21} color={iconColor('muted')} />
                </Pressable>
                {index < filteredMissions.length - 1 ? (
                  <View className="h-px bg-border-subtle" />
                ) : null}
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
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-primary">
                    <Text className="text-sm font-bold text-white">{index + 1}</Text>
                  </View>
                  {index < missions.length - 1 ? (
                    <View className="my-1 w-px flex-1 bg-border-subtle" />
                  ) : null}
                </View>

                <Pressable
                  onPress={() => onSelectMission(mission)}
                  accessibilityRole="button"
                  accessibilityLabel={mission.title}
                  className="mb-5 min-h-[92px] flex-1 rounded-[22px] bg-surface-soft p-4 active:opacity-70"
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
