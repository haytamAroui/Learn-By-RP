/**
 * Loading a bundled avatar asset into bytes.
 *
 * The web build reads the asset over HTTP, so the same module works in a
 * browser and in a device bundle.
 */
export async function loadAvatarBytes(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Avatar asset could not be loaded (${response.status})`);
  }
  return response.arrayBuffer();
}
