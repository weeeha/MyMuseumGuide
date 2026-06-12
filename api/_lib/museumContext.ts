/**
 * Curated per-museum context packs injected into prompts (spec §5.4).
 * MMFA is the launch golden path. Other listed museums get a thin pack;
 * scanned/unknown museums get ''.
 */
const PACKS: Record<string, string> = {
  mmfa: [
    'Museum: Montreal Museum of Fine Arts (Musée des beaux-arts de Montréal), Canada.',
    'Collection strengths: Quebec and Canadian art (including the Quebec Pavilion),',
    'European Old Masters (Rembrandt, El Greco, Veronese circle), Impressionism and',
    'post-Impressionism (Monet, Renoir, Cézanne), decorative arts and design,',
    'Indigenous art, and international contemporary art.',
    'Labels are bilingual French/English. Wall labels usually carry title, artist,',
    'date, medium, and credit line — trust a legible label over visual guessing.',
  ].join(' '),
  moma: 'Museum: Museum of Modern Art, New York. Strengths: modern and contemporary art, photography, design, film.',
  met: 'Museum: The Metropolitan Museum of Art, New York. Encyclopedic: Egyptian art, European paintings, Greek and Roman, the American Wing, Asian art.',
  louvre:
    'Museum: Musée du Louvre, Paris. Strengths: Egyptian antiquities, Greek and Roman sculpture, Italian and French painting. Labels in French.',
  'tate-modern':
    'Museum: Tate Modern, London. Strengths: international modern and contemporary art, performance, photography.',
  rijksmuseum:
    'Museum: Rijksmuseum, Amsterdam. Strengths: Dutch Golden Age painting (Rembrandt, Vermeer), Asian art, decorative arts. Labels in Dutch and English.',
};

export function contextForMuseum(museumId?: string): string {
  if (!museumId) return '';
  return PACKS[museumId] ?? '';
}
