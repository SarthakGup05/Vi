import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./client";

/**
 * Server-side Admin Supabase client using the Service Role Key.
 * Bypasses RLS to reliably manage guest sessions and background jobs.
 */
export function createAdminClient() {
  const url =
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)?.trim() ||
    "https://demo.supabase.co";
  const serviceKey =
    (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY
    )?.trim() || "";

  if (!isSupabaseConfigured() || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
