import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ConsultationWithClient, LawyerProfile } from "@/lib/types";
import { LawyerDashboardView } from "./lawyer-view";

export default async function LawyerDashboardPage() {
  const user = await requireRole("lawyer");
  const supabase = await createClient();

  const [profileResult, consultationsResult] = await Promise.all([
    supabase
      .from("lawyer_profiles")
      .select("lawyer_id, specialty, hourly_rate")
      .eq("lawyer_id", user.uid)
      .maybeSingle(),

    supabase
      .from("consultations")
      .select("*, client:client_id(uid, name, email, role)")
      .eq("lawyer_id", user.uid)
      .order("scheduled_at", { ascending: true }),
  ]);

  return (
    <LawyerDashboardView
      profile={(profileResult.data as LawyerProfile | null) ?? null}
      consultations={
        (consultationsResult.data ?? []) as unknown as ConsultationWithClient[]
      }
      loadError={
        profileResult.error?.message ?? consultationsResult.error?.message ?? null
      }
    />
  );
}
