import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Refreshes the Supabase auth cookie on every dashboard request and
 * bounces signed-out visitors to /login.
 *
 * This is an optimistic check only — the real authorization happens in
 * `lib/auth.ts`, which verifies the token with the auth server and looks
 * up the caller's role. See node_modules/next/dist/docs/01-app/02-guides/
 * authentication.md ("Optimistic checks with Proxy").
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Session cookies only need refreshing on routes that read them.
  matcher: ["/", "/dashboard/:path*"],
};
