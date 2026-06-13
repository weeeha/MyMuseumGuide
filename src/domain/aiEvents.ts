import type { FollowUp } from './types';

/** Stage-1 identification facts, sent as the first SSE event. */
export interface ArtifactMeta {
  title: string;
  artist?: string;
  period?: string;
  origin?: string;
  medium?: string;
}

export interface StreamExtras {
  tags: string[];
  followUps: Omit<FollowUp, 'id'>[];
}

export interface StreamDone {
  narrativeId: string;
  cached: boolean;
}
