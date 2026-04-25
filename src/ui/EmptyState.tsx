import { IonIcon, IonText } from '@ionic/react';
import type { ReactNode } from 'react';

interface Props {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-2xl) var(--sp-base)',
        textAlign: 'center',
        gap: 'var(--sp-md)',
        minHeight: '60vh',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 'var(--rd-full)',
          background: 'var(--sf-accent-sub)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IonIcon
          icon={icon}
          style={{ fontSize: 32, color: 'var(--ic-accent)' }}
        />
      </div>
      <IonText>
        <h2 style={{ fontSize: 'var(--ft-title2)', fontWeight: 700, margin: 0 }}>
          {title}
        </h2>
        {description && (
          <p
            style={{
              color: 'var(--tx-secondary)',
              maxWidth: 320,
              marginTop: 'var(--sp-sm)',
            }}
          >
            {description}
          </p>
        )}
      </IonText>
      {action}
    </div>
  );
}
