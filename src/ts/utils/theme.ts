export type Theme = "light" | "night";
const THEME_KEY = "z8_theme";

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
}

export function getInitialTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "light" || t === "night") return t;
  } catch {}
  const prefersDark = typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "night" : "light";
}
