import { Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { File, Paths, EncodingType } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { pickBestNativeVoice, resolveSpeechLocale } from './language';
import type {
  TransportCapabilities,
  VoiceEvent,
  VoicePlaybackOptions,
  VoiceTransport,
} from './types';

/**
 * Voice transport backed by expo-speech-recognition (capture + interim results)
 * and expo-audio (Gemini TTS playback) with expo-speech as the offline fallback.
 *
 * Exposes the same event surface as the previous Web Speech API implementation so
 * the session components do not change their listening logic.
 */
export class NativeVoiceTransport implements VoiceTransport {
  readonly id = 'native-expo';
  readonly capabilities: TransportCapabilities = {
    speechRateControl: true,
    endOfTurnDelayControl: false,
    pushToTalk: true,
    scriptedLineInjection: true,
    blockingToolCalls: false,
    transcriptRevisions: true,
  };
  private listeners: ((event: VoiceEvent) => void)[] = [];
  private subscriptions: Array<{ remove: () => void }> = [];
  private targetLanguage = 'es';
  private targetLocale = 'es-ES';
  private nativeVoiceCache = new Map<string, string | null>();
  private isMuted = false;
  private isRecording = false;
  private player: AudioPlayer | null = null;
  private tempAudioFile: File | null = null;
  private audioConfigured = false;
  /**
   * True only between a real playback_start and its matching playback_end.
   *
   * startListening() calls stopPlayback() defensively. stopPlayback must therefore
   * stay silent when nothing is playing; otherwise playback_end causes the session
   * UI to call startListening() again and the transport recurses synchronously.
   */
  private isPlaybackActive = false;
  private playbackGeneration = 0;
  private disposed = false;

  constructor() {
    this.attachListeners();
  }

  private attachListeners() {
    const on = <K extends 'result' | 'error' | 'start' | 'end' | 'volumechange' | 'speechstart'>(
      event: K,
      handler: (payload: any) => void
    ) => {
      const sub = (ExpoSpeechRecognitionModule as any).addListener(event, handler);
      this.subscriptions.push(sub);
    };

    on('start', () => {
      this.isRecording = true;
      this.emit({ type: 'listening_start' });
    });

    on('end', () => {
      this.isRecording = false;
      this.emit({ type: 'listening_end' });
    });

    on('result', (event: ExpoSpeechRecognitionResultEvent) => {
      const transcript = (event?.results ?? [])
        .map(r => r?.transcript ?? '')
        .join(' ')
        .trim();

      if (!transcript) return;

      this.emit({
        type: 'speech_result',
        payload: {
          transcript,
          isFinal: Boolean(event.isFinal),
        },
      });
    });

    // Native volume is dBFS-ish (-2 inaudible .. 10 loud). Map into 0..1.
    on('volumechange', (event: { value: number }) => {
      const raw = event?.value ?? 0;
      const normalized = Math.max(0, Math.min(1, (raw + 2) / 12));
      this.emit({ type: 'audio_level', payload: normalized });
    });

    on('error', (event: ExpoSpeechRecognitionErrorEvent) => {
      const code = event?.error ?? 'unknown';
      if (code === 'no-speech' || code === 'aborted') {
        this.isRecording = false;
        this.emit({ type: 'listening_end' });
        return;
      }
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        this.emit({ type: 'error', payload: 'mic_denied' });
        return;
      }
      this.isRecording = false;
      this.emit({ type: 'error', payload: code });
      this.emit({ type: 'listening_end' });
    });
  }

  public setLanguage(langCode: string, preferredLocale?: string) {
    this.targetLanguage = langCode;
    this.targetLocale = resolveSpeechLocale(langCode, preferredLocale);
  }

  public subscribe(fn: (event: VoiceEvent) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private emit(event: VoiceEvent) {
    for (const listener of [...this.listeners]) {
      try {
        listener(event);
      } catch (e) {
        console.error('Voice listener error', e);
      }
    }
  }

  private async ensureAudioMode() {
    if (this.audioConfigured) return;
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      this.audioConfigured = true;
    } catch (e) {
      console.warn('Audio mode configuration failed', e);
    }
  }

  public async startListening(): Promise<boolean> {
    if (this.disposed || this.isMuted) return false;
    if (this.isRecording) return true;

    this.stopPlayback();
    await this.ensureAudioMode();

    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        this.emit({ type: 'error', payload: 'mic_denied' });
        return false;
      }
    } catch (e) {
      console.warn('Microphone permission check failed:', e);
      this.emit({ type: 'error', payload: 'mic_denied' });
      return false;
    }

    try {
      ExpoSpeechRecognitionModule.start({
        lang: this.targetLocale,
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        // Roleplay is turn-based, so route audio to the speaker rather than the earpiece.
        iosTaskHint: 'dictation',
      });
      return true;
    } catch (e) {
      console.warn('Could not start speech recognition:', e);
      this.emit({ type: 'error', payload: 'unknown' });
      return false;
    }
  }

  public stopListening() {
    if (!this.isRecording) return;
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // ignore
    }
    this.isRecording = false;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopListening();
      Speech.stop();
    }
  }

  private beginPlayback(): number {
    this.playbackGeneration += 1;
    this.isPlaybackActive = true;
    this.emit({ type: 'playback_start' });
    return this.playbackGeneration;
  }

  private finishPlayback(generation: number) {
    if (!this.isPlaybackActive || generation !== this.playbackGeneration) return;
    this.isPlaybackActive = false;
    this.emit({ type: 'playback_end' });
  }

  public stopPlayback() {
    const hadActivePlayback = this.isPlaybackActive;
    if (hadActivePlayback) {
      // Invalidate callbacks from the interrupted playback before stopping the
      // underlying player/speech engine. Native callbacks may arrive afterwards.
      this.isPlaybackActive = false;
      this.playbackGeneration += 1;
    }

    if (this.player) {
      try {
        this.player.pause();
        this.player.remove();
      } catch {
        // ignore
      }
      this.player = null;
      this.cleanupTempAudio();
      if (hadActivePlayback) {
        this.emit({ type: 'interrupted' });
      }
    }
    try {
      Speech.stop();
    } catch {
      // ignore
    }

    // Critical recursion guard: startListening() calls stopPlayback(). An idle
    // stop must not manufacture playback_end, because the session's playback_end
    // handler starts listening again.
    if (hadActivePlayback) {
      this.emit({ type: 'playback_end' });
    }
  }

  public async playSpeech(
    text: string,
    options: VoicePlaybackOptions = {}
  ): Promise<void> {
    if (this.disposed) return;
    this.stopPlayback();
    const speed = options.speed || 1.0;
    const lang = options.lang || this.targetLanguage;
    const locale = resolveSpeechLocale(lang, options.locale);

    if (options.audioBase64) {
      const played = await this.playBase64Audio(
        options.audioBase64,
        speed,
        options.mimeType
      );
      if (played) return;
    }

    return this.fallbackSpeech(text, speed, locale);
  }

  private async playBase64Audio(
    base64: string,
    speed: number,
    mimeType = 'audio/wav'
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      return this.playViaWebAudio(base64, speed, mimeType);
    }

    try {
      await this.ensureAudioMode();

      const extension =
        mimeType.includes('mpeg') || mimeType.includes('mp3')
          ? 'mp3'
          : mimeType.includes('aac')
            ? 'aac'
            : 'wav';
      const file = new File(Paths.cache, `learnbyrp-${Date.now()}.${extension}`);
      file.create({ overwrite: true });
      file.write(base64, { encoding: EncodingType.Base64 });
      this.tempAudioFile = file;

      const playbackGeneration = this.beginPlayback();

      const player = createAudioPlayer({ uri: file.uri });
      player.volume = 1.0;
      player.playbackRate = Math.max(0.5, Math.min(2, speed));
      this.player = player;

      await new Promise<void>(resolve => {
        let settled = false;
        const subscription = player.addListener('playbackStatusUpdate', status => {
          if (settled || !status?.didJustFinish) return;
          settled = true;
          subscription.remove();
          try {
            player.remove();
          } catch {
            // ignore
          }
          if (this.player === player) {
            this.player = null;
          }
          this.cleanupTempAudio();
          this.finishPlayback(playbackGeneration);
          resolve();
        });

        player.play();
      });

      return true;
    } catch (e) {
      console.warn('Base64 audio playback failed, using TTS fallback:', e);
      this.cleanupTempAudio();
      return false;
    }
  }

  private async playViaWebAudio(
    base64: string,
    speed: number,
    mimeType: string
  ): Promise<boolean> {
    try {
      const AudioCtor = (globalThis as any).Audio;
      if (!AudioCtor) return false;

      return new Promise<boolean>(resolve => {
        const audio = new AudioCtor(`data:${mimeType};base64,${base64}`);
        audio.playbackRate = speed;
        const playbackGeneration = this.beginPlayback();
        const done = () => {
          this.finishPlayback(playbackGeneration);
          resolve(true);
        };
        audio.onended = done;
        audio.onerror = () => {
          this.finishPlayback(playbackGeneration);
          resolve(false);
        };
        const attempt = audio.play();
        if (attempt && typeof attempt.catch === 'function') {
          attempt.catch(() => {
            this.finishPlayback(playbackGeneration);
            resolve(false);
          });
        }
      });
    } catch (e) {
      console.warn('Web base64 playback unavailable:', e);
      return false;
    }
  }

  private cleanupTempAudio() {
    if (!this.tempAudioFile) return;
    const file = this.tempAudioFile;
    this.tempAudioFile = null;
    try {
      file.delete();
    } catch {
      // Best effort: the cache directory is purged by the OS anyway.
    }
  }

  private async resolveNativeVoice(locale: string): Promise<string | undefined> {
    if (this.nativeVoiceCache.has(locale)) {
      return this.nativeVoiceCache.get(locale) || undefined;
    }

    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const match = pickBestNativeVoice(voices as any[], locale);
      const identifier = match?.identifier ?? null;
      this.nativeVoiceCache.set(locale, identifier);
      return identifier || undefined;
    } catch (error) {
      console.warn('Could not inspect native voices:', error);
      this.nativeVoiceCache.set(locale, null);
      return undefined;
    }
  }

  private async fallbackSpeech(
    text: string,
    speed: number,
    locale: string
  ): Promise<void> {
    const voice = await this.resolveNativeVoice(locale);

    return new Promise(resolve => {
      const playbackGeneration = this.beginPlayback();

      Speech.speak(text, {
        language: locale,
        voice,
        rate: speed,
        pitch: 1.0,
        useApplicationAudioSession: true,
        onDone: () => {
          this.finishPlayback(playbackGeneration);
          resolve();
        },
        onStopped: () => {
          this.finishPlayback(playbackGeneration);
          resolve();
        },
        onError: () => {
          this.finishPlayback(playbackGeneration);
          resolve();
        },
      });
    });
  }

  public dispose() {
    if (this.disposed) return;
    this.stopListening();
    this.stopPlayback();
    this.disposed = true;
    for (const sub of this.subscriptions) {
      try {
        sub.remove();
      } catch {
        // ignore
      }
    }
    this.subscriptions = [];
    this.listeners = [];
  }
}
