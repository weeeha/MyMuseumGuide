import type { ArtifactMeta } from './identifyTypes';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  uk: 'Ukrainian',
  ja: 'Japanese',
  zh: 'Chinese',
};

const LEVEL_NOTES: Record<string, string> = {
  curious: 'a curious first-timer: warm, vivid, zero jargon',
  informed: 'an informed amateur: context, technique, and history welcome',
  scholarly: 'a scholarly visitor: references, debates, and precision welcome',
};

export function identifyPrompt(context: string): string {
  return [
    'You are the identification stage of a museum guide. Look at the photo of',
    'an artwork or museum object. If a wall label is visible, read it and',
    'trust it over visual guessing.',
    context ? `Museum context: ${context}` : '',
    'Reply with STRICT JSON only — no prose, no code fences — exactly:',
    '{"title": string, "artist": string|null, "period": string|null,',
    ' "origin": string|null, "medium": string|null}',
    'If you cannot identify the specific work, give your best honest generic',
    'title (e.g. "Roman marble torso") rather than inventing a famous one.',
  ]
    .filter(Boolean)
    .join('\n');
}

export interface NarrativeInput {
  meta: ArtifactMeta;
  context: string;
  language: string;
  level: string;
  museumName?: string;
}

export function narrativePrompt(input: NarrativeInput): string {
  const language = LANGUAGE_NAMES[input.language] ?? 'English';
  const levelNote = LEVEL_NOTES[input.level] ?? LEVEL_NOTES.curious;
  const facts = [
    `Title: ${input.meta.title}`,
    input.meta.artist && `Artist: ${input.meta.artist}`,
    input.meta.period && `Period: ${input.meta.period}`,
    input.meta.origin && `Origin: ${input.meta.origin}`,
    input.meta.medium && `Medium: ${input.meta.medium}`,
    input.museumName && `Seen at: ${input.museumName}`,
  ]
    .filter(Boolean)
    .join('\n');

  return [
    'You are MuseumLover, an in-ear museum guide. A visitor is standing in',
    'front of this work right now. Write what you would say to them.',
    '',
    `Write entirely in ${language}. Your listener is ${input.level} level —`,
    `${levelNote}.`,
    '',
    facts,
    input.context ? `\nMuseum context: ${input.context}` : '',
    '',
    'OUTPUT FORMAT — exactly three sections separated by a line containing',
    'only ### :',
    '',
    'First section: one vivid sentence that makes them look closer (this is',
    'read aloud first).',
    '###',
    'Second section: the story — 3 to 5 short paragraphs. Who made it, when,',
    'why it matters, and the one human detail that makes it stick. Spoken',
    'register, no headings, no lists. End the final paragraph with one short',
    'spoken invitation to ask a follow-up question (e.g. "If you want to know',
    'why the critics hated it — just ask.").',
    '###',
    'Third section: STRICT JSON, no code fences:',
    '{"tags": [3-5 short topic tags in English],',
    ' "followUps": [{"prompt": question in ' + language + ', "kind": "artist"|"movement"|"technique"|"related"}, …exactly 3]}',
  ].join('\n');
}
