import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./client";

const FALLBACK_SUPABASE_URL = "https://demo.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.vibecut-mock-token";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and Server Actions.
 * Conforms to Next.js 15+ / 16 asynchronous cookies() pattern.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const isConfigured = isSupabaseConfigured();
  const url = isConfigured
    ? (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!
    : FALLBACK_SUPABASE_URL;
  const key = isConfigured
    ? (
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.SUPABASE_PUBLISHABLE_KEY
      )!
    : FALLBACK_SUPABASE_ANON_KEY;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
