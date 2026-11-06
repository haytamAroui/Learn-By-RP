/**
 * Audio timing helpers.
 *
 * The speech provider returns base64 audio without a duration, and the avatar
 * needs the real length to place a mouth timeline. The parser is dependency
 * free and portable so the server, the client, and tests can all use it.
 */

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function decodeBase64ToBytes(input: string): Uint8Array {
  const cleaned = String(input ?? '').replace(/[\s\r\n]/g, '').replace(/=+$/, '');
  const bytes = new Uint8Array(Math.floor((cleaned.length * 3) / 4));
  let outputIndex = 0;
  let buffer = 0;
  let bits = 0;

  for (let index = 0; index < cleaned.length; index += 1) {
    const value = BASE64_ALPHABET.indexOf(cleaned[index]);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[outputIndex] = (buffer >> bits) & 0xff;
      outputIndex += 1;
    }
  }

  return bytes.subarray(0, outputIndex);
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  if (offset < 0 || offset + length > bytes.length) return '';
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(bytes[offset + index]);
  }
  return value;
}

function readUint32(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > bytes.length) return 0;
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function readUint16(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 2 > bytes.length) return 0;
  return (bytes[offset] | (bytes[offset + 1] << 8)) >>> 0;
}

/**
 * Duration of a base64 WAV payload in milliseconds.
 *
 * Returns null when the payload is not a readable WAV container or when the
 * header does not describe a usable sample format. Callers must treat null as
 * "duration unknown" and fall back to an estimate.
 */
export function wavDurationMs(base64: string): number | null {
  if (!base64) return null;

  const bytes = decodeBase64ToBytes(base64);
  if (bytes.length < 44) return null;
  if (readAscii(bytes, 0, 4) !== 'RIFF' || readAscii(bytes, 8, 4) !== 'WAVE') {
    return null;
  }

  let byteRate = 0;
  let dataSize = 0;
  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const chunkId = readAscii(bytes, offset, 4);
    const chunkSize = readUint32(bytes, offset + 4);
    const body = offset + 8;

    if (chunkId === 'fmt ') {
      const channels = readUint16(bytes, body + 2);
      const sampleRate = readUint32(bytes, body + 4);
      byteRate = readUint32(bytes, body + 8);
      if (!byteRate) {
        const bitsPerSample = readUint16(bytes, body + 14);
        byteRate = sampleRate * Math.max(1, channels) * Math.max(1, Math.floor(bitsPerSample / 8));
      }
    } else if (chunkId === 'data') {
      dataSize = chunkSize;
    }

    if (chunkSize === 0) break;
    offset = body + chunkSize + (chunkSize % 2);
  }

  if (!byteRate || !dataSize) return null;
  if (dataSize === 0xffffffff) return null;

  const durationMs = (dataSize / byteRate) * 1000;
  if (!Number.isFinite(durationMs) || durationMs <= 0) return null;
  return Math.round(durationMs);
}

interface WavLayout {
  bytes: Uint8Array;
  audioFormat: number;
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  dataOffset: number;
  dataSize: number;
}

function readWavLayout(base64: string): WavLayout | null {
  const bytes = decodeBase64ToBytes(base64);
  if (bytes.length < 44) return null;
  if (readAscii(bytes, 0, 4) !== 'RIFF' || readAscii(bytes, 8, 4) !== 'WAVE') return null;

  let audioFormat = 1;
  let channels = 1;
  let sampleRate = 24000;
  let bitsPerSample = 16;
  let dataOffset = 0;
  let dataSize = 0;
  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const chunkId = readAscii(bytes, offset, 4);
    const chunkSize = readUint32(bytes, offset + 4);
    const body = offset + 8;

    if (chunkId === 'fmt ') {
      audioFormat = readUint16(bytes, body);
      channels = readUint16(bytes, body + 2) || 1;
      sampleRate = readUint32(bytes, body + 4) || 24000;
      bitsPerSample = readUint16(bytes, body + 14) || 16;
    } else if (chunkId === 'data') {
      dataOffset = body;
      dataSize = Math.min(chunkSize, bytes.length - body);
    }

    if (chunkSize === 0) break;
    offset = body + chunkSize + (chunkSize % 2);
  }

  if (!dataOffset || !dataSize) return null;
  return { bytes, audioFormat, channels, sampleRate, bitsPerSample, dataOffset, dataSize };
}

function encodeBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    output += alphabet[a >> 2];
    output += alphabet[((a & 3) << 4) | ((b ?? 0) >> 4)];
    output += b === undefined ? '=' : alphabet[((b & 15) << 2) | ((c ?? 0) >> 6)];
    output += c === undefined ? '=' : alphabet[c & 63];
  }
  return output;
}

function buildWav(
  layout: Omit<WavLayout, 'bytes' | 'dataOffset' | 'dataSize'>,
  samples: Uint8Array
): string {
  const header = new Uint8Array(44);
  const writeAscii = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      header[offset + index] = value.charCodeAt(index);
    }
  };
  const writeUint32 = (offset: number, value: number) => {
    header[offset] = value & 0xff;
    header[offset + 1] = (value >> 8) & 0xff;
    header[offset + 2] = (value >> 16) & 0xff;
    header[offset + 3] = (value >> 24) & 0xff;
  };
  const writeUint16 = (offset: number, value: number) => {
    header[offset] = value & 0xff;
    header[offset + 1] = (value >> 8) & 0xff;
  };

  const byteRate = (layout.sampleRate * layout.channels * layout.bitsPerSample) / 8;
  writeAscii(0, 'RIFF');
  writeUint32(4, 36 + samples.length);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  writeUint32(16, 16);
  writeUint16(20, layout.audioFormat);
  writeUint16(22, layout.channels);
  writeUint32(24, layout.sampleRate);
  writeUint32(28, byteRate);
  writeUint16(32, (layout.channels * layout.bitsPerSample) / 8);
  writeUint16(34, layout.bitsPerSample);
  writeAscii(36, 'data');
  writeUint32(40, samples.length);

  const output = new Uint8Array(44 + samples.length);
  output.set(header, 0);
  output.set(samples, 44);
  return encodeBase64(output);
}

/**
 * Cut a wav payload into pieces at the given offsets.
 *
 * The clip is cut so the first piece can be played while the rest is still on
 * its way. The cut points are estimates, so the pieces are approximate, but
 * they are real audio from one synthesis and they play back to back.
 *
 * Returns null when the payload is not a wav this can cut.
 */
export function splitWavBase64(base64: string, offsetsMs: number[]): string[] | null {
  const layout = readWavLayout(base64);
  if (!layout) return null;
  if (layout.audioFormat !== 1) return null;
  if (layout.bitsPerSample % 8 !== 0) return null;

  const bytesPerFrame = (layout.channels * layout.bitsPerSample) / 8;
  if (bytesPerFrame <= 0) return null;

  const totalFrames = layout.dataSize / bytesPerFrame;
  const totalMs = (totalFrames / layout.sampleRate) * 1000;
  const points = [...new Set(offsetsMs.filter(value => value > 0 && value < totalMs))]
    .sort((a, b) => a - b);
  if (points.length === 0) return null;

  const pieces: string[] = [];
  let startFrame = 0;

  for (const point of points) {
    const endFrame = Math.min(totalFrames, Math.round((point / totalMs) * totalFrames));
    if (endFrame <= startFrame) continue;
    const from = startFrame * bytesPerFrame;
    const to = endFrame * bytesPerFrame;
    pieces.push(
      buildWav(
        {
          audioFormat: layout.audioFormat,
          channels: layout.channels,
          sampleRate: layout.sampleRate,
          bitsPerSample: layout.bitsPerSample,
        },
        layout.bytes.subarray(layout.dataOffset + from, layout.dataOffset + to)
      )
    );
    startFrame = endFrame;
  }

  if (startFrame * bytesPerFrame >= layout.dataSize) return null;

  pieces.push(
    buildWav(
      {
        audioFormat: layout.audioFormat,
        channels: layout.channels,
        sampleRate: layout.sampleRate,
        bitsPerSample: layout.bitsPerSample,
      },
      layout.bytes.subarray(layout.dataOffset + startFrame * bytesPerFrame, layout.dataOffset + layout.dataSize)
    )
  );

  return pieces.length > 1 ? pieces : null;
}
