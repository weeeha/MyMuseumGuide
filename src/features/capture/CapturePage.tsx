import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { cameraOutline } from 'ionicons/icons';
import { EmptyState } from '../../ui/EmptyState';

export function CapturePage() {
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
        <EmptyState
          icon={cameraOutline}
          title="Point at an artifact"
          description="Take a photo and we'll identify it, narrate the story, and save it to your Journey. Coming in Phase 3."
        />
      </IonContent>
    </IonPage>
  );
}
