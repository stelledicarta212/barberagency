"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function hasCompletedOnboarding() {
  try {
    if (localStorage.getItem("ba_onboarding_done") === "true") return true;

    const raw = localStorage.getItem("ba_onboarding_barberia");
    if (!raw) return false;

    const data = JSON.parse(raw);
    const nombre = (data?.barberia?.nombre ?? "").toString().trim();
    const servicios = Array.isArray(data?.servicios) ? data.servicios : [];
    const barberos = Array.isArray(data?.barberos) ? data.barberos : [];
    const accesos = data?.accesos ?? {};
    const adminEmail = (accesos?.admin?.email ?? "").toString().trim();
    const adminPassword = (accesos?.admin?.password ?? "").toString().trim();
    const barberosAcceso = Array.isArray(accesos?.barberos) ? accesos.barberos : [];
    const activeBarberosWithCredentials = barberosAcceso.filter(
      (barber: { activo?: boolean; email?: string; password?: string }) =>
        Boolean(barber?.activo) &&
        (barber?.email ?? "").toString().trim().length > 0 &&
        (barber?.password ?? "").toString().trim().length >= 6,
    );
    const branding = data?.branding ?? {};
    const paletteId = (branding?.palette_id ?? "").toString().trim();
    const templateId = (branding?.template_id ?? "").toString().trim();

    return (
      nombre.length > 2 &&
      servicios.length > 0 &&
      barberos.length > 0 &&
      adminEmail.length > 0 &&
      adminPassword.length >= 6 &&
      activeBarberosWithCredentials.length > 0 &&
      paletteId.length > 0 &&
      templateId.length > 0
    );
  } catch {
    return false;
  }
}

export function OnboardingGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const isOnboardingRoute =
    pathname === "/barberia" || pathname?.startsWith("/barberia/") || false;

  useEffect(() => {
    if (!pathname) return;
    if (isOnboardingRoute) return;
    if (localStorage.getItem("ba_user_role") === "barbero") return;

    if (!hasCompletedOnboarding()) {
      router.replace("/barberia?onboarding=1");
    }
  }, [isOnboardingRoute, pathname, router]);
  return null;
}
