export type Theme = "light" | "dark";

/**
 * The static export has no server to read a cookie on, so the choice
 * lives in localStorage and is applied after mount. `ThemeScript` in the
 * root layout paints it before first paint to avoid a light flash.
 */
export const THEME_STORAGE_KEY = "nyaysetu-theme";

export function parseTheme(value: string | null | undefined): Theme {
  return value === "dark" ? "dark" : "light";
}

export function readStoredTheme(): Theme {
  try {
    return parseTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "light";
  }
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable — the theme just will not survive a refresh.
  }
}
