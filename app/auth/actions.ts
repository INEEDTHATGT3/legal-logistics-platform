"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { LEGAL_SPECIALTIES } from "@/lib/types";

/**
 * Sign-in / sign-up return an ActionResult so the form can render the
 * error inline. On success they redirect — `redirect()` works by throwing
 * a control-flow signal, so it is always called outside a try/catch.
 */

export async function signIn(formData: FormData): Promise<ActionResult> {
  const email = (formData.get("email") as string | null)?.trim();
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return { ok: false, error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim();
  const password = formData.get("password") as string | null;
  const requestedRole = formData.get("role") as string | null;

  if (!name) return { ok: false, error: "Enter your full name." };
  if (!email) return { ok: false, error: "Enter your email." };
  if (!password || password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  // Only these two are self-serve. `admin` is granted with SQL — the
  // database trigger downgrades anything else to 'client' regardless, so
  // this check is a friendly message, not the security boundary.
  if (requestedRole !== "client" && requestedRole !== "lawyer") {
    return { ok: false, error: "Choose whether you are a client or a lawyer." };
  }

  const metadata: Record<string, string> = {
    full_name: name,
    role: requestedRole,
  };

  if (requestedRole === "lawyer") {
    const specialty = (formData.get("specialty") as string | null)?.trim();
    const rate = Number(formData.get("hourly_rate"));

    if (!specialty || !LEGAL_SPECIALTIES.includes(specialty as (typeof LEGAL_SPECIALTIES)[number])) {
      return { ok: false, error: "Select your area of practice." };
    }
    if (!Number.isFinite(rate) || rate < 0) {
      return { ok: false, error: "Enter an hourly rate of ₹0 or more." };
    }

    metadata.specialty = specialty;
    metadata.hourly_rate = String(rate);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // Projects with "Confirm email" enabled return a user but no session.
  if (!data.session) {
    return {
      ok: false,
      error: "Account created. Check your inbox to confirm the address, then sign in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
