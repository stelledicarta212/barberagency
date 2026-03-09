"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  LayoutTemplate,
  Palette,
  Save,
} from "lucide-react";

type SaveState =
  | { type: "idle"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type BrandingConfig = {
  template_id?: string;
  template_name?: string;
  template_hero?: string;
  palette_id?: string;
  palette_name?: string;
  theme_mode?: "light" | "dark";
  color_primary?: string;
  color_secondary?: string;
  color_background?: string;
  color_surface?: string;
  color_text?: string;
  cta_label?: string;
  logo_width?: number;
  booking_form_global?: boolean;
  font_pair?: string;
  updated_at?: string;
};

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
  branding?: BrandingConfig;
};

type TemplateOption = {
  id: string;
  name: string;
  hero: string;
  subtitle: string;
  nav: string[];
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
    hero: "Agenda tus cortes en segundos, sin llamadas ni caos.",
    subtitle: "Ideal para barberias tradicionales con enfoque familiar.",
    nav: ["Inicio", "Nosotros", "Servicios", "Contacto"],
  },
  {
    id: "urban",
    name: "Urban Fade",
    hero: "Tu estilo empieza aqui. Reserva online en 1 minuto.",
    subtitle: "Visual moderno para clientes jovenes y urbanos.",
    nav: ["Home", "Barberos", "Servicios", "Reservar"],
  },
  {
    id: "premium",
    name: "Premium Lounge",
    hero: "Experiencia premium desde la primera cita.",
    subtitle: "Para negocios que venden experiencia y detalle.",
    nav: ["Inicio", "Experiencia", "Servicios", "Reserva"],
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
    secondary: "#d1d5db",
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

const fontOptions = [
  "Barlow + DM Sans",
  "Oswald + Inter",
  "Poppins + Manrope",
  "Bebas + Montserrat",
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

function safeNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasCredentialSetup(draft: OnboardingDraft | null) {
  const adminEmail = safeString(draft?.accesos?.admin?.email);
  const adminPassword = safeString(draft?.accesos?.admin?.password);
  const activeBarberos = Array.isArray(draft?.accesos?.barberos)
    ? draft.accesos.barberos.filter((barber) => barber.activo)
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
    if (typeof window === "undefined") return paletteOptions[0]?.id ?? "barber-gold-night";
    const fromDraft = safeString(readDraft()?.branding?.palette_id);
    return fromDraft || (paletteOptions[0]?.id ?? "barber-gold-night");
  });
  const [ctaLabel, setCtaLabel] = useState(() => {
    if (typeof window === "undefined") return "Reservar cita";
    const fromDraft = safeString(readDraft()?.branding?.cta_label);
    return fromDraft || "Reservar cita";
  });
  const [logoWidth, setLogoWidth] = useState(() => {
    if (typeof window === "undefined") return 110;
    return Math.max(64, Math.min(180, safeNumber(readDraft()?.branding?.logo_width, 110)));
  });
  const [bookingFormGlobal, setBookingFormGlobal] = useState(() => {
    if (typeof window === "undefined") return true;
    return readDraft()?.branding?.booking_form_global !== false;
  });
  const [fontPair, setFontPair] = useState(() => {
    if (typeof window === "undefined") return fontOptions[0];
    const fromDraft = safeString(readDraft()?.branding?.font_pair);
    return fromDraft || fontOptions[0];
  });

  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });

  useEffect(() => {
    if (!draft) router.replace("/barberia?onboarding=1");
  }, [draft, router]);

  const currentTemplate = useMemo(
    () => templateOptions.find((template) => template.id === templateId) ?? templateOptions[0],
    [templateId],
  );
  const currentPalette = useMemo(
    () => paletteOptions.find((palette) => palette.id === paletteId) ?? paletteOptions[0],
    [paletteId],
  );

  const activeServices = useMemo(() => {
    if (!draft?.servicios?.length) return [];
    return draft.servicios.filter((service) => service.nombre?.trim()).slice(0, 4);
  }, [draft]);

  const activeBarbers = useMemo(() => {
    if (!draft?.barberos?.length) return [];
    return draft.barberos.filter((barber) => barber.activo && barber.nombre?.trim()).slice(0, 4);
  }, [draft]);

  function buildBrandingPayload(): BrandingConfig {
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
      logo_width: logoWidth,
      booking_form_global: bookingFormGlobal,
      font_pair: fontPair,
      updated_at: new Date().toISOString(),
    };
  }

  function saveBranding(completeOnboarding: boolean) {
    if (!draft) {
      setSaveState({ type: "error", message: "No hay datos de barberia. Vuelve al paso 1." });
      return false;
    }

    const payload: OnboardingDraft = { ...draft, branding: buildBrandingPayload() };

    if (completeOnboarding && !hasCredentialSetup(payload)) {
      setSaveState({
        type: "error",
        message: "Completa credenciales de admin y al menos un barbero activo en el paso 1.",
      });
      return false;
    }

    localStorage.setItem("ba_onboarding_barberia", JSON.stringify(payload));

    if (completeOnboarding) {
      localStorage.setItem("ba_onboarding_done", "true");
      return true;
    }

    localStorage.removeItem("ba_onboarding_done");
    setSaveState({
      type: "success",
      message: "Plantilla guardada. Puedes seguir ajustando antes de finalizar.",
    });
    return true;
  }

  async function handleFinish() {
    const ok = saveBranding(true);
    if (!ok) return;

    const latestDraft = readDraft();
    if (!latestDraft) {
      setSaveState({
        type: "error",
        message: "No se encontro el borrador para finalizar onboarding.",
      });
      localStorage.removeItem("ba_onboarding_done");
      return;
    }

    setSaveState({
      type: "success",
      message: "Creando barberia, administrador y barberos en BD...",
    });

    const response = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: latestDraft }),
    });

    const result = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      admin?: { email?: string };
    };

    if (!response.ok || !result.ok) {
      localStorage.removeItem("ba_onboarding_done");
      setSaveState({
        type: "error",
        message: result.message || "No se pudo guardar onboarding en base de datos.",
      });
      return;
    }

    const adminEmail = safeString(
      result.admin?.email || latestDraft?.accesos?.admin?.email,
    ).toLowerCase();
    const adminPassword = (latestDraft?.accesos?.admin?.password ?? "").toString();
    if (adminEmail) localStorage.setItem("ba_login_prefill_email", adminEmail);
    if (adminPassword) localStorage.setItem("ba_login_prefill_password", adminPassword);
    localStorage.setItem("ba_login_prefill_source", "onboarding");

    setSaveState({
      type: "success",
      message: "Administrador y barberos creados con exito. Redirigiendo a login...",
    });

    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
    localStorage.removeItem("ba_user_role");
    localStorage.removeItem("ba_user_id");
    localStorage.removeItem("ba_user_email");
    router.push("/login?onboarding=1");
  }

  if (!draft || !currentTemplate || !currentPalette) {
    return (
      <section className="panel animate-rise p-5">
        <p className="text-sm text-zinc-300">Cargando editor de plantilla...</p>
      </section>
    );
  }

  const previewBackground =
    currentPalette.mode === "light"
      ? `linear-gradient(120deg, ${currentPalette.background}, #e2e8f0 40%, ${currentPalette.surface})`
      : `radial-gradient(circle at 15% 20%, ${currentPalette.primary}22, transparent 35%), radial-gradient(circle at 85% 0%, ${currentPalette.secondary}22, transparent 30%), linear-gradient(145deg, ${currentPalette.background}, ${currentPalette.surface})`;

  return (
    <section className="space-y-5 overflow-x-hidden pb-8">
      <div className="animate-rise flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="title-gradient text-2xl font-black tracking-tight sm:text-3xl">
            Paso 2: Landing y estilo
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Configura una landing simple por barberia con formulario global de reservas.
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

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="panel animate-rise h-fit space-y-4 p-4 xl:sticky xl:top-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Customize
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              Ajusta logo, colores, tipografia y boton de reserva.
            </p>
          </div>

          <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3">
            <p className="text-xs font-black uppercase tracking-wide text-zinc-300">Site Logo</p>
            <div className="flex items-center justify-between gap-3">
              <div
                className="rounded-lg border border-white/20 bg-zinc-950 p-1"
                style={{ width: `${logoWidth}px` }}
              >
                {draft.barberia?.logo_url ? (
                  <img
                    src={draft.barberia.logo_url}
                    alt="Logo barberia"
                    className="h-12 w-full rounded object-cover"
                  />
                ) : (
                  <div className="grid h-12 w-full place-items-center rounded text-xs font-black text-zinc-200">
                    BA
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-zinc-300">{logoWidth}px</span>
            </div>
            <input
              type="range"
              min={64}
              max={180}
              value={logoWidth}
              onChange={(event) => setLogoWidth(Number(event.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>

          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-zinc-300">
              <LayoutTemplate className="size-4 text-[var(--accent)]" />
              Plantilla
            </p>
            <div className="space-y-2">
              {templateOptions.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setTemplateId(template.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
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
          </div>

          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-zinc-300">
              <Palette className="size-4 text-[var(--accent)]" />
              Color palette
            </p>
            <div className="grid gap-2">
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
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-zinc-300">Font pair</span>
            <select
              value={fontPair}
              onChange={(event) => setFontPair(event.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
            >
              {fontOptions.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-zinc-300">Texto del boton principal</span>
            <input
              value={ctaLabel}
              onChange={(event) => setCtaLabel(event.target.value)}
              placeholder="Reservar cita"
              className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-sm">
            <span className="inline-flex items-center gap-2 font-semibold text-zinc-200">
              <CalendarClock className="size-4 text-[var(--accent)]" />
              Formulario global de reservas
            </span>
            <input
              type="checkbox"
              checked={bookingFormGlobal}
              onChange={(event) => setBookingFormGlobal(event.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
          </label>

          <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3">
            <p className="text-xs font-black uppercase tracking-wide text-zinc-300">Resumen</p>
            <div className="mt-2 space-y-1 text-xs text-zinc-300">
              <p>
                <span className="text-zinc-400">Barberia:</span> {draft.barberia?.nombre || "Sin nombre"}
              </p>
              <p>
                <span className="text-zinc-400">Ciudad:</span> {draft.barberia?.ciudad || "Sin ciudad"}
              </p>
              <p>
                <span className="text-zinc-400">Servicios:</span> {draft.servicios?.length ?? 0}
              </p>
              <p>
                <span className="text-zinc-400">Barberos:</span> {draft.barberos?.length ?? 0}
              </p>
            </div>
          </article>
        </aside>

        <article className="panel animate-rise overflow-hidden p-4" style={{ animationDelay: "80ms" }}>
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-300">
            Vista previa de landing
          </h2>

          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-zinc-950 p-4">
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className="size-3 rounded-full bg-red-400/70" />
              <span className="size-3 rounded-full bg-yellow-300/70" />
              <span className="size-3 rounded-full bg-emerald-400/70" />
            </div>

            <div
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: `${currentPalette.secondary}66` }}
            >
              <div
                className="min-h-[560px] p-5 sm:p-7"
                style={{ background: previewBackground, color: currentPalette.text }}
              >
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="overflow-hidden rounded-lg border border-white/20 bg-zinc-950"
                      style={{ width: `${logoWidth}px` }}
                    >
                      {draft.barberia?.logo_url ? (
                        <img
                          src={draft.barberia.logo_url}
                          alt={draft.barberia?.nombre || "Logo"}
                          className="h-11 w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-11 place-items-center text-xs font-black">BA</div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] opacity-70">{fontPair}</p>
                      <p className="text-sm font-semibold">{draft.barberia?.nombre || "Tu barberia"}</p>
                    </div>
                  </div>

                  <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
                    {currentTemplate.nav.map((item) => (
                      <span key={item} className="opacity-85">
                        {item}
                      </span>
                    ))}
                  </nav>

                  <button
                    type="button"
                    className="rounded-xl border px-4 py-2 text-sm font-semibold"
                    style={{ borderColor: `${currentPalette.text}66` }}
                  >
                    {draft.barberia?.telefono || "300 000 0000"}
                  </button>
                </header>

                <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <p
                      className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]"
                      style={{ borderColor: `${currentPalette.primary}88`, color: currentPalette.primary }}
                    >
                      {currentTemplate.name}
                    </p>
                    <h3 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
                      {currentTemplate.hero}
                    </h3>
                    <p className="mt-4 max-w-xl text-sm opacity-90 sm:text-base">
                      {draft.barberia?.descripcion || currentTemplate.subtitle}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {activeServices.length > 0 ? (
                        activeServices.map((service) => (
                          <span
                            key={`${service.nombre}-${service.duracion_min}`}
                            className="rounded-full border px-3 py-1 text-xs font-semibold"
                            style={{ borderColor: `${currentPalette.secondary}99` }}
                          >
                            {service.nombre} ({service.duracion_min} min)
                          </span>
                        ))
                      ) : (
                        <span className="text-sm opacity-80">Agrega servicios en el paso 1.</span>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="rounded-xl px-5 py-3 text-sm font-black"
                        style={{ backgroundColor: currentPalette.primary, color: "#ffffff" }}
                      >
                        {ctaLabel.trim() || "Reservar cita"}
                      </button>
                      <span className="text-xs opacity-80">Slug: /{draft.barberia?.slug || "mi-barberia"}</span>
                    </div>
                  </div>

                  <aside
                    className="rounded-2xl border p-4"
                    style={{ borderColor: `${currentPalette.secondary}66`, backgroundColor: `${currentPalette.surface}cc` }}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
                      Reserva online
                    </p>
                    <p className="mt-2 text-sm opacity-90">
                      Formulario global para que tus clientes agenden desde cualquier dispositivo.
                    </p>

                    {bookingFormGlobal ? (
                      <div className="mt-4 space-y-2">
                        <input
                          readOnly
                          value="Nombre del cliente"
                          className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-sm"
                        />
                        <input
                          readOnly
                          value="Telefono"
                          className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-sm"
                        />
                        <select className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-sm">
                          <option>Servicio</option>
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            readOnly
                            value="Fecha"
                            className="h-10 rounded-lg border border-white/20 bg-black/20 px-3 text-sm"
                          />
                          <input
                            readOnly
                            value="Hora"
                            className="h-10 rounded-lg border border-white/20 bg-black/20 px-3 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          className="mt-2 w-full rounded-lg px-4 py-2 text-sm font-black"
                          style={{ backgroundColor: currentPalette.primary, color: "#ffffff" }}
                        >
                          {ctaLabel.trim() || "Reservar cita"}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                        El formulario global esta desactivado.
                      </div>
                    )}
                  </aside>
                </div>

                <footer className="mt-10 border-t border-white/15 pt-4 text-xs opacity-80">
                  {activeBarbers.length > 0 ? (
                    <p>
                      Equipo:{" "}
                      {activeBarbers.map((barber) => barber.nombre).join(" | ")}
                    </p>
                  ) : (
                    <p>Agrega barberos en el paso 1 para completar la landing.</p>
                  )}
                </footer>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="panel-muted animate-rise p-4" style={{ animationDelay: "120ms" }}>
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <CheckCircle2 className="size-4 text-[var(--success)]" />
          Al finalizar, cada barberia queda con esta landing base y formulario global de reservas.
        </p>
      </div>
    </section>
  );
}

