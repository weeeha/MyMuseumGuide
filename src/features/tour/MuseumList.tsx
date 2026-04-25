import { IonIcon, IonItem, IonLabel, IonList, IonNote } from '@ionic/react';
import { businessOutline, chevronForwardOutline } from 'ionicons/icons';
import type { Museum } from '../../domain/types';
import { MUSEUMS } from '../../domain/museums';

interface Props {
  onPick: (museum: Museum) => void;
  selectedId?: string;
}

export function MuseumList({ onPick, selectedId }: Props) {
  return (
    <IonList inset>
      {MUSEUMS.map((m) => {
        const isSelected = m.id === selectedId;
        return (
          <IonItem
            key={m.id}
            button
            detail={false}
            onClick={() => onPick(m)}
            color={isSelected ? 'light' : undefined}
          >
            <IonIcon
              slot="start"
              icon={businessOutline}
              color={isSelected ? 'primary' : 'medium'}
            />
            <IonLabel>
              <h2 style={{ fontWeight: 600 }}>{m.name}</h2>
              <p style={{ color: 'var(--tx-secondary)' }}>
                {m.city}, {m.country}
              </p>
            </IonLabel>
            {m.id === 'mmfa' && (
              <IonNote slot="end" color="primary">
                Curated
              </IonNote>
            )}
            <IonIcon
              slot="end"
              icon={chevronForwardOutline}
              color="medium"
              style={{ fontSize: 18 }}
            />
          </IonItem>
        );
      })}
    </IonList>
  );
}
