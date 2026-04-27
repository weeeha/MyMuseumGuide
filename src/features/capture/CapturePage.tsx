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
  refreshOutline,
} from 'ionicons/icons';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import type { ArtifactInfo, JourneyEntry } from '../../domain/types';
import { aiClient } from '../../services/ai/client';
import { takePhoto } from '../../services/camera/camera';
import { journeyPhotoPath, savePhoto } from '../../services/storage/photos';
import { useJourney } from '../../state/useJourney';
import { useSession } from '../../state/useSession';
import { useUserProfile } from '../../state/useUserProfile';
import { ArtifactCard } from '../../ui/ArtifactCard';
import { EmptyState } from '../../ui/EmptyState';

type Phase =
  | { kind: 'idle' }
  | { kind: 'identifying'; photoDataUrl: string }
  | { kind: 'result'; photoDataUrl: string; artifact: ArtifactInfo };

export function CapturePage() {
  const profile = useUserProfile((s) => s.profile);
  const museum = useSession((s) => s.museum);
  const addToJourney = useJourney((s) => s.add);
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  const startCapture = async () => {
    if (!profile) return;
    try {
      const photo = await takePhoto();
      if (!photo) return;
      setPhase({ kind: 'identifying', photoDataUrl: photo.dataUrl });
      const entryId = nanoid();
      const photoPath = journeyPhotoPath(entryId);
      await savePhoto(photoPath, photo.dataUrl);
      const artifact = await aiClient.identifyArtifact({
        photoDataUrl: photo.dataUrl,
        museum: museum ?? undefined,
        language: profile.language,
        level: profile.level,
        interests: profile.interests,
      });
      const entry: JourneyEntry = {
        id: entryId,
        museumId: museum?.id ?? 'generic',
        museumName: museum?.name ?? 'Generic',
        capturedAt: new Date().toISOString(),
        photoPath,
        artifact,
      };
      await addToJourney(entry);
      setPhase({ kind: 'result', photoDataUrl: photo.dataUrl, artifact });
      presentToast({
        message: 'Saved to your Journey',
        duration: 1800,
        color: 'success',
        icon: checkmarkCircle,
        position: 'top',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not identify the artifact';
      presentToast({ message, duration: 2400, color: 'danger' });
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

        {phase.kind === 'identifying' && (
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-sm)',
              }}
            >
              <IonSpinner name="crescent" />
              <IonText>
                <p style={{ margin: 0, fontWeight: 600 }}>Identifying…</p>
              </IonText>
            </div>
            <IonNote color="medium" style={{ fontSize: 'var(--ft-foot)' }}>
              Looking it up against {museum?.name ?? 'a generic catalog'} in{' '}
              {profile?.language?.toUpperCase()} at the {profile?.level} level.
            </IonNote>
          </div>
        )}

        {phase.kind === 'result' && (
          <>
            <ArtifactCard
              photoSrc={phase.photoDataUrl}
              artifact={phase.artifact}
              museumName={museum?.name}
              capturedAt={new Date().toISOString()}
            />
            <div
              style={{
                padding: 'var(--sp-base)',
                paddingBottom: 'var(--sp-2xl)',
              }}
            >
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
