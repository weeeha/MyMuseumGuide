import './index.css';
import { useEffect } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonSpinner, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AppShell } from './app/AppShell';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';
import { useSession } from './state/useSession';
import { useUserProfile } from './state/useUserProfile';
import Components from './pages/Components';
import DesignTokens from './pages/DesignTokens';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '@ionic/react/css/palettes/dark.class.css';

import './theme/variables.css';

setupIonicReact({ mode: 'ios' });

const App: React.FC = () => {
  const hydrate = useUserProfile((s) => s.hydrate);
  const hydrated = useUserProfile((s) => s.hydrated);
  const profile = useUserProfile((s) => s.profile);
  const hydrateSession = useSession((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    hydrateSession();
  }, [hydrate, hydrateSession]);

  if (!hydrated) {
    return (
      <IonApp>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
          }}
        >
          <IonSpinner name="crescent" />
        </div>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Switch>
            <Route exact path="/dev/tokens" component={DesignTokens} />
            <Route exact path="/dev/components" component={Components} />
            <Route exact path="/onboarding">
              {profile ? <Redirect to="/tour" /> : <OnboardingFlow />}
            </Route>
            <Route path="/">
              {profile ? <AppShell /> : <Redirect to="/onboarding" />}
            </Route>
          </Switch>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
