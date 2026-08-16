import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User, UserRole } from "@/lib/types";

/**
 * The signed-in user's `public.users` profile.
 *
 * Uses `auth.getUser()` — which revalidates the token with the Supabase
 * auth server — rather than `auth.getSession()`, which only decodes the
 * cookie and so can be spoofed. Wrapped in React `cache()` so a layout
 * and its page share one round trip per request.
 *
 * Redirects to /login when there is no valid session.
 */
export const getCurrentUser = cache(async (): Promise<User> => {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("uid, name, email, role")
    .eq("uid", authUser.id)
    .maybeSingle();

  if (profile) {
    return profile as User;
  }

  // Self-heal: the account exists in auth.users but the trigger in
  // supabase/schema.sql never mirrored it into public.users. Create the
  // row as a plain client — role escalation only happens via SQL.
  const { data: created, error } = await supabase
    .from("users")
    .insert({
      uid: authUser.id,
      name:
        (authUser.user_metadata?.full_name as string | undefined) ||
        authUser.email?.split("@")[0] ||
        "User",
      email: authUser.email ?? "",
      role: "client",
    })
    .select("uid, name, email, role")
    .single();

  if (error || !created) {
    throw new Error(
      `Could not load or create your profile. Run supabase/schema.sql in the Supabase SQL Editor. (${error?.message ?? "unknown error"})`
    );
  }

  return created as User;
});

/**
 * Guards a role-specific dashboard. A lawyer who opens /dashboard/admin
 * is sent to their own dashboard rather than shown an empty page.
 */
export async function requireRole(role: UserRole): Promise<User> {
  const user = await getCurrentUser();

  if (user.role !== role) {
    redirect(`/dashboard/${user.role}`);
  }

  return user;
}

/**
 * The authenticated Supabase client plus the caller's profile, for use
 * inside server actions. Throws rather than redirecting — callers turn
 * this into an `ActionResult`.
 */
export async function getActionContext() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("You are signed out. Please sign in again.");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("uid, name, email, role")
    .eq("uid", authUser.id)
    .maybeSingle();

  if (!profile) {
    throw new Error("Your profile could not be found.");
  }

  return { supabase, user: profile as User };
}
