export type Language =
  | 'en'
  | 'fr'
  | 'es'
  | 'de'
  | 'it'
  | 'pt'
  | 'ru'
  | 'uk'
  | 'ja'
  | 'zh';

export const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'uk', label: 'Ukrainian', native: 'Українська' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'zh', label: 'Chinese', native: '中文' },
];

export type Level = 'curious' | 'informed' | 'scholarly';

export const LEVELS: { id: Level; label: string; blurb: string }[] = [
  { id: 'curious', label: 'Curious', blurb: 'Friendly intro, no jargon.' },
  { id: 'informed', label: 'Informed', blurb: 'Context, technique, history.' },
  { id: 'scholarly', label: 'Scholarly', blurb: 'Deep references and debates.' },
];

export const INTERESTS = [
  'Antiquity',
  'Medieval',
  'Renaissance',
  'Baroque',
  'Impressionism',
  'Modern Art',
  'Contemporary',
  'Sculpture',
  'Photography',
  'Decorative Arts',
  'Indigenous Art',
  'Asian Art',
  'African Art',
] as const;

export type Interest = (typeof INTERESTS)[number];

export interface UserProfile {
  language: Language;
  level: Level;
  interests: Interest[];
  credits: number;
  plan: 'free' | 'monthly' | 'annual';
}

export interface Museum {
  id: string;
  name: string;
  city: string;
  country: string;
  cover?: string;
  topics?: string[];
  theme?: MuseumTheme;
}

/** Per-museum design tokens (spec §6.2). */
export interface MuseumTheme {
  accent: string;
  onAccent: string;
  surfaceTint: string;
  canvas: 'warm' | 'cool' | 'stone';
  titleFont: 'serif' | 'sans';
}

export interface FloorPlan {
  id: string;
  museumId: string;
  imagePath: string;
  detectedTopics?: string[];
  capturedAt: string;
}

export interface ArtifactInfo {
  id: string;
  title: string;
  artist?: string;
  period?: string;
  origin?: string;
  medium?: string;
  summary: string;
  story: string;
  tags: string[];
  followUps: FollowUp[];
  /** Server-side narrative cache id — keys TTS and (R2) conversation. */
  narrativeId?: string;
}

export interface FollowUp {
  id: string;
  prompt: string;
  kind: 'artist' | 'movement' | 'technique' | 'related';
}

export interface JourneyEntry {
  id: string;
  museumId: string;
  museumName: string;
  capturedAt: string;
  photoPath: string;
  artifact: ArtifactInfo;
  audioUrl?: string;
  notes?: string;
}

export interface CaptureRequest {
  photoDataUrl: string;
  museum?: Museum;
  language: Language;
  level: Level;
  interests: Interest[];
}
