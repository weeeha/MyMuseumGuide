-- Narrative cache: one row per museum + artifact + language + level bucket.
-- Spec §5.3 — ten visitors photographing the same Monet pay for one
-- generation per bucket.
create table if not exists narratives (
  id uuid primary key,
  museum_id text not null,
  artifact_key text not null,
  lang text not null,
  level text not null,
  title text not null,
  artist text,
  period text,
  origin text,
  medium text,
  summary text not null,
  story text not null,
  tags jsonb not null default '[]',
  follow_ups jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (museum_id, artifact_key, lang, level)
);

-- Service-role key is the only consumer; lock the table down.
alter table narratives enable row level security;
