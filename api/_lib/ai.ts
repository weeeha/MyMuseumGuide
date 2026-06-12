import { generateText, streamText } from 'ai';
import type { ArtifactMeta } from './identifyTypes';
import { identifyPrompt, narrativePrompt, type NarrativeInput } from './prompts';

/**
 * Model strings route through the Vercel AI Gateway (spec §5.2): one key,
 * fallbacks and observability configured in the gateway dashboard.
 *
 * NOTE: The plan draft used 'anthropic/claude-haiku-4-5' (dash) but the actual
 * GatewayModelId type registers 'anthropic/claude-haiku-4.5' (dot). Using the
 * canonical registered string so typecheck passes and routing is correct.
 */
const IDENTIFY_MODEL = 'anthropic/claude-haiku-4.5';
const NARRATIVE_MODEL = 'anthropic/claude-fable-5';

export async function stageOne(input: {
  photoDataUrl: string;
  context: string;
}): Promise<ArtifactMeta> {
  const { text } = await generateText({
    model: IDENTIFY_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', image: input.photoDataUrl },
          { type: 'text', text: identifyPrompt(input.context) },
        ],
      },
    ],
  });
  const raw = text
    .trim()
    .replace(/^```(?:json)?/, '')
    .replace(/```$/, '')
    .trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error('Could not identify the artwork — try including the wall label');
  }
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  return {
    title: str(parsed.title) ?? 'Unidentified artwork',
    artist: str(parsed.artist),
    period: str(parsed.period),
    origin: str(parsed.origin),
    medium: str(parsed.medium),
  };
}

export async function* narrativeStream(input: NarrativeInput): AsyncIterable<string> {
  const result = streamText({
    model: NARRATIVE_MODEL,
    prompt: narrativePrompt(input),
  });
  for await (const chunk of result.textStream) {
    yield chunk;
  }
}
