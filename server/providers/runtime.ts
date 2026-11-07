import { createHash } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import type {
  ProviderRuntimeDescriptor,
  RealtimeSessionDescriptor,
  RealtimeSessionRequest,
  SpeechSynthesisRequest,
  SpeechSynthesisResponse,
} from '../../src/providers/runtime/contracts';
import {
  geminiCatalogLocales,
  localeVoiceEnvironmentKey,
  pickGeminiVoiceForLocale,
} from './geminiVoice';
import { EdgeTtsProvider } from './edgeTts';

/**
 * Dutch Lemma Guidance:
 * Adapted from the Mural vocabulary assessment formula for Dutch:
 * - Group inflected and separable verb forms under their base infinitive lemma
 *   (e.g., 'fietste' -> 'fietsen', 'belt op' / 'opgebeld' -> 'opbellen', 'haalde af' -> 'afhalen').
 * - Nouns with definite dictionary article (de/het).
 * - Preserve reflexive verbs ('zich herinneren') and authentic Belgian Dutch fixed phrases.
 */
export const DUTCH_LEMMA_GUIDANCE = `DUTCH LEMMA GUIDANCE:
- Nouns: provide in singular with their dictionary article (de/het) (e.g. 'de koffie', 'het station', 'het brood').
- Verbs: provide in the infinitive base lemma (e.g. 'bestellen', 'betalen', 'afhalen', 'opbellen', 'fietsen').
- Separable verbs: group inflected and separated forms under their base compound infinitive (e.g. 'fietste onder fietsen', 'belt op onder opbellen', 'haalde af onder afhalen').
- Reflexive verbs: preserve reflexive pronouns (e.g. 'zich herinneren', 'zich vergissen').
- Authentic Belgian Dutch fixed phrases: preserve high-frequency pragmatic tokens ('alstublieft', 'graag gedaan', 'dat smaakt', 'tot ziens').`;

/**
 * 6-Stage Language Growth Progression (Teaching Focus):
 * Adapted from the Mural developmental framework, aligned 1-to-1 with CEFR milestones:
 * - Fase 1–2 (A1 Foundation): Groeten, de/het lidwoorden, tegenwoordige tijd (o.t.t.), basiswoordvolgorde (SVO).
 * - Fase 3–4 (A2 Everyday Independence): Scheidbare werkwoorden (opbellen, meebrengen), voltooid verleden tijd (v.t.t.), gebruik van 'er', en bijzinsvolgorde (inversie/bijzin met werkwoord achteraan).
 * - Fase 5–6 (B1 Confident Conversation): Hypothetische constructies ('zou graag willen', 'mocht het kunnen'), pragmatisch register (ge/u/je in Vlaanderen), en genuanceerde connectoren (hoewel, daarentegen, tenzij).
 */
export const DUTCH_TEACHING_FOCUS_STAGES = `6-STAGE TEACHING FOCUS (CEFR PROGRESSION):
- Stage 1-2 (A1 Breakthrough & Foundation): Greetings, introductions, de/het gender, present tense, basic subject-verb-object sentence structure.
- Stage 3-4 (A2 Everyday Independence): Separable verbs (opbellen, afhalen), present perfect (voltooid verleden tijd), prepositional 'er' usage, and subordinate clause word order (bijzinsvolgorde: verb at end).
- Stage 5-6 (B1 Confident Conversation): Hypothetical & conditional constructions ('zou graag willen', 'als het zou kunnen'), polite vs everyday register (ge/u/je distinctions in Flanders), and nuanced discourse connectors.`;

export function enrichDutchPrompts(instruction?: string, task?: string): string | undefined {
  if (!instruction) return instruction;
  if (task === 'assessment' && !instruction.includes('DUTCH LEMMA GUIDANCE')) {
    return `${instruction}\n\n${DUTCH_LEMMA_GUIDANCE}\n\n${DUTCH_TEACHING_FOCUS_STAGES}`;
  }
  return instruction;
}

export interface StructuredJsonRequest {
  task: 'actor' | 'coach' | 'assessment';
  systemInstruction?: string;
  input: string;
  temperature?: number;
}

