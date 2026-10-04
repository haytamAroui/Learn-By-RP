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
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: request.input,
      config: {
        systemInstruction: request.systemInstruction,
        responseMimeType: 'application/json',
        temperature: request.temperature ?? 0.4,
      },
    });

    return parseJsonObject<T>(response.text || '{}');
  }

  async synthesize(request: SpeechSynthesisRequest): Promise<SpeechSynthesisResponse> {
    const locale = request.locale || request.language;
    const configuredVoice =
      request.voice ||
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
      ? 'Speak in natural Belgian Dutch (Flemish as used in Flanders), with local Belgian pronunciation and cadence. Do not use a Netherlands Dutch accent. The text is the exact transcript; do not translate or paraphrase it.'
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
            ...(request.systemInstruction
              ? [{ role: 'system', content: request.systemInstruction }]
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

  const speechPreference =
    env.SPEECH_PROVIDER || (gemini ? 'gemini' : 'native');
  const speech = speechPreference === 'gemini' ? gemini : null;

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
