export type Theme = "light" | "dark";

/**
 * The theme is stored in a plain cookie rather than localStorage so the
 * server can render the correct `dark` class on <html> on the first
 * paint — no flash, and no hydration mismatch on the toggle icon.
 */
export const THEME_COOKIE = "nyaysetu-theme";

export function parseTheme(value: string | undefined): Theme {
  return value === "dark" ? "dark" : "light";
}
