/** Largest edge we send to the backend (spec §5.1 — guardrails). */
export const MAX_UPLOAD_EDGE = 1280;

export function computeTargetSize(
  width: number,
  height: number,
  maxEdge = MAX_UPLOAD_EDGE,
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width, height };
  const scale = maxEdge / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode captured image'));
    img.src = dataUrl;
  });
}

/**
 * Downscale a data-URL photo so its long edge is ≤ maxEdge. Returns the
 * original data URL when it is already small enough or when canvas is
 * unavailable (we never block a capture on resizing).
 */
export async function downscaleDataUrl(
  dataUrl: string,
  maxEdge = MAX_UPLOAD_EDGE,
  quality = 0.82,
): Promise<string> {
  try {
    const img = await loadImage(dataUrl);
    const { width, height } = computeTargetSize(
      img.naturalWidth,
      img.naturalHeight,
      maxEdge,
    );
    if (width === img.naturalWidth && height === img.naturalHeight) {
      return dataUrl;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return dataUrl;
  }
}
