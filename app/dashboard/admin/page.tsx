"use client";

import { selectAllDeliveries, useDemoReady, useDemoState } from "@/lib/demo-store";
import { DashboardSkeleton } from "@/components/demo/dashboard-skeleton";
import { AdminDashboardView } from "./admin-view";

export default function AdminDashboardPage() {
  const ready = useDemoReady();
  const demo = useDemoState();

  if (!ready) return <DashboardSkeleton />;

  return (
    <AdminDashboardView deliveries={selectAllDeliveries(demo)} loadError={null} />
  );
}
