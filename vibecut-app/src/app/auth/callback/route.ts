import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth & Email Confirmation Callback Route Handler.
 * Exchanges authorization code for Supabase session cookies.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging auth code for session:", error.message);
        return NextResponse.redirect(
          new URL(`/?auth_error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }

      // Successful exchange, redirect to target destination
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (err) {
      console.error("Unexpected error in auth callback handler:", err);
    }
  }

  // Fallback redirect to home
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
