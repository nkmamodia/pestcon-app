import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Used inside client components ('use client')
export function getSupabaseClient() {
  return createClientComponentClient();
}
