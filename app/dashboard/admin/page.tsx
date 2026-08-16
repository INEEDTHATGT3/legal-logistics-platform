import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { DeliveryWithClient } from "@/lib/types";
import { AdminDashboardView } from "./admin-view";

export default async function AdminDashboardPage() {
  await requireRole("admin");
  const supabase = await createClient();

  // RLS lets an admin read every delivery; a client only ever sees their own.
  const { data, error } = await supabase
    .from("deliveries")
    .select("*, client:client_id(uid, name, email, role)")
    .order("created_at", { ascending: false });

  return (
    <AdminDashboardView
      deliveries={(data ?? []) as unknown as DeliveryWithClient[]}
      loadError={error?.message ?? null}
    />
  );
}
