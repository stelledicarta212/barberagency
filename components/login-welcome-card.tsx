"use client";

import { Scissors, ShieldCheck, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

type SessionRole = "admin" | "barbero";

type WelcomeState = {
  open: boolean;
  role: SessionRole;
  email: string;
  name: string;
  logoUrl: string;
};

type DraftAccess = {
  admin?: { nombre?: string; email?: string };
  barberos?: Array<{ nombre?: string; email?: string; activo?: boolean }>;
};

type DraftBarberia = {
  logo_url?: string | null;
};

type OnboardingDraft = {
  accesos?: DraftAccess;
  barberia?: DraftBarberia;
};

const WELCOME_CARD_IMAGE_SRC = "/welcome-card-image.png";

function normalizeRole(value: string | null): SessionRole {
  return value === "barbero" ? "barbero" : "admin";
}

function clean(value: unknown) {
  return (value ?? "").toString().trim();
}

function displayNameFromEmail(email: string) {
  const base = clean(email.split("@")[0]);
  if (!base) return "Usuario";
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function toTitleCase(value: string) {
  return clean(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function readOnboardingDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem("ba_onboarding_barberia");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingDraft;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function resolveUserName(email: string, draft: OnboardingDraft | null) {
  const target = clean(email).toLowerCase();
  if (!target || !draft?.accesos) return "";

  const admin = draft.accesos.admin;
  if (clean(admin?.email).toLowerCase() === target) {
    return clean(admin?.nombre);
  }

  const barberos = Array.isArray(draft.accesos.barberos) ? draft.accesos.barberos : [];
  const found = barberos.find((barber) => clean(barber?.email).toLowerCase() === target);
  return clean(found?.nombre);
}

function roleLabel(role: SessionRole) {
  return role === "admin" ? "Administrador" : "Barbero";
}

function roleMessage(role: SessionRole) {
  return role === "admin"
    ? "Gracias, tu cuenta de administrador ya esta lista."
    : "Gracias, tu acceso de barbero ya esta listo.";
}

function buildInitialState(): WelcomeState {
  if (typeof window === "undefined") {
    return { open: false, role: "admin", email: "", name: "", logoUrl: "" };
  }

  try {
    const shouldShow = localStorage.getItem("ba_show_login_welcome") === "1";
    if (!shouldShow) {
      return { open: false, role: "admin", email: "", name: "", logoUrl: "" };
    }

    const role = normalizeRole(localStorage.getItem("ba_user_role"));
    const email = clean(localStorage.getItem("ba_user_email"));
    const draft = readOnboardingDraft();
    const resolvedName =
      resolveUserName(email, draft) ||
      clean(localStorage.getItem("ba_user_nombre")) ||
      displayNameFromEmail(email);
    const logoUrl = clean(draft?.barberia?.logo_url);

    return {
      open: true,
      role,
      email,
      name: resolvedName,
      logoUrl,
    };
  } catch {
    return { open: false, role: "admin", email: "", name: "", logoUrl: "" };
  }
}

export function LoginWelcomeCard() {
  const [state, setState] = useState<WelcomeState>(buildInitialState);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!state.open) return;
    try {
      localStorage.removeItem("ba_show_login_welcome");
    } catch {
      // noop
    }
  }, [state.open]);

  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/78 p-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-[620px] rounded-[30px] border border-[var(--line)] bg-[linear-gradient(160deg,#020817_0%,#061325_100%)] p-6 shadow-[0_26px_60px_rgba(2,6,23,0.62)] sm:p-9">
        <button
          type="button"
          onClick={() => setState((prev) => ({ ...prev, open: false }))}
          aria-label="Cerrar bienvenida"
          className="absolute right-4 top-4 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-1.5 text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
        >
          <X className="size-4" />
        </button>

        <div className="mx-auto h-40 w-40 overflow-hidden rounded-sm bg-zinc-100 ring-1 ring-white/20 sm:h-44 sm:w-44">
          {!imageError ? (
            <img
              src={WELCOME_CARD_IMAGE_SRC}
              alt="Imagen de bienvenida"
              className="h-full w-full scale-110 object-cover object-center"
              onError={() => setImageError(true)}
            />
          ) : state.logoUrl ? (
            <div
              className="h-full w-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${state.logoUrl}")` }}
              aria-label="Logo de barberia"
              role="img"
            />
          ) : state.role === "admin" ? (
            <ShieldCheck className="size-16 text-slate-900" />
          ) : (
            <Scissors className="size-16 text-slate-900" />
          )}
        </div>

        <h2 className="mt-6 text-center text-4xl font-black tracking-tight text-zinc-50">
          Hola, {toTitleCase(state.name) || "Usuario"}!
        </h2>
        <p className="mt-3 text-center text-3xl font-semibold text-zinc-100/95">
          {roleMessage(state.role)}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] px-3 py-1 font-bold uppercase tracking-wide text-zinc-100">
            <Sparkles className="size-3.5 text-[var(--accent)]" />
            {roleLabel(state.role)}
          </span>
          {state.email ? (
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-1 font-semibold text-zinc-300">
              {state.email}
            </span>
          ) : null}
        </div>

        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, open: false }))}
            className="rounded-lg bg-[var(--accent)] px-8 py-3 text-2xl font-black text-white transition hover:bg-[var(--accent-strong)]"
          >
            Inicia tu aventura ahora!
          </button>
        </div>
      </div>
    </div>
  );
}
