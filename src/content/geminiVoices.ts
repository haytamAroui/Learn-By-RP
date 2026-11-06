/**
 * Authentic Google Gemini voice design personas for Belgian Dutch roleplay.
 * Aligned with Gemini 3.8 Flash TTS and VlaamsVoice audio compendium.
 */

export interface GeminiVoicePersona {
  id: string;
  name: string;
  gender: 'female' | 'male';
  title: string;
  description: string;
  sampleText: string;
}

export const GEMINI_VOICE_PERSONAS: GeminiVoicePersona[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'female',
    title: 'Helder — Nieuws & Formeel',
    description: 'Heldere, formele en verzorgde stem. Zeer geschikt voor zakelijke dialogen, nieuws en officiële instanties.',
    sampleText: 'Goedemiddag. Welkom bij de stadsdiensten van Brussel. Waarmee kan ik u helpen?',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'female',
    title: 'Warm — Warm & Verhalend',
    description: 'Warme, vriendelijke en natuurlijke vertelstem. Ideaal voor bakkerijen, cafés en gezellige ontmoetingen.',
    sampleText: 'Goeiemorgen! Welkom in onze bakkerij. Wat mag het voor u zijn vandaag?',
  },
  {
    id: 'Leda',
    name: 'Leda',
    gender: 'female',
    title: 'Jong — Jong & Levendig',
    description: 'Frisse, levendige en jeugdige stem. Perfect voor ontspannen contact tussen vrienden of studenten.',
    sampleText: 'Hé hallo! Super leuk om je te zien. Ga je mee iets drinken op de Oude Markt?',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'female',
    title: 'Rustgevend — Rustig & Zacht',
    description: 'Rustgevende, geduldige en zachte toon. Uitstekend geschikt voor rustig spreektempo en extra verstaanbaarheid.',
    sampleText: 'Neem gerust je tijd. We oefenen samen stap voor stap in het Vlaams.',
  },
  {
    id: 'Despina',
    name: 'Despina',
    gender: 'female',
    title: 'Elegant — Elegant & Vloeiend',
    description: 'Elegante, melodieuze en vloeiende stem. Uitermate passend voor cultuur, kunst en rondleidingen.',
    sampleText: 'Welkom in het museum. Het schilderij aan de overzijde toont het historische Gent.',
  },
  {
    id: 'Autonoe',
    name: 'Autonoe',
    gender: 'female',
    title: 'Opgewekt — Opgewekt & Spontaan',
    description: 'Spontane, enthousiaste en vrolijke intonatie met een aanstekelijke dynamiek.',
    sampleText: 'Amai, wat een leuk idee! Dat gaan we zeker uitproberen.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'male',
    title: 'Levendig — Levendig & Jeugdig',
    description: 'Dynamische, jeugdige en expressieve mannenstem voor vlotte alledaagse gesprekken.',
    sampleText: 'Dag kameraad! Alles goed met jou vandaag? Kom er gezellig bij.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'male',
    title: 'Diep — Rijp & Warm',
    description: 'Diepe, rijpe en warme mannenstem met natuurlijke rust, betrouwbaarheid en autoriteit.',
    sampleText: 'Goedenavond. Kom gerust binnen en ga zitten. Een warme koffie doet altijd deugd.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'male',
    title: 'Gezaghebbend — Diep & Zakelijk',
    description: 'Gezaghebbende, diepe en zakelijke mannenstem. Geschikt voor professionele interacties.',
    sampleText: 'Goedemorgen. Laten we het dossier en de planning voor vandaag overlopen.',
  },
];
