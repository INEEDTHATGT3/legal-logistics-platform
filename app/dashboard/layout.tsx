import { RoleProvider } from "@/components/dashboard/role-context";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to /login when signed out, and repairs a missing
  // public.users row. Cached per request, so the page below reuses it.
  const currentUser = await getCurrentUser();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <RoleProvider initialUser={currentUser} initialTheme={theme}>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden">
          <DashboardSidebar />

          <div className="flex flex-1 flex-col overflow-hidden">
            <DashboardTopbar />

            <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </RoleProvider>
  );
}
