import { randomUUID } from 'node:crypto';
import { narrativeStream, stageOne } from './_lib/ai';
import { createIdentifyHandler } from './_lib/identifyCore';
import { contextForMuseum } from './_lib/museumContext';
import { createNarrativesRepo } from './_lib/narrativesRepo';
import { getSupabase } from './_lib/supabase';

const handler = createIdentifyHandler({
  stageOne,
  narrativeStream,
  repo: createNarrativesRepo(getSupabase()),
  contextFor: contextForMuseum,
  newId: () => randomUUID(),
});

export default handler;
