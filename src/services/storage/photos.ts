import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

const STORAGE_DIR = Directory.Data;

export const journeyPhotoPath = (entryId: string): string =>
  `journey/${entryId}.jpg`;

export const floorPlanPhotoPath = (planId: string): string =>
  `floorplans/${planId}.jpg`;

function stripDataUrlPrefix(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  return comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function savePhoto(
  relativePath: string,
  dataUrl: string,
): Promise<void> {
  await Filesystem.writeFile({
    path: relativePath,
    directory: STORAGE_DIR,
    data: stripDataUrlPrefix(dataUrl),
    recursive: true,
  });
}

export async function resolvePhotoSrc(relativePath: string): Promise<string> {
  if (Capacitor.getPlatform() === 'web') {
    const { data } = await Filesystem.readFile({
      path: relativePath,
      directory: STORAGE_DIR,
    });
    const base64 = typeof data === 'string' ? data : await blobToBase64(data);
    return `data:image/jpeg;base64,${base64}`;
  }
  const { uri } = await Filesystem.getUri({
    path: relativePath,
    directory: STORAGE_DIR,
  });
  return Capacitor.convertFileSrc(uri);
}

export async function deletePhoto(relativePath: string): Promise<void> {
  try {
    await Filesystem.deleteFile({
      path: relativePath,
      directory: STORAGE_DIR,
    });
  } catch {
    // Best-effort: callers should still be able to remove the index entry
    // even if the file is already gone (uninstall / partial state).
  }
}

export async function clearPhotoDir(dirPath: string): Promise<void> {
  try {
    await Filesystem.rmdir({
      path: dirPath,
      directory: STORAGE_DIR,
      recursive: true,
    });
  } catch {
    // Directory may not exist yet on a fresh install.
  }
}
