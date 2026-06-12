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
    audio.addEventListener('error', () => this.setState('idle')); // TODO R2: surface audio errors to the UI

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

    try {
      await audio.play();
    } catch (err) {
      // Safari/iOS can reject play() (autoplay policy, decode, network)
      // without a preceding 'error' event. The state subscription is the
      // caller's source of truth, so reset instead of rethrowing.
      if (this.state === 'loading') this.setState('idle');
      console.warn('narration play failed', err);
    }
  }

  toggle(): void {
    const audio = this.audio;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {
        if (this.state !== 'idle') this.setState('idle');
      });
    } else {
      audio.pause();
    }
  }

  stop(): void {
    const audio = this.audio;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load?.();
    }
    this.audio = null;
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('stop', null);
    }
    if (this.state !== 'idle') this.setState('idle');
  }
}

export const narrationPlayer = new NarrationPlayer();
