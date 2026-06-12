import { resolveApiUrl } from '../ai/identify';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused';
type Listener = (state: PlayerState) => void;

export interface NowPlayingMeta {
  title: string;
  artist?: string;
  museumName?: string;
}

/**
 * Single app-wide narration player. HTML5 audio streams the MP3 (playback
 * starts before the file completes); Media Session metadata gives lock-screen
 * controls where the platform supports it. The iOS background-audio
 * entitlement (UIBackgroundModes) lands with `npx cap add ios` in R4 —
 * until then, background playback works in browser contexts only.
 */
export class NarrationPlayer {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  private state: PlayerState = 'idle';

  private setState(state: PlayerState) {
    this.state = state;
    this.listeners.forEach((l) => l(state));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): PlayerState {
    return this.state;
  }

  async play(url: string, meta: NowPlayingMeta): Promise<void> {
    this.stop();
    const audio = new Audio(resolveApiUrl(url));
    this.audio = audio;
    audio.preload = 'auto';
    this.setState('loading');
    audio.addEventListener('playing', () => this.setState('playing'));
    audio.addEventListener('pause', () => {
      if (this.state !== 'idle') this.setState('paused');
    });
    audio.addEventListener('ended', () => this.setState('idle'));
    audio.addEventListener('error', () => this.setState('idle'));

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: meta.title,
        artist: meta.artist ?? '',
        album: meta.museumName ?? 'MuseumLover',
      });
      navigator.mediaSession.setActionHandler('play', () => void audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('stop', () => this.stop());
    }

    await audio.play();
  }

  toggle(): void {
    const audio = this.audio;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }

  stop(): void {
    const audio = this.audio;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load?.();
    }
    this.audio = null;
    if (this.state !== 'idle') this.setState('idle');
  }
}

export const narrationPlayer = new NarrationPlayer();
