import type { JourneyEntry } from '../../domain/types';
import { journeyPhotoPath, savePhoto } from '../../services/storage/photos';

/**
 * Demo Journey content for backend-less UI work (VITE_USE_MOCK_AI=true).
 *
 * Exists so the artifact detail view, audio player and museum theming can be
 * judged without a camera, a backend, or a museum. It seeds only when mock
 * mode is on *and* the Journey is empty, so it can never overwrite a real
 * capture — the photo is sacred (spec §9) applies to demo runs too.
 *
 * Placeholder images are drawn on a canvas rather than shipped as binary
 * assets: no repo weight, and they inherit the museum accent so the seeded
 * entries look like they belong to the active theme.
 */

const DEMO_MUSEUM = { id: 'mmfa', name: 'Montreal Museum of Fine Arts' };

interface DemoSpec {
  slug: string;
  hoursAgo: number;
  palette: [string, string];
  entry: Omit<JourneyEntry, 'id' | 'photoPath' | 'capturedAt' | 'museumId' | 'museumName'>;
}

const DEMOS: DemoSpec[] = [
  {
    slug: 'demo-hurdy-gurdy',
    hoursAgo: 2,
    palette: ['#6B4A2F', '#241610'],
    entry: {
      artifact: {
        id: 'demo-hurdy-gurdy',
        title: 'The Hurdy-Gurdy Player',
        artist: 'Georges de La Tour',
        period: 'c. 1631–1636',
        origin: 'France',
        medium: 'Oil on canvas',
        summary:
          'A blind street musician, painted life-size and lit like a saint. La Tour refuses to make him pitiable — he gives him the monumental dignity usually reserved for apostles.',
        story:
          'Look at the hands first. The left one is a claw around the crank, the knuckles swollen from a lifetime of turning it; the right presses keys worn smooth. La Tour painted musicians repeatedly, and he never softened them.\n\nWhat makes this painting strange is the scale. Beggars and street performers were a stock subject in the 1630s, usually small, comic, and safely distant. La Tour paints this man at the size of an altarpiece figure, filling the frame, his coat rendered with the same devotional care a court painter would spend on silk.\n\nThe light comes from the left and low, raking across the face. His eyes are closed — or gone; contemporaries would have read the sunken sockets immediately. He is not looking at you and never will, which is precisely why you cannot stop looking at him.\n\nLa Tour was the son of a baker who married into minor nobility and spent his career in Lorraine, a duchy repeatedly wrecked by the Thirty Years’ War. He watched a lot of people lose everything. This is not a painting about poverty. It is a painting about someone who still has his instrument.',
        tags: ['Baroque', 'Genre painting', 'Chiaroscuro', 'French'],
        followUps: [
          {
            id: 'f1',
            prompt: 'Why did La Tour paint so many candlelit night scenes?',
            kind: 'artist',
          },
          {
            id: 'f2',
            prompt: 'What is a hurdy-gurdy and how does it actually work?',
            kind: 'technique',
          },
          {
            id: 'f3',
            prompt: 'How does this compare to Caravaggio’s beggars?',
            kind: 'related',
          },
        ],
        narrativeId: 'demo-narrative-1',
      },
    },
  },
  {
    slug: 'demo-northern-river',
    hoursAgo: 5,
    palette: ['#2F4A55', '#10191E'],
    entry: {
      artifact: {
        id: 'demo-northern-river',
        title: 'The Northern River',
        artist: 'Tom Thomson',
        period: '1915',
        origin: 'Canada',
        medium: 'Oil on canvas',
        summary:
          'A tangle of black spruce framing a slab of blue water. Thomson painted the Canadian north as a screen of foreground clutter you have to look through — which is exactly how it feels to be in it.',
        story:
          'Most landscape painting of this period opens a window. Thomson builds a wall. The spruce trunks and dead branches crowd the picture plane, and the river is glimpsed through gaps, never handed to you.\n\nHe worked from small oil sketches made on birch panels he could carry in a canoe, then scaled them up in a Toronto shack in the winter. The sketch for this one is roughly the size of a paperback. Almost nothing survives the enlargement except the color decisions — which is the point; the decisions were already made outdoors, fast, with cold hands.\n\nThomson had been a commercial designer, and it shows in the flattened, poster-like structure — the decorative rhythm of the trunks owes as much to Art Nouveau as to anything he saw in Algonquin Park.\n\nHe drowned in Canoe Lake two years later, aged 39, in circumstances still argued about. The painters who became the Group of Seven formed in his wake and spent decades insisting he was the one who saw it first.',
        tags: ['Canadian', 'Landscape', 'Post-Impressionism', 'Group of Seven'],
        followUps: [
          {
            id: 'f1',
            prompt: 'Who were the Group of Seven and why did they matter?',
            kind: 'movement',
          },
          {
            id: 'f2',
            prompt: 'How do plein-air oil sketches become studio paintings?',
            kind: 'technique',
          },
          {
            id: 'f3',
            prompt: 'What actually happened to Tom Thomson?',
            kind: 'artist',
          },
        ],
        narrativeId: 'demo-narrative-2',
      },
    },
  },
  {
    slug: 'demo-inuit-bear',
    hoursAgo: 26,
    palette: ['#4A5560', '#161B20'],
    entry: {
      artifact: {
        id: 'demo-inuit-bear',
        title: 'Dancing Bear',
        artist: 'Pauta Saila',
        period: '1970s',
        origin: 'Kinngait (Cape Dorset), Nunavut',
        medium: 'Serpentinite',
        summary:
          'A polar bear reared onto one hind leg, head thrown back, impossibly light. Saila carved dozens of these and never let one look like an animal specimen.',
        story:
          'The stone is serpentinite, quarried locally, and it fights back — it is hard, brittle at the edges, and it dictates where mass can go. Saila works with that rather than against it: the bear’s weight sits in the haunches and the polished belly, while the extended forelimb tapers to almost nothing.\n\nThe pose is not naturalistic and was never meant to be. Bears in Inuit cosmology are shape-shifters, close kin to shamans, and a bear that dances is a bear caught mid-transformation. Saila grew up on the land before settlement life; he was carving a being, not a subject.\n\nCommercial Inuit sculpture began in the late 1940s and could easily have flattened into souvenir work. What kept artists like Saila out of that trap was the refusal to explain — the sculptures do not narrate, they simply hold a moment of impossible balance.\n\nRun your eye around the back. The finish shifts from high polish to a matte rasp on the flanks. That is deliberate: light behaves differently on each, and the bear seems to move as you walk past it.',
        tags: ['Inuit Art', 'Sculpture', 'Contemporary', 'Indigenous Art'],
        followUps: [
          {
            id: 'f1',
            prompt: 'What does the dancing bear mean in Inuit cosmology?',
            kind: 'movement',
          },
          {
            id: 'f2',
            prompt: 'How is serpentinite carved and finished?',
            kind: 'technique',
          },
          {
            id: 'f3',
            prompt: 'How did Kinngait become a center for Inuit art?',
            kind: 'related',
          },
        ],
        narrativeId: 'demo-narrative-3',
      },
    },
  },
];

