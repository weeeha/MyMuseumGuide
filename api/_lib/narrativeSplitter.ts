export interface SplitterHandlers {
  onSummary(text: string): void;
  onDelta(text: string): void;
}

export interface SplitResult {
  summary: string;
  story: string;
  tags: string[];
  followUps: { prompt: string; kind: string }[];
}

const DELIM = '\n###\n';

/**
 * Incremental parser for the narrative model's contract:
 *   summary \n###\n story (streamed) \n###\n extras-JSON
 * Story text is forwarded as deltas as it arrives; while inside the story
 * section we hold back the last DELIM.length-1 chars so a delimiter split
 * across chunks is never leaked into the story.
 */
export function createNarrativeSplitter(handlers: SplitterHandlers) {
  let section: 0 | 1 | 2 = 0;
  let buf = '';
  let summary = '';
  let story = '';

  const emitStory = (text: string) => {
    if (!text) return;
    story += text;
    handlers.onDelta(text);
  };

  return {
    push(chunk: string): void {
      buf += chunk;
      for (;;) {
        if (section === 2) return; // extras buffer to end()
        const i = buf.indexOf(DELIM);
        if (i === -1) {
          if (section === 1) {
            const safe = buf.length - (DELIM.length - 1);
            if (safe > 0) {
              emitStory(buf.slice(0, safe));
              buf = buf.slice(safe);
            }
          }
          return;
        }
        const head = buf.slice(0, i);
        buf = buf.slice(i + DELIM.length);
        if (section === 0) {
          summary = head.trim();
          handlers.onSummary(summary);
          section = 1;
        } else {
          emitStory(head);
          section = 2;
        }
      }
    },
    end(): SplitResult {
      let tags: string[] = [];
      let followUps: { prompt: string; kind: string }[] = [];
      if (section === 0) {
        summary = buf.trim();
        if (summary) handlers.onSummary(summary);
      } else if (section === 1) {
        emitStory(buf);
      } else {
        const raw = buf.trim().replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<SplitResult>;
            if (Array.isArray(parsed.tags)) tags = parsed.tags;
            if (Array.isArray(parsed.followUps)) followUps = parsed.followUps;
          } catch {
            // Extras are best-effort decoration; a malformed tail must not
            // sink a narrative the user already heard.
          }
        }
      }
      buf = '';
      return { summary, story: story.trim(), tags, followUps };
    },
  };
}
