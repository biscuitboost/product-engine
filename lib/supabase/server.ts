/**
 * Supabase Client for Server-Side
 * Uses service_role key to bypass Row Level Security (RLS)
 * Only use in API routes and server components
 */

import { createClient } from '@supabase/supabase-js';

export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
