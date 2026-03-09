"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ImagePlus,
  LayoutTemplate,
  Palette,
  Save,
  Type,
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
  nav_items?: string[];
  hero_badge?: string;
  hero_title?: string;
  hero_subtitle?: string;
  booking_title?: string;
  booking_subtitle?: string;
  benefit_1?: string;
  benefit_2?: string;
  benefit_3?: string;
  footer_note?: string;
  hero_image_url?: string;
  image_secondary_url?: string;
  image_tertiary_url?: string;
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
  subtitle: string;
  badge: string;
  heroTitle: string;
  heroSubtitle: string;
  bookingTitle: string;
  bookingSubtitle: string;
  nav: [string, string, string, string];
  benefits: [string, string, string];
  footer: string;
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

const DEFAULT_HERO_IMAGE = "/Fondoiniciodshb.jpg";
const DEFAULT_SECONDARY_IMAGE =
  "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=1200&q=80";
const DEFAULT_TERTIARY_IMAGE =
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80";

const templateOptions: TemplateOption[] = [
  {
    id: "classic",
    name: "Classic Barber",
    subtitle: "Ideal para barberias tradicionales con enfoque familiar.",
    badge: "HECHO PARA CRECER TU BARBERIA",
    heroTitle: "Tu barberia mas organizada, con mas citas y menos caos.",
    heroSubtitle:
      "Centraliza horarios, servicios y equipo para dar una experiencia profesional sin complicarte.",
    bookingTitle: "Reserva tu cita en menos de 1 minuto",
    bookingSubtitle:
      "Selecciona servicio, barbero y horario. Confirmacion inmediata por WhatsApp o email.",
    nav: ["Inicio", "Servicios", "Equipo", "Contactar"],
    benefits: [
      "Agenda clara para todo tu equipo.",
      "Menos desorden en WhatsApp y llamadas.",
      "Mas tiempo para atender y vender.",
    ],
    footer: "Landing base lista para publicar y ajustar con tu marca.",
  },
  {
    id: "urban",
    name: "Urban Fade",
    subtitle: "Visual moderno para clientes jovenes y urbanos.",
    badge: "ESTILO URBANO + RESERVA RAPIDA",
    heroTitle: "Diseno moderno para una barberia que se mueve rapido.",
    heroSubtitle:
      "Muestra tus servicios, capta nuevos clientes y llena los espacios libres con una landing clara.",
    bookingTitle: "Agenda online y evita tiempos muertos",
    bookingSubtitle:
      "Clientes reservan desde celular y tu equipo recibe citas ordenadas por horario.",
    nav: ["Home", "Barberos", "Servicios", "Reservar"],
    benefits: [
      "Marca visual actual para redes.",
      "Formulario simple para reservar al instante.",
      "Mayor conversion desde trafico organico.",
    ],
    footer: "Perfecta para barberos que venden imagen y velocidad.",
  },
  {
    id: "premium",
    name: "Premium Lounge",
    subtitle: "Para negocios que venden experiencia y detalle.",
    badge: "EXPERIENCIA PREMIUM",
    heroTitle: "Convierte tu barberia en una marca premium reservable 24/7.",
    heroSubtitle:
      "Posiciona tu negocio con una landing elegante, servicios definidos y agenda automatizada.",
    bookingTitle: "Reserva tu experiencia premium",
    bookingSubtitle:
      "Da una primera impresion fuerte con un proceso de reserva claro y sin friccion.",
    nav: ["Inicio", "Experiencia", "Servicios", "Reserva"],
    benefits: [
      "Look premium para tickets altos.",
      "Onboarding simple para el equipo.",
      "Control completo desde dashboard.",
    ],
    footer: "Pensada para barberias que quieren escalar con posicionamiento.",
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

function normalizeNavItems(value: unknown, fallback: [string, string, string, string]) {
  if (!Array.isArray(value)) return [...fallback];
  const cleaned = value
    .map((item) => safeString(item))
    .filter(Boolean)
    .slice(0, 4);
  while (cleaned.length < 4) {
    cleaned.push(fallback[cleaned.length]);
  }
  return cleaned;
}

export default function BarberiaTemplatePage() {
  const router = useRouter();
  const [draft] = useState<OnboardingDraft | null>(() => {
    if (typeof window === "undefined") return null;
    return readDraft();
  });

  const defaultTemplate = templateOptions[0];
  const defaultPalette = paletteOptions[0];

  const initialTemplate =
    templateOptions.find(
      (template) => template.id === safeString(draft?.branding?.template_id),
    ) ?? defaultTemplate;

  const initialPalette =
    paletteOptions.find((palette) => palette.id === safeString(draft?.branding?.palette_id)) ??
    defaultPalette;

  const [templateId, setTemplateId] = useState(initialTemplate.id);
  const [paletteId, setPaletteId] = useState(initialPalette.id);

  const [ctaLabel, setCtaLabel] = useState(
    safeString(draft?.branding?.cta_label) || "Reservar cita",
  );
  const [logoWidth, setLogoWidth] = useState(
    Math.max(64, Math.min(180, safeNumber(draft?.branding?.logo_width, 110))),
  );
  const [fontPair, setFontPair] = useState(
    safeString(draft?.branding?.font_pair) || fontOptions[0],
  );

  const [heroBadge, setHeroBadge] = useState(
    safeString(draft?.branding?.hero_badge) || initialTemplate.badge,
  );
  const [heroTitle, setHeroTitle] = useState(
    safeString(draft?.branding?.hero_title) || initialTemplate.heroTitle,
  );
  const [heroSubtitle, setHeroSubtitle] = useState(
    safeString(draft?.branding?.hero_subtitle) || initialTemplate.heroSubtitle,
  );
  const [bookingTitle, setBookingTitle] = useState(
    safeString(draft?.branding?.booking_title) || initialTemplate.bookingTitle,
  );
  const [bookingSubtitle, setBookingSubtitle] = useState(
    safeString(draft?.branding?.booking_subtitle) || initialTemplate.bookingSubtitle,
  );

  const [benefit1, setBenefit1] = useState(
    safeString(draft?.branding?.benefit_1) || initialTemplate.benefits[0],
  );
  const [benefit2, setBenefit2] = useState(
    safeString(draft?.branding?.benefit_2) || initialTemplate.benefits[1],
  );
  const [benefit3, setBenefit3] = useState(
    safeString(draft?.branding?.benefit_3) || initialTemplate.benefits[2],
  );
  const [footerNote, setFooterNote] = useState(
    safeString(draft?.branding?.footer_note) || initialTemplate.footer,
  );

  const [navItems, setNavItems] = useState<string[]>(() =>
    normalizeNavItems(draft?.branding?.nav_items, initialTemplate.nav),
  );

  const [heroImageUrl, setHeroImageUrl] = useState(
    safeString(draft?.branding?.hero_image_url) || DEFAULT_HERO_IMAGE,
  );
  const [secondaryImageUrl, setSecondaryImageUrl] = useState(
    safeString(draft?.branding?.image_secondary_url) || DEFAULT_SECONDARY_IMAGE,
  );
  const [tertiaryImageUrl, setTertiaryImageUrl] = useState(
    safeString(draft?.branding?.image_tertiary_url) || DEFAULT_TERTIARY_IMAGE,
  );

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

  function applyTemplatePreset(template: TemplateOption) {
    setTemplateId(template.id);
    setHeroBadge(template.badge);
    setHeroTitle(template.heroTitle);
    setHeroSubtitle(template.heroSubtitle);
    setBookingTitle(template.bookingTitle);
    setBookingSubtitle(template.bookingSubtitle);
    setBenefit1(template.benefits[0]);
    setBenefit2(template.benefits[1]);
    setBenefit3(template.benefits[2]);
    setFooterNote(template.footer);
    setNavItems([...template.nav]);
  }

  function updateNavItem(index: number, value: string) {
    setNavItems((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function buildBrandingPayload(): BrandingConfig {
    return {
      template_id: currentTemplate.id,
      template_name: currentTemplate.name,
      template_hero: heroTitle.trim() || currentTemplate.heroTitle,
      palette_id: currentPalette.id,
      palette_name: currentPalette.name,
      theme_mode: currentPalette.mode,
      color_primary: currentPalette.primary,
      color_secondary: currentPalette.secondary,
      color_background: currentPalette.background,
      color_surface: currentPalette.surface,
      color_text: currentPalette.text,
      cta_label: ctaLabel.trim() || "Reservar cita",
      logo_width: logoWidth,
      booking_form_global: true,
      font_pair: fontPair,
      nav_items: navItems.map((item) => item.trim()).filter(Boolean).slice(0, 4),
      hero_badge: heroBadge.trim(),
      hero_title: heroTitle.trim(),
      hero_subtitle: heroSubtitle.trim(),
      booking_title: bookingTitle.trim(),
      booking_subtitle: bookingSubtitle.trim(),
      benefit_1: benefit1.trim(),
      benefit_2: benefit2.trim(),
      benefit_3: benefit3.trim(),
      footer_note: footerNote.trim(),
      hero_image_url: heroImageUrl.trim() || DEFAULT_HERO_IMAGE,
      image_secondary_url: secondaryImageUrl.trim() || DEFAULT_SECONDARY_IMAGE,
      image_tertiary_url: tertiaryImageUrl.trim() || DEFAULT_TERTIARY_IMAGE,
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
      message: "Landing guardada. Puedes seguir editando textos, colores e imagenes.",
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
      ? `linear-gradient(140deg, ${currentPalette.background}, #e7eef7 52%, ${currentPalette.surface})`
      : `radial-gradient(circle at 14% 22%, ${currentPalette.primary}25, transparent 35%), radial-gradient(circle at 85% 0%, ${currentPalette.secondary}24, transparent 30%), linear-gradient(145deg, ${currentPalette.background}, ${currentPalette.surface})`;

  const previewTextSoft = currentPalette.mode === "light" ? "#334155" : "#cbd5e1";
  const previewLine = currentPalette.mode === "light" ? "#cbd5e1" : "#334155";

  const previewHeroImage = heroImageUrl.trim() || DEFAULT_HERO_IMAGE;
  const previewSecondaryImage = secondaryImageUrl.trim() || DEFAULT_SECONDARY_IMAGE;
  const previewTertiaryImage = tertiaryImageUrl.trim() || DEFAULT_TERTIARY_IMAGE;

  return (
    <section className="space-y-5 overflow-x-hidden pb-8">
      <div className="animate-rise flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="title-gradient text-2xl font-black tracking-tight sm:text-3xl">
            Paso 2: Landing y estilo
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Creamos textos ejemplo para tu landing y tu cliente los puede editar cuando quiera.
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

      <div className="grid gap-4 xl:grid-cols-[390px_1fr]">
        <aside className="panel animate-rise h-fit space-y-4 p-4 xl:sticky xl:top-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Customize
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              Edita colores, imagenes y textos de ejemplo para publicar una landing profesional.
            </p>
          </div>

          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-zinc-300">
              <LayoutTemplate className="size-4 text-[var(--accent)]" />
              Plantilla base
            </p>
            <div className="space-y-2">
              {templateOptions.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplatePreset(template)}
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
              Paleta
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

          <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3">
            <p className="text-xs font-black uppercase tracking-wide text-zinc-300">Site logo</p>
            <div className="flex items-center justify-between gap-3">
              <div
                className="overflow-hidden rounded-lg border border-white/20 bg-zinc-950 p-1"
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

          <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-zinc-300">
              <Type className="size-4 text-[var(--accent)]" />
              Textos ejemplo editables
            </p>

            <label className="block space-y-1 text-sm">
              <span className="text-zinc-300">Badge</span>
              <input
                value={heroBadge}
                onChange={(event) => setHeroBadge(event.target.value)}
                className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-zinc-300">Hero titulo</span>
              <textarea
                value={heroTitle}
                onChange={(event) => setHeroTitle(event.target.value)}
                rows={2}
                className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-zinc-300">Hero subtitulo</span>
              <textarea
                value={heroSubtitle}
                onChange={(event) => setHeroSubtitle(event.target.value)}
                rows={2}
                className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-zinc-300">Texto boton principal</span>
              <input
                value={ctaLabel}
                onChange={(event) => setCtaLabel(event.target.value)}
                placeholder="Reservar cita"
                className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-zinc-300">Titulo bloque reserva</span>
              <input
                value={bookingTitle}
                onChange={(event) => setBookingTitle(event.target.value)}
                className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-zinc-300">Subtitulo bloque reserva</span>
              <textarea
                value={bookingSubtitle}
                onChange={(event) => setBookingSubtitle(event.target.value)}
                rows={2}
                className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              {navItems.map((item, index) => (
                <label key={`nav-${index}`} className="block space-y-1 text-sm">
                  <span className="text-zinc-300">Menu {index + 1}</span>
                  <input
                    value={item}
                    onChange={(event) => updateNavItem(index, event.target.value)}
                    className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
                  />
                </label>
              ))}
            </div>

            <div className="grid gap-2">
              <label className="block space-y-1 text-sm">
                <span className="text-zinc-300">Beneficio 1</span>
                <input
                  value={benefit1}
                  onChange={(event) => setBenefit1(event.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-zinc-300">Beneficio 2</span>
                <input
                  value={benefit2}
                  onChange={(event) => setBenefit2(event.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-zinc-300">Beneficio 3</span>
                <input
                  value={benefit3}
                  onChange={(event) => setBenefit3(event.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
                />
              </label>
            </div>

            <label className="block space-y-1 text-sm">
              <span className="text-zinc-300">Texto pie de pagina</span>
              <input
                value={footerNote}
                onChange={(event) => setFooterNote(event.target.value)}
                className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
          </div>

          <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-zinc-300">
              <ImagePlus className="size-4 text-[var(--accent)]" />
              Imagenes editables
            </p>
            <label className="block space-y-1 text-sm">
              <span className="text-zinc-300">Hero image URL</span>
              <input
                value={heroImageUrl}
                onChange={(event) => setHeroImageUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-zinc-300">Imagen secundaria URL</span>
              <input
                value={secondaryImageUrl}
                onChange={(event) => setSecondaryImageUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-zinc-300">Imagen terciaria URL</span>
              <input
                value={tertiaryImageUrl}
                onChange={(event) => setTertiaryImageUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
          </div>

          <article className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-300">
              <CalendarClock className="size-4" />
              Formulario global activo
            </p>
            <p className="mt-1 text-xs text-emerald-200/90">
              La reserva online queda activa por defecto para todas las barberias.
            </p>
          </article>

          <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3">
            <p className="text-xs font-black uppercase tracking-wide text-zinc-300">Resumen negocio</p>
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
              <p>
                <span className="text-zinc-400">Admin login:</span>{" "}
                {safeString(draft.accesos?.admin?.email) || "Sin email"}
              </p>
            </div>
          </article>
        </aside>

        <article className="panel animate-rise overflow-hidden p-4" style={{ animationDelay: "80ms" }}>
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-300">
            Vista previa de landing profesional
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
                className="relative min-h-[760px]"
                style={{ background: previewBackground, color: currentPalette.text }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-[300px] bg-cover bg-center"
                  style={{ backgroundImage: `url(${previewHeroImage})` }}
                />
                <div className="absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-black/65 via-black/50 to-transparent" />
                <div className="relative z-10 p-5 sm:p-7">
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
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: previewTextSoft }}>
                        {fontPair}
                      </p>
                      <p className="text-sm font-semibold">{draft.barberia?.nombre || "Tu barberia"}</p>
                    </div>
                  </div>

                  <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
                    {navItems.map((item, index) => (
                      <span key={`nav-preview-${index}`} className="opacity-90">
                        {item || `Menu ${index + 1}`}
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

                <div className="mt-14 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <p
                      className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]"
                      style={{ borderColor: `${currentPalette.primary}88`, color: currentPalette.primary }}
                    >
                      {heroBadge || currentTemplate.badge}
                    </p>

                    <h3 className="max-w-2xl text-3xl font-black leading-tight sm:text-5xl">
                      {heroTitle || currentTemplate.heroTitle}
                    </h3>
                    <p className="max-w-xl text-sm sm:text-base" style={{ color: previewTextSoft }}>
                      {heroSubtitle || currentTemplate.heroSubtitle}
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
                        <span className="text-sm" style={{ color: previewTextSoft }}>
                          Agrega servicios en el paso 1.
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="rounded-xl px-5 py-3 text-sm font-black"
                        style={{ backgroundColor: currentPalette.primary, color: "#ffffff" }}
                      >
                        {ctaLabel.trim() || "Reservar cita"}
                      </button>
                      <span className="text-xs" style={{ color: previewTextSoft }}>
                        /{draft.barberia?.slug || "mi-barberia"}
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <div
                        className="rounded-xl border p-3"
                        style={{ borderColor: previewLine, backgroundColor: `${currentPalette.surface}cf` }}
                      >
                        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: previewTextSoft }}>
                          Servicios
                        </p>
                        <p className="mt-1 text-lg font-black">{draft.servicios?.length ?? 0}</p>
                      </div>
                      <div
                        className="rounded-xl border p-3"
                        style={{ borderColor: previewLine, backgroundColor: `${currentPalette.surface}cf` }}
                      >
                        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: previewTextSoft }}>
                          Barberos
                        </p>
                        <p className="mt-1 text-lg font-black">{draft.barberos?.length ?? 0}</p>
                      </div>
                      <div
                        className="rounded-xl border p-3"
                        style={{ borderColor: previewLine, backgroundColor: `${currentPalette.surface}cf` }}
                      >
                        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: previewTextSoft }}>
                          Slot agenda
                        </p>
                        <p className="mt-1 text-lg font-black">{draft.barberia?.slot_min || 15} min</p>
                      </div>
                    </div>
                  </div>

                  <aside
                    className="rounded-2xl border p-4"
                    style={{ borderColor: `${currentPalette.secondary}66`, backgroundColor: `${currentPalette.surface}cc` }}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: previewTextSoft }}>
                      {bookingTitle || currentTemplate.bookingTitle}
                    </p>
                    <p className="mt-2 text-sm" style={{ color: previewTextSoft }}>
                      {bookingSubtitle || currentTemplate.bookingSubtitle}
                    </p>

                    <div className="mt-4 space-y-2">
                      <input
                        readOnly
                        value="Nombre completo"
                        className="h-10 w-full rounded-lg border px-3 text-sm"
                        style={{ borderColor: previewLine, backgroundColor: "rgba(2,8,23,0.18)" }}
                      />
                      <input
                        readOnly
                        value="Telefono"
                        className="h-10 w-full rounded-lg border px-3 text-sm"
                        style={{ borderColor: previewLine, backgroundColor: "rgba(2,8,23,0.18)" }}
                      />
                      <select
                        className="h-10 w-full rounded-lg border px-3 text-sm"
                        style={{ borderColor: previewLine, backgroundColor: "rgba(2,8,23,0.18)" }}
                      >
                        <option>Servicio</option>
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          readOnly
                          value="Fecha"
                          className="h-10 rounded-lg border px-3 text-sm"
                          style={{ borderColor: previewLine, backgroundColor: "rgba(2,8,23,0.18)" }}
                        />
                        <input
                          readOnly
                          value="Hora"
                          className="h-10 rounded-lg border px-3 text-sm"
                          style={{ borderColor: previewLine, backgroundColor: "rgba(2,8,23,0.18)" }}
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
                  </aside>
                </div>

                <section className="mt-10 grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <article
                    className="overflow-hidden rounded-2xl border"
                    style={{ borderColor: previewLine, backgroundColor: `${currentPalette.surface}cc` }}
                  >
                    <img
                      src={previewSecondaryImage}
                      alt="Espacio interior de barberia"
                      className="h-48 w-full object-cover"
                    />
                    <div className="space-y-2 p-4">
                      <p className="text-sm font-black">Servicios destacados</p>
                      <div className="flex flex-wrap gap-2">
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
                          <span className="text-xs" style={{ color: previewTextSoft }}>
                            Agrega servicios en el paso 1 para mostrarlos aqui.
                          </span>
                        )}
                      </div>
                    </div>
                  </article>

                  <article
                    className="overflow-hidden rounded-2xl border"
                    style={{ borderColor: previewLine, backgroundColor: `${currentPalette.surface}cc` }}
                  >
                    <img
                      src={previewTertiaryImage}
                      alt="Equipo de barberos"
                      className="h-48 w-full object-cover"
                    />
                    <div className="space-y-2 p-4">
                      <p className="text-sm font-black">Por que elegirnos</p>
                      <ul className="space-y-1 text-sm" style={{ color: previewTextSoft }}>
                        <li>• {benefit1 || currentTemplate.benefits[0]}</li>
                        <li>• {benefit2 || currentTemplate.benefits[1]}</li>
                        <li>• {benefit3 || currentTemplate.benefits[2]}</li>
                      </ul>
                      <p className="text-xs" style={{ color: previewTextSoft }}>
                        Equipo activo:{" "}
                        {activeBarbers.length > 0
                          ? activeBarbers.map((barber) => barber.nombre).join(" | ")
                          : "Sin barberos activos"}
                      </p>
                    </div>
                  </article>
                </section>

                <footer className="mt-8 border-t pt-4 text-xs" style={{ borderColor: previewLine, color: previewTextSoft }}>
                  {footerNote || currentTemplate.footer}
                </footer>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="panel-muted animate-rise p-4" style={{ animationDelay: "120ms" }}>
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <CheckCircle2 className="size-4 text-[var(--success)]" />
          Landing profesional lista: textos de ejemplo editables, imagenes editables y formulario de reservas siempre activo.
        </p>
      </div>
    </section>
  );
}

