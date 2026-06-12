export interface ArtifactMeta {
  title: string;
  artist?: string;
  period?: string;
  origin?: string;
  medium?: string;
}

export interface IdentifyRequestBody {
  photoDataUrl: string;
  museumId?: string;
  museumName?: string;
  language: string;
  level: string;
}
