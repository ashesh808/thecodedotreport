import React from "react";
import { applyTheme, getInitialTheme, Theme } from "@/utils/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>(() => getInitialTheme());

  const flip = () => {
    const next: Theme = theme === "night" ? "light" : "night";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button className="btn btn-sm" onClick={flip} title="Toggle theme">
      {theme === "night" ? "🌙 Night" : " ☀️ Day"}
    </button>
  );
}
