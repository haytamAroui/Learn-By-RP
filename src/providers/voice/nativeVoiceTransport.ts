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
import {
  markListeningEnded,
  markListeningStarted,
  markPlaybackEnded,
  markPlaybackStarted,
  publishPlaybackProgress,
} from './playbackClock';
import {
  estimateSpeechDurationMs,
  estimateVisemeTimeline,
  timelineFromCues,
  visemeAt,
  type VisemeTimeline,
} from './visemes';
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
  private playbackTimeline: VisemeTimeline | null = null;
  private progressTimer: ReturnType<typeof setInterval> | null = null;
  private speechQueue: Array<{
    text: string;
    options: VoicePlaybackOptions;
    resolve: () => void;
  }> = [];
  private speechQueueRunning = false;
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
    // The shared clock mirrors the transport's own playback events so a
    // character renderer can follow the voice without session internals.
    if (event.type === 'playback_start') {
      markPlaybackStarted();
    } else if (event.type === 'playback_progress') {
      publishPlaybackProgress(event.payload);
    } else if (event.type === 'playback_end') {
      markPlaybackEnded();
    } else if (event.type === 'listening_start') {
      markListeningStarted();
    } else if (event.type === 'listening_end') {
      markListeningEnded();
    }

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
    this.stopProgressTimer();
    this.playbackCancel?.();
    this.playbackCancel = null;
    // A queued line that is abandoned must still release its waiters.
    const abandoned = this.speechQueue.splice(0, this.speechQueue.length);
    for (const item of abandoned) item.resolve();
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

  /**
   * Provider audio carries its own mouth timeline. When it does not, the
   * transport rebuilds one from the text so the mouth still tracks the line.
   */
  private resolveTimeline(text: string, options: VoicePlaybackOptions): VisemeTimeline {
    const provided = timelineFromCues(options.visemes);
    if (provided.cues.length > 0) return provided;

    const estimated = estimateSpeechDurationMs(text, options.speed || 1);
    return estimateVisemeTimeline(text, estimated);
  }

  private stopProgressTimer() {
    if (!this.progressTimer) return;
    clearInterval(this.progressTimer);
    this.progressTimer = null;
  }

  /**
   * Emit the playback position while audio runs. The avatar uses it to place
   * the mouth and to keep speech and visuals in step.
   */
  private startProgressTimer(
    generation: number,
    read: () => { currentTimeMs: number; durationMs: number },
    timeline?: VisemeTimeline,
    chunkOffsetMs = 0
  ) {
    this.stopProgressTimer();
    if (this.disposed) return;

    // The timer is bounded by the line length. A player that never reports
    // completion must not leave a repeating timer running.
    const startedAt = Date.now();
    const lifetimeMs = Math.max(3000, (timeline?.durationMs ?? 0) + 2000);

    this.progressTimer = setInterval(() => {
      if (this.disposed || generation !== this.playbackGeneration || !this.playbackActive) {
        this.stopProgressTimer();
        return;
      }
      if (Date.now() - startedAt > lifetimeMs) {
        this.stopProgressTimer();
        return;
      }

      let timing: { currentTimeMs: number; durationMs: number };
      try {
        timing = read();
      } catch {
        this.stopProgressTimer();
        return;
      }

      const clipTimeMs = Math.max(0, Math.round(timing.currentTimeMs));
      const durationMs = Math.max(0, Math.round(timing.durationMs));
      this.emit({
        type: 'playback_progress',
        payload: {
          // The position is reported across the whole line, so a queued line
          // keeps one clock.
          currentTimeMs: chunkOffsetMs + clipTimeMs,
          durationMs,
          viseme: visemeAt(timeline, clipTimeMs),
        },
      });
    }, 50);
  }

  public async playSpeech(
    text: string,
    options: VoicePlaybackOptions = {}
  ): Promise<void> {
    if (this.disposed) return;
    this.stopPlayback();
    const generation = ++this.playbackGeneration;
    this.playbackActive = true;
    this.playbackTimeline = this.resolveTimeline(text, options);
    this.emit({ type: 'playback_start' });
    await this.playClip(text, options, generation, options.chunkOffsetMs ?? 0);
    this.finishPlayback(generation);
  }

  /**
   * Queue a piece of a spoken line.
   *
   * Pieces play back to back and the line keeps one start and one end, so the
   * session sees one continuous utterance and the mouth clock runs across the
   * whole line.
   */
  public enqueueSpeech(text: string, options: VoicePlaybackOptions = {}): Promise<void> {
    return new Promise<void>(resolve => {
      this.speechQueue.push({ text, options, resolve });
      if (!this.speechQueueRunning) void this.drainSpeechQueue();
    });
  }

  private async drainSpeechQueue() {
    this.speechQueueRunning = true;
    const generation = ++this.playbackGeneration;
    this.playbackActive = true;
    this.emit({ type: 'playback_start' });

    try {
      while (this.speechQueue.length > 0) {
        const item = this.speechQueue.shift();
        if (!item) break;
        if (this.disposed || generation !== this.playbackGeneration) break;

        this.playbackTimeline = this.resolveTimeline(item.text, item.options);
        try {
          await this.playClip(
            item.text,
            item.options,
            generation,
            item.options.chunkOffsetMs ?? 0
          );
        } catch {
          // One failed piece must not end the line.
        }
        item.resolve();
      }
    } finally {
      this.speechQueueRunning = false;
      this.finishPlayback(generation);
    }
  }

  /**
   * Play one clip without announcing a new utterance.
   */
  private async playClip(
    text: string,
    options: VoicePlaybackOptions,
    generation: number,
    chunkOffsetMs: number
  ): Promise<void> {
    const speed = options.speed || 1.0;
    const lang = options.lang || this.targetLanguage;
    const locale = resolveSpeechLocale(lang, options.locale);
    const timeline = this.resolveTimeline(text, options);

    // Gemini TTS supplies locale-directed Dutch audio for nl-BE. Play that
    // provider audio directly; only fall back to exact-match native speech when
    // synthesis was unavailable.
    if (options.audioBase64) {
      const played = await this.playBase64Audio(
        options.audioBase64,
        speed,
        options.mimeType,
        generation,
        timeline,
        chunkOffsetMs
      );
      if (played) return;
    }

    if (this.disposed || generation !== this.playbackGeneration) return;
    return this.fallbackSpeech(text, speed, locale, generation, timeline, chunkOffsetMs);
  }

  private async playBase64Audio(
    base64: string,
    speed: number,
    mimeType = 'audio/wav',
    generation: number,
    timeline?: VisemeTimeline,
    chunkOffsetMs = 0
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      return this.playViaWebAudio(base64, speed, mimeType, generation, timeline, chunkOffsetMs);
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
          resolve();
        });

        player.play();
        this.startProgressTimer(
          generation,
          () => ({
            currentTimeMs: (player.currentTime ?? 0) * 1000,
            durationMs: (player.duration ?? 0) * 1000 || timeline?.durationMs || 0,
          }),
          timeline,
          chunkOffsetMs
        );
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
    generation: number,
    timeline?: VisemeTimeline,
    chunkOffsetMs = 0
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
        this.startProgressTimer(
          generation,
          () => ({
            currentTimeMs: (Number(audio.currentTime) || 0) * 1000,
            durationMs: (Number(audio.duration) || 0) * 1000 || timeline?.durationMs || 0,
          }),
          timeline,
          chunkOffsetMs
        );
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
    this.stopProgressTimer();
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
    generation: number,
    timeline?: VisemeTimeline,
    chunkOffsetMs = 0
  ): Promise<void> {
    const voice = await this.resolveNativeVoice(locale);
    if (this.disposed || generation !== this.playbackGeneration) return;

    // Expo Speech may silently choose the OS default when `voice` is omitted.
    // That produced French audio for Belgian Dutch on hosts without an nl-BE
    // voice. Keep the playback boundary locale-safe and let the UI offer text.
    if (locale.toLowerCase() === 'nl-be' && !voice) {
      this.emit({ type: 'error', payload: 'voice_locale_unavailable' });
      return;
    }

    return new Promise(resolve => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (this.playbackCancel === cancel) this.playbackCancel = null;
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

      // The native speech engine reports no timeline, so the clock runs on
      // elapsed time against the estimated duration of the line.
      const startedAt = Date.now();
      this.startProgressTimer(
        generation,
        () => ({
          currentTimeMs: Date.now() - startedAt,
          durationMs: timeline?.durationMs ?? 0,
        }),
        timeline,
        chunkOffsetMs
      );
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
