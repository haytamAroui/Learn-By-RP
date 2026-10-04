import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createProviderRuntime } from '../server/providers/runtime';

describe('provider runtime architecture', () => {
  it('keeps vendor SDKs out of the learner session component', () => {
    const live = readFileSync('src/components/LiveSessionView.tsx', 'utf8');

    expect(live).toContain('createConversationProvider');
    expect(live).toContain('createVoiceTransport');
    expect(live).toContain('speakWithBestAvailable');
    expect(live).not.toContain('api.actorRespond(');
    expect(live).not.toContain('new NativeVoiceTransport');
    expect(live).not.toContain('GoogleGenAI');
  });

  it('keeps vendor SDK calls behind the server provider runtime', () => {
    const server = readFileSync('server/index.ts', 'utf8');
    const runtime = readFileSync('server/providers/runtime.ts', 'utf8');

    expect(server).toContain("createProviderRuntime");
    expect(server).toContain("'/api/providers'");
    expect(server).toContain("'/api/realtime/session'");
    expect(server).toContain("'/api/speech/synthesize'");
    expect(server).not.toContain('new GoogleGenAI');
    expect(server).not.toContain('.models.generateContent(');
    expect(runtime).toContain('this.client.interactions.create(');
    expect(runtime).toContain('Belgian Dutch (Flemish as used in Flanders)');
  });

  it('defaults safely to deterministic reasoning and native speech', () => {
    const runtime = createProviderRuntime({} as NodeJS.ProcessEnv);
    const descriptor = runtime.descriptor();

    expect(descriptor.conversation.id).toBe('deterministic');
    expect(descriptor.speech.id).toBe('native');
    expect(descriptor.realtime?.available).toBe(false);
  });

  it('accepts an OpenAI-compatible local structured model without network use', () => {
    const runtime = createProviderRuntime({
      OPENAI_COMPATIBLE_BASE_URL: 'http://127.0.0.1:1234/v1',
      OPENAI_COMPATIBLE_MODEL: 'local-roleplay-model',
      STRUCTURED_PROVIDER: 'openai-compatible',
    } as NodeJS.ProcessEnv);

    const descriptor = runtime.descriptor();
    expect(descriptor.conversation.id).toBe('openai-compatible');
    expect(descriptor.conversation.model).toBe('local-roleplay-model');
  });

  it('advertises Realtime only when the server has an OpenAI key', () => {
    const runtime = createProviderRuntime({
      OPENAI_API_KEY: 'test-only-key',
    } as NodeJS.ProcessEnv);

    const descriptor = runtime.descriptor();
    expect(descriptor.realtime?.id).toBe('openai-realtime');
    expect(descriptor.realtime?.available).toBe(true);
  });
});
