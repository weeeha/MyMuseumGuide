import type { SupabaseClient } from '@supabase/supabase-js';

export interface NarrativeRecord {
  id: string;
  museumId: string;
  artifactKey: string;
  lang: string;
  level: string;
  title: string;
  artist?: string;
  period?: string;
  origin?: string;
  medium?: string;
  summary: string;
  story: string;
  tags: string[];
  followUps: { prompt: string; kind: string }[];
}

export interface NarrativesRepo {
  findByBucket(
    museumId: string,
    artifactKey: string,
    lang: string,
    level: string,
  ): Promise<NarrativeRecord | null>;
  findById(id: string): Promise<NarrativeRecord | null>;
  insert(record: NarrativeRecord): Promise<void>;
}

type Row = {
  id: string;
  museum_id: string;
  artifact_key: string;
  lang: string;
  level: string;
  title: string;
  artist: string | null;
  period: string | null;
  origin: string | null;
  medium: string | null;
  summary: string;
  story: string;
  tags: string[];
  follow_ups: { prompt: string; kind: string }[];
};

function toRecord(row: Row): NarrativeRecord {
  return {
    id: row.id,
    museumId: row.museum_id,
    artifactKey: row.artifact_key,
    lang: row.lang,
    level: row.level,
    title: row.title,
    artist: row.artist ?? undefined,
    period: row.period ?? undefined,
    origin: row.origin ?? undefined,
    medium: row.medium ?? undefined,
    summary: row.summary,
    story: row.story,
    tags: row.tags ?? [],
    followUps: row.follow_ups ?? [],
  };
}

export function createNarrativesRepo(db: SupabaseClient): NarrativesRepo {
  return {
    async findByBucket(museumId, artifactKey, lang, level) {
      const { data, error } = await db
        .from('narratives')
        .select('*')
        .eq('museum_id', museumId)
        .eq('artifact_key', artifactKey)
        .eq('lang', lang)
        .eq('level', level)
        .maybeSingle();
      if (error) throw new Error(`narratives lookup failed: ${error.message}`);
      return data ? toRecord(data as Row) : null;
    },
    async findById(id) {
      const { data, error } = await db
        .from('narratives')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(`narratives lookup failed: ${error.message}`);
      return data ? toRecord(data as Row) : null;
    },
    async insert(record) {
      const { error } = await db.from('narratives').insert({
        id: record.id,
        museum_id: record.museumId,
        artifact_key: record.artifactKey,
        lang: record.lang,
        level: record.level,
        title: record.title,
        artist: record.artist ?? null,
        period: record.period ?? null,
        origin: record.origin ?? null,
        medium: record.medium ?? null,
        summary: record.summary,
        story: record.story,
        tags: record.tags,
        follow_ups: record.followUps,
      });
      // Unique-violation race (two visitors, same Monet, same moment) is
      // benign: the first insert wins and both users already got their
      // stream. Swallow 23505, surface everything else.
      if (error && error.code !== '23505') {
        throw new Error(`narratives insert failed: ${error.message}`);
      }
    },
  };
}
