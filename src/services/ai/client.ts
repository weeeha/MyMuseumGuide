import type { CaptureRequest, Museum } from '../../domain/types';
import { identifyArtifactStream, type IdentifyEvents } from './identify';
import { mockIdentifyStream, mockParseFloorPlan } from './mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_AI === 'true';

/**
 * Client seam for the backend AI API (spec §5.1). identify streams against
 * /api/identify (R1); floor-plan parsing stays mocked until R3's plan-visit.
 * Set VITE_USE_MOCK_AI=true for backend-less UI development.
 */
export const aiClient = {
  parseFloorPlan: async (
    photoDataUrl: string,
    museum: Museum,
  ): Promise<{ topics: string[] }> => {
    return mockParseFloorPlan(photoDataUrl, museum);
  },

  identifyStream: (req: CaptureRequest, events: IdentifyEvents): Promise<void> =>
    USE_MOCK ? mockIdentifyStream(req, events) : identifyArtifactStream(req, events),
};
