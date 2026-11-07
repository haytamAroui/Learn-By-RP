import type { DutchRegionalProfileId } from '../types';

export type { DutchRegionalProfileId };

export interface DutchRegionalProfile {
  id: DutchRegionalProfileId;
  name: string;
  region: string;
  tag: string;
  description: string;
  stylePrompt: string;
  sampleText: string;
  defaultVoiceGender: 'female' | 'male';
  edgeVoice: string;
  geminiVoice: string;
}

export const DUTCH_REGIONAL_PROFILES: readonly DutchRegionalProfile[] = [
  {
    id: 'vrt_standard',
    name: 'VRT Nieuwsanker',
    region: 'Heel Vlaanderen (Algemeen Nederlands)',
    tag: 'Standaard Vlaams ⭐',
    description: 'Verzorgd, gezaghebbend en helder gearticuleerd Vlaams met zachte "g" en natuurlijke cadans.',
    stylePrompt: 'Clear, authoritative, and articulate Belgian Dutch (Vlaams) newscaster. Soft g, accurate Flemish prosody, professional broadcast tone.',
    sampleText: 'Goedenavond. Het Agentschap Wegen en Verkeer meldt dat de vernieuwingswerken aan de Ring vlot vooruitgaan. Vanaf volgende week maandag wordt er evenwel ernstige verkeershinder verwacht.',
    defaultVoiceGender: 'female',
    edgeVoice: 'nl-BE-DenaNeural',
    geminiVoice: 'Kore',
  },
  {
    id: 'antwerps',
    name: 'Antwerpse Energie',
    region: 'Provincie Antwerpen',
    tag: 'Stedelijk & Dynamisch',
    description: 'Vlotte, levendige Antwerpse spreektrant met zelfverzekerde intonatie en een warm, direct karakter.',
    stylePrompt: 'Spirited and charismatic Belgian Dutch speaker with subtle Antwerp cadence, natural conversational rhythm, energetic and confident.',
    sampleText: 'Amai zeg, ge moet eens kijken naar de Scheldekaaien vandaag! Heel de stad is buiten en het zonnetje schijnt op het MAS. Wat een heerlijke sfeer in Antwerpen.',
    defaultVoiceGender: 'male',
    edgeVoice: 'nl-BE-ArnaudNeural',
    geminiVoice: 'Puck',
  },
  {
    id: 'gents',
    name: 'Gents & Oost-Vlaams',
    region: 'Gent & Oost-Vlaanderen',
    tag: 'Zangerig & Gemoedelijk',
    description: 'Melodieuze Gentse intonatie, zachtaardig en vertellend met authentieke Vlaamse gezelligheid.',
    stylePrompt: 'Warm, melodic Ghent intonation, friendly Belgian Dutch cadence, relaxed, amiable storytelling tone with soft articulation.',
    sampleText: 'Welkom aan de Graslei in Gent. Kijk eens hoe het water van de Leie glinstert tegen de middeleeuwse gevels van het Gravensteen. Hier ademt elke steen geschiedenis.',
    defaultVoiceGender: 'female',
    edgeVoice: 'nl-BE-DenaNeural',
    geminiVoice: 'Aoede',
  },
  {
    id: 'west_vlaams',
    name: 'Brugs & West-Vlaams',
    region: 'Brugge & Kuststreek',
    tag: 'Nuchter & Hartelijk',
    description: 'Karaktervolle West-Vlaamse klankkleur, zacht klinkend met liefde voor streekverhalen en traditie.',
    stylePrompt: 'Hearty Belgian Dutch speaker with gentle West-Flemish melodic lilt, calm, welcoming storytelling tone.',
    sampleText: 'In het hart van het historische Brugge bereiden we onze ambachtelijke chocoladepralines volgens een aloud familierecept. De geur van verse cacao vult de hele straat.',
    defaultVoiceGender: 'male',
    edgeVoice: 'nl-BE-ArnaudNeural',
    geminiVoice: 'Charon',
  },
  {
    id: 'brussels',
    name: 'Brusselse Zakelijke Presentator',
    region: 'Brussel & Rand',
    tag: 'Professioneel & Modern',
    description: 'Modern, tweetalig beïnvloed Belgisch Nederlands. Vriendelijk, zakelijk en diplomatisch.',
    stylePrompt: 'Polite and polished Belgian Dutch corporate speaker from Brussels, calm, international, articulate and engaging.',
    sampleText: 'Goedemorgen aan alle deelnemers. Vandaag lanceren we ons nieuwe technologische initiatief voor Vlaamse en Europese start-ups hier in het hart van Brussel.',
    defaultVoiceGender: 'male',
    edgeVoice: 'nl-BE-ArnaudNeural',
    geminiVoice: 'Fenrir',
  },
];

export function getDutchRegionalProfile(id?: string): DutchRegionalProfile {
  const match = DUTCH_REGIONAL_PROFILES.find(p => p.id === id);
  return match || DUTCH_REGIONAL_PROFILES[0];
}

export function buildFlemishSpeechStyle(profileId?: string, baseStyle?: string): string {
  const profile = getDutchRegionalProfile(profileId);
  const base = baseStyle ? `${baseStyle}. ` : '';
  return `${base}Belgian Dutch regional cadence: ${profile.stylePrompt}`;
}
