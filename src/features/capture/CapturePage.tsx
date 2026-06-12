import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonRouter,
  useIonToast,
} from '@ionic/react';
import {
  cameraOutline,
  checkmarkCircle,
  imageOutline,
  pauseOutline,
  playOutline,
  refreshOutline,
} from 'ionicons/icons';
import { nanoid } from 'nanoid';
import { useEffect, useRef, useState } from 'react';
import { narrationPlayer, type PlayerState } from '../../services/audio/player';
import type { ArtifactInfo, JourneyEntry } from '../../domain/types';
import { aiClient } from '../../services/ai/client';
import { ttsUrlFor } from '../../services/ai/identify';
import { takePhoto } from '../../services/camera/camera';
import {
  deletePhoto,
  journeyPhotoPath,
  savePhoto,
} from '../../services/storage/photos';
import { useJourney } from '../../state/useJourney';
import { useSession } from '../../state/useSession';
import { useUserProfile } from '../../state/useUserProfile';
import { ArtifactCard } from '../../ui/ArtifactCard';
import { EmptyState } from '../../ui/EmptyState';
import {
  applyStreamEvent,
  finalizeArtifact,
  initialStreaming,
  previewArtifact,
  type StreamingPhase,
} from './streamingPhase';

type Phase =
  | { kind: 'idle' }
  | { kind: 'saving'; photoDataUrl: string }
  | { kind: 'streaming'; stream: StreamingPhase }
  | { kind: 'result'; photoDataUrl: string; artifact: ArtifactInfo; capturedAt: string };

