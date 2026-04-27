import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { albumsOutline, closeOutline, trashOutline } from 'ionicons/icons';
import { useState } from 'react';
import type { JourneyEntry } from '../../domain/types';
import { useJourney } from '../../state/useJourney';
import { ArtifactCard } from '../../ui/ArtifactCard';
import { EmptyState } from '../../ui/EmptyState';
import { useResolvedPhotoSrc } from '../../ui/useResolvedPhotoSrc';

const THUMB_STYLE: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 'var(--rd-sm)',
  objectFit: 'cover',
  background: 'var(--sf-secondary)',
};

function JourneyThumbnail({ path, alt }: { path: string; alt: string }) {
  const src = useResolvedPhotoSrc(path);
  if (!src) {
    return <div slot="start" style={THUMB_STYLE} aria-hidden />;
  }
  return <img slot="start" src={src} alt={alt} style={THUMB_STYLE} />;
}

export function JourneyPage() {
  const entries = useJourney((s) => s.entries);
  const removeEntry = useJourney((s) => s.remove);
  const [active, setActive] = useState<JourneyEntry | null>(null);
  const [presentAlert] = useIonAlert();
  const activePhotoSrc = useResolvedPhotoSrc(active?.photoPath ?? null);

  const confirmRemove = (entry: JourneyEntry) => {
    presentAlert({
      header: 'Remove from Journey?',
      message: `"${entry.artifact.title}" — this cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            removeEntry(entry.id);
            if (active?.id === entry.id) setActive(null);
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Journey</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Journey</IonTitle>
          </IonToolbar>
        </IonHeader>

        {entries.length === 0 ? (
          <EmptyState
            icon={albumsOutline}
            title="Your visits will live here"
            description="Photos, narratives, and audio from every artifact you capture, in chronological order."
          />
        ) : (
          <IonList>
            {entries.map((entry) => (
              <IonItemSliding key={entry.id}>
                <IonItem button detail onClick={() => setActive(entry)}>
                  <JourneyThumbnail
                    path={entry.photoPath}
                    alt={entry.artifact.title}
                  />
                  <IonLabel>
                    <h2 style={{ fontWeight: 600 }}>{entry.artifact.title}</h2>
                    <p style={{ fontSize: 'var(--ft-foot)' }}>
                      {entry.museumName} · {formatRelative(entry.capturedAt)}
                    </p>
                  </IonLabel>
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption
                    color="danger"
                    onClick={() => confirmRemove(entry)}
                  >
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}

        <IonModal isOpen={!!active} onDidDismiss={() => setActive(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{active?.artifact.title ?? 'Artifact'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setActive(null)}>
                  <IonIcon slot="icon-only" icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {active && activePhotoSrc ? (
              <ArtifactCard
                photoSrc={activePhotoSrc}
                artifact={active.artifact}
                museumName={active.museumName}
                capturedAt={active.capturedAt}
              />
            ) : active ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'var(--sp-xl)',
                }}
              >
                <IonSpinner name="crescent" />
              </div>
            ) : null}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}

function formatRelative(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const diffMs = Date.now() - then;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
