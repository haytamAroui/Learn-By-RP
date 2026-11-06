import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppText';
import { ChevronDown, ChevronUp, Lightbulb, Volume2 } from 'lucide-react-native';
import { MissionDefinition, Passage, UsefulPhrase } from '../types';
import { useI18n } from '../features/i18n';
import { ELEVATION } from '../design/tokens';
import { iconColor } from '../design/iconColor';
import { ReferenceArtwork } from './ReferenceArtwork';
import { phraseTranslation } from '../features/roleplay/sessionPresentation';

export function CharacterAvatar({ mission, size = 46 }: { mission: MissionDefinition; size?: number }) {
  return <View className="relative overflow-hidden rounded-full bg-warning-soft" style={{ width: size, height: size }}>
    {mission.character.voiceGender ? <ReferenceArtwork kind={mission.character.voiceGender === 'male' ? 'boy' : 'girl'} />
      : <Text className="self-center text-lg font-semibold text-ink">{mission.character.name.slice(0, 1)}</Text>}
  </View>;
}

interface Props {
  mission: MissionDefinition;
  latest?: Passage;
  older: Passage[];
  meaningVisible: boolean;
  onToggleMeaning: () => void;
  onReplay: (passage: Passage) => void;
  suggestions: UsefulPhrase[];
  suggestionsOpen: boolean;
  suggestionsBusy: boolean;
  onToggleSuggestions: () => void;
  onUsePhrase: (phrase: UsefulPhrase) => void;
  onPlayPhrase: (phrase: UsefulPhrase) => void;
  audioDisabled: boolean;
  playingId: string | null;
  passages: Passage[];
  historyOpen: boolean;
  onToggleHistory: () => void;
}

