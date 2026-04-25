import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { mapOutline } from 'ionicons/icons';
import { EmptyState } from '../../ui/EmptyState';

export function TourPage() {
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
        <EmptyState
          icon={mapOutline}
          title="Pick a museum to begin"
          description="Choose from a list or photograph the floor plan at the entrance. Coming in Phase 2."
        />
      </IonContent>
    </IonPage>
  );
}
