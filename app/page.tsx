import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Sends each signed-in user to the dashboard for their role. */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("uid", user.id)
    .maybeSingle();

  // A missing profile row is repaired by the dashboard layout, so send
  // them to the client dashboard and let it self-heal.
  redirect(`/dashboard/${profile?.role ?? "client"}`);
}
