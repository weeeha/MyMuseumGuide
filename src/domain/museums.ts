import type { Museum } from './types';

/**
 * Hard-coded museum list for v1. MMFA is the curated golden path
 * (Phase 3 will load a top-50 artifact bias pack for it). The others are
 * generic-mode entries.
 */
export const MUSEUMS: Museum[] = [
  {
    id: 'mmfa',
    name: 'Montreal Museum of Fine Arts',
    city: 'Montreal',
    country: 'Canada',
    topics: [
      'Quebec & Canadian Art',
      'European Old Masters',
      'Decorative Arts',
      'Indigenous Art',
      'Contemporary',
    ],
  },
  {
    id: 'moma',
    name: 'Museum of Modern Art',
    city: 'New York',
    country: 'USA',
    topics: ['Modern Art', 'Photography', 'Architecture & Design', 'Film'],
  },
  {
    id: 'met',
    name: 'The Met',
    city: 'New York',
    country: 'USA',
    topics: [
      'Egyptian Art',
      'European Paintings',
      'Greek & Roman',
      'American Wing',
      'Asian Art',
    ],
  },
  {
    id: 'louvre',
    name: 'Musée du Louvre',
    city: 'Paris',
    country: 'France',
    topics: [
      'Egyptian Antiquities',
      'Greek & Roman',
      'Italian Painting',
      'French Painting',
      'Sculpture',
    ],
  },
  {
    id: 'tate-modern',
    name: 'Tate Modern',
    city: 'London',
    country: 'UK',
    topics: ['Modern Art', 'Contemporary', 'Performance', 'Photography'],
  },
  {
    id: 'rijksmuseum',
    name: 'Rijksmuseum',
    city: 'Amsterdam',
    country: 'Netherlands',
    topics: [
      'Dutch Golden Age',
      'European Painting',
      'Asian Art',
      'Decorative Arts',
    ],
  },
];

export function findMuseum(id: string): Museum | undefined {
  return MUSEUMS.find((m) => m.id === id);
}
