import React, { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './AppText';
import { ChevronDown, ChevronUp, Check, Volume2 } from 'lucide-react-native';
import {
  GEMINI_VOICE_PERSONAS,
  GeminiVoicePersona,
} from '../content/geminiVoices';
import { speakWithBestAvailable } from '../providers/voice/speechOutput';
import { NativeVoiceTransport } from '../providers/voice/nativeVoiceTransport';
import { iconColor } from '../design/iconColor';

export interface GeminiVoiceSelectorProps {
  selectedVoiceId?: string;
  onSelectVoice: (voiceId: string) => void;
  speechRate?: number;
  label?: string;
  defaultExpanded?: boolean;
}

/**
 * Dropdown voice selector for Google Gemini 3.8 Flash voice design personas.
 * Faithfully matches the Flemish Voice Design menu:
 * 👩 Kore (Helder — Nieuws & Formeel)
 * 👨 Charon (Diep — Rijp & Warm) [selected highlight]
 */
export const GeminiVoiceSelector: React.FC<GeminiVoiceSelectorProps> = ({
  selectedVoiceId = 'Charon',
  onSelectVoice,
  speechRate = 1,
  label,
  defaultExpanded = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [auditioningId, setAuditioningId] = useState<string | null>(null);
  const voiceTransportRef = useRef<NativeVoiceTransport | null>(null);

  const selectedPersona =
    GEMINI_VOICE_PERSONAS.find(p => p.id === selectedVoiceId) ??
    GEMINI_VOICE_PERSONAS.find(p => p.id === 'Charon') ??
    GEMINI_VOICE_PERSONAS[0];

  const handleAudition = async (persona: GeminiVoicePersona) => {
    try {
      setAuditioningId(persona.id);
      if (!voiceTransportRef.current) {
        voiceTransportRef.current = new NativeVoiceTransport(() => true);
      }
      await speakWithBestAvailable(voiceTransportRef.current, persona.sampleText, {
        language: 'nl',
        locale: 'nl-BE',
        speed: speechRate,
        voiceGender: persona.gender,
        voice: persona.id,
      });
    } catch (e) {
      console.warn('Voice audition failed:', e);
    } finally {
      setAuditioningId(null);
    }
  };

  return (
    <View className="w-full gap-2">
      {label ? (
        <Text className="text-xs font-semibold text-muted uppercase tracking-wider">
          {label}
        </Text>
      ) : null}

      {/* Main Trigger / Selected Voice Bar */}
      <Pressable
        onPress={() => setIsOpen(prev => !prev)}
        accessibilityRole="button"
        accessibilityLabel={`Gemini stem selector: ${selectedPersona.name}`}
        accessibilityState={{ expanded: isOpen }}
        className="min-h-12 w-full flex-row items-center justify-between rounded-2xl border border-border-interactive bg-surface px-4 py-2.5 hover:bg-surface-hover active:scale-[0.99] transition-all focus:border-2 focus:border-focus"
      >
        <View className="flex-1 flex-row items-center gap-2.5 overflow-hidden">
          <Text className="text-base">
            {selectedPersona.gender === 'female' ? '👩' : '👨'}
          </Text>
          <Text className="text-sm font-bold text-ink truncate">
            {selectedPersona.name}{' '}
            <Text className="text-xs font-normal text-muted">
              ({selectedPersona.title})
            </Text>
          </Text>
        </View>

        <View className="flex-row items-center gap-2 pl-2">
          {isOpen ? (
            <ChevronUp size={18} color={iconColor('muted')} />
          ) : (
            <ChevronDown size={18} color={iconColor('muted')} />
          )}
        </View>
      </Pressable>

      {/* Dropdown Menu Options matching user's reference */}
      {isOpen ? (
        <View
          accessibilityRole="menu"
          className="w-full overflow-hidden rounded-2xl border border-border-interactive/80 bg-[#0C1E23] p-1.5 shadow-xl transition-all"
        >
          {GEMINI_VOICE_PERSONAS.map(persona => {
            const isSelected = persona.id === selectedPersona.id;
            const isAuditioning = auditioningId === persona.id;
            const emoji = persona.gender === 'female' ? '👩' : '👨';

            return (
              <View
                key={persona.id}
                className={`min-h-12 w-full flex-row items-center justify-between rounded-xl px-3 py-2 transition-all ${
                  isSelected
                    ? 'bg-[#0070F3]'
                    : 'bg-transparent hover:bg-white/10 active:bg-white/15'
                }`}
              >
                {/* Voice Selection Tap Target */}
                <Pressable
                  onPress={() => {
                    onSelectVoice(persona.id);
                    setIsOpen(false);
                  }}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${persona.name} (${persona.title})`}
                  className="min-h-12 flex-1 flex-row items-center gap-2.5"
                >
                  <Text className="text-base">{emoji}</Text>
                  <View className="flex-1 flex-row items-center gap-1.5 flex-wrap">
                    <Text
                      className={`text-sm font-bold ${
                        isSelected ? 'text-white' : 'text-[#E1E7E8]'
                      }`}
                    >
                      {persona.name}
                    </Text>
                    <Text
                      className={`text-xs ${
                        isSelected ? 'text-white/90' : 'text-[#9BB1B7]'
                      }`}
                    >
                      ({persona.title})
                    </Text>
                  </View>
                  {isSelected ? (
                    <Check size={16} color="#FFFFFF" className="mr-1" />
                  ) : null}
                </Pressable>

                {/* Instant Audition Speaker Button */}
                <Pressable
                  onPress={e => {
                    e.stopPropagation();
                    void handleAudition(persona);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Beluister stem ${persona.name}`}
                  className={`min-h-12 min-w-12 items-center justify-center rounded-lg p-2 active:scale-95 ${
                    isAuditioning
                      ? 'bg-white/20'
                      : isSelected
                        ? 'hover:bg-white/20'
                        : 'hover:bg-white/10'
                  }`}
                >
                  <Volume2
                    size={18}
                    color={isSelected ? '#FFFFFF' : isAuditioning ? '#CBF37C' : '#9BB1B7'}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};
