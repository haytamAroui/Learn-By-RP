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

export class WebVoiceTransport {
  private recognition: any = null;
  private isListening = false;
  private isMuted = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private currentSpeechUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: ((event: VoiceEvent) => void)[] = [];
  private targetLanguage = 'es-ES';
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.targetLanguage;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.emit({ type: 'listening_start' });
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        this.emit({
          type: 'speech_result',
          payload: {
            transcript: finalTranscript || interimTranscript,
            isFinal: Boolean(finalTranscript)
          }
        });
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          this.emit({ type: 'error', payload: event.error });
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.emit({ type: 'listening_end' });
      };
    }
  }

  public setLanguage(langCode: string) {
    const map: Record<string, string> = {
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      ja: 'ja-JP'
    };
    this.targetLanguage = map[langCode] || 'es-ES';
    if (this.recognition) {
      this.recognition.lang = this.targetLanguage;
    }
  }

  public subscribe(fn: (event: VoiceEvent) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private emit(event: VoiceEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('Voice listener error', e);
      }
    }
  }

  public async startListening(): Promise<boolean> {
    if (this.isMuted) return false;
    this.stopPlayback(); // Learner speaking interrupts any active playback!

    try {
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.startAudioMeter(this.mediaStream);
      }

      if (this.recognition) {
        try {
          this.recognition.start();
        } catch {
          // If already started, ignore
        }
      }
      return true;
    } catch (err: any) {
      console.warn('Microphone permission denied or unavailable:', err);
      this.emit({ type: 'error', payload: 'mic_denied' });
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
  }

  private startAudioMeter(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(1, average / 128);
        this.emit({ type: 'audio_level', payload: normalized });
        this.animFrameId = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('Audio metering unavailable', e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopListening();
    }
  }

  public stopPlayback() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
      this.emit({ type: 'interrupted' });
    }
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      this.currentSpeechUtterance = null;
      this.emit({ type: 'interrupted' });
    }
    this.emit({ type: 'playback_end' });
  }

  public async playSpeech(
    text: string,
    options: {
      audioBase64?: string;
      speed?: number;
      lang?: string;
    } = {}
  ): Promise<void> {
    this.stopPlayback();

    const speed = options.speed || 1.0;

    // 1. Play Gemini TTS Base64 WAV if provided
    if (options.audioBase64) {
      return new Promise(resolve => {
        this.emit({ type: 'playback_start' });
        const audio = new Audio(`data:audio/wav;base64,${options.audioBase64}`);
        audio.playbackRate = speed;
        this.currentAudioElement = audio;

        audio.onended = () => {
          this.currentAudioElement = null;
          this.emit({ type: 'playback_end' });
          resolve();
        };

        audio.onerror = () => {
          this.currentAudioElement = null;
          this.emit({ type: 'playback_end' });
          resolve();
        };

        audio.play().catch(e => {
          console.warn('Audio play failed, falling back to speech synthesis', e);
          this.fallbackSpeechSynthesis(text, speed, options.lang).then(resolve);
        });
      });
    }

    // 2. Play Web SpeechSynthesis
    return this.fallbackSpeechSynthesis(text, speed, options.lang);
  }

  private fallbackSpeechSynthesis(text: string, speed = 1.0, lang?: string): Promise<void> {
    return new Promise(resolve => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }

      this.emit({ type: 'playback_start' });
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;
      utterance.lang = lang || this.targetLanguage;
      this.currentSpeechUtterance = utterance;

      utterance.onend = () => {
        this.currentSpeechUtterance = null;
        this.emit({ type: 'playback_end' });
        resolve();
      };

      utterance.onerror = () => {
        this.currentSpeechUtterance = null;
        this.emit({ type: 'playback_end' });
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public dispose() {
    this.stopListening();
    this.stopPlayback();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
