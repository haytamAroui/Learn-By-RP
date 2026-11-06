import { describe, expect, it } from 'vitest';
import { decodeBase64ToBytes, splitWavBase64, wavDurationMs } from './audioTiming';

function buildWav(sampleRateHz: number, channels: number, bitsPerSample: number, frames: number): string {
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;
  const dataSize = frames * blockAlign;
  const buffer = new Uint8Array(44 + dataSize);

  const writeAscii = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      buffer[offset + index] = value.charCodeAt(index);
    }
  };
  const writeUint32 = (offset: number, value: number) => {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >> 8) & 0xff;
    buffer[offset + 2] = (value >> 16) & 0xff;
    buffer[offset + 3] = (value >> 24) & 0xff;
  };
  const writeUint16 = (offset: number, value: number) => {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >> 8) & 0xff;
  };

  writeAscii(0, 'RIFF');
  writeUint32(4, 36 + dataSize);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  writeUint32(16, 16);
  writeUint16(20, 1);
  writeUint16(22, channels);
  writeUint32(24, sampleRateHz);
  writeUint32(28, sampleRateHz * blockAlign);
  writeUint16(32, blockAlign);
  writeUint16(34, bitsPerSample);
  writeAscii(36, 'data');
  writeUint32(40, dataSize);

  let binary = '';
  for (let index = 0; index < buffer.length; index += 1) {
    binary += String.fromCharCode(buffer[index]);
  }
  return btoa(binary);
}

describe('base64 decoding', () => {
  it('decodes a known payload', () => {
    const bytes = decodeBase64ToBytes('aGVsbG8=');
    expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111]);
  });

  it('ignores whitespace and padding', () => {
    const bytes = decodeBase64ToBytes('aGVs\nbG8=');
    expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111]);
  });

  it('returns an empty array for an empty payload', () => {
    expect(decodeBase64ToBytes('').length).toBe(0);
  });
});

describe('wav duration', () => {
  it('measures the length of a wav payload', () => {
    const wav = buildWav(24000, 1, 16, 24000);
    expect(wavDurationMs(wav)).toBe(1000);
  });

  it('measures stereo payloads', () => {
    const wav = buildWav(24000, 2, 16, 24000);
    expect(wavDurationMs(wav)).toBe(1000);
  });

  it('returns null for a payload that is not a wav container', () => {
    expect(wavDurationMs('aGVsbG8gd29ybGQ=')).toBeNull();
  });

  it('returns null for an empty payload', () => {
    expect(wavDurationMs('')).toBeNull();
  });

  it('returns null when the header describes no data', () => {
    const wav = buildWav(24000, 1, 16, 0);
    expect(wavDurationMs(wav)).toBeNull();
  });
});

describe('wav splitting', () => {
  it('cuts a clip into pieces that cover the whole line', () => {
    const wav = buildWav(24000, 1, 16, 48000);
    const pieces = splitWavBase64(wav, [1000]);

    expect(pieces).not.toBeNull();
    expect(pieces!.length).toBe(2);
    expect(wavDurationMs(pieces![0])).toBe(1000);
    expect(wavDurationMs(pieces![1])).toBe(1000);
  });

  it('cuts at several points', () => {
    const wav = buildWav(24000, 1, 16, 48000);
    const pieces = splitWavBase64(wav, [500, 1500]);

    expect(pieces!.length).toBe(3);
    expect(wavDurationMs(pieces![0])).toBe(500);
    expect(wavDurationMs(pieces![1])).toBe(1000);
    expect(wavDurationMs(pieces![2])).toBe(500);
  });

  it('ignores points outside the clip', () => {
    const wav = buildWav(24000, 1, 16, 48000);
    const pieces = splitWavBase64(wav, [0, 1000, 9000]);
    expect(pieces!.length).toBe(2);
  });

  it('refuses a payload that is not a wav', () => {
    expect(splitWavBase64('aGVsbG8gd29ybGQ=', [100])).toBeNull();
  });

  it('refuses a clip with no cut point', () => {
    const wav = buildWav(24000, 1, 16, 48000);
    expect(splitWavBase64(wav, [])).toBeNull();
  });
});
