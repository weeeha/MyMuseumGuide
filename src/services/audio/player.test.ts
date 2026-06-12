import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NarrationPlayer } from './player';

class FakeAudio {
  static instances: FakeAudio[] = [];
  src: string;
  paused = true;
  preload = '';
  private handlers = new Map<string, () => void>();
  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }
  addEventListener(name: string, fn: () => void) {
    this.handlers.set(name, fn);
  }
  fire(name: string) {
    this.handlers.get(name)?.();
  }
  async play() {
    this.paused = false;
    this.fire('playing');
  }
  pause() {
    this.paused = true;
    this.fire('pause');
  }
  removeAttribute() {
    this.src = '';
  }
  load() {}
}

describe('NarrationPlayer', () => {
  beforeEach(() => {
    FakeAudio.instances = [];
    vi.stubGlobal('Audio', FakeAudio as unknown as typeof Audio);
    return undefined;
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('transitions idle → loading → playing on play()', async () => {
    const player = new NarrationPlayer();
    const states: string[] = [];
    player.subscribe((s) => states.push(s));
    await player.play('/api/tts?nid=n1', { title: 'Sunrise' });
    expect(states).toEqual(['idle', 'loading', 'playing']);
  });

  it('toggle pauses and resumes', async () => {
    const player = new NarrationPlayer();
    await player.play('/api/tts?nid=n1', { title: 'Sunrise' });
    player.toggle();
    expect(FakeAudio.instances[0].paused).toBe(true);
    player.toggle();
    expect(FakeAudio.instances[0].paused).toBe(false);
  });

  it('ended returns the player to idle', async () => {
    const player = new NarrationPlayer();
    const states: string[] = [];
    player.subscribe((s) => states.push(s));
    await player.play('/api/tts?nid=n1', { title: 'Sunrise' });
    FakeAudio.instances[0].fire('ended');
    expect(states.at(-1)).toBe('idle');
  });

  it('resets to idle when play() rejects (iOS autoplay policy)', async () => {
    const player = new NarrationPlayer();
    vi.spyOn(FakeAudio.prototype, 'play').mockRejectedValueOnce(
      new Error('NotAllowedError'),
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const states: string[] = [];
    player.subscribe((s) => states.push(s));
    await player.play('/api/tts?nid=n1', { title: 'Sunrise' });
    expect(states).toEqual(['idle', 'loading', 'idle']);
    warnSpy.mockRestore();
  });
});
