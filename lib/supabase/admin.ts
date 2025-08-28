/**
 * Supabase admin client for server-side operations
 * Uses service role key to bypass Row Level Security (RLS)
 * Should only be used in API routes and server-side operations
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Admin client with service role privileges
 * Bypasses RLS - use with caution and only for legitimate admin operations
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
