import React, { useState } from 'react';
import { Search, ArrowRight, Filter, Compass, Sparkles, MapPin, Route, Repeat } from 'lucide-react';
import { MissionDefinition } from '../types';
import { useI18n } from '../features/i18n';

interface MissionsScreenProps {
  missions: MissionDefinition[];
  onSelectMission: (mission: MissionDefinition) => void;
}

export const MissionsScreen: React.FC<MissionsScreenProps> = ({
  missions,
  onSelectMission
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
    { id: 'social', label: t.missions.filterSocial }
  ];

  const filteredMissions = missions.filter(m => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.setting.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.character.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesLvl = selectedLevel === 'all' || m.levelRange === selectedLevel;
    return matchesSearch && matchesCat && matchesLvl;
  });

  // Connected neighborhood sequence for active language
  const routeMissions = missions;
  const activeLanguage = missions[0]?.language || 'es';
  const neighborhoodLoopTitles: Record<string, Record<string, string>> = {
    es: {
      en: 'Calle del Sol — Connected Neighborhood Loop (Madrid)',
      fr: 'Calle del Sol — Boucle de quartier connectée (Madrid)',
      es: 'Calle del Sol — Bucle de barrio conectado (Madrid)',
      nl: 'Calle del Sol — Verbonden buurtlus (Madrid)'
    },
    fr: {
      en: 'Quartier Saint-Michel — Connected Rive Gauche Loop (Paris)',
      fr: 'Quartier Saint-Michel — Boucle Rive Gauche connectée (Paris)',
      es: 'Quartier Saint-Michel — Bucle Rive Gauche conectado (París)',
      nl: 'Quartier Saint-Michel — Verbonden Rive Gauche-lus (Parijs)'
    },
    de: {
      en: 'Kreuzberg Marktplatz — Connected Neighborhood Loop (Berlin)',
      fr: 'Kreuzberg Marktplatz — Boucle de quartier connectée (Berlin)',
      es: 'Kreuzberg Marktplatz — Bucle de barrio conectado (Berlín)',
      nl: 'Kreuzberg Marktplatz — Verbonden buurtlus (Berlijn)'
    },
    it: {
      en: 'Piazza Santa Croce — Connected Historic District Loop (Florence)',
      fr: 'Piazza Santa Croce — Boucle de quartier historique connectée (Florence)',
      es: 'Piazza Santa Croce — Bucle de distrito histórico conectado (Florencia)',
      nl: 'Piazza Santa Croce — Verbonden historische wijk-lus (Florence)'
    },
    ja: {
      en: 'Yanaka Ginza — Connected Shitamachi Neighborhood Loop (Tokyo)',
      fr: 'Yanaka Ginza — Boucle Shitamachi connectée (Tokyo)',
      es: 'Yanaka Ginza — Bucle Shitamachi conectado (Tokio)',
      nl: 'Yanaka Ginza — Verbonden Shitamachi-buurtlus (Tokio)'
    }
  };

  const currentLoopTitle =
    neighborhoodLoopTitles[activeLanguage]?.[uiLang] ||
    neighborhoodLoopTitles[activeLanguage]?.['en'] ||
    t.common.connectedLoop;

  return (
    <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6 px-3.5 py-4 sm:py-8 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-heading">
            {t.missions.heading}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-body">
            {t.missions.subheading}
          </p>
        </div>

        {/* View Switcher: Catalog vs Story Route */}
        <div className="flex items-center rounded-xl bg-surface-sunken p-1 border border-border-subtle self-start sm:self-auto">
          <button
            onClick={() => setActiveView('catalog')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeView === 'catalog'
                ? 'bg-surface text-heading shadow-xs font-semibold'
                : 'text-muted hover:text-heading'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>{t.missions.tabCatalog} ({filteredMissions.length})</span>
          </button>
          <button
            onClick={() => setActiveView('route')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeView === 'route'
                ? 'bg-surface text-heading shadow-xs font-semibold'
                : 'text-muted hover:text-heading'
            }`}
          >
            <Route className="h-3.5 w-3.5" />
            <span>{t.missions.tabRoute} ({routeMissions.length})</span>
          </button>
        </div>
      </div>

      {activeView === 'route' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl bg-surface p-5 border border-border-subtle space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <MapPin className="h-4 w-4" />
              <span>{currentLoopTitle}</span>
            </div>
            <p className="text-xs text-body leading-relaxed">
              {t.missions.routeSubtitle}
            </p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
            {routeMissions.map((mission, index) => (
              <div
                key={mission.id}
                onClick={() => onSelectMission(mission)}
                className="group relative cursor-pointer rounded-2xl border border-border-subtle bg-surface p-5 transition-all hover:border-primary/40 hover:shadow-xs"
              >
                {/* Node indicator */}
                <div className="absolute -left-[27px] top-6 flex h-6 w-6 items-center justify-center rounded-full bg-surface border-2 border-primary text-[11px] font-bold text-primary shadow-xs">
                  {index + 1}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <span className="font-semibold text-heading">{mission.neighborhood}</span>
                    <span>{t.common.level} {mission.levelRange} · ~{mission.estimatedMinutes} {t.common.minutes}</span>
                  </div>

                  <h3 className="font-display text-lg font-semibold text-heading group-hover:text-primary transition-colors">
                    {mission.title}
                  </h3>

                  <p className="text-xs text-body line-clamp-2">
                    {mission.setting}
                  </p>

                  <div className="flex items-center gap-2 text-xs pt-1">
                    <span className="font-medium text-heading">{t.common.speakingWith}</span>
                    <span className="text-body">{mission.character.name} ({mission.character.role})</span>
                  </div>

                  {mission.transferPattern && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-card-warm p-2.5 text-xs text-primary-dark dark:text-primary-light border border-primary/10">
                      <Repeat className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <div>
                        <strong>{t.common.transferPattern} </strong>
                        <span>{mission.transferPattern}</span>
                        {mission.transferReason && (
                          <div className="text-[11px] text-muted mt-0.5">{mission.transferReason}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'catalog' && (
        <div className="space-y-6">
          {/* Search and Category Filter Bar */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder={t.missions.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 pl-10 pr-4 text-sm text-heading placeholder:text-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-xl bg-surface-sunken p-1 border border-border-subtle max-w-full">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-surface text-heading shadow-xs font-semibold'
                        : 'text-muted hover:text-heading'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted shrink-0 self-end sm:self-auto">
                <span>{t.missions.filterLevel}</span>
                {['all', 'A1', 'A2'].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`rounded-lg px-2.5 py-1 uppercase text-xs transition-colors ${
                      selectedLevel === lvl
                        ? 'bg-primary text-white font-medium shadow-xs'
                        : 'bg-surface text-muted hover:text-heading border border-border-subtle'
                    }`}
                  >
                    {lvl === 'all' ? t.missions.filterAll : lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mission Cards Grid */}
          <div className="space-y-3.5 sm:space-y-4">
            {filteredMissions.map(mission => (
              <div
                key={mission.id}
                onClick={() => onSelectMission(mission)}
                className="group cursor-pointer rounded-2xl border border-border-subtle bg-surface p-4 sm:p-5 transition-all hover:border-primary/40 hover:shadow-xs active:scale-99"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="space-y-2">
                    <div className="text-xs text-muted flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-heading">{mission.neighborhood}</span>
                      <span>·</span>
                      <span>{mission.estimatedMinutes} {t.common.minutes}</span>
                      <span>·</span>
                      <span>{t.common.level} {mission.levelRange}</span>
                    </div>

                    <h3 className="font-display text-xl font-semibold text-heading group-hover:text-primary transition-colors">
                      {mission.title}
                    </h3>

                    <p className="text-xs leading-relaxed text-body line-clamp-2">
                      {mission.setting}
                    </p>

                    <div className="pt-1">
                      <span className="text-xs font-semibold text-heading">{t.common.goal} </span>
                      <span className="text-xs text-body">{mission.learnerGoal}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between sm:flex-col sm:items-end">
                    <div className="text-right text-xs text-muted">
                      {t.common.speakingWith} <strong className="text-heading font-medium">{mission.character.name}</strong>
                      <div className="text-[11px] text-faint">{mission.character.role}</div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelectMission(mission);
                      }}
                      className="flex items-center gap-1 rounded-xl border border-border-subtle bg-surface-sunken px-3.5 py-1.5 text-xs font-medium text-heading group-hover:bg-primary group-hover:text-white group-hover:border-transparent transition-all sm:mt-4 shadow-2xs"
                    >
                      <span>{t.missions.briefingButton}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredMissions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border-subtle p-8 text-center text-sm text-muted">
                {t.missions.noMissionsFound}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
