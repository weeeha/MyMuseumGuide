import {
  IonButton,
  IonChip,
  IonIcon,
  IonLabel,
  IonNote,
  IonText,
} from '@ionic/react';
import {
  brushOutline,
  calendarOutline,
  globeOutline,
  layersOutline,
  sparklesOutline,
} from 'ionicons/icons';
import type { ArtifactInfo } from '../domain/types';

interface Props {
  photoSrc: string;
  artifact: ArtifactInfo;
  capturedAt?: string;
  museumName?: string;
  onFollowUp?: (followUpId: string) => void;
  /** True while the story is still streaming in — shows a writing cursor. */
  streaming?: boolean;
}

export function ArtifactCard({
  photoSrc,
  artifact,
  capturedAt,
  museumName,
  onFollowUp,
  streaming = false,
}: Props) {
  const facts: { icon: string; value: string }[] = [];
  if (artifact.artist) facts.push({ icon: brushOutline, value: artifact.artist });
  if (artifact.period) facts.push({ icon: calendarOutline, value: artifact.period });
  if (artifact.origin) facts.push({ icon: globeOutline, value: artifact.origin });
  if (artifact.medium) facts.push({ icon: layersOutline, value: artifact.medium });

  return (
    <article style={{ display: 'flex', flexDirection: 'column' }}>
      <img
        src={photoSrc}
        alt={artifact.title}
        style={{
          width: '100%',
          maxHeight: 320,
          objectFit: 'cover',
          display: 'block',
          background: 'var(--sf-secondary)',
        }}
      />
      <div style={{ padding: 'var(--sp-base)' }}>
        {(museumName || capturedAt) && (
          <IonNote
            color="medium"
            style={{
              fontSize: 'var(--ft-cap1)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
              display: 'block',
            }}
          >
            {[museumName, capturedAt && formatDate(capturedAt)]
              .filter(Boolean)
              .join(' · ')}
          </IonNote>
        )}
        <IonText>
          <h1
            style={{
              fontSize: 'var(--ft-title1)',
              fontWeight: 700,
              margin: '6px 0 0',
              lineHeight: 1.2,
            }}
          >
            {artifact.title}
          </h1>
        </IonText>

        {facts.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--sp-sm) var(--sp-md)',
              marginTop: 'var(--sp-sm)',
            }}
          >
            {facts.map((f) => (
              <span
                key={f.value}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 'var(--ft-foot)',
                  color: 'var(--tx-secondary)',
                }}
              >
                <IonIcon icon={f.icon} style={{ fontSize: 14 }} />
                {f.value}
              </span>
            ))}
          </div>
        )}

        <IonText>
          <p
            style={{
              fontSize: 'var(--ft-body)',
              fontWeight: 500,
              marginTop: 'var(--sp-md)',
              lineHeight: 1.45,
            }}
          >
            {artifact.summary}
          </p>
        </IonText>

        <div aria-live={streaming ? 'polite' : 'off'}>
          {artifact.story &&
            artifact.story.split('\n\n').map((para, i, all) => (
              <IonText key={i} color="medium">
                <p
                  style={{
                    fontSize: 'var(--ft-body)',
                    marginTop: 'var(--sp-sm)',
                    lineHeight: 1.55,
                  }}
                >
                  {para}
                  {streaming && i === all.length - 1 && (
                    <span className="ml-streaming-cursor" aria-hidden="true" />
                  )}
                </p>
              </IonText>
            ))}
          {streaming && !artifact.story && (
            <IonText color="medium">
              <p style={{ fontSize: 'var(--ft-body)', marginTop: 'var(--sp-sm)' }}>
                <span className="ml-streaming-cursor" aria-hidden="true" />
              </p>
            </IonText>
          )}
        </div>

        {artifact.tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--sp-xs)',
              marginTop: 'var(--sp-md)',
            }}
          >
            {artifact.tags.map((t) => (
              <IonChip key={t} color="medium" outline>
                <IonLabel>{t}</IonLabel>
              </IonChip>
            ))}
          </div>
        )}

        {artifact.followUps.length > 0 && (
          <div style={{ marginTop: 'var(--sp-lg)' }}>
            <IonNote
              color="medium"
              style={{
                fontSize: 'var(--ft-cap1)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
                display: 'block',
                marginBottom: 'var(--sp-sm)',
              }}
            >
              <IonIcon
                icon={sparklesOutline}
                style={{ verticalAlign: 'text-bottom', marginRight: 4 }}
              />
              Go deeper
            </IonNote>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--sp-sm)',
              }}
            >
              {artifact.followUps.map((f) => (
                <IonButton
                  key={f.id}
                  fill="outline"
                  expand="block"
                  size="default"
                  onClick={() => onFollowUp?.(f.id)}
                  disabled={!onFollowUp}
                >
                  <IonLabel
                    style={{ whiteSpace: 'normal', textAlign: 'left' }}
                  >
                    {f.prompt}
                  </IonLabel>
                </IonButton>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}
