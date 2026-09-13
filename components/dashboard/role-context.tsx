"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User, UserRole } from "@/lib/types";
import type { Theme } from "@/lib/theme";
import {
  hydrateDemoStore,
  selectPersona,
  toggleTheme,
  useDemoUser,
  useTheme,
} from "@/lib/demo-store";

// ── Context Shape ────────────────────────────────────────────────────
interface RoleContextValue {
  role: UserRole;
  currentUser: User;
  switchPersona: (persona: UserRole) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

/**
 * The URL is the single source of truth for which persona is active, so
 * a direct link to `/dashboard/admin/` lands in the right dashboard on a
 * cold load — which matters once the site is a set of static files with
 * no server to redirect.
 */
function personaFromPath(pathname: string | null): UserRole {
  const match = pathname?.match(/\/dashboard\/(client|lawyer|admin)\b/);
  return (match?.[1] as UserRole | undefined) ?? "client";
}

// ── Provider ─────────────────────────────────────────────────────────
export function RoleProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const role = personaFromPath(usePathname());
  const currentUser = useDemoUser(role);
  // Theme lives in the demo store rather than component state: it is
  // really browser state (an <html> class plus localStorage) that the
  // inline script in the root layout applies before React mounts.
  const theme = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Pulls the saved scenario and theme out of localStorage — neither can
  // be read during render on a statically exported page.
  useEffect(() => {
    hydrateDemoStore();
  }, []);

  // Keep the store aligned with the route, so the mutations in
  // `lib/demo-reducers.ts` apply the right role guard.
  useEffect(() => {
    selectPersona(role);
  }, [role]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // Navigating is the switch: the route change re-runs the effect above
  // and the whole dashboard follows.
  const switchPersona = useCallback(
    (persona: UserRole) => {
      router.push(`/dashboard/${persona}`);
    },
    [router]
  );

  return (
    <RoleContext.Provider
      value={{
        role,
        currentUser,
        switchPersona,
        sidebarCollapsed,
        toggleSidebar,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────
export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used inside <RoleProvider>");
  }
  return ctx;
}
