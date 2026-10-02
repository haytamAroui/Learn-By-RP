import type { MissionDefinition } from '../../types';

export interface ActorSafetyResponse {
  replyText: string;
  meaning: string;
  proposedAction: { name: string; payload: Record<string, unknown> } | null;
}

export function isRegulatedHealthMission(
  mission: Pick<MissionDefinition, 'scenarioFamilyId'>
): boolean {
  return mission.scenarioFamilyId === 'pharmacy-consultation';
}

export const REGULATED_HEALTH_ACTOR_RULES = `
REGULATED HEALTH ROLEPLAY SAFETY:
- This is communication practice, not medical care.
- Never diagnose or suggest what condition the learner has.
- Never recommend, select, endorse, compare, or prescribe a medicine, remedy, supplement, or treatment.
- Never provide dosage, frequency, timing, route of administration, duration, contraindication, efficacy, or side-effect claims.
- You may help the learner describe symptoms, ask to speak with a licensed pharmacist/clinician, locate the consultation counter, or ask how to read the product label/leaflet.
- If the learner requests medical advice, stay in character and briefly redirect them to the licensed professional and the official product label/leaflet.
`.trim();

const HIGH_CONFIDENCE_ADVICE_PATTERNS: RegExp[] = [
  /\b(?:dosage|posology|posologie|dosierung|dosaggio|dosis)\b/i,
  /\b(?:ibuprofen|loratadin|loratadine|cetirizin|cetirizine|paracetamol|acetaminophen)\b/i,
  /\b\d+\s*(?:tablet(?:s)?|tablette(?:s)?|comprim(?:e|é|és|es)?|pastill(?:e|es|a|as)?|capsul(?:e|es|a|as)?|sprays?|doses?)\b/i,
  /(?:一回|1回|１回)?\s*[一二三四五六七八九十0-9０-９]+\s*錠/u,
  /\b(?:every|toutes les|cada)\s+\d+\s*(?:hours?|heures?|horas?)\b/i,
  /\b(?:times? a day|fois par jour|mal am tag|volte al giorno|veces al día)\b/i,
  /\b(?:daily|täglich|quotidiennement|al giorno|al día)\b/i,
  /(?:一日|1日|１日).{0,12}(?:回|錠)/u,
  /\b(?:take|swallow|apply|use)\s+(?:this|one|two|three|the)\s+(?:tablet|capsule|spray|medicine|medication)/i,
  /\b(?:prenez|prends|sucer|avale[rz]?)\b.{0,50}\b(?:comprim|pastill|médicament|spray)/i,
  /\bnehmen sie\b.{0,50}\b(?:tablette|medikament|spray)/i,
  /\b(?:tome|tómese|toma)\b.{0,50}\b(?:pastilla|medicamento|tableta|spray)/i,
  /\b(?:prenda|assuma|usi)\b.{0,50}\b(?:compress|farmaco|medicin|spray)/i,
  /(?:服用|飲んでください|飲みましょう)/u,
  /\b(?:i recommend|we recommend|je vous conseille|je recommande|ich empfehle|le recomiendo|te recomiendo|consiglio)\b/i,
  /(?:おすすめ).{0,20}(?:薬|治療)/u,
  /\b(?:will cure|treats|works all day|soothe(?:s)? quickly|gentle on the stomach|does not cause drowsiness)\b/i,
  /\b(?:ne fait pas dormir|calme vite|macht nicht müde|wirkt den ganzen tag|no da sueño|no dan sueño|non dà sonnolenza)\b/i,
];

export function containsRegulatedHealthAdvice(text: string): boolean {
  return HIGH_CONFIDENCE_ADVICE_PATTERNS.some(pattern => pattern.test(text));
}

