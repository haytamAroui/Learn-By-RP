/**
 * Loading a bundled avatar asset into bytes.
 *
 * A glTF binary is loaded whole and parsed in memory. On a device the file is
 * read through the file system; on the web it is fetched.
 */
export async function loadAvatarBytes(uri: string): Promise<ArrayBuffer> {
  const { File } = await import('expo-file-system');
  const file = new File(uri);
  return file.arrayBuffer();
}
