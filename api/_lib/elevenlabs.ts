import { requireEnv } from './env';

/** Stream MP3 from ElevenLabs (spec §5.2 — Turbo family, streamed). */
export async function synthElevenLabs(
  text: string,
  voiceId: string,
  lang: string,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': requireEnv('ELEVENLABS_API_KEY'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        language_code: lang,
      }),
    },
  );
  if (!res.ok || !res.body) {
    throw new Error(`ElevenLabs TTS failed: ${res.status}`);
  }
  return res.body;
}
