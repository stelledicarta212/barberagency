"use client";

import { Moon, SunMedium } from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

type PublicThemeToggleProps = {
  initialTheme: ThemeMode;
  className?: string;
  style?: CSSProperties;
};

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("ba_public_theme", theme);
}

function writeThemeCookie(theme: ThemeMode) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `ba_public_theme=${theme}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function PublicThemeToggle({
  initialTheme,
  className,
  style,
}: PublicThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    writeThemeCookie(nextTheme);
    window.location.reload();
  }

  const label = theme === "dark" ? "Tema claro" : "Tema oscuro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold transition hover:opacity-90 ${className ?? ""}`.trim()}
      style={style}
      aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"}
      title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      {theme === "dark" ? <SunMedium className="size-4" /> : <Moon className="size-4" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
