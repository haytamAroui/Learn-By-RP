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
  private disposed = false;
  private captureGeneration = 0;
  private listeningRequest: Promise<boolean> | null = null;
  private nativeStopPending = false;
  private playbackGeneration = 0;
  private playbackActive = false;
  private playbackCancel: (() => void) | null = null;
  private webAudio: any = null;

  constructor(private readonly mayCapture: () => boolean | Promise<boolean> = () => false) {
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
      if (this.nativeStopPending || this.disposed) {
        try { ExpoSpeechRecognitionModule.stop(); } catch { /* already stopped */ }
        return;
      }
      this.isRecording = true;
      this.emit({ type: 'listening_start' });
    });

    on('end', () => {
      this.nativeStopPending = false;
      this.isRecording = false;
      this.emit({ type: 'listening_end' });
    });

    on('result', (event: ExpoSpeechRecognitionResultEvent) => {
      const transcript = (event?.results ?? [])
        .map(r => r?.transcript ?? '')
        .join(' ')
        .trim();

      if (!transcript) return;

      const generation = this.captureGeneration;
      void Promise.resolve(this.mayCapture()).then(allowed => {
        if (!allowed || this.disposed || generation !== this.captureGeneration) return;
        this.emit({
          type: 'speech_result',
          payload: { transcript, isFinal: Boolean(event.isFinal) },
        });
      }).catch(() => undefined);
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
        this.isRecording = false;
        this.nativeStopPending = false;
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

  public startListening(): Promise<boolean> {
    if (this.nativeStopPending) return Promise.resolve(false);
    if (this.listeningRequest) return this.listeningRequest;
    const generation = ++this.captureGeneration;
    const request = this.beginListening(generation).finally(() => {
      if (this.listeningRequest === request) this.listeningRequest = null;
    });
    this.listeningRequest = request;
    return request;
  }

  private async beginListening(generation: number): Promise<boolean> {
    if (this.disposed || this.isMuted) return false;
    if (!(await this.mayCapture())) {
      this.stopListening();
      this.emit({ type: 'error', payload: 'mic_denied' });
      return false;
    }
    if (this.isRecording) return true;

    this.stopPlayback();
    await this.ensureAudioMode();
    if (generation !== this.captureGeneration || this.disposed || this.isMuted) return false;

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
      // Consent can be withdrawn while the OS permission dialog is open.
      if (!(await this.mayCapture()) || generation !== this.captureGeneration || this.disposed || this.isMuted) return false;
      // Native start events arrive asynchronously; stop must already know that
      // capture has been requested if the learner cancels before that event.
      this.isRecording = true;
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
      this.isRecording = false;
      console.warn('Could not start speech recognition:', e);
      this.emit({ type: 'error', payload: 'unknown' });
      return false;
    }
  }

  public stopListening() {
    this.captureGeneration += 1;
    if (!this.isRecording) return;
    this.nativeStopPending = true;
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
      this.stopPlayback();
    }
  }

  public stopPlayback() {
    const wasActive = this.playbackActive;
    this.playbackGeneration += 1;
    this.playbackActive = false;
    this.playbackCancel?.();
    this.playbackCancel = null;
    if (this.webAudio) {
      this.webAudio.onended = null;
      this.webAudio.onerror = null;
      try { this.webAudio.pause(); this.webAudio.removeAttribute?.('src'); this.webAudio.load?.(); } catch { /* best effort */ }
      this.webAudio = null;
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
    }
    try {
      Speech.stop();
    } catch {
      // ignore
    }
    if (wasActive) {
      this.emit({ type: 'interrupted' });
      this.emit({ type: 'playback_end' });
    }
  }

  public async playSpeech(
    text: string,
    options: VoicePlaybackOptions = {}
  ): Promise<void> {
    if (this.disposed) return;
    this.stopPlayback();
    const generation = ++this.playbackGeneration;
    this.playbackActive = true;
    this.emit({ type: 'playback_start' });
    const speed = options.speed || 1.0;
    const lang = options.lang || this.targetLanguage;
    const locale = resolveSpeechLocale(lang, options.locale);

    // Gemini TTS supplies locale-directed Dutch audio for nl-BE. Play that
    // provider audio directly; only fall back to exact-match native speech when
    // synthesis was unavailable.
    if (options.audioBase64) {
      const played = await this.playBase64Audio(
        options.audioBase64,
        speed,
        options.mimeType,
        generation
      );
      if (played) return;
    }

    if (this.disposed || generation !== this.playbackGeneration) return;
    return this.fallbackSpeech(text, speed, locale, generation);
  }

  private async playBase64Audio(
    base64: string,
    speed: number,
    mimeType = 'audio/wav',
    generation: number
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      return this.playViaWebAudio(base64, speed, mimeType, generation);
    }

    try {
      await this.ensureAudioMode();
      if (this.disposed || generation !== this.playbackGeneration) return false;

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

      const player = createAudioPlayer({ uri: file.uri });
      player.volume = 1.0;
      player.playbackRate = Math.max(0.5, Math.min(2, speed));
      this.player = player;

      await new Promise<void>(resolve => {
        let settled = false;
        this.playbackCancel = () => { if (!settled) { settled = true; resolve(); } };
        const subscription = player.addListener('playbackStatusUpdate', status => {
          if (settled || generation !== this.playbackGeneration || !status?.didJustFinish) return;
          settled = true;
          this.playbackCancel = null;
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
          this.finishPlayback(generation);
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
    mimeType: string,
    generation: number
  ): Promise<boolean> {
    try {
      const AudioCtor = (globalThis as any).Audio;
      if (!AudioCtor) return false;

      return new Promise<boolean>(resolve => {
        const audio = new AudioCtor(`data:${mimeType};base64,${base64}`);
        if (this.disposed || generation !== this.playbackGeneration) { resolve(false); return; }
        this.webAudio = audio;
        audio.playbackRate = speed;
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          this.webAudio = null;
          this.playbackCancel = null;
          this.finishPlayback(generation);
          resolve(true);
        };
        audio.onended = done;
        audio.onerror = () => {
          if (settled) return;
          settled = true;
          this.webAudio = null;
          this.playbackCancel = null;
          resolve(false);
        };
        this.playbackCancel = () => {
          if (settled) return;
          settled = true;
          resolve(false);
        };
        const attempt = audio.play();
        if (attempt && typeof attempt.catch === 'function') {
          attempt.catch(() => {
            if (!settled) {
              settled = true;
              this.webAudio = null;
              this.playbackCancel = null;
              resolve(false);
            }
          });
        }
      });
    } catch (e) {
      console.warn('Web base64 playback unavailable:', e);
      return false;
    }
  }

  private finishPlayback(generation: number) {
    if (generation !== this.playbackGeneration || !this.playbackActive) return;
    this.playbackActive = false;
    this.playbackCancel = null;
    this.emit({ type: 'playback_end' });
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
    locale: string,
    generation: number
  ): Promise<void> {
    const voice = await this.resolveNativeVoice(locale);
    if (this.disposed || generation !== this.playbackGeneration) return;

    // Expo Speech may silently choose the OS default when `voice` is omitted.
    // That produced French audio for Belgian Dutch on hosts without an nl-BE
    // voice. Keep the playback boundary locale-safe and let the UI offer text.
    if (locale.toLowerCase() === 'nl-be' && !voice) {
      this.finishPlayback(generation);
      this.emit({ type: 'error', payload: 'voice_locale_unavailable' });
      return;
    }

    return new Promise(resolve => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (this.playbackCancel === cancel) this.playbackCancel = null;
        this.finishPlayback(generation);
        resolve();
      };
      const cancel = () => { if (!settled) { settled = true; resolve(); } };
      this.playbackCancel = cancel;

      Speech.speak(text, {
        language: locale,
        voice,
        rate: speed,
        pitch: 1.0,
        useApplicationAudioSession: true,
        onDone: finish,
        onStopped: finish,
        onError: finish,
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
