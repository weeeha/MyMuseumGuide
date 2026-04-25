import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import {
  albumsOutline,
  cameraOutline,
  mapOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { Redirect, Route } from 'react-router-dom';
import { CapturePage } from '../features/capture/CapturePage';
import { JourneyPage } from '../features/journey/JourneyPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { TourPage } from '../features/tour/TourPage';

export function AppShell() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tour" component={TourPage} />
        <Route exact path="/capture" component={CapturePage} />
        <Route exact path="/journey" component={JourneyPage} />
        <Route exact path="/profile" component={ProfilePage} />
        <Route exact path="/">
          <Redirect to="/tour" />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="tour" href="/tour">
          <IonIcon icon={mapOutline} />
          <IonLabel>Tour</IonLabel>
        </IonTabButton>
        <IonTabButton tab="capture" href="/capture">
          <IonIcon icon={cameraOutline} />
          <IonLabel>Capture</IonLabel>
        </IonTabButton>
        <IonTabButton tab="journey" href="/journey">
          <IonIcon icon={albumsOutline} />
          <IonLabel>Journey</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/profile">
          <IonIcon icon={personCircleOutline} />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
