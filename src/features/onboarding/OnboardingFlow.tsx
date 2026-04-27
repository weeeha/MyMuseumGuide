import {
  IonButton,
  IonChip,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonProgressBar,
  IonRadio,
  IonRadioGroup,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { arrowForward, checkmarkCircle } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  INTERESTS,
  LANGUAGES,
  LEVELS,
  type Interest,
  type Language,
  type Level,
} from '../../domain/types';
import { buildInitialProfile, useUserProfile } from '../../state/useUserProfile';

type Step = 'language' | 'level' | 'interests';

const STEP_INDEX: Record<Step, number> = {
  language: 0,
  level: 1,
  interests: 2,
};

export function OnboardingFlow() {
  const history = useHistory();
  const save = useUserProfile((s) => s.save);
  const [step, setStep] = useState<Step>('language');
  const [language, setLanguage] = useState<Language>('en');
  const [level, setLevel] = useState<Level>('curious');
  const [interests, setInterests] = useState<Interest[]>([]);

  const next = async () => {
    if (step === 'language') setStep('level');
    else if (step === 'level') setStep('interests');
    else {
      await save(buildInitialProfile(language, level, interests));
      history.replace('/tour');
    }
  };

  const back = () => {
    if (step === 'level') setStep('language');
    else if (step === 'interests') setStep('level');
  };

  const toggleInterest = (i: Interest) => {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  };

  const progress = (STEP_INDEX[step] + 1) / 3;
  const canContinue =
    (step === 'language' && !!language) ||
    (step === 'level' && !!level) ||
    (step === 'interests' && interests.length > 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome</IonTitle>
        </IonToolbar>
        <IonProgressBar value={progress} />
      </IonHeader>
      <IonContent className="ion-padding">
        {step === 'language' && (
          <LanguageStep value={language} onChange={setLanguage} />
        )}
        {step === 'level' && <LevelStep value={level} onChange={setLevel} />}
        {step === 'interests' && (
          <InterestsStep value={interests} onToggle={toggleInterest} />
        )}
      </IonContent>
      <IonFooter className="ion-no-border">
        <IonToolbar>
          <div
            style={{
              display: 'flex',
              gap: 'var(--sp-sm)',
              padding: '0 var(--sp-base)',
            }}
          >
            {step !== 'language' && (
              <IonButton fill="clear" onClick={back}>
                Back
              </IonButton>
            )}
            <IonButton
              expand="block"
              disabled={!canContinue}
              onClick={next}
              style={{ flex: 1 }}
            >
              {step === 'interests' ? 'Start exploring' : 'Continue'}
              <IonIcon slot="end" icon={arrowForward} />
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
}

function LanguageStep({
  value,
  onChange,
}: {
  value: Language;
  onChange: (l: Language) => void;
}) {
  return (
    <>
      <IonText>
        <h1 style={{ fontSize: 'var(--ft-large)', fontWeight: 700 }}>
          Pick your language
        </h1>
        <p style={{ color: 'var(--tx-secondary)' }}>
          Tours are written and narrated in this language.
        </p>
      </IonText>
      <IonRadioGroup
        value={value}
        onIonChange={(e) => onChange(e.detail.value as Language)}
      >
        <IonList inset>
          {LANGUAGES.map((lang) => (
            <IonItem key={lang.code}>
              <IonRadio value={lang.code} labelPlacement="end" justify="start">
                <span style={{ fontWeight: 600 }}>{lang.native}</span>
                <span
                  style={{
                    color: 'var(--tx-tertiary)',
                    marginLeft: 'var(--sp-sm)',
                  }}
                >
                  {lang.label}
                </span>
              </IonRadio>
            </IonItem>
          ))}
        </IonList>
      </IonRadioGroup>
    </>
  );
}

function LevelStep({
  value,
  onChange,
}: {
  value: Level;
  onChange: (l: Level) => void;
}) {
  return (
    <>
      <IonText>
        <h1 style={{ fontSize: 'var(--ft-large)', fontWeight: 700 }}>
          How deep do you want to go?
        </h1>
        <p style={{ color: 'var(--tx-secondary)' }}>
          Sets the tone of every description. You can change it any time.
        </p>
      </IonText>
      <IonRadioGroup
        value={value}
        onIonChange={(e) => onChange(e.detail.value as Level)}
      >
        <IonList inset>
          {LEVELS.map((lvl) => (
            <IonItem key={lvl.id}>
              <IonRadio value={lvl.id} labelPlacement="end" justify="start">
                <IonLabel>
                  <h2 style={{ fontWeight: 600 }}>{lvl.label}</h2>
                  <p style={{ color: 'var(--tx-secondary)' }}>{lvl.blurb}</p>
                </IonLabel>
              </IonRadio>
            </IonItem>
          ))}
        </IonList>
      </IonRadioGroup>
    </>
  );
}

function InterestsStep({
  value,
  onToggle,
}: {
  value: Interest[];
  onToggle: (i: Interest) => void;
}) {
  return (
    <>
      <IonText>
        <h1 style={{ fontSize: 'var(--ft-large)', fontWeight: 700 }}>
          What do you love?
        </h1>
        <p style={{ color: 'var(--tx-secondary)' }}>
          Pick a few — we'll lean toward these in suggestions and follow-ups.
        </p>
      </IonText>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--sp-sm)',
          marginTop: 'var(--sp-base)',
        }}
      >
        {INTERESTS.map((i) => {
          const selected = value.includes(i);
          return (
            <IonChip
              key={i}
              color={selected ? 'primary' : 'medium'}
              outline={!selected}
              onClick={() => onToggle(i)}
            >
              {selected && <IonIcon icon={checkmarkCircle} />}
              <IonLabel>{i}</IonLabel>
            </IonChip>
          );
        })}
      </div>
    </>
  );
}
