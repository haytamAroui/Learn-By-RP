import { Platform, Share } from 'react-native';
import { File, Paths, Directory, EncodingType } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Writes text to a shareable file and opens the native share sheet.
 * On web this falls back to the Web Share API, then to a download.
 */
export async function shareTextFile(
  fileName: string,
  contents: string,
  mimeType = 'text/plain'
): Promise<{ ok: boolean; message?: string }> {
  if (Platform.OS === 'web') {
    return shareOnWeb(fileName, contents, mimeType);
  }

  try {
    const exportsDir = new Directory(Paths.cache, 'exports');
    if (!exportsDir.exists) {
      exportsDir.create({ intermediates: true });
    }

    const file = new File(exportsDir, fileName);
    if (file.exists) {
      file.delete();
    }
    file.create();
    file.write(contents, { encoding: EncodingType.UTF8 });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType,
        dialogTitle: fileName,
        UTI: 'public.plain-text',
      });
      return { ok: true };
    }

    await Share.share({ message: contents, title: fileName });
    return { ok: true };
  } catch (e) {
    console.error('Failed to share text file', e);
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

// Minimal shapes for the browser globals used on web, declared locally so the
// project does not need the full DOM lib in tsconfig.
interface WebShareNavigator {
  share?: (data: { title?: string; text?: string }) => Promise<void>;
}

interface WebDocument {
  createElement: (tag: 'a') => {
    href: string;
    download: string;
    click: () => void;
  };
}

interface WebGlobal {
  navigator?: WebShareNavigator;
  document?: WebDocument;
  Blob?: new (parts: string[], options: { type: string }) => unknown;
  URL?: {
    createObjectURL: (blob: unknown) => string;
    revokeObjectURL: (url: string) => void;
  };
}

async function shareOnWeb(
  fileName: string,
  contents: string,
  mimeType: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const web = globalThis as unknown as WebGlobal;

    if (typeof web.navigator?.share === 'function') {
      await web.navigator.share({ title: fileName, text: contents });
      return { ok: true };
    }

    if (!web.Blob || !web.URL || !web.document) {
      return { ok: false, message: 'Sharing is not available in this browser.' };
    }

    const blob = new web.Blob([contents], { type: `${mimeType};charset=utf-8` });
    const url = web.URL.createObjectURL(blob);
    const link = web.document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    web.URL.revokeObjectURL(url);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
