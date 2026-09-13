"use client";

import { DEMO_PERSONAS } from "@/lib/demo-data";
import {
  selectClientConsultations,
  selectClientDeliveries,
  selectLawyerDirectory,
  useDemoReady,
  useDemoState,
} from "@/lib/demo-store";
import { DashboardSkeleton } from "@/components/demo/dashboard-skeleton";
import { ClientDashboardView } from "./client-view";

export default function ClientDashboardPage() {
  const ready = useDemoReady();
  const demo = useDemoState();

  if (!ready) return <DashboardSkeleton />;

  const clientId = DEMO_PERSONAS.client.uid;

  return (
    <ClientDashboardView
      lawyers={selectLawyerDirectory(demo)}
      consultations={selectClientConsultations(demo, clientId)}
      deliveries={selectClientDeliveries(demo, clientId)}
      loadError={null}
    />
  );
}
