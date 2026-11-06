/**
 * SoundSteps nl-BE: Belgian Dutch Phonetic Guidance & Articulation Reference
 *
 * Provides adult learners with explicit articulatory and phonetic guidance
 * on the 5 hallmark differences between contemporary Belgian Standard Dutch
 * and Northern Netherlands Dutch.
 */

export interface PhoneticGuidance {
  id: 'soft_g' | 'bilabial_w' | 'pure_monophthongs' | 'flemish_diphthongs' | 'alveolar_r';
  feature: string;
  ipa: string;
  tip: string;
  example: string;
}

export const PHONETIC_FEATURES: Record<PhoneticGuidance['id'], PhoneticGuidance> = {
  soft_g: {
    id: 'soft_g',
    feature: 'Zachte Vlaamse g',
    ipa: '/ɣ/ & /x/',
    tip: 'Ontspan de achterkant van de keel; vermijd de harde noordelijke schraapklank [χ].',
    example: 'goeiemorgen, graag, dag, mogelijk',
  },
  bilabial_w: {
    id: 'bilabial_w',
    feature: 'Vlaamse bilabiale w',
    ipa: '[β̞]',
    tip: 'Laat beide lippen zachtjes samenkomen; de boventanden raken de onderlip niet.',
    example: 'wat, waar, willen, water, wie',
  },
  pure_monophthongs: {
    id: 'pure_monophthongs',
    feature: 'Zuivere monoftong',
    ipa: '/eː/, /oː/, /øː/',
    tip: 'Houd de klinker stabiel en strak tot het einde; vermijd een glijklank (geen "eej" of "oow").',
    example: 'meenemen, alstublieft, brood, groot, koffie',
  },
  flemish_diphthongs: {
    id: 'flemish_diphthongs',
    feature: 'Vlaamse tweeklank',
    ipa: '/ɛi/, /œy/, /ɔu/',
    tip: 'Beschaafde, evenwichtige mondstand zonder overdreven mondhoekenspreiding.',
    example: 'kijken, prijs, huis, buiten, koud',
  },
  alveolar_r: {
    id: 'alveolar_r',
    feature: 'Tongpunt-r',
    ipa: '[r]',
    tip: 'Lichte ontspannen trilling voorin de mond tegen de tandenboog.',
    example: 'rond, trein, route, perron',
  },
};

/**
 * Detect primary Belgian Dutch phonetic feature in a phrase form.
 */
export function detectBelgianDutchPhonetics(phrase: string): PhoneticGuidance | null {
  if (!phrase || typeof phrase !== 'string') return null;
  const lower = phrase.toLowerCase();

  // Priority 1: Soft-G (most recognizable hallmark of Belgian Dutch)
  if (/[gc]h|g/i.test(lower)) {
    return PHONETIC_FEATURES.soft_g;
  }

  // Priority 2: Bilabial W
  if (/w/i.test(lower)) {
    return PHONETIC_FEATURES.bilabial_w;
  }

  // Priority 3: Pure monophthongs (ee, oo, eu)
  if (/ee|oo|eu|alstublieft|koffie|station/i.test(lower)) {
    return PHONETIC_FEATURES.pure_monophthongs;
  }

  // Priority 4: Diphthongs
  if (/ij|ei|ui|ou|au/i.test(lower)) {
    return PHONETIC_FEATURES.flemish_diphthongs;
  }

  // Priority 5: Rhotic R
  if (/r/i.test(lower)) {
    return PHONETIC_FEATURES.alveolar_r;
  }

  return null;
}