export function CapturePage() {
  const profile = useUserProfile((s) => s.profile);
  const museum = useSession((s) => s.museum);
  const addToJourney = useJourney((s) => s.add);
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  // The reducer state lives in a ref so SSE callbacks (which fire faster
  // than React renders) never read stale phase from a closure.
  const streamRef = useRef<StreamingPhase | null>(null);

  useEffect(() => narrationPlayer.subscribe(setPlayerState), []);
  useEffect(() => () => narrationPlayer.stop(), []);

  const startCapture = async () => {
    if (!profile || phase.kind !== 'idle') return;
    let photoPath: string | undefined;
    try {
      const photo = await takePhoto();
      if (!photo) return;
      setPhase({ kind: 'saving', photoDataUrl: photo.dataUrl });

      // The photo is sacred: persist before any AI runs (spec §9).
      const entryId = nanoid();
      photoPath = journeyPhotoPath(entryId);
      await savePhoto(photoPath, photo.dataUrl);

      const stream = initialStreaming(photo.dataUrl, entryId);
      streamRef.current = stream;
      setPhase({ kind: 'streaming', stream });

      const update = (
        apply: (s: StreamingPhase) => StreamingPhase,
      ): StreamingPhase => {
        const next = apply(streamRef.current ?? stream);
        streamRef.current = next;
        setPhase({ kind: 'streaming', stream: next });
        return next;
      };

      let failed: string | null = null;
      let done: { narrativeId: string; cached: boolean } | null = null;

      await aiClient.identifyStream(
        {
          photoDataUrl: photo.dataUrl,
          museum: museum ?? undefined,
          language: profile.language,
          level: profile.level,
          interests: profile.interests,
        },
        {
          onMeta: (meta) => update((s) => applyStreamEvent(s, { type: 'meta', meta })),
          onSummary: (text) =>
            update((s) => applyStreamEvent(s, { type: 'summary', text })),
          onDelta: (text) =>
            update((s) => applyStreamEvent(s, { type: 'delta', text })),
          onExtras: (extras) =>
            update((s) => applyStreamEvent(s, { type: 'extras', extras })),
          onDone: (d) => {
            done = d;
          },
          onError: (message) => {
            failed = message;
          },
        },
      );

      const finalStream = streamRef.current ?? stream;
      streamRef.current = null;

      if (failed || !done) {
        await deletePhoto(photoPath);
        presentToast({
          message: failed ?? 'The guide went quiet — try again',
          duration: 2400,
          color: 'danger',
        });
        setPhase({ kind: 'idle' });
        return;
      }

      // TS control-flow can't see callback assignment into `done`; use a
      // local copy after the null-check guard so the type is narrowed.
      const finalDone = done as { narrativeId: string; cached: boolean };
      const artifact = finalizeArtifact(finalStream, finalDone.narrativeId);
      const entry: JourneyEntry = {
        id: entryId,
        museumId: museum?.id ?? 'generic',
        museumName: museum?.name ?? 'Generic',
        capturedAt: new Date().toISOString(),
        photoPath,
        artifact,
        audioUrl: ttsUrlFor(finalDone.narrativeId),
      };
      await addToJourney(entry);
      setPhase({ kind: 'result', photoDataUrl: photo.dataUrl, artifact, capturedAt: entry.capturedAt });
      presentToast({
        message: 'Saved to your Journey',
        duration: 1800,
        color: 'success',
        icon: checkmarkCircle,
        position: 'top',
      });
    } catch (err) {
      if (photoPath) {
        void deletePhoto(photoPath).catch(() => {});
      }
      const message =
        err instanceof Error ? err.message : 'Could not identify the artifact';
      presentToast({ message, duration: 2400, color: 'danger' });
      streamRef.current = null;
      setPhase({ kind: 'idle' });
    }
  };

  const reset = () => setPhase({ kind: 'idle' });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Capture</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Capture</IonTitle>
          </IonToolbar>
        </IonHeader>

        {phase.kind === 'idle' && (
          <EmptyState
            icon={cameraOutline}
            title="Point at an artifact"
            description={
              museum
                ? `We'll identify it and save it to your Journey for ${museum.name}.`
                : 'Pick a museum on the Tour tab for tailored narration, or capture in generic mode.'
            }
            action={
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--sp-sm)',
                  width: '100%',
                  maxWidth: 320,
                }}
              >
                <IonButton expand="block" size="large" onClick={startCapture}>
                  <IonIcon slot="start" icon={cameraOutline} />
                  Take photo
                </IonButton>
                {!museum && (
                  <IonButton
                    fill="clear"
                    onClick={() => router.push('/tour', 'back')}
                  >
                    <IonIcon slot="start" icon={imageOutline} />
                    Pick a museum first
                  </IonButton>
                )}
              </div>
            }
          />
        )}

        {phase.kind === 'saving' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 'var(--sp-base)',
              gap: 'var(--sp-base)',
            }}
          >
            <img
              src={phase.photoDataUrl}
              alt="Captured artifact"
              style={{
                width: '100%',
                maxHeight: 320,
                objectFit: 'cover',
                borderRadius: 'var(--rd-md)',
                opacity: 0.9,
              }}
            />
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}
            >
              <IonSpinner name="crescent" />
              <IonText>
                <p style={{ margin: 0, fontWeight: 600 }}>Saving…</p>
              </IonText>
            </div>
          </div>
        )}

        {phase.kind === 'streaming' && (
          <>
            <ArtifactCard
              photoSrc={phase.stream.photoDataUrl}
              artifact={previewArtifact(phase.stream)}
              museumName={museum?.name}
              streaming
            />
            {!phase.stream.meta && (
              <IonNote
                color="medium"
                style={{
                  display: 'block',
                  padding: '0 var(--sp-base)',
                  fontSize: 'var(--ft-foot)',
                }}
              >
                Looking it up against {museum?.name ?? 'a generic catalog'} in{' '}
                {profile?.language?.toUpperCase()} at the {profile?.level} level…
              </IonNote>
            )}
          </>
        )}

        {phase.kind === 'result' && (
          <>
            <ArtifactCard
              photoSrc={phase.photoDataUrl}
              artifact={phase.artifact}
              museumName={museum?.name}
              capturedAt={phase.capturedAt}
            />
            <div
              style={{ padding: 'var(--sp-base)', paddingBottom: 'var(--sp-2xl)' }}
            >
              {phase.artifact.narrativeId && (
                <IonButton
                  expand="block"
                  size="large"
                  onClick={() => {
                    if (playerState === 'playing' || playerState === 'paused') {
                      narrationPlayer.toggle();
                    } else {
                      void narrationPlayer.play(
                        ttsUrlFor(phase.artifact.narrativeId!),
                        {
                          title: phase.artifact.title,
                          artist: phase.artifact.artist,
                          museumName: museum?.name,
                        },
                      );
                    }
                  }}
                  style={{ marginBottom: 'var(--sp-sm)' }}
                >
                  <IonIcon
                    slot="start"
                    icon={playerState === 'playing' ? pauseOutline : playOutline}
                  />
                  {playerState === 'playing'
                    ? 'Pause'
                    : playerState === 'loading'
                      ? 'Loading…'
                      : 'Listen'}
                </IonButton>
              )}
              <IonButton expand="block" onClick={reset}>
                <IonIcon slot="start" icon={refreshOutline} />
                Capture another
              </IonButton>
              <IonButton
                expand="block"
                fill="clear"
                onClick={() => router.push('/journey', 'forward')}
                style={{ marginTop: 'var(--sp-sm)' }}
              >
                Open Journey
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