/**
 * Draws a placeholder "artwork" — a soft diagonal wash inside a gallery mat.
 * Deliberately abstract: a fake photograph of a real painting would be worse
 * than an obvious stand-in.
 */
function placeholderPhoto(palette: [string, string], label: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const [light, dark] = palette;
  ctx.fillStyle = '#0B0908';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const inset = 60;
  const gradient = ctx.createLinearGradient(inset, inset, canvas.width - inset, canvas.height - inset);
  gradient.addColorStop(0, light);
  gradient.addColorStop(1, dark);
  ctx.fillStyle = gradient;
  ctx.fillRect(inset, inset, canvas.width - inset * 2, canvas.height - inset * 2);

  // A few soft bands so the thumbnail doesn't read as a flat color chip.
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#000000';
    const y = inset + ((canvas.height - inset * 2) / 5) * i;
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, y + 120, canvas.width * 0.7, 140, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(inset, inset, canvas.width - inset * 2, canvas.height - inset * 2);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '500 26px -apple-system, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, canvas.width / 2, canvas.height - 96);

  return canvas.toDataURL('image/jpeg', 0.82);
}

export function demoSeedEnabled(): boolean {
  return import.meta.env.VITE_USE_MOCK_AI === 'true';
}

/**
 * React StrictMode invokes effects twice in development. Both passes observe
 * an empty Journey and both write, producing duplicate entries. Sharing one
 * in-flight promise makes the second call a no-op await instead of a race.
 */
let inFlight: Promise<number> | null = null;

/**
 * Seeds demo entries via the store's own `add`, so they persist and behave
 * exactly like captured ones (including deletion). Returns how many it wrote.
 */
export function seedDemoJourney(
  existingCount: number,
  add: (entry: JourneyEntry) => Promise<void>,
): Promise<number> {
  if (!demoSeedEnabled() || existingCount > 0) return Promise.resolve(0);
  inFlight ??= writeDemoEntries(add);
  return inFlight;
}

async function writeDemoEntries(
  add: (entry: JourneyEntry) => Promise<void>,
): Promise<number> {
  let written = 0;
  // Oldest first: the store prepends, so this leaves newest at the top.
  for (const demo of [...DEMOS].reverse()) {
    const id = demo.slug;
    const photoPath = journeyPhotoPath(id);
    try {
      const dataUrl = placeholderPhoto(demo.palette, 'DEMO — placeholder image');
      if (!dataUrl) continue;
      await savePhoto(photoPath, dataUrl);
      await add({
        id,
        museumId: DEMO_MUSEUM.id,
        museumName: DEMO_MUSEUM.name,
        capturedAt: new Date(Date.now() - demo.hoursAgo * 3_600_000).toISOString(),
        photoPath,
        artifact: demo.entry.artifact,
      });
      written += 1;
    } catch (err) {
      // Demo content must never break app start.
      console.warn('demo seed skipped', id, err);
    }
  }
  return written;
}
