import React, { useState } from 'react';
import { Volume2, Search, Sparkles, Clock, CheckCircle2, BookOpen, Filter } from 'lucide-react';
import { PhraseItem, LanguageCode } from '../types';
import { useI18n } from '../features/i18n';
import { WebVoiceTransport } from '../providers/voice/webVoiceTransport';

interface VocabScreenProps {
  phrases: PhraseItem[];
  learningLanguage: LanguageCode;
  onPracticeDue: () => void;
  duePhrasesCount: number;
}

export const VocabScreen: React.FC<VocabScreenProps> = ({
  phrases,
  learningLanguage,
  onPracticeDue,
  duePhrasesCount
}) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'beginner' | 'elementary' | 'intermediate'>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const voiceTransport = React.useMemo(() => {
    const transport = new WebVoiceTransport();
    transport.setLanguage(learningLanguage);
    return transport;
  }, [learningLanguage]);

  const handlePlayAudio = (phrase: PhraseItem) => {
    setPlayingId(phrase.id);
    voiceTransport.playSpeech(phrase.form, {
      lang: phrase.language,
      speed: 0.9
    }).finally(() => {
      setPlayingId(null);
    });
  };

  const filteredPhrases = phrases.filter(p => {
    if (p.language !== learningLanguage) return false;
    if (selectedLevel !== 'all' && p.difficulty !== selectedLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.form.toLowerCase().includes(q) ||
        p.meaning.toLowerCase().includes(q) ||
        p.usageNote.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-3.5 py-4 sm:py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <BookOpen className="h-4 w-4" />
            <span>Vocabulary & Essential Phrases</span>
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-medium tracking-tight text-heading">
            Words that stick in real conversation
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-body">
            Every phrase is practiced in authentic situational context with spoken audio and spaced retrieval.
          </p>
        </div>

        {/* Due review action pill */}
        {duePhrasesCount > 0 && (
          <button
            onClick={onPracticeDue}
            className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-primary-dark active:scale-95"
          >
            <Clock className="h-4 w-4" />
            <span>Practice Due ({duePhrasesCount})</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar (Amiko Style) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search words, meanings or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-surface py-2 sm:py-2.5 pl-10 pr-4 text-xs sm:text-sm text-heading placeholder:text-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-xl bg-surface-sunken p-1 border border-border-subtle">
            {(['all', 'beginner', 'elementary', 'intermediate'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  selectedLevel === lvl
                    ? 'bg-surface text-heading shadow-xs font-semibold'
                    : 'text-muted hover:text-heading'
                }`}
              >
                {lvl === 'all' ? 'All Levels' : lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vocabulary Cards Grid (Amiko vcard style) */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPhrases.map(phrase => (
          <div
            key={phrase.id}
            className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div>
              {/* Card Head */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-heading">
                      "{phrase.form}"
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-primary font-medium">
                    {phrase.meaning}
                  </p>
                </div>

                {/* Audio Speaker Button */}
                <button
                  onClick={() => handlePlayAudio(phrase)}
                  disabled={playingId === phrase.id}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    playingId === phrase.id
                      ? 'bg-primary text-white border-primary'
                      : 'border-border-subtle bg-surface-sunken text-muted hover:text-primary hover:border-primary/40'
                  }`}
                  title="Listen to native pronunciation"
                  aria-label="Listen to pronunciation"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              {/* Usage Note / Grammatical Context */}
              {phrase.usageNote && (
                <div className="mt-3 text-xs text-body leading-relaxed border-t border-border-subtle/60 pt-2.5">
                  <span className="text-muted font-medium">Context: </span>
                  <span>{phrase.usageNote}</span>
                </div>
              )}
            </div>

            {/* Card Footer: Recall Status & Difficulty Tag */}
            <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-2.5 text-[11px]">
              <span className="capitalize text-muted font-medium">
                Level: <strong className="text-heading font-semibold">{phrase.difficulty}</strong>
              </span>

              <span
                className={`rounded-lg px-2 py-0.5 font-semibold capitalize border ${
                  phrase.recallStatus === 'steady'
                    ? 'bg-card-sage text-accent-sage border-accent-sage/20'
                    : phrase.recallStatus === 'growing'
                    ? 'bg-card-sky text-accent-sky border-accent-sky/20'
                    : 'bg-card-warm text-primary border-primary/20'
                }`}
              >
                {phrase.recallStatus}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredPhrases.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface p-12 text-center text-muted">
          <BookOpen className="mx-auto h-8 w-8 text-faint mb-2" />
          <p className="text-sm font-medium text-heading">No vocabulary found matching your filter</p>
          <p className="text-xs text-muted mt-1">Try clearing your search or selecting a different level.</p>
        </div>
      )}
    </div>
  );
};
