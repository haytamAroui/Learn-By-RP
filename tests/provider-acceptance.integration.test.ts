import { describe, expect, it } from 'vitest';
import { createProviderRuntime } from '../server/providers/runtime';

const runRealProviders = process.env.RUN_PROVIDER_ACCEPTANCE === '1';

function responseDoneText(event: any): string {
  const outputs = Array.isArray(event?.response?.output) ? event.response.output : [];
  for (const item of outputs) {
    const parts = Array.isArray(item?.content) ? item.content : [];
    for (const part of parts) {
      if (
        part?.type === 'output_text' &&
        typeof part.text === 'string' &&
        part.text.trim()
      ) {
        return part.text.trim();
      }
    }
  }
  return '';
}

async function runRealtimeTextTurn(
  clientSecret: string,
  model: string
): Promise<string> {
  if (typeof WebSocket === 'undefined') {
    throw new Error('Node runtime does not expose WebSocket');
  }

  return new Promise<string>((resolve, reject) => {
    const ws = new WebSocket(
      `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
      ['realtime', `openai-insecure-api-key.${clientSecret}`]
    );

    let collected = '';
    let settled = false;

    const finish = (error?: Error, text?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        // ignore
      }
      if (error) reject(error);
      else resolve(text || collected);
    };

    const timer = setTimeout(
      () => finish(new Error('OpenAI Realtime acceptance timed out')),
      30000
    );

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'session.update',
          session: {
            type: 'realtime',
            output_modalities: ['text'],
            instructions:
              'You are a provider acceptance probe. Reply briefly and do not use tools.',
          },
        })
      );

      ws.send(
        JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: 'Reply with a short confirmation that the realtime connection works.',
              },
            ],
          },
        })
      );

      ws.send(
        JSON.stringify({
          type: 'response.create',
          response: { output_modalities: ['text'] },
        })
      );
    };

    ws.onerror = () => {
      finish(new Error('OpenAI Realtime WebSocket failed'));
    };

    ws.onmessage = event => {
      let payload: any;
      try {
        payload = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (
        payload.type === 'response.output_text.delta' &&
        typeof payload.delta === 'string'
      ) {
        collected += payload.delta;
        return;
      }

      if (payload.type === 'response.output_text.done') {
        const text =
          typeof payload.text === 'string' && payload.text.trim()
            ? payload.text.trim()
            : collected.trim();
        if (text) finish(undefined, text);
        return;
      }

      if (payload.type === 'response.done') {
        const text = collected.trim() || responseDoneText(payload);
        if (text) finish(undefined, text);
        else finish(new Error('OpenAI Realtime completed without text'));
        return;
      }

      if (payload.type === 'error') {
        finish(
          new Error(
            payload?.error?.message || 'OpenAI Realtime returned an error event'
          )
        );
      }
    };
  });
}

describe.skipIf(!runRealProviders)('real provider acceptance', () => {
  it(
    'creates an OpenAI Realtime session and completes a real text turn',
    async () => {
      expect(process.env.OPENAI_API_KEY).toBeTruthy();

      const runtime = createProviderRuntime(process.env);
      expect(runtime.realtime).not.toBeNull();

      const session = await runtime.realtime!.createSession({
        targetLanguage: 'fr',
        explanationLanguage: 'en',
        instructions:
          'Provider acceptance session. Keep responses short and text-only.',
      });

      expect(session.provider).toBe('openai-realtime');
      expect(session.clientSecret.length).toBeGreaterThan(20);

      const text = await runRealtimeTextTurn(
        session.clientSecret,
        session.model
      );

      expect(text.trim().length).toBeGreaterThan(0);
    },
    45000
  );

  const ttsCases = [
    {
      name: 'French',
      language: 'fr',
      locale: 'fr-FR',
      text: 'Bonjour, je voudrais un café.',
    },
    {
      name: 'Belgian Dutch',
      language: 'nl',
      locale: 'nl-BE',
      text: 'Goedemorgen, ik wil graag een koffie.',
    },
  ] as const;

  for (const sample of ttsCases) {
    it(
      `generates real Gemini TTS audio for ${sample.name}`,
      async () => {
        expect(process.env.GEMINI_API_KEY).toBeTruthy();

        const runtime = createProviderRuntime(process.env);
        expect(runtime.speech).not.toBeNull();

        const result = await runtime.speech!.synthesize({
          text: sample.text,
          language: sample.language,
          locale: sample.locale,
          speed: 1,
          style: 'Natural, friendly, clear speech for a language learner.',
        });

        expect(result.fallback).toBe('none');
        expect(result.audio?.provider).toBe('gemini');
        expect(result.audio?.mimeType).toMatch(/^audio\//i);

        const bytes = Buffer.from(result.audio!.base64, 'base64');
        expect(bytes.byteLength).toBeGreaterThan(1000);
      },
      45000
    );
  }
});
