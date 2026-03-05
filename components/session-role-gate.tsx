"use client";

import { useEffect, useState, type ReactNode } from "react";

export type SessionRole = "admin" | "barbero";

const ROLE_STORAGE_KEY = "ba_user_role";

function normalizeRole(value: string | null | undefined): SessionRole {
  return value === "barbero" ? "barbero" : "admin";
}

function readRole(): SessionRole {
  if (typeof window === "undefined") return "barbero";
  const stored = localStorage.getItem(ROLE_STORAGE_KEY);
  return stored ? normalizeRole(stored) : "barbero";
}

export function useSessionRole() {
  const [role, setRole] = useState<SessionRole>(readRole);

  useEffect(() => {
    const refreshRole = () => setRole(readRole());

    const refreshRoleFromSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) {
          localStorage.removeItem(ROLE_STORAGE_KEY);
          setRole("barbero");
          return;
        }

        const data = (await response.json()) as { role?: string };
        const nextRole = normalizeRole(data.role ?? null);
        localStorage.setItem(ROLE_STORAGE_KEY, nextRole);
        setRole(nextRole);
      } catch {
        refreshRole();
      }
    };

    refreshRoleFromSession();
    window.addEventListener("focus", refreshRole);
    window.addEventListener("storage", refreshRole);

    return () => {
      window.removeEventListener("focus", refreshRole);
      window.removeEventListener("storage", refreshRole);
    };
  }, []);

  return role;
}

type AdminOnlyProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const role = useSessionRole();

  if (role !== "admin") return <>{fallback}</>;
  return <>{children}</>;
}
