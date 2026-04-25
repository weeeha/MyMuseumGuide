import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface CapturedPhoto {
  dataUrl: string;
  format: string;
}

/**
 * Capture a photo. On native iOS this opens the action sheet (Camera /
 * Photos / Choose File); in web dev it falls back to a file picker.
 */
export async function takePhoto(): Promise<CapturedPhoto | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      promptLabelHeader: 'Photo',
      promptLabelPhoto: 'Choose from library',
      promptLabelPicture: 'Take photo',
    });
    if (!photo.dataUrl) return null;
    return { dataUrl: photo.dataUrl, format: photo.format };
  } catch (err) {
    // User cancelled or permission denied.
    if (err instanceof Error && /cancel/i.test(err.message)) return null;
    throw err;
  }
}
