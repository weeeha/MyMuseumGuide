import {
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonNote,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  businessOutline,
  cameraOutline,
  locationOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import type { FloorPlan, Museum } from '../../domain/types';
import { useSession } from '../../state/useSession';
import { FloorPlanCapture } from './FloorPlanCapture';
import { MuseumList } from './MuseumList';

export function TourPage() {
  const history = useHistory();
  const hydrated = useSession((s) => s.hydrated);
  const hydrate = useSession((s) => s.hydrate);
  const museum = useSession((s) => s.museum);
  const floorPlan = useSession((s) => s.floorPlan);
  const setMuseum = useSession((s) => s.setMuseum);
  const setFloorPlan = useSession((s) => s.setFloorPlan);
  const clear = useSession((s) => s.clear);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tour</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Tour</IonTitle>
          </IonToolbar>
        </IonHeader>

        {!museum ? <NoMuseumView onPick={setMuseum} /> : (
          <ActiveMuseumView
            museum={museum}
            floorPlan={floorPlan}
            onFloorPlan={setFloorPlan}
            onChange={clear}
            onCapture={() => history.push('/capture')}
          />
        )}
      </IonContent>
    </IonPage>
  );
}

function NoMuseumView({ onPick }: { onPick: (m: Museum) => void }) {
  return (
    <>
      <div style={{ padding: 'var(--sp-base)' }}>
        <IonText>
          <h1
            style={{
              fontSize: 'var(--ft-large)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Where are you?
          </h1>
          <p style={{ color: 'var(--tx-secondary)' }}>
            Pick a museum to start your visit. We'll tailor identifications and
            narrative to its collection.
          </p>
        </IonText>
      </div>
      <MuseumList onPick={(m) => onPick(m)} />
      <IonNote
        color="medium"
        style={{
          display: 'block',
          fontSize: 'var(--ft-foot)',
          padding: '0 var(--sp-base) var(--sp-2xl)',
        }}
      >
        At a different museum? Pick the closest match — we treat the rest as
        generic mode for now.
      </IonNote>
    </>
  );
}

interface ActiveProps {
  museum: Museum;
  floorPlan: FloorPlan | null;
  onFloorPlan: (plan: FloorPlan) => Promise<void>;
  onChange: () => void;
  onCapture: () => void;
}

function ActiveMuseumView({
  museum,
  floorPlan,
  onFloorPlan,
  onChange,
  onCapture,
}: ActiveProps) {
  return (
    <div style={{ padding: 'var(--sp-base)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--sp-base)',
        }}
      >
        <div>
          <IonNote
            color="primary"
            style={{
              fontSize: 'var(--ft-cap1)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
            }}
          >
            <IonIcon
              icon={locationOutline}
              style={{ verticalAlign: 'text-bottom', marginRight: 4 }}
            />
            You're at
          </IonNote>
          <h1
            style={{
              fontSize: 'var(--ft-title1)',
              fontWeight: 700,
              margin: '4px 0 0',
            }}
          >
            {museum.name}
          </h1>
          <IonText color="medium">
            <p style={{ margin: 0, fontSize: 'var(--ft-subhead)' }}>
              {museum.city}, {museum.country}
            </p>
          </IonText>
        </div>
        <IonButton fill="clear" size="small" onClick={onChange}>
          <IonIcon slot="start" icon={swapHorizontalOutline} />
          Change
        </IonButton>
      </div>

      {museum.topics && museum.topics.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--sp-xs)',
            marginTop: 'var(--sp-md)',
          }}
        >
          {museum.topics.map((t) => (
            <IonChip key={t} color="medium" outline>
              <IonIcon icon={businessOutline} />
              <IonLabel>{t}</IonLabel>
            </IonChip>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'var(--sp-lg)' }}>
        <FloorPlanCapture
          museum={museum}
          floorPlan={floorPlan}
          onCapture={onFloorPlan}
        />
      </div>

      <IonButton expand="block" size="large" onClick={onCapture}>
        <IonIcon slot="start" icon={cameraOutline} />
        Capture an artifact
      </IonButton>
      <IonNote
        color="medium"
        style={{
          display: 'block',
          fontSize: 'var(--ft-foot)',
          textAlign: 'center',
          marginTop: 'var(--sp-sm)',
        }}
      >
        Real Claude vision lands in Phase 3 — Capture currently shows a
        placeholder.
      </IonNote>
    </div>
  );
}
