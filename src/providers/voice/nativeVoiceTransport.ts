import { Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { File, Paths, EncodingType } from 'expo-file-system';
import * as Speech from 'expo-speech';

export interface VoiceEvent {
  type:
    | 'listening_start'
    | 'listening_end'
    | 'speech_result'
    | 'audio_level'
    | 'playback_start'
    | 'playback_end'
    | 'error'
    | 'interrupted';
  payload?: any;
}

const LOCALE_MAP: Record<string, string> = {
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  ja: 'ja-JP',
};

const TTS_LOCALE_MAP: Record<string, string> = {
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  ja: 'ja-JP',
};

/**
 * Voice transport backed by expo-speech-recognition (capture + interim results)
 * and expo-audio (Gemini TTS playback) with expo-speech as the offline fallback.
 *
 * Exposes the same event surface as the previous Web Speech API implementation so
 * the session components do not change their listening logic.
 */
export class NativeVoiceTransport {
  private listeners: ((event: VoiceEvent) => void)[] = [];
  private subscriptions: Array<{ remove: () => void }> = [];
  private targetLanguage = 'es-ES';
  private isMuted = false;
  private isRecording = false;
  private player: AudioPlayer | null = null;
  private tempAudioFile: File | null = null;
  private audioConfigured = false;

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

  public setLanguage(langCode: string) {
    this.targetLanguage = LOCALE_MAP[langCode] || 'es-ES';
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
    if (this.isMuted) return false;
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
        lang: this.targetLanguage,
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

  public stopPlayback() {
    if (this.player) {
      try {
        this.player.pause();
        this.player.remove();
      } catch {
        // ignore
      }
      this.player = null;
      this.cleanupTempAudio();
      this.emit({ type: 'interrupted' });
    }
    try {
      Speech.stop();
    } catch {
      // ignore
    }
    this.emit({ type: 'playback_end' });
  }

  public async playSpeech(
    text: string,
    options: { audioBase64?: string; speed?: number; lang?: string } = {}
  ): Promise<void> {
    this.stopPlayback();
    const speed = options.speed || 1.0;
    const lang = options.lang || this.targetLanguage;

    if (options.audioBase64) {
      const played = await this.playBase64Audio(options.audioBase64, speed);
      if (played) return;
    }

    return this.fallbackSpeech(text, speed, lang);
  }

  private async playBase64Audio(base64: string, speed: number): Promise<boolean> {
    if (Platform.OS === 'web') {
      return this.playViaWebAudio(base64, speed);
    }

    try {
      await this.ensureAudioMode();

      const file = new File(Paths.cache, `mission-coach-${Date.now()}.wav`);
      file.create({ overwrite: true });
      file.write(base64, { encoding: EncodingType.Base64 });
      this.tempAudioFile = file;

      this.emit({ type: 'playback_start' });

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
          this.emit({ type: 'playback_end' });
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

  private async playViaWebAudio(base64: string, speed: number): Promise<boolean> {
    try {
      const AudioCtor = (globalThis as any).Audio;
      if (!AudioCtor) return false;

      return new Promise<boolean>(resolve => {
        const audio = new AudioCtor(`data:audio/wav;base64,${base64}`);
        audio.playbackRate = speed;
        this.emit({ type: 'playback_start' });
        const done = () => {
          this.emit({ type: 'playback_end' });
          resolve(true);
        };
        audio.onended = done;
        audio.onerror = () => {
          this.emit({ type: 'playback_end' });
          resolve(false);
        };
        const attempt = audio.play();
        if (attempt && typeof attempt.catch === 'function') {
          attempt.catch(() => {
            this.emit({ type: 'playback_end' });
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

  private fallbackSpeech(text: string, speed: number, lang: string): Promise<void> {
    return new Promise(resolve => {
      this.emit({ type: 'playback_start' });

      Speech.speak(text, {
        language: TTS_LOCALE_MAP[lang.split('-')[0]] || lang,
        rate: speed,
        pitch: 1.0,
        onDone: () => {
          this.emit({ type: 'playback_end' });
          resolve();
        },
        onStopped: () => {
          this.emit({ type: 'playback_end' });
          resolve();
        },
        onError: () => {
          this.emit({ type: 'playback_end' });
          resolve();
        },
      });
    });
  }

  public dispose() {
    this.stopListening();
    this.stopPlayback();
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
