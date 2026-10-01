import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ArrowRight, Compass, MapPin, Repeat, Route, Search } from 'lucide-react-native';
import { MissionDefinition } from '../types';
import { useI18n } from '../features/i18n';
import { Button, Card, ChipRow, EmptyState, Field, Segmented } from './ui';
import { iconColor } from '../design/iconColor';

interface MissionsScreenProps {
  missions: MissionDefinition[];
  onSelectMission: (mission: MissionDefinition) => void;
}

const NEIGHBORHOOD_LOOP_TITLES: Record<
  string,
  Record<string, string>
> = {
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
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
  const filteredMissions = missions.filter(m => {
    const matchesSearch =
      !query ||
      m.title.toLowerCase().includes(query) ||
      m.setting.toLowerCase().includes(query) ||
      m.character.name.toLowerCase().includes(query);
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesLvl = selectedLevel === 'all' || m.levelRange === selectedLevel;
    return matchesSearch && matchesCat && matchesLvl;
  });

  const activeLanguage = missions[0]?.language || 'es';
  const currentLoopTitle =
    NEIGHBORHOOD_LOOP_TITLES[activeLanguage]?.[uiLang] ||
    NEIGHBORHOOD_LOOP_TITLES[activeLanguage]?.en ||
    t.common.connectedLoop;

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{ padding: 14, paddingBottom: 28, gap: 18 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-1">
        <Text className="font-display text-2xl font-medium tracking-tight text-ink">
          {t.missions.heading}
        </Text>
        <Text className="text-xs text-body">{t.missions.subheading}</Text>
      </View>

      <Segmented
        accessibilityLabel="Missions view"
        value={activeView}
        onChange={setActiveView}
        options={[
          {
            id: 'catalog',
            label: `${t.missions.tabCatalog} (${filteredMissions.length})`,
            icon: <Compass size={14} color={iconColor('muted')} />,
          },
          {
            id: 'route',
            label: `${t.missions.tabRoute} (${missions.length})`,
            icon: <Route size={14} color={iconColor('muted')} />,
          },
        ]}
      />

      {activeView === 'route' ? (
        <View className="gap-4">
          <Card className="gap-2 p-5">
            <View className="flex-row items-center gap-2">
              <MapPin size={16} color={iconColor('brand')} />
              <Text className="flex-1 text-xs font-semibold uppercase tracking-wider text-primary">
                {currentLoopTitle}
              </Text>
            </View>
            <Text className="text-xs leading-relaxed text-body">{t.missions.routeSubtitle}</Text>
          </Card>

          {missions.map((mission, index) => (
            <View key={mission.id} className="flex-row gap-3">
              <View className="items-center">
                <View className="h-7 w-7 items-center justify-center rounded-full border-2 border-primary bg-surface">
                  <Text className="text-xs font-bold text-primary">{index + 1}</Text>
                </View>
                {index < missions.length - 1 ? (
                  <View className="mt-1 w-0.5 flex-1 bg-border" />
                ) : null}
              </View>

              <Card className="flex-1 gap-2" onPress={() => onSelectMission(mission)}>
                <View className="flex-row flex-wrap items-center justify-between gap-2">
                  <Text className="text-xs font-semibold text-ink">{mission.neighborhood}</Text>
                  <Text className="text-xs text-muted">
                    {t.common.level} {mission.levelRange} · ~{mission.estimatedMinutes}{' '}
                    {t.common.minutes}
                  </Text>
                </View>

                <Text className="font-display text-lg font-semibold text-ink">
                  {mission.title}
                </Text>
                <Text className="text-xs leading-relaxed text-body" numberOfLines={2}>
                  {mission.setting}
                </Text>

                <View className="flex-row flex-wrap items-center gap-1.5 pt-1">
                  <Text className="text-xs font-medium text-ink">{t.common.speakingWith}</Text>
                  <Text className="text-xs text-body">
                    {mission.character.name} ({mission.character.role})
                  </Text>
                </View>

                {mission.transferPattern ? (
                  <View className="mt-1 flex-row items-start gap-2 rounded-xl border border-primary/10 bg-card-warm p-2.5">
                    <Repeat
                      size={14}
                      color={iconColor('brand')}
                      style={{ marginTop: 1 }}
                    />
                    <View className="flex-1">
                      <Text className="text-xs text-primary-dark dark:text-primary">
                        <Text className="font-semibold">{t.common.transferPattern} </Text>
                        {mission.transferPattern}
                      </Text>
                      {mission.transferReason ? (
                        <Text className="mt-0.5 text-xs text-muted">
                          {mission.transferReason}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </Card>
            </View>
          ))}
        </View>
      ) : (
        <View className="gap-3.5">
          <Field
            placeholder={t.missions.searchPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel={t.missions.searchPlaceholder}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingRight: 4 }}
          >
            {categories.map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <Button
                  key={cat.id}
                  label={cat.label}
                  onPress={() => setSelectedCategory(cat.id)}
                  size="sm"
                  variant="secondary"
                  className={isActive ? 'border-primary bg-primary/10' : ''}
                  textClassName={isActive ? 'text-primary' : 'text-muted'}
                />
              );
            })}
          </ScrollView>

          <ChipRow
            value={selectedLevel}
            onChange={setSelectedLevel}
            options={[
              { id: 'all', label: t.missions.filterAll },
              { id: 'A1', label: 'A1' },
              { id: 'A2', label: 'A2' },
            ]}
          />

          {filteredMissions.map(mission => (
            <Card key={mission.id} className="gap-3" onPress={() => onSelectMission(mission)}>
              <View className="gap-2">
                <View className="flex-row flex-wrap items-center gap-1.5">
                  <Text className="text-xs font-semibold text-ink">
                    {mission.neighborhood}
                  </Text>
                  <Text className="text-muted">·</Text>
                  <Text className="text-xs text-muted">
                    {mission.estimatedMinutes} {t.common.minutes}
                  </Text>
                  <Text className="text-muted">·</Text>
                  <Text className="text-xs text-muted">
                    {t.common.level} {mission.levelRange}
                  </Text>
                </View>

                <Text className="font-display text-xl font-semibold text-ink">
                  {mission.title}
                </Text>

                <Text className="text-xs leading-relaxed text-body" numberOfLines={2}>
                  {mission.setting}
                </Text>

                <View className="flex-row flex-wrap items-baseline gap-1 pt-1">
                  <Text className="text-xs font-semibold text-ink">{t.common.goal} </Text>
                  <Text className="text-xs text-body">{mission.learnerGoal}</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between gap-3 border-t border-border-subtle pt-3">
                <View className="flex-1">
                  <Text className="text-xs text-muted">
                    {t.common.speakingWith}{' '}
                    <Text className="font-medium text-ink">{mission.character.name}</Text>
                  </Text>
                  <Text className="text-xs text-muted">{mission.character.role}</Text>
                </View>

                <Button
                  label={t.missions.briefingButton}
                  onPress={() => onSelectMission(mission)}
                  size="sm"
                  variant="secondary"
                  icon={<ArrowRight size={14} color={iconColor('muted')} />}
                />
              </View>
            </Card>
          ))}

          {filteredMissions.length === 0 ? (
            <EmptyState message={t.missions.noMissionsFound} />
          ) : null}
        </View>
      )}
    </ScrollView>
  );
};
