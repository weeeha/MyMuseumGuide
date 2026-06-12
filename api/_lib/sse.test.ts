import { sseEvent } from './sse';

describe('sseEvent', () => {
  it('encodes an event frame with JSON data', () => {
    expect(sseEvent('meta', { title: 'X' })).toBe(
      'event: meta\ndata: {"title":"X"}\n\n',
    );
  });
});