export function regulatedHealthCoachHint(
  language: MissionDefinition['language'] | string
): string {
  switch (language) {
    case 'es':
      return 'Describe tus síntomas y pide hablar con el farmacéutico. Si necesitas información del producto, pide la etiqueta o el prospecto oficial.';
    case 'fr':
      return 'Décrivez vos symptômes et demandez à parler au pharmacien. Pour les informations sur le produit, demandez la notice officielle.';
    case 'de':
      return 'Beschreiben Sie Ihre Beschwerden und bitten Sie um ein Gespräch mit dem Apotheker. Fragen Sie für Produktinformationen nach der offiziellen Packungsbeilage.';
    case 'it':
      return 'Descrivi i sintomi e chiedi di parlare con il farmacista. Per le informazioni sul prodotto, chiedi il foglietto illustrativo ufficiale.';
    case 'ja':
      return '症状を伝えて、薬剤師に相談したいと伝えましょう。製品情報は公式の説明書を確認したいと頼みましょう。';
    default:
      return 'Describe the symptoms and ask to speak with the pharmacist. For product information, ask for the official label or leaflet.';
  }
}

export function regulatedHealthBoundaryReply(
  language: MissionDefinition['language'] | string
): Pick<ActorSafetyResponse, 'replyText' | 'meaning'> {
  switch (language) {
    case 'es':
      return {
        replyText:
          'Puedo ayudarle a explicar sus síntomas y a pedir hablar con el farmacéutico. Para elegir un medicamento o saber cómo usarlo, consulte al profesional y la etiqueta oficial.',
        meaning:
          'I can help you explain your symptoms and ask to speak with the pharmacist. For choosing or using a medicine, consult the professional and the official label.',
      };
    case 'fr':
      return {
        replyText:
          'Je peux vous aider à décrire vos symptômes et à demander le pharmacien. Pour choisir ou utiliser un médicament, demandez au professionnel et suivez la notice officielle.',
        meaning:
          'I can help you describe your symptoms and ask for the pharmacist. For choosing or using medicine, ask the professional and follow the official leaflet.',
      };
    case 'de':
      return {
        replyText:
          'Ich kann Ihnen helfen, Ihre Beschwerden zu beschreiben und nach dem Apotheker zu fragen. Zur Auswahl oder Anwendung eines Medikaments fragen Sie die Fachperson und beachten Sie die Packungsinformation.',
        meaning:
          'I can help you describe your symptoms and ask for the pharmacist. For choosing or using medicine, ask the professional and follow the official package information.',
      };
    case 'it':
      return {
        replyText:
          'Posso aiutarla a descrivere i sintomi e a chiedere di parlare con il farmacista. Per scegliere o usare un medicinale, chieda al professionista e segua il foglietto illustrativo ufficiale.',
        meaning:
          'I can help you describe your symptoms and ask to speak with the pharmacist. For choosing or using medicine, ask the professional and follow the official leaflet.',
      };
    case 'ja':
      return {
        replyText:
          '症状を伝えたり、薬剤師に相談したいとお願いしたりする練習はできます。薬の選び方や使い方は、薬剤師と公式の説明書で確認してください。',
        meaning:
          'I can help you practise describing symptoms and asking to consult the pharmacist. For choosing or using medicine, check with the pharmacist and the official leaflet.',
      };
    default:
      return {
        replyText:
          'I can help you describe symptoms and ask to speak with the pharmacist. For choosing or using medicine, consult the professional and the official product label.',
        meaning:
          'Communication practice only; medical choices and instructions must come from a licensed professional and official product information.',
      };
  }
}

export function sanitizeRegulatedHealthActorResponse(
  response: ActorSafetyResponse,
  language: MissionDefinition['language'] | string
): ActorSafetyResponse {
  const combined = `${response.replyText}\n${response.meaning}`;
  if (!containsRegulatedHealthAdvice(combined)) return response;

  return {
    ...regulatedHealthBoundaryReply(language),
    proposedAction: null,
  };
}

/**
 * Scene facts are deterministic truth, but internal medically suggestive fact
 * names must not become prompt material in regulated health scenes.
 */
export function regulatedHealthPromptFacts(
  sceneFacts: unknown
): Record<string, boolean> {
  const hasFacts =
    Boolean(sceneFacts) && typeof sceneFacts === 'object' && !Array.isArray(sceneFacts);

  return {
    pharmacyServiceContext: hasFacts,
    pharmacistConsultationAvailable: true,
    labelOrLeafletHelpAvailable: true,
  };
}
