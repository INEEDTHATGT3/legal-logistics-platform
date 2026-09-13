"use client";

import { RoleProvider } from "@/components/dashboard/role-context";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Client-side shell. There is no server on a static export, so the
 * persona comes from the URL and the demo state comes from the browser —
 * both handled inside `RoleProvider`.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProvider>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden">
          <DashboardSidebar />

          <div className="flex flex-1 flex-col overflow-hidden">
            <DashboardTopbar />

            <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </RoleProvider>
  );
}
