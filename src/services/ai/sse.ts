export interface SseParser {
  push(chunk: string): void;
  end(): void;
}

/**
 * Minimal SSE parser. Buffers partial frames across pushes; emits
 * (event, data) per complete frame. Multi-line data is joined with \n
 * per the SSE spec.
 */
export function createSseParser(
  onEvent: (event: string, data: string) => void,
): SseParser {
  let buffer = '';

  const flushBlock = (block: string) => {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
    }
    if (dataLines.length > 0) onEvent(event, dataLines.join('\n'));
  };

  return {
    push(chunk) {
      buffer += chunk.replace(/\r\n/g, '\n');
      let idx = buffer.indexOf('\n\n');
      while (idx !== -1) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (block.trim()) flushBlock(block);
        idx = buffer.indexOf('\n\n');
      }
    },
    end() {
      if (buffer.trim()) flushBlock(buffer);
      buffer = '';
    },
  };
}

/** Drain a fetch Response body through the SSE parser. */
export async function readSse(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: string, data: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser(onEvent);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.push(decoder.decode(value, { stream: true }));
  }
  parser.push(decoder.decode());
  parser.end();
}
