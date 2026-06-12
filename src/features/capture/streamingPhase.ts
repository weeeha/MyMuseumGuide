import { nanoid } from 'nanoid';
import type { ArtifactMeta, StreamExtras } from '../../domain/aiEvents';
import type { ArtifactInfo, FollowUp } from '../../domain/types';

export interface StreamingPhase {
  photoDataUrl: string;
  entryId: string;
  meta: ArtifactMeta | null;
  summary: string;
  story: string;
  tags: string[];
  followUps: Omit<FollowUp, 'id'>[];
}

export type StreamUiEvent =
  | { type: 'meta'; meta: ArtifactMeta }
  | { type: 'summary'; text: string }
  | { type: 'delta'; text: string }
  | { type: 'extras'; extras: StreamExtras };

export function initialStreaming(
  photoDataUrl: string,
  entryId: string,
): StreamingPhase {
  return {
    photoDataUrl,
    entryId,
    meta: null,
    summary: '',
    story: '',
    tags: [],
    followUps: [],
  };
}

export function applyStreamEvent(
  phase: StreamingPhase,
  event: StreamUiEvent,
): StreamingPhase {
  switch (event.type) {
    case 'meta':
      return { ...phase, meta: event.meta };
    case 'summary':
      return { ...phase, summary: event.text };
    case 'delta':
      return { ...phase, story: phase.story + event.text };
    case 'extras':
      return { ...phase, tags: event.extras.tags, followUps: event.extras.followUps };
  }
}

/** Partial ArtifactInfo for rendering mid-stream. */
export function previewArtifact(phase: StreamingPhase): ArtifactInfo {
  return {
    id: phase.entryId,
    title: phase.meta?.title ?? 'Looking closely…',
    artist: phase.meta?.artist,
    period: phase.meta?.period,
    origin: phase.meta?.origin,
    medium: phase.meta?.medium,
    summary: phase.summary,
    story: phase.story,
    tags: phase.tags,
    followUps: [],
  };
}

export function finalizeArtifact(
  phase: StreamingPhase,
  narrativeId: string,
): ArtifactInfo {
  return {
    ...previewArtifact(phase),
    narrativeId,
    followUps: phase.followUps.map((f) => ({ ...f, id: nanoid() })) as FollowUp[],
  };
}
