"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, UserRole } from "@/lib/types";
import { THEME_COOKIE, type Theme } from "@/lib/theme";

// ── Context Shape ────────────────────────────────────────────────────
interface RoleContextValue {
  role: UserRole;
  currentUser: User;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────
export function RoleProvider({
  children,
  initialUser,
  initialTheme,
}: {
  children: ReactNode;
  initialUser: User;
  initialTheme: Theme;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  // Push the choice out to the two external systems that hold it: the
  // <html> class Tailwind reads, and the cookie the server reads on the
  // next request.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  }, [theme]);

  return (
    <RoleContext.Provider
      value={{
        role: initialUser.role,
        currentUser: initialUser,
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
