import { describe, expect, it, vi } from 'vitest';
import { createNarrativesRepo, type NarrativeRecord } from './narrativesRepo';

const record: NarrativeRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  museumId: 'mmfa',
  artifactKey: 'impression-soleil-levant--claude-monet',
  lang: 'en',
  level: 'curious',
  title: 'Impression, soleil levant',
  artist: 'Claude Monet',
  period: '1872',
  origin: 'France',
  medium: 'Oil on canvas',
  summary: 'The painting that named a movement.',
  story: 'Look at the orange disc…',
  tags: ['impressionism'],
  followUps: [{ prompt: 'What movement is this?', kind: 'movement' }],
};

function fakeSupabase(row: unknown) {
  const maybeSingle = vi.fn(async () => ({ data: row, error: null }));
  const insert = vi.fn(async () => ({ error: null }));
  type Chain = {
    select: () => Chain;
    eq: () => Chain;
    insert: typeof insert;
    maybeSingle: typeof maybeSingle;
  };
  const chain: Chain = {
    select: () => chain,
    eq: () => chain,
    insert,
    maybeSingle,
  };
  return { from: vi.fn(() => chain), chain };
}

describe('createNarrativesRepo', () => {
  it('maps a snake_case row to a NarrativeRecord on findByBucket', async () => {
    const db = fakeSupabase({
      id: record.id,
      museum_id: 'mmfa',
      artifact_key: record.artifactKey,
      lang: 'en',
      level: 'curious',
      title: record.title,
      artist: record.artist,
      period: record.period,
      origin: record.origin,
      medium: record.medium,
      summary: record.summary,
      story: record.story,
      tags: record.tags,
      follow_ups: record.followUps,
    });
    const repo = createNarrativesRepo(db as never);
    const found = await repo.findByBucket('mmfa', record.artifactKey, 'en', 'curious');
    expect(found).toEqual(record);
    expect(db.from).toHaveBeenCalledWith('narratives');
  });

  it('returns null when no row matches', async () => {
    const db = fakeSupabase(null);
    const repo = createNarrativesRepo(db as never);
    expect(await repo.findById('missing')).toBeNull();
  });

  it('inserts snake_case columns', async () => {
    const db = fakeSupabase(null);
    const repo = createNarrativesRepo(db as never);
    await repo.insert(record);
    expect(db.chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        museum_id: 'mmfa',
        artifact_key: record.artifactKey,
        follow_ups: record.followUps,
      }),
    );
  });
});
