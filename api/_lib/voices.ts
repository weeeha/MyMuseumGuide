/**
 * ElevenLabs voice selection. One multilingual default voice in v1
 * ("Rachel", a premade voice); per-language overrides slot in here as the
 * voice direction matures (spec open question — one voice per language).
 */
export const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export const VOICE_BY_LANG: Partial<Record<string, string>> = {};

export function voiceFor(lang: string): string {
  return VOICE_BY_LANG[lang] ?? DEFAULT_VOICE_ID;
}
