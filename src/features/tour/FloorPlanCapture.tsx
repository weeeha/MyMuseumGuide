import {
  IonButton,
  IonCard,
  IonCardContent,
  IonChip,
  IonIcon,
  IonLabel,
  IonNote,
  IonSpinner,
  IonText,
  useIonToast,
} from '@ionic/react';
import { cameraOutline, refreshOutline, scanOutline } from 'ionicons/icons';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import type { FloorPlan, Museum } from '../../domain/types';
import { takePhoto } from '../../services/camera/camera';
import { aiClient } from '../../services/ai/client';

interface Props {
  museum: Museum;
  floorPlan: FloorPlan | null;
  onCapture: (plan: FloorPlan) => void;
}

export function FloorPlanCapture({ museum, floorPlan, onCapture }: Props) {
  const [presentToast] = useIonToast();
  const [busy, setBusy] = useState(false);

  const capture = async () => {
    setBusy(true);
    try {
      const photo = await takePhoto();
      if (!photo) {
        setBusy(false);
        return;
      }
      const { topics } = await aiClient.parseFloorPlan(photo.dataUrl, museum);
      const plan: FloorPlan = {
        id: nanoid(),
        museumId: museum.id,
        imageDataUrl: photo.dataUrl,
        detectedTopics: topics,
        capturedAt: new Date().toISOString(),
      };
      onCapture(plan);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not capture floor plan';
      presentToast({ message, duration: 2400, color: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  if (!floorPlan) {
    return (
      <IonCard>
        <IonCardContent>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-md)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--rd-md)',
                background: 'var(--sf-accent-sub)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <IonIcon
                icon={scanOutline}
                style={{ fontSize: 24, color: 'var(--ic-accent)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <IonText>
                <p
                  style={{
                    fontWeight: 600,
                    margin: 0,
                    fontSize: 'var(--ft-callout)',
                  }}
                >
                  Got a floor plan?
                </p>
              </IonText>
              <IonNote color="medium" style={{ fontSize: 'var(--ft-foot)' }}>
                Photograph the plan at the entrance — we'll use it as context.
              </IonNote>
            </div>
          </div>
          <IonButton
            expand="block"
            onClick={capture}
            disabled={busy}
            style={{ marginTop: 'var(--sp-md)' }}
          >
            {busy ? (
              <IonSpinner name="crescent" />
            ) : (
              <>
                <IonIcon slot="start" icon={cameraOutline} />
                Scan floor plan
              </>
            )}
          </IonButton>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard>
      <img
        src={floorPlan.imageDataUrl}
        alt="Floor plan"
        style={{
          width: '100%',
          maxHeight: 220,
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <IonCardContent>
        <IonText>
          <p style={{ fontWeight: 600, margin: 0 }}>
            Detected {floorPlan.detectedTopics?.length ?? 0} topics
          </p>
        </IonText>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--sp-xs)',
            marginTop: 'var(--sp-sm)',
          }}
        >
          {(floorPlan.detectedTopics ?? []).map((t) => (
            <IonChip key={t} color="primary" outline>
              <IonLabel>{t}</IonLabel>
            </IonChip>
          ))}
        </div>
        <IonButton
          fill="clear"
          size="small"
          onClick={capture}
          disabled={busy}
          style={{ marginTop: 'var(--sp-sm)' }}
        >
          <IonIcon slot="start" icon={refreshOutline} />
          Re-scan
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
}
