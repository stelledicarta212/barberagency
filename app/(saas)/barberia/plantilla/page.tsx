"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Palette, Save } from "lucide-react";

type SaveState =
  | { type: "idle"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type OnboardingDraft = {
  barberia: {
    nombre: string;
    slug: string;
    descripcion: string;
    logo_url: string | null;
    telefono: string;
    direccion: string;
    ciudad: string;
    timezone: string;
    slot_min: number;
  };
  servicios: Array<{
    nombre: string;
    duracion_min: number;
    precio: number;
  }>;
  barberos: Array<{
    nombre: string;
    especialidad: string | null;
    foto_url: string | null;
    activo: boolean;
  }>;
  horarios: Array<{
    dia: string;
    activo: boolean;
    hora_abre: string;
    hora_cierra: string;
  }>;
  accesos?: {
    admin: {
      nombre: string;
      email: string;
      password: string;
    };
    barberos: Array<{
      nombre: string;
      email: string;
      password: string;
      activo: boolean;
    }>;
  };
  branding?: Record<string, unknown>;
};

type TemplateOption = {
  id: string;
  name: string;
  hero: string;
  subtitle: string;
};

type PaletteOption = {
  id: string;
  name: string;
  description: string;
  mode: "dark" | "light";
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
};

const templateOptions: TemplateOption[] = [
  {
    id: "classic",
    name: "Classic Barber",
    hero: "Estilo clasico, agenda moderna.",
    subtitle: "Ideal para barberias tradicionales con enfoque familiar.",
  },
  {
    id: "urban",
    name: "Urban Fade",
    hero: "Cortes precisos para una marca que impone.",
    subtitle: "Visual moderno para clientes jovenes y urbanos.",
  },
  {
    id: "premium",
    name: "Premium Lounge",
    hero: "Experiencia premium desde la primera cita.",
    subtitle: "Para negocios que venden experiencia y detalle.",
  },
];

const paletteOptions: PaletteOption[] = [
  {
    id: "barber-red-blue",
    name: "Rojo + Azul Clasico",
    description: "Inspirado en el poste de barberia tradicional.",
    mode: "dark",
    primary: "#dc2626",
    secondary: "#2563eb",
    background: "#090f1a",
    surface: "#111827",
    text: "#f8fafc",
  },
  {
    id: "barber-black-white",
    name: "Negro + Blanco",
    description: "Minimalista y elegante para una imagen limpia.",
    mode: "light",
    primary: "#111827",
    secondary: "#e5e7eb",
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#111827",
  },
  {
    id: "barber-gold-night",
    name: "Dorado + Noche",
    description: "Look premium para marcas de alto ticket.",
    mode: "dark",
    primary: "#ca8a04",
    secondary: "#1e293b",
    background: "#020617",
    surface: "#0f172a",
    text: "#e2e8f0",
  },
  {
    id: "barber-carbon",
    name: "Carbon + Acero",
    description: "Paleta sobria para imagen profesional moderna.",
    mode: "dark",
    primary: "#475569",
    secondary: "#94a3b8",
    background: "#0b1120",
    surface: "#111827",
    text: "#e2e8f0",
  },
];

function readDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem("ba_onboarding_barberia");
    if (!raw) return null;
    const data = JSON.parse(raw) as OnboardingDraft;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

function safeString(value: unknown) {
  return (value ?? "").toString().trim();
}

function hasCredentialSetup(draft: OnboardingDraft | null) {
  const adminEmail = safeString(draft?.accesos?.admin?.email);
  const adminPassword = safeString(draft?.accesos?.admin?.password);
  const activeBarberos = Array.isArray(draft?.accesos?.barberos)
    ? draft.accesos!.barberos.filter((barber) => barber.activo)
    : [];

  return adminEmail.length > 0 && adminPassword.length >= 6 && activeBarberos.length > 0;
}

export default function BarberiaTemplatePage() {
  const router = useRouter();
  const [draft] = useState<OnboardingDraft | null>(() => {
    if (typeof window === "undefined") return null;
    return readDraft();
  });
  const [templateId, setTemplateId] = useState(() => {
    if (typeof window === "undefined") return templateOptions[0]?.id ?? "classic";
    const fromDraft = safeString(readDraft()?.branding?.template_id);
    return fromDraft || (templateOptions[0]?.id ?? "classic");
  });
  const [paletteId, setPaletteId] = useState(() => {
    if (typeof window === "undefined") return paletteOptions[0]?.id ?? "barber-red-blue";
    const fromDraft = safeString(readDraft()?.branding?.palette_id);
    return fromDraft || (paletteOptions[0]?.id ?? "barber-red-blue");
  });
  const [ctaLabel, setCtaLabel] = useState(() => {
    if (typeof window === "undefined") return "Reservar cita";
    const fromDraft = safeString(readDraft()?.branding?.cta_label);
    return fromDraft || "Reservar cita";
  });
  const [saveState, setSaveState] = useState<SaveState>({
    type: "idle",
    message: "",
  });

  useEffect(() => {
    if (!draft) router.replace("/barberia?onboarding=1");
  }, [draft, router]);

  const currentTemplate = useMemo(
    () =>
      templateOptions.find((template) => template.id === templateId) ??
      templateOptions[0],
    [templateId],
  );

  const currentPalette = useMemo(
    () => paletteOptions.find((palette) => palette.id === paletteId) ?? paletteOptions[0],
    [paletteId],
  );

  const activeServices = useMemo(() => {
    if (!draft?.servicios?.length) return [];
    return draft.servicios.filter((service) => service.nombre?.trim()).slice(0, 3);
  }, [draft]);

  const activeBarbers = useMemo(() => {
    if (!draft?.barberos?.length) return [];
    return draft.barberos
      .filter((barber) => barber.activo && barber.nombre?.trim())
      .slice(0, 3);
  }, [draft]);

  function buildBrandingPayload() {
    const safeCtaLabel = ctaLabel.trim() || "Reservar cita";
    return {
      template_id: currentTemplate.id,
      template_name: currentTemplate.name,
      template_hero: currentTemplate.hero,
      palette_id: currentPalette.id,
      palette_name: currentPalette.name,
      theme_mode: currentPalette.mode,
      color_primary: currentPalette.primary,
      color_secondary: currentPalette.secondary,
      color_background: currentPalette.background,
      color_surface: currentPalette.surface,
      color_text: currentPalette.text,
      cta_label: safeCtaLabel,
      updated_at: new Date().toISOString(),
    };
  }

  function saveBranding(completeOnboarding: boolean) {
    if (!draft) {
      setSaveState({
        type: "error",
        message: "No hay datos de barberia. Vuelve al paso 1.",
      });
      return false;
    }

    const payload: OnboardingDraft = {
      ...draft,
      branding: buildBrandingPayload(),
    };

    if (completeOnboarding && !hasCredentialSetup(payload)) {
      setSaveState({
        type: "error",
        message:
          "Completa credenciales del admin y al menos un barbero activo en el paso 1.",
      });
      return false;
    }

    localStorage.setItem("ba_onboarding_barberia", JSON.stringify(payload));

    if (completeOnboarding) {
      localStorage.setItem("ba_onboarding_done", "true");
      setSaveState({
        type: "success",
        message: "Listo. Tu onboarding quedo finalizado.",
      });
      return true;
    }

    localStorage.removeItem("ba_onboarding_done");
    setSaveState({
      type: "success",
      message: "Estilo guardado. Puedes ajustar mas antes de finalizar.",
    });
    return true;
  }

  async function handleFinish() {
    const ok = saveBranding(true);
    if (!ok) return;

    const adminEmail = safeString(draft?.accesos?.admin?.email).toLowerCase();
    const adminPassword = (draft?.accesos?.admin?.password ?? "").toString();
    if (adminEmail) localStorage.setItem("ba_login_prefill_email", adminEmail);
    if (adminPassword) localStorage.setItem("ba_login_prefill_password", adminPassword);
    localStorage.setItem("ba_login_prefill_source", "onboarding");

    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
    localStorage.removeItem("ba_user_role");
    localStorage.removeItem("ba_user_id");
    localStorage.removeItem("ba_user_email");
    router.push("/login?onboarding=1");
  }

  if (!draft || !currentTemplate || !currentPalette) {
    return (
      <section className="panel animate-rise p-5">
        <p className="text-sm text-zinc-300">Cargando configuracion de plantilla...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5 overflow-x-hidden pb-8">
      <div className="animate-rise flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="title-gradient text-2xl font-black tracking-tight sm:text-3xl">
            Paso 2: Colores y plantilla
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Personaliza la imagen de tu barberia con base en los datos del paso 1.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/barberia")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-bold text-zinc-100 transition hover:border-zinc-500 sm:w-auto"
          >
            <ArrowLeft className="size-4" />
            Volver a datos
          </button>
          <button
            type="button"
            onClick={() => saveBranding(false)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-bold text-zinc-100 transition hover:border-zinc-500 sm:w-auto"
          >
            <Save className="size-4" />
            Guardar estilo
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--accent-strong)] sm:w-auto"
          >
            Finalizar onboarding
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      {saveState.message ? (
        <div
          className={`panel animate-rise p-3 text-sm font-semibold ${
            saveState.type === "error" ? "text-red-300" : "text-emerald-300"
          }`}
        >
          {saveState.message}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className="panel animate-rise p-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-zinc-300">
            <Palette className="size-4 text-[var(--accent)]" />
            Plantilla base
          </h2>
          <div className="mt-3 grid gap-2">
            {templateOptions.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setTemplateId(template.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  template.id === currentTemplate.id
                    ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface-muted))]"
                    : "border-[var(--line)] bg-[var(--surface-muted)] hover:border-zinc-500"
                }`}
              >
                <p className="text-sm font-bold text-zinc-100">{template.name}</p>
                <p className="mt-1 text-xs text-zinc-400">{template.subtitle}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="panel-muted animate-rise p-4" style={{ animationDelay: "50ms" }}>
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-300">
            Resumen de negocio
          </h2>
          <div className="mt-3 space-y-2 text-sm text-zinc-200">
            <p>
              <span className="text-zinc-400">Barberia:</span>{" "}
              <strong>{draft.barberia?.nombre || "Sin nombre"}</strong>
            </p>
            <p>
              <span className="text-zinc-400">Ciudad:</span>{" "}
              <strong>{draft.barberia?.ciudad || "Sin ciudad"}</strong>
            </p>
            <p>
              <span className="text-zinc-400">Servicios:</span>{" "}
              <strong>{draft.servicios?.length ?? 0}</strong>
            </p>
            <p>
              <span className="text-zinc-400">Barberos:</span>{" "}
              <strong>{draft.barberos?.length ?? 0}</strong>
            </p>
            <p>
              <span className="text-zinc-400">Admin login:</span>{" "}
              <strong>{safeString(draft.accesos?.admin?.email) || "Sin configurar"}</strong>
            </p>
          </div>
        </article>
      </div>

      <article className="panel animate-rise p-4" style={{ animationDelay: "90ms" }}>
        <h2 className="text-sm font-black uppercase tracking-wide text-zinc-300">
          Paleta de color
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {paletteOptions.map((palette) => (
            <button
              key={palette.id}
              type="button"
              onClick={() => setPaletteId(palette.id)}
              className={`rounded-xl border p-3 text-left transition ${
                palette.id === currentPalette.id
                  ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface-muted))]"
                  : "border-[var(--line)] bg-[var(--surface-muted)] hover:border-zinc-500"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-zinc-100">{palette.name}</p>
                <div className="flex items-center gap-1">
                  <span
                    className="size-4 rounded-full border border-zinc-700"
                    style={{ backgroundColor: palette.primary }}
                  />
                  <span
                    className="size-4 rounded-full border border-zinc-700"
                    style={{ backgroundColor: palette.secondary }}
                  />
                  <span
                    className="size-4 rounded-full border border-zinc-700"
                    style={{ backgroundColor: palette.background }}
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-zinc-400">{palette.description}</p>
            </button>
          ))}
        </div>

        <label className="mt-4 block space-y-1 text-sm">
          <span className="text-zinc-300">Texto del boton principal</span>
          <input
            value={ctaLabel}
            onChange={(event) => setCtaLabel(event.target.value)}
            placeholder="Reservar cita"
            className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
        </label>
      </article>

      <article className="panel animate-rise overflow-hidden p-4" style={{ animationDelay: "130ms" }}>
        <h2 className="text-sm font-black uppercase tracking-wide text-zinc-300">
          Vista previa en tiempo real
        </h2>

        <div
          className="mt-4 rounded-2xl border p-4"
          style={{
            borderColor: currentPalette.secondary,
            background: `linear-gradient(145deg, ${currentPalette.background}, ${currentPalette.surface})`,
            color: currentPalette.text,
          }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {draft.barberia?.logo_url ? (
                <img
                  src={draft.barberia.logo_url}
                  alt={draft.barberia.nombre || "Logo barberia"}
                  className="size-12 rounded-lg border border-white/20 object-cover"
                />
              ) : (
                <div
                  className="grid size-12 place-items-center rounded-lg text-xs font-black"
                  style={{ backgroundColor: currentPalette.primary, color: "#ffffff" }}
                >
                  BA
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: currentPalette.secondary }}>
                  {currentTemplate.name}
                </p>
                <p className="text-lg font-black">
                  {draft.barberia?.nombre || "Tu barberia"}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-bold"
              style={{
                backgroundColor: currentPalette.primary,
                color: currentPalette.mode === "light" ? "#ffffff" : "#ffffff",
              }}
            >
              {ctaLabel.trim() || "Reservar cita"}
            </button>
          </div>

          <h3 className="text-2xl font-black tracking-tight sm:text-3xl">{currentTemplate.hero}</h3>
          <p className="mt-2 max-w-2xl text-sm opacity-90">
            {draft.barberia?.descripcion || currentTemplate.subtitle}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border p-3" style={{ borderColor: `${currentPalette.secondary}77` }}>
              <p className="text-xs font-bold uppercase tracking-wide opacity-80">Servicios destacados</p>
              <div className="mt-2 space-y-1 text-sm">
                {activeServices.length > 0 ? (
                  activeServices.map((service) => (
                    <p key={`${service.nombre}-${service.duracion_min}`}>
                      {service.nombre} - {service.duracion_min} min
                    </p>
                  ))
                ) : (
                  <p className="opacity-70">Agrega servicios en el paso 1.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border p-3" style={{ borderColor: `${currentPalette.secondary}77` }}>
              <p className="text-xs font-bold uppercase tracking-wide opacity-80">Equipo</p>
              <div className="mt-2 space-y-1 text-sm">
                {activeBarbers.length > 0 ? (
                  activeBarbers.map((barber) => (
                    <p key={`${barber.nombre}-${barber.especialidad ?? ""}`}>
                      {barber.nombre}
                      {barber.especialidad ? ` - ${barber.especialidad}` : ""}
                    </p>
                  ))
                ) : (
                  <p className="opacity-70">Agrega barberos en el paso 1.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      <div className="panel-muted animate-rise p-4" style={{ animationDelay: "160ms" }}>
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <CheckCircle2 className="size-4 text-[var(--success)]" />
          Al finalizar vas al login para entrar con las credenciales que acabas de crear.
        </p>
      </div>
    </section>
  );
}
