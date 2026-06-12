import { createSseParser } from './sse';

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
});