interface StructuredJsonProvider {
  id: string;
  model: string;
  generateJson<T = any>(request: StructuredJsonRequest): Promise<T>;
}

interface SpeechProvider {
  id: string;
  speechModel: string;
  /** The provider can stream, so a line may be spoken one piece at a time. */
  streaming?: boolean;
  synthesize(request: SpeechSynthesisRequest): Promise<SpeechSynthesisResponse>;
}

function parseJsonObject<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first >= 0 && last > first) {
      return JSON.parse(trimmed.slice(first, last + 1)) as T;
    }
    throw new Error('Provider did not return a JSON object');
  }
}

const EDGE_TO_GEMINI_VOICE_MAP: Record<string, string> = {
  'nl-BE-DenaNeural': 'Kore',
  'nl-BE-ArnaudNeural': 'Puck',
  'fr-FR-DeniseNeural': 'Aoede',
  'fr-FR-HenriNeural': 'Charon',
  'es-ES-ElviraNeural': 'Kore',
  'es-ES-AlvaroNeural': 'Charon',
};

class GeminiProvider implements StructuredJsonProvider, SpeechProvider {
  readonly id = 'gemini';
  readonly model: string;
  readonly speechModel: string;
  private readonly client: GoogleGenAI;
  private readonly localeVoiceCache = new Map<string, Promise<string | undefined>>();

  constructor(
    apiKey: string,
    model = process.env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash',
    ttsModel = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts'
  ) {
    this.model = model;
    this.speechModel = ttsModel;
    this.client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'learnbyrp-provider-runtime' },
      },
    });
  }

  async generateJson<T>(request: StructuredJsonRequest): Promise<T> {
    const enrichedInstruction = enrichDutchPrompts(request.systemInstruction, request.task);
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: request.input,
      config: {
        systemInstruction: enrichedInstruction,
        responseMimeType: 'application/json',
        temperature: request.temperature ?? 0.4,
      },
    });

    return parseJsonObject<T>(response.text || '{}');
  }

  async synthesize(request: SpeechSynthesisRequest): Promise<SpeechSynthesisResponse> {
    const locale = request.locale || request.language;
    const rawVoice = request.voice;
    const requestedVoice = rawVoice && EDGE_TO_GEMINI_VOICE_MAP[rawVoice] ? EDGE_TO_GEMINI_VOICE_MAP[rawVoice] : rawVoice;
    const configuredVoice =
      requestedVoice ||
      (request.voiceGender
        ? process.env[localeVoiceEnvironmentKey(locale, request.voiceGender)]
        : process.env[localeVoiceEnvironmentKey(locale)]);
    const voiceName = configuredVoice || await this.resolveVoiceForLocale(
      locale,
      request.voiceGender
    );

    const pace =
      (request.speed ?? 1) < 0.9
        ? 'Speak a little slower than normal, while staying natural.'
        : (request.speed ?? 1) > 1.1
          ? 'Speak briskly but clearly.'
          : 'Use a natural conversational pace.';

    const normalizedLocale = locale.replace('_', '-').toLowerCase();
    const localeDirection = normalizedLocale === 'nl-be'
      ? 'Speak in natural Belgian Dutch (Flemish as used in Flanders) with authentic Flemish pronunciation, soft "g" (/ɣ/), bilabial "w" ([β̞]), pure monophthongs, and natural Belgian Dutch cadence. Do not use a Netherlands Dutch accent. The text is the exact transcript; do not translate or paraphrase it.'
      : request.locale
        ? `Use natural pronunciation and accent appropriate for ${request.locale}. The text is the exact transcript; do not translate or paraphrase it.`
        : `Speak naturally in language ${request.language}. The text is the exact transcript; do not translate or paraphrase it.`;

    const interaction = await this.client.interactions.create({
      model: this.speechModel,
      input: [{
        type: 'user_input',
        content: [{
          type: 'text',
          text: request.text,
          annotations: [{
            type: 'speech_metadata',
            style: [
              request.style || 'Natural conversational character voice.',
              localeDirection,
              pace,
            ].join(' '),
          }],
        }],
      }],
      response_format: { type: 'audio' },
      generation_config: {
        speech_config: [{ voice: voiceName }],
      },
    });

    const base64 = interaction.output_audio?.data;

    if (!base64) {
      throw new Error('Gemini TTS returned no audio');
    }

    return {
      audio: {
        provider: 'gemini',
        model: this.speechModel,
        voice: voiceName,
        base64,
        mimeType: interaction.output_audio?.mime_type || 'audio/wav',
        sampleRateHz: 24000,
      },
      fallback: 'none',
    };
  }

  private resolveVoiceForLocale(locale: string, voiceGender?: string): Promise<string> {
    const normalizedLocale = locale.replace('_', '-').toLowerCase();
    const cacheKey = `${normalizedLocale}:${voiceGender || 'any'}`;
    let voicePromise = this.localeVoiceCache.get(cacheKey);
    if (!voicePromise) {
      voicePromise = this.client.voices
        .list({
          language_code: geminiCatalogLocales(locale),
          ...(voiceGender ? { gender: [voiceGender] } : {}),
          type: ['prebuilt'],
          page_size: 100,
        })
        .then(response => pickGeminiVoiceForLocale(response.voices || [], locale, voiceGender))
        .catch(error => {
          // Voice catalog lookup must not make TTS unavailable. The stable
          // fallback remains multilingual and the prompt still carries locale.
          console.warn(`Gemini voice lookup failed for ${locale}; using Puck:`, error);
          return undefined;
        });
      this.localeVoiceCache.set(cacheKey, voicePromise);
    }
    const neutralFallback = 'Puck';
    const genderFallback: Record<string, string> = {
      female: 'Aoede',
      male: 'Puck',
      neutral: neutralFallback,
    };
    return voicePromise.then(voice => voice || genderFallback[voiceGender || ''] || neutralFallback);
  }
}

