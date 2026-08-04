-- TTS audio cache bucket (spec §5.3 — keyed by narrative id, see ttsCore).
-- Public so `getPublicUrl` links play without a signed request; writes only
-- ever happen with the service-role key, which bypasses RLS.
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do update set public = true;
