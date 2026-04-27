import { useEffect, useState } from 'react';
import { resolvePhotoSrc } from '../services/storage/photos';

export function useResolvedPhotoSrc(
  path: string | null | undefined,
): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    setSrc(null);
    resolvePhotoSrc(path)
      .then((resolved) => {
        if (!cancelled) setSrc(resolved);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return src;
}
