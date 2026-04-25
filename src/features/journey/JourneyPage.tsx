import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { albumsOutline } from 'ionicons/icons';
import { EmptyState } from '../../ui/EmptyState';

export function JourneyPage() {
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
        <EmptyState
          icon={albumsOutline}
          title="Your visits will live here"
          description="Photos, narratives, and audio from every artifact you capture, in chronological order."
        />
      </IonContent>
    </IonPage>
  );
}
