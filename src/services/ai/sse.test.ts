import { createSseParser, readSse } from './sse';

describe('createSseParser', () => {
  it('parses a single complete event', () => {
    const events: [string, string][] = [];
    const p = createSseParser((e, d) => events.push([e, d]));
    p.push('event: meta\ndata: {"title":"Sunrise"}\n\n');
    p.end();
    expect(events).toEqual([['meta', '{"title":"Sunrise"}']]);
  });

  it('handles events split across pushes at arbitrary boundaries', () => {
    const events: [string, string][] = [];
    const p = createSseParser((e, d) => events.push([e, d]));
    p.push('event: del');
    p.push('ta\ndata: {"text":"he');
    p.push('llo"}\n');
    p.push('\nevent: done\ndata: {}\n\n');
    p.end();
    expect(events).toEqual([
      ['delta', '{"text":"hello"}'],
      ['done', '{}'],
    ]);
  });

  it('defaults the event name to "message" when absent', () => {
    const events: [string, string][] = [];
    const p = createSseParser((e, d) => events.push([e, d]));
    p.push('data: plain\n\n');
    p.end();
    expect(events).toEqual([['message', 'plain']]);
  });

  it('tolerates CRLF line endings from normalizing proxies', () => {
    const events: [string, string][] = [];
    const p = createSseParser((e, d) => events.push([e, d]));
    p.push('event: meta\r\ndata: {"x":1}\r\n\r\n');
    p.end();
    expect(events).toEqual([['meta', '{"x":1}']]);
  });
});

describe('readSse', () => {
  it('decodes a stream of Uint8Array chunks end-to-end', async () => {
    const enc = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode('event: meta\ndata: {"x":1}\n\n'));
        c.close();
      },
    });
    const events: [string, string][] = [];
    await readSse(body, (e, d) => events.push([e, d]));
    expect(events).toEqual([['meta', '{"x":1}']]);
  });
});
