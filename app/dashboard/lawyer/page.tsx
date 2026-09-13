"use client";

import { DEMO_PERSONAS } from "@/lib/demo-data";
import {
  selectLawyerConsultations,
  selectLawyerProfile,
  useDemoReady,
  useDemoState,
} from "@/lib/demo-store";
import { DashboardSkeleton } from "@/components/demo/dashboard-skeleton";
import { LawyerDashboardView } from "./lawyer-view";

export default function LawyerDashboardPage() {
  const ready = useDemoReady();
  const demo = useDemoState();

  if (!ready) return <DashboardSkeleton />;

  const lawyerId = DEMO_PERSONAS.lawyer.uid;

  return (
    <LawyerDashboardView
      profile={selectLawyerProfile(demo, lawyerId)}
      consultations={selectLawyerConsultations(demo, lawyerId)}
      loadError={null}
    />
  );
}
