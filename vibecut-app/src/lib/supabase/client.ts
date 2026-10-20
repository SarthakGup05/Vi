import { createBrowserClient } from "@supabase/ssr";

/**
 * Checks if real Supabase environment variables are present and configured.
 * If not, the application gracefully activates Mock/Demo mode.
 */
export const isSupabaseConfigured = (): boolean => {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) return false;
  if (
    url === "https://your-project.supabase.co" ||
    key === "your_supabase_anon_key" ||
    !url.startsWith("http")
  ) {
    return false;
  }
  return true;
};

// Safe fallback credentials for mock/demo mode to prevent @supabase/ssr constructor crash
const FALLBACK_SUPABASE_URL = "https://demo.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.vibecut-mock-token";

/**
 * Browser-side Supabase client using @supabase/ssr.
 * Cookies are automatically synchronized with the browser document.cookie.
 */
export function createClient() {
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

  return createBrowserClient(url, key);
}