export function ConversationStage(props: Props) {
  const { t } = useI18n();
  const turns = props.historyOpen ? props.passages : props.passages.slice(-4);
  return <View className="gap-3">
    {props.passages.length > 4 ? <Pressable accessibilityRole="button" accessibilityLabel={t.live.conversationHistory}
      accessibilityState={{ expanded: props.historyOpen }} aria-expanded={props.historyOpen} onPress={props.onToggleHistory}
      className="min-h-12 flex-row items-center justify-between rounded-xl border border-transparent px-3 hover:bg-surface-hover focus:border-2 focus:border-focus">
      <Text className="text-sm font-semibold text-muted">{t.live.conversationHistory}</Text>
      {props.historyOpen ? <ChevronUp size={18} color={iconColor('muted')} /> : <ChevronDown size={18} color={iconColor('muted')} />}
    </Pressable> : null}
    {turns.map(passage => {
      const learner = passage.speaker === 'user';
      const latest = passage.id === props.latest?.id;
      return (
        <View
          key={passage.id}
          className={`w-full flex-row items-end gap-3 ${
            learner ? 'justify-end' : 'justify-start'
          }`}
        >
          {!learner ? (
            <CharacterAvatar mission={props.mission} size={48} />
          ) : null}
          <View
            className={`min-w-0 gap-1.5 border px-4 py-3.5 ${
              learner
                ? 'border-transparent bg-action'
                : 'border-border-subtle/40 bg-surface'
            }`}
            style={{
              maxWidth: '85%',
              borderRadius: 22,
              borderBottomLeftRadius: learner ? 22 : 6,
              borderBottomRightRadius: learner ? 6 : 22,
              boxShadow: ELEVATION.card,
            }}
          >
            <Text
              className={`text-xs font-semibold ${
                learner ? 'text-action-text/80' : 'text-muted'
              }`}
            >
              {learner ? t.common.you : props.mission.character.name}
            </Text>
            <Text
              className={`${
                latest && !learner
                  ? 'text-[18px] leading-[26px] font-medium'
                  : 'text-[16px] leading-[24px]'
              } ${learner ? 'text-action-text' : 'text-ink'}`}
            >
              {passage.text}
            </Text>
            {learner && passage.meaning ? (
              <Text className="text-xs text-action-text/80 mt-0.5">
                {passage.meaning}
              </Text>
            ) : null}
            {!learner ? (
              <View className="flex-row items-center justify-between gap-2 pt-1 border-t border-border-subtle/20 mt-1">
                {latest && passage.meaning ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      props.meaningVisible
                        ? t.common.hideTranslation
                        : t.common.showTranslation
                    }
                    accessibilityState={{ expanded: props.meaningVisible }}
                    aria-expanded={props.meaningVisible}
                    onPress={props.onToggleMeaning}
                    className="min-h-12 min-w-0 flex-1 justify-center rounded-xl px-1 hover:opacity-80 active:opacity-70 focus:border-2 focus:border-focus"
                  >
                    <Text
                      className={
                        props.meaningVisible
                          ? 'text-xs leading-5 text-muted'
                          : 'text-xs font-semibold text-language'
                      }
                    >
                      {props.meaningVisible
                        ? passage.meaning
                        : `🌐 ${t.common.showTranslation}`}
                    </Text>
                  </Pressable>
                ) : (
                  <View className="flex-1" />
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    latest
                      ? t.common.listen
                      : `${t.common.listen}: ${passage.text}`
                  }
                  accessibilityState={{
                    disabled: props.audioDisabled,
                    busy: props.playingId === passage.id,
                  }}
                  disabled={props.audioDisabled}
                  onPress={() => props.onReplay(passage)}
                  className={`h-12 w-12 items-center justify-center rounded-full hover:bg-language-soft active:opacity-70 focus:border-2 focus:border-focus ${
                    props.audioDisabled ? 'opacity-40' : ''
                  }`}
                >
                  <Volume2 size={18} color={iconColor('language')} />
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      );
    })}
  </View>;
}

export function SuggestedReplies(props: Props) {
  const { t, language } = useI18n();
  return <View>
    {props.suggestions.length ? <View className="gap-2 rounded-[28px] border border-border-subtle/30 bg-surface-soft/50 p-3" style={{ boxShadow: ELEVATION.card }}>
      <Pressable onPress={props.onToggleSuggestions} disabled={props.suggestionsBusy}
        accessibilityRole="button" accessibilityLabel={t.live.usefulReplies}
        accessibilityState={{ expanded: props.suggestionsOpen, busy: props.suggestionsBusy }}
        aria-expanded={props.suggestionsOpen}
        className="min-h-12 flex-row items-center gap-2 rounded-full border border-transparent px-2 hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-warning-soft"><Lightbulb size={20} color={iconColor('warning')} /></View>
        <Text className="min-w-0 flex-1 text-[15px] font-semibold text-ink">{t.live.usefulReplies}{props.suggestionsBusy ? '…' : ''}</Text>
        {props.suggestionsOpen ? <ChevronUp size={18} color={iconColor('muted')} /> : <ChevronDown size={18} color={iconColor('muted')} />}
      </Pressable>
      {props.suggestionsOpen ? <ScrollView style={{ maxHeight: 230 }} keyboardShouldPersistTaps="handled">
        <View className="gap-2">
        {props.suggestions.map(phrase => <View key={phrase.id} className="flex-row items-center gap-1 rounded-[22px] bg-language-soft px-3 py-1">
          <Pressable accessibilityRole="button" accessibilityLabel={`${t.live.useTypedExample}: ${phrase.form}`}
            onPress={() => props.onUsePhrase(phrase)} className="min-h-14 min-w-0 flex-1 justify-center gap-1 rounded-xl border border-transparent px-2 py-2 hover:bg-language-soft active:opacity-70 focus:border-2 focus:border-focus">
            <Text className="text-[15px] font-semibold leading-[22px] text-ink">{phrase.form}</Text>
            {phraseTranslation(phrase, language) ? <Text className="text-sm leading-5 text-muted">{phraseTranslation(phrase, language)}</Text> : null}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`${t.common.listen}: ${phrase.form}`}
            accessibilityState={{ disabled: props.audioDisabled, busy: props.playingId === phrase.id }}
            disabled={props.audioDisabled} onPress={() => props.onPlayPhrase(phrase)}
            className={`h-12 w-12 items-center justify-center rounded-full border border-transparent bg-surface hover:bg-language-soft active:opacity-70 focus:border-2 focus:border-focus ${props.audioDisabled ? 'opacity-40' : ''}`}>
            <Volume2 size={18} color={iconColor('language')} />
          </Pressable>
        </View>)}
        </View>
        <Text className="px-2 pt-1 text-xs leading-5 text-muted">{t.live.replyHint}</Text>
      </ScrollView> : null}
    </View> : null}
  </View>;
}
