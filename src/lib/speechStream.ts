import type {
  SpeechSynthesisChunk,
  SpeechSynthesisRequest,
  SpeechSynthesisStreamEvent,
} from '../providers/runtime/contracts';

/**
 * Read a server-sent event stream.
 *
 * `XMLHttpRequest` is used rather than `fetch` because a streaming response
 * body is not available in the React Native fetch implementation, and the
 * event stream is the only way to hear a line before it has been synthesised
 * in full.
 */
export interface SpeechStreamOptions {
  url: string;
  headers: Record<string, string>;
  body: SpeechSynthesisRequest;
  onChunk: (chunk: SpeechSynthesisChunk) => void;
  signal?: AbortSignal;
}

function parseFrames(buffer: string): { frames: string[]; rest: string } {
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  return { frames: parts, rest };
}

function readFrame(frame: string): SpeechSynthesisStreamEvent | null {
  for (const line of frame.split('\n')) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload) continue;
    try {
      return JSON.parse(payload) as SpeechSynthesisStreamEvent;
    } catch {
      // A partial frame is not an event.
      return null;
    }
  }
  return null;
}

export function openSpeechStream(options: SpeechStreamOptions): Promise<void> {
  if (typeof XMLHttpRequest === 'undefined') {
    return Promise.reject(new Error('This runtime cannot read an event stream'));
  }

  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    let consumed = 0;
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      options.signal?.removeEventListener('abort', onAbort);
      if (error) reject(error);
      else resolve();
    };

    const onAbort = () => {
      try {
        request.abort();
      } catch {
        // The request may already be finished.
      }
      finish();
    };

    const drain = () => {
      const text = request.responseText ?? '';
      if (text.length <= consumed) return;
      const { frames, rest } = parseFrames(text.slice(consumed));
      consumed = text.length - rest.length;
      for (const frame of frames) {
        const event = readFrame(frame);
        if (event?.type === 'chunk') options.onChunk(event.chunk);
      }
    };

    request.open('POST', options.url, true);
    request.setRequestHeader('Content-Type', 'application/json');
    for (const [name, value] of Object.entries(options.headers)) {
      request.setRequestHeader(name, value);
    }

    request.onprogress = drain;
    request.onload = () => {
      drain();
      if (request.status >= 400) {
        finish(new Error(`Speech stream failed with ${request.status}`));
        return;
      }
      finish();
    };
    request.onerror = () => finish(new Error('Speech stream could not be read'));
    request.onabort = () => finish();

    options.signal?.addEventListener('abort', onAbort, { once: true });
    if (options.signal?.aborted) {
      onAbort();
      return;
    }

    request.send(JSON.stringify(options.body));
  });
}
