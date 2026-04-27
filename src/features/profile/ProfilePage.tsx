import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  checkmarkCircle,
  flashOutline,
  languageOutline,
  refreshOutline,
  sparklesOutline,
} from 'ionicons/icons';
import {
  INTERESTS,
  LANGUAGES,
  LEVELS,
  type Interest,
  type Language,
  type Level,
} from '../../domain/types';
import { useUserProfile } from '../../state/useUserProfile';

export function ProfilePage() {
  const profile = useUserProfile((s) => s.profile);
  const setLanguage = useUserProfile((s) => s.setLanguage);
  const setLevel = useUserProfile((s) => s.setLevel);
  const setInterests = useUserProfile((s) => s.setInterests);
  const reset = useUserProfile((s) => s.reset);

  if (!profile) return null;

  const toggleInterest = (i: Interest) => {
    const next = profile.interests.includes(i)
      ? profile.interests.filter((x) => x !== i)
      : [...profile.interests, i];
    setInterests(next);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Profile</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonCard>
          <IonCardContent>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <IonText color="medium">
                  <p
                    style={{
                      fontSize: 'var(--ft-foot)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: 0,
                    }}
                  >
                    Plan
                  </p>
                </IonText>
                <h2
                  style={{
                    fontSize: 'var(--ft-title2)',
                    fontWeight: 700,
                    margin: '4px 0',
                  }}
                >
                  {profile.plan === 'free' ? 'Free' : profile.plan === 'monthly' ? 'Monthly' : 'Annual'}
                </h2>
                <IonText color="medium">
                  <p style={{ fontSize: 'var(--ft-foot)', margin: 0 }}>
                    {profile.credits} credits
                  </p>
                </IonText>
              </div>
              <IonButton fill="solid" disabled>
                <IonIcon slot="start" icon={sparklesOutline} />
                Upgrade
              </IonButton>
            </div>
            <IonNote
              color="medium"
              style={{
                fontSize: 'var(--ft-cap1)',
                display: 'block',
                marginTop: 'var(--sp-sm)',
              }}
            >
              Subscription wiring lands in Phase 4 ($6.99/mo + $2.99 top-up).
            </IonNote>
          </IonCardContent>
        </IonCard>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Preferences</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonIcon slot="start" icon={languageOutline} color="primary" />
            <IonSelect
              label="Language"
              value={profile.language}
              onIonChange={(e) => setLanguage(e.detail.value as Language)}
              interface="action-sheet"
            >
              {LANGUAGES.map((l) => (
                <IonSelectOption key={l.code} value={l.code}>
                  {l.native} ({l.label})
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonIcon slot="start" icon={flashOutline} color="primary" />
            <IonSelect
              label="Depth"
              value={profile.level}
              onIonChange={(e) => setLevel(e.detail.value as Level)}
              interface="action-sheet"
            >
              {LEVELS.map((l) => (
                <IonSelectOption key={l.id} value={l.id}>
                  {l.label} — {l.blurb}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Interests</IonLabel>
            <IonBadge color="medium">{profile.interests.length}</IonBadge>
          </IonListHeader>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--sp-sm)',
              padding: 'var(--sp-sm) var(--sp-base) var(--sp-base)',
            }}
          >
            {INTERESTS.map((i) => {
              const selected = profile.interests.includes(i);
              return (
                <IonChip
                  key={i}
                  color={selected ? 'primary' : 'medium'}
                  outline={!selected}
                  onClick={() => toggleInterest(i)}
                >
                  {selected && <IonIcon icon={checkmarkCircle} />}
                  <IonLabel>{i}</IonLabel>
                </IonChip>
              );
            })}
          </div>
        </IonList>

        <IonList inset>
          <IonItem button detail={false} onClick={reset}>
            <IonIcon slot="start" icon={refreshOutline} color="danger" />
            <IonLabel color="danger">Reset profile (dev)</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
}
