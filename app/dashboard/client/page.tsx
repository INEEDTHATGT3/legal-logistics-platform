import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type {
  ConsultationWithLawyer,
  Delivery,
  LawyerWithUser,
} from "@/lib/types";
import { ClientDashboardView } from "./client-view";

export default async function ClientDashboardPage() {
  const user = await requireRole("client");
  const supabase = await createClient();

  const [lawyersResult, consultationsResult, deliveriesResult] =
    await Promise.all([
      // Directory of every advocate, with their name/email from users.
      supabase
        .from("lawyer_profiles")
        .select("lawyer_id, specialty, hourly_rate, user:lawyer_id(uid, name, email, role)")
        .order("hourly_rate", { ascending: true }),

      // My consultations, with the lawyer I booked.
      supabase
        .from("consultations")
        .select("*, lawyer:lawyer_id(uid, name, email, role)")
        .eq("client_id", user.uid)
        .order("scheduled_at", { ascending: true }),

      // My deliveries, newest first.
      supabase
        .from("deliveries")
        .select("*")
        .eq("client_id", user.uid)
        .order("created_at", { ascending: false }),
    ]);

  return (
    <ClientDashboardView
      lawyers={(lawyersResult.data ?? []) as unknown as LawyerWithUser[]}
      consultations={
        (consultationsResult.data ?? []) as unknown as ConsultationWithLawyer[]
      }
      deliveries={(deliveriesResult.data ?? []) as Delivery[]}
      loadError={
        lawyersResult.error?.message ??
        consultationsResult.error?.message ??
        deliveriesResult.error?.message ??
        null
      }
    />
  );
}