class ResilientSpeechProvider implements SpeechProvider {
  readonly id: string;
  readonly speechModel: string;
  readonly streaming: boolean;

  constructor(private readonly providers: SpeechProvider[]) {
    this.id = providers[0]?.id ?? 'none';
    this.speechModel = providers[0]?.speechModel ?? 'none';
    this.streaming = providers.some(provider => provider.streaming === true);
  }

  async synthesize(request: SpeechSynthesisRequest): Promise<SpeechSynthesisResponse> {
    let lastError: unknown;

    for (const provider of this.providers) {
      try {
        return await provider.synthesize(request);
      } catch (error) {
        lastError = error;
        console.warn(`Speech provider ${provider.id} failed; trying the next one:`, error);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('No speech provider is available');
  }
}

class OpenAICompatibleProvider implements StructuredJsonProvider {
  readonly id = 'openai-compatible';
  readonly model: string;

  constructor(
    private readonly baseUrl: string,
    model: string,
    private readonly apiKey?: string
  ) {
    this.model = model;
  }

  async generateJson<T>(request: StructuredJsonRequest): Promise<T> {
    const enrichedInstruction = enrichDutchPrompts(request.systemInstruction, request.task);
    const response = await fetch(
      `${this.baseUrl.replace(/\/+$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            ...(enrichedInstruction
              ? [{ role: 'system', content: enrichedInstruction }]
              : []),
            { role: 'user', content: request.input },
          ],
          temperature: request.temperature ?? 0.4,
          ...(process.env.OPENAI_COMPATIBLE_JSON_MODE === 'false'
            ? {}
            : { response_format: { type: 'json_object' } }),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `OpenAI-compatible provider failed with HTTP ${response.status}`
      );
    }

    const payload: any = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('OpenAI-compatible provider returned no message content');
    }

    return parseJsonObject<T>(content);
  }
}

class OpenAIRealtimeBroker {
  readonly id = 'openai-realtime';
  readonly model: string;

  constructor(
    private readonly apiKey: string,
    model = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1'
  ) {
    this.model = model;
  }

  async createSession(
    request: RealtimeSessionRequest,
    safetyIdentifier?: string
  ): Promise<RealtimeSessionDescriptor> {
    const stableSafetyId = safetyIdentifier?.trim()
      ? createHash('sha256').update(safetyIdentifier.trim()).digest('hex')
      : undefined;

    const response = await fetch(
      'https://api.openai.com/v1/realtime/client_secrets',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(stableSafetyId
            ? { 'OpenAI-Safety-Identifier': stableSafetyId }
            : {}),
        },
        body: JSON.stringify({
          session: {
            type: 'realtime',
            model: this.model,
            output_modalities: ['text'],
            instructions: request.instructions,
          },
        }),
      }
    );

    const payload: any = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        payload?.error?.message ||
          `OpenAI Realtime session creation failed with HTTP ${response.status}`
      );
    }

    if (typeof payload?.value !== 'string' || !payload.value) {
      throw new Error('OpenAI Realtime session did not return a client secret');
    }

    return {
      provider: 'openai-realtime',
      transport: 'websocket',
      model: this.model,
      clientSecret: payload.value,
      expiresAt:
        typeof payload.expires_at === 'number' ? payload.expires_at : undefined,
    };
  }
}

export interface ProviderRuntime {
  structured: StructuredJsonProvider | null;
  speech: SpeechProvider | null;
  realtime: OpenAIRealtimeBroker | null;
  descriptor(): ProviderRuntimeDescriptor;
}

export function createProviderRuntime(
  env: NodeJS.ProcessEnv = process.env
): ProviderRuntime {
  const gemini = env.GEMINI_API_KEY
    ? new GeminiProvider(
        env.GEMINI_API_KEY,
        env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash',
        env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts'
      )
    : null;

  const edge = new EdgeTtsProvider();

  const compatible =
    env.OPENAI_COMPATIBLE_BASE_URL && env.OPENAI_COMPATIBLE_MODEL
      ? new OpenAICompatibleProvider(
          env.OPENAI_COMPATIBLE_BASE_URL,
          env.OPENAI_COMPATIBLE_MODEL,
          env.OPENAI_COMPATIBLE_API_KEY
        )
      : null;

  const structuredPreference =
    env.STRUCTURED_PROVIDER ||
    (gemini ? 'gemini' : compatible ? 'openai-compatible' : 'deterministic');

  const structured =
    structuredPreference === 'openai-compatible'
      ? compatible
      : structuredPreference === 'gemini'
        ? gemini
        : null;

  /*
   * Speech providers in order of preference.
   *
   * The Edge voice needs no account and reports where every word is spoken.
   * The cloud voice is the fallback: it is metered, and a metered provider that
   * runs out must not take the voice away from a session.
   */
  const speechPreference = env.SPEECH_PROVIDER || (gemini ? 'gemini' : 'edge');
  const speechChain: SpeechProvider[] =
    speechPreference === 'edge'
      ? [edge, ...(gemini ? [gemini] : [])]
      : [...(gemini ? [gemini] : []), edge];
  const speech = speechChain.length > 0 ? new ResilientSpeechProvider(speechChain) : null;

  const realtime = env.OPENAI_API_KEY
    ? new OpenAIRealtimeBroker(
        env.OPENAI_API_KEY,
        env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1'
      )
    : null;

  return {
    structured,
    speech,
    realtime,
    descriptor() {
      return {
        conversation: structured
          ? {
              id: structured.id,
              model: structured.model,
              capabilities: ['structured_text'],
              available: true,
            }
          : {
              id: 'deterministic',
              capabilities: ['structured_text'],
              available: true,
            },
        speech: speech
          ? {
              id: speech.id,
              model: speech.speechModel,
              capabilities: ['tts'],
              available: true,
            }
          : {
              id: 'native',
              capabilities: ['tts'],
              available: true,
            },
        realtime: realtime
          ? {
              id: realtime.id,
              model: realtime.model,
              capabilities: ['realtime_text'],
              available: true,
            }
          : {
              id: 'openai-realtime',
              capabilities: ['realtime_text'],
              available: false,
            },
      };
    },
  };
}
