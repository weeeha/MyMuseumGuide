import type { ArtifactInfo, CaptureRequest, Museum } from '../../domain/types';
import { mockIdentifyArtifact, mockParseFloorPlan } from './mock';

/**
 * Thin client for the backend AI API. Phase 2 returns mocked data so the
 * full UI loop is buildable; Phase 3 swaps these implementations to
 * fetch('/api/v1/identify') etc. against the Cloudflare Workers backend.
 */
export const aiClient = {
  parseFloorPlan: async (
    photoDataUrl: string,
    museum: Museum,
  ): Promise<{ topics: string[] }> => {
    return mockParseFloorPlan(photoDataUrl, museum);
  },

  identifyArtifact: async (req: CaptureRequest): Promise<ArtifactInfo> => {
    return mockIdentifyArtifact(req);
  },
};
