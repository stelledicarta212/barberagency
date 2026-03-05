"use client";

import { Moon, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("ba_theme", theme);
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";

  const fromHtml = document.documentElement.dataset.theme;
  if (isThemeMode(fromHtml)) return fromHtml;

  const fromStorage = localStorage.getItem("ba_theme");
  if (isThemeMode(fromStorage)) return fromStorage;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
      aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"}
      title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      {theme === "dark" ? (
        <>
          <SunMedium className="size-4" />
          <span className="hidden sm:inline">Tema claro</span>
        </>
      ) : (
        <>
          <Moon className="size-4" />
          <span className="hidden sm:inline">Tema oscuro</span>
        </>
      )}
    </button>
  );
}
