import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnv } from './env';

let client: SupabaseClient | null = null;

/**
 * Lazy singleton Supabase client. Throws at first call if the required env
 * vars are missing — intentional fail-loud at cold start (spec note in Task 10).
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
  }
  return client;
}
