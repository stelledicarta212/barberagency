import { env } from "@/lib/env";
import { signSessionToken } from "@/lib/session-token";

type PostgrestMethod = "GET" | "POST" | "PATCH" | "DELETE";

type PublicProfileRow = {
  barberia_id: number;
  slug: string;
  enabled?: boolean | null;
  qr_enabled?: boolean | null;
  nombre_publico?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  email_contacto?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  politicas?: string | null;
  moneda?: string | null;
};

type ThemeRow = {
  barberia_id: number;
  primary_color?: string | null;
  secondary_color?: string | null;
  background_color?: string | null;
  text_color?: string | null;
};

type UserIdRow = {
  id: number;
};

type ServiceRow = {
  id: number;
  nombre: string | null;
  duracion_min: number | null;
  precio: number | null;
};

type BarberRow = {
  id: number;
  nombre: string | null;
  activo: boolean | null;
};

type AssetRow = {
  id: number;
  tipo?: string | null;
  url?: string | null;
  orden?: number | null;
};

export type PublicLandingBrandingInput = {
  color_primary?: string;
  color_secondary?: string;
  color_background?: string;
  color_surface?: string;
  color_text?: string;
  theme_mode?: "light" | "dark";
  template_id?: string;
  template_name?: string;
  cta_label?: string;
  logo_width?: number;
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
};

export type PublicLandingThemeInput = PublicLandingBrandingInput;

export type PublicLandingBrandingConfig = {
  templateId: string;
  templateName: string;
  themeMode: "light" | "dark";
  palette: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
  ctaLabel: string;
  logoWidth: number;
  fontPair: string;
  navItems: string[];
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  bookingTitle: string;
  bookingSubtitle: string;
  benefit1: string;
  benefit2: string;
  benefit3: string;
  footerNote: string;
  heroImageUrl: string;
  secondaryImageUrl: string;
  tertiaryImageUrl: string;
};

export type EnsureLandingParams = {
  token: string;
  barberiaId: number;
  fallbackSlug: string;
  fallbackName: string;
  origin: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  contactEmail?: string | null;
  branding?: PublicLandingBrandingInput | null;
};

export type PublicLandingMeta = {
  barberiaId: number;
  slug: string;
  enabled: boolean;
  qrEnabled: boolean;
  publicPath: string;
  publicUrl: string;
  qrUrl: string;
};

export type PublicLandingContext = {
  profile: {
    barberiaId: number;
    slug: string;
    nombrePublico: string;
    logoUrl: string;
    coverUrl: string;
    ciudad: string;
    direccion: string;
    telefono: string;
    whatsapp: string;
    emailContacto: string;
    instagram: string;
    tiktok: string;
    politicas: string;
    moneda: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  branding: PublicLandingBrandingConfig | null;
  services: Array<{
    id: number;
    nombre: string;
    duracionMin: number;
    precio: number;
  }>;
  barbers: Array<{
    id: number;
    nombre: string;
  }>;
  ownerUserId: number | null;
  ownerToken: string | null;
};

function clean(value: unknown) {
  return (value ?? "").toString().trim();
}

function toSafePositiveInt(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return 0;
  return parsed;
}

function slugify(input: string) {
  return clean(input)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function normalizeHexColor(value: unknown, fallback: string) {
  const color = clean(value);
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toUpperCase();
  return fallback.toUpperCase();
}

function normalizeMode(value: unknown, fallback: "light" | "dark") {
  const mode = clean(value).toLowerCase();
  if (mode === "light" || mode === "dark") return mode;
  return fallback;
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return [...fallback];
  const list = value
    .map((item) => clean(item))
    .filter(Boolean)
    .slice(0, 4);
  return list.length > 0 ? list : [...fallback];
}

function normalizeOrigin(origin: string) {
  const fallback = "https://barberagency-app.gymh5g.easypanel.host";
  const configured = clean(process.env.APP_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL);
  const candidate = configured || clean(origin) || fallback;
  return candidate.endsWith("/") ? candidate.slice(0, -1) : candidate;
}

function normalizeBaseDomain(value: string) {
  const cleaned = clean(value).toLowerCase();
  if (!cleaned) return "";

  const noProtocol = cleaned
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .trim();

  return noProtocol.replace(/:\d+$/, "");
}

function getLandingBaseDomain() {
  return normalizeBaseDomain(
    process.env.LANDING_BASE_DOMAIN || process.env.NEXT_PUBLIC_LANDING_BASE_DOMAIN || "",
  );
}

function getLandingProtocol(origin: string) {
  const explicit = clean(process.env.LANDING_BASE_PROTOCOL);
  if (explicit === "http" || explicit === "https") return explicit;
  const normalizedOrigin = normalizeOrigin(origin);
  if (normalizedOrigin.startsWith("http://")) return "http";
  return "https";
}

function postgrestErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const value = payload as { message?: string; details?: string; hint?: string };
  return clean(value.message) || clean(value.details) || clean(value.hint);
}

function isMissingColumnError(message: string, column: string) {
  const msg = clean(message).toLowerCase();
  const col = column.toLowerCase();
  return (
    msg.includes(`could not find the '${col}' column`) ||
    (msg.includes("column") && msg.includes(col) && msg.includes("does not exist")) ||
    (msg.includes("schema cache") && msg.includes(col))
  );
}

function isUndefinedTableError(message: string, table: string) {
  const msg = clean(message).toLowerCase();
  const tbl = table.toLowerCase();
  return (
    (msg.includes("relation") && msg.includes(tbl) && msg.includes("does not exist")) ||
    msg.includes(`could not find the table '${tbl}'`) ||
    msg.includes(`could not find relation '${tbl}'`)
  );
}

function isUniqueConstraintError(message: string, constraintName: string) {
  const msg = clean(message).toLowerCase();
  const constraint = constraintName.toLowerCase();
  return msg.includes("duplicate key value violates unique constraint") && msg.includes(constraint);
}

function isRlsPolicyError(message: string, table: string) {
  const msg = clean(message).toLowerCase();
  const tbl = table.toLowerCase();
  return (
    msg.includes("row-level security policy") &&
    (msg.includes(`\"${tbl}\"`) || msg.includes(`'${tbl}'`) || msg.includes(` ${tbl}`))
  );
}

const LANDING_CONFIG_PREFIX = "ba://landing-config/";

function sanitizeBrandingConfig(
  branding: PublicLandingBrandingInput | null | undefined,
): PublicLandingBrandingConfig | null {
  if (!branding || typeof branding !== "object") return null;

  const raw = branding as Record<string, unknown>;
  const themeMode = normalizeMode(raw.theme_mode ?? raw.themeMode, "dark");
  const palettePrimary = normalizeHexColor(raw.color_primary ?? raw.primaryColor, "#111827");
  const paletteSecondary = normalizeHexColor(raw.color_secondary ?? raw.secondaryColor, "#F59E0B");
  const paletteBackground = normalizeHexColor(
    raw.color_background ?? raw.backgroundColor,
    themeMode === "light" ? "#FFFFFF" : "#020617",
  );
  const paletteSurface = normalizeHexColor(
    raw.color_surface ?? raw.surfaceColor,
    themeMode === "light" ? "#FFFFFF" : "#0F172A",
  );
  const paletteText = normalizeHexColor(
    raw.color_text ?? raw.textColor,
    themeMode === "light" ? "#111827" : "#E2E8F0",
  );

  return {
    templateId: clean(raw.template_id ?? raw.templateId) || "classic",
    templateName: clean(raw.template_name ?? raw.templateName) || "Classic Barber",
    themeMode,
    palette: {
      primary: palettePrimary,
      secondary: paletteSecondary,
      background: paletteBackground,
      surface: paletteSurface,
      text: paletteText,
    },
    ctaLabel: clean(raw.cta_label ?? raw.ctaLabel) || "Reservar cita",
    logoWidth: Math.max(64, Math.min(220, Number(raw.logo_width ?? raw.logoWidth ?? 110) || 110)),
    fontPair: clean(raw.font_pair ?? raw.fontPair) || "Barlow + DM Sans",
    navItems: normalizeStringArray(raw.nav_items ?? raw.navItems, [
      "Inicio",
      "Servicios",
      "Equipo",
      "Reserva",
    ]),
    heroBadge: clean(raw.hero_badge ?? raw.heroBadge) || "Reserva online",
    heroTitle:
      clean(raw.hero_title ?? raw.heroTitle) || "Agenda tu cita en minutos con disponibilidad real.",
    heroSubtitle:
      clean(raw.hero_subtitle ?? raw.heroSubtitle) ||
      "Selecciona servicio, fecha y hora. Te confirmamos al instante para que llegues sin esperas.",
    bookingTitle: clean(raw.booking_title ?? raw.bookingTitle) || "Reserva ahora",
    bookingSubtitle:
      clean(raw.booking_subtitle ?? raw.bookingSubtitle) ||
      "Tu cita queda guardada en la agenda de la barberia.",
    benefit1: clean(raw.benefit_1 ?? raw.benefit1),
    benefit2: clean(raw.benefit_2 ?? raw.benefit2),
    benefit3: clean(raw.benefit_3 ?? raw.benefit3),
    footerNote: clean(raw.footer_note ?? raw.footerNote),
    heroImageUrl: clean(raw.hero_image_url ?? raw.heroImageUrl),
    secondaryImageUrl: clean(raw.image_secondary_url ?? raw.secondaryImageUrl),
    tertiaryImageUrl: clean(raw.image_tertiary_url ?? raw.tertiaryImageUrl),
  };
}

function encodeBrandingConfig(config: PublicLandingBrandingConfig) {
  const raw = JSON.stringify(config);
  return `${LANDING_CONFIG_PREFIX}${Buffer.from(raw, "utf8").toString("base64url")}`;
}

function decodeBrandingConfig(urlValue: unknown): PublicLandingBrandingConfig | null {
  const value = clean(urlValue);
  if (!value.startsWith(LANDING_CONFIG_PREFIX)) return null;
  try {
    const encoded = value.slice(LANDING_CONFIG_PREFIX.length);
    const decoded = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as PublicLandingBrandingInput | null;
    return sanitizeBrandingConfig(parsed);
  } catch {
    return null;
  }
}

async function requestPostgrest<T>(
  path: string,
  options: {
    method?: PostgrestMethod;
    token?: string | null;
    body?: unknown;
    preferRepresentation?: boolean;
  } = {},
) {
  const method = options.method ?? "GET";
  const headers = new Headers({ Accept: "application/json" });
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.preferRepresentation) headers.set("Prefer", "return=representation");

  const response = await fetch(`${env.apiUrl}/${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const raw = (await response.json().catch(() => null)) as unknown;
    throw new Error(postgrestErrorMessage(raw) || `PostgREST error (${response.status})`);
  }

  if (response.status === 204) return null as T;
  const text = await response.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

function buildAdminToken(userId: number, email: string) {
  const safeUserId = toSafePositiveInt(userId) || 1;
  const safeEmail = clean(email) || `owner${safeUserId}@barberagency.local`;
  return signSessionToken({
    userId: safeUserId,
    role: "admin",
    email: safeEmail,
  });
}

export function buildPublicLandingPath(slug: string) {
  const safeSlug = slugify(slug) || "mi-barberia";
  return `/reservar/${safeSlug}`;
}

export function buildPublicLandingUrl(origin: string, slug: string) {
  const safeSlug = slugify(slug) || "mi-barberia";
  const landingBaseDomain = getLandingBaseDomain();

  if (landingBaseDomain) {
    return `${getLandingProtocol(origin)}://${safeSlug}.${landingBaseDomain}`;
  }

  return `${normalizeOrigin(origin)}${buildPublicLandingPath(safeSlug)}`;
}

export function buildQrImageUrl(publicUrl: string) {
  const data = encodeURIComponent(publicUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${data}`;
}

export async function resolveOwnerAuthByEmail(email: string) {
  const safeEmail = clean(email).toLowerCase();
  if (!safeEmail || !safeEmail.includes("@")) return null;

  const bootstrapToken = buildAdminToken(1, "bootstrap@barberagency.local");
  const users = await requestPostgrest<UserIdRow[]>(
    `usuarios?select=id&email=eq.${encodeURIComponent(safeEmail)}&limit=1`,
    { token: bootstrapToken },
  );
  const userId = toSafePositiveInt(users?.[0]?.id);
  if (!userId) return null;
  return {
    userId,
    token: buildAdminToken(userId, safeEmail),
  };
}

async function upsertThemeForBarberia(
  token: string,
  barberiaId: number,
  branding: PublicLandingThemeInput | null | undefined,
) {
  // Avoid resetting the theme with defaults when caller is only ensuring
  // profile/slug persistence and did not send branding payload.
  if (!branding || typeof branding !== "object") return;

  let includeBackground = true;
  let includeText = true;
  let includeSecondary = true;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const body: Record<string, unknown> = {
      barberia_id: barberiaId,
      primary_color: normalizeHexColor(branding?.color_primary, "#111827"),
    };
    if (includeSecondary) {
      body.secondary_color = normalizeHexColor(branding?.color_secondary, "#F59E0B");
    }
    if (includeBackground) {
      body.background_color = normalizeHexColor(branding?.color_background, "#FFFFFF");
    }
    if (includeText) {
      body.text_color = normalizeHexColor(branding?.color_text, "#111827");
    }

    try {
      const existing = await requestPostgrest<ThemeRow[]>(
        `barberia_theme?select=barberia_id&barberia_id=eq.${barberiaId}&limit=1`,
        { token },
      );

      if (existing?.[0]?.barberia_id) {
        await requestPostgrest<ThemeRow[]>(
          `barberia_theme?barberia_id=eq.${barberiaId}`,
          { method: "PATCH", token, body, preferRepresentation: true },
        );
      } else {
        await requestPostgrest<ThemeRow[]>("barberia_theme", {
          method: "POST",
          token,
          body,
          preferRepresentation: true,
        });
      }
      return;
    } catch (error) {
      const message = error instanceof Error ? clean(error.message) : "";
      if (isUndefinedTableError(message, "barberia_theme")) return;
      if (includeSecondary && isMissingColumnError(message, "secondary_color")) {
        includeSecondary = false;
        continue;
      }
      if (includeBackground && isMissingColumnError(message, "background_color")) {
        includeBackground = false;
        continue;
      }
      if (includeText && isMissingColumnError(message, "text_color")) {
        includeText = false;
        continue;
      }
      throw error;
    }
  }
}

async function upsertQrAsset(token: string, barberiaId: number, qrUrl: string) {
  try {
    const rows = await requestPostgrest<Array<{ id: number }>>(
      `barberia_assets?select=id&barberia_id=eq.${barberiaId}&tipo=eq.qr&order=updated_at.desc&limit=1`,
      { token },
    );
    const existingId = toSafePositiveInt(rows?.[0]?.id);

    if (existingId) {
      await requestPostgrest<unknown>(
        `barberia_assets?id=eq.${existingId}`,
        {
          method: "PATCH",
          token,
          body: { url: qrUrl, activo: true, orden: 0 },
          preferRepresentation: true,
        },
      );
      return;
    }

    await requestPostgrest<unknown>("barberia_assets", {
      method: "POST",
      token,
      body: {
        barberia_id: barberiaId,
        tipo: "qr",
        url: qrUrl,
        orden: 0,
        activo: true,
      },
      preferRepresentation: true,
    });
  } catch (error) {
    const message = error instanceof Error ? clean(error.message) : "";
    if (
      isUndefinedTableError(message, "barberia_assets") ||
      isMissingColumnError(message, "tipo") ||
      isMissingColumnError(message, "url")
    ) {
      return;
    }
    throw error;
  }
}

async function upsertLandingBrandingAsset(
  token: string,
  barberiaId: number,
  branding: PublicLandingBrandingInput | null | undefined,
) {
  const config = sanitizeBrandingConfig(branding);
  if (!config) return;

  const configPayload = encodeBrandingConfig(config);

  try {
    const rows = await requestPostgrest<AssetRow[]>(
      `barberia_assets?select=id,tipo,url,orden&barberia_id=eq.${barberiaId}&tipo=eq.other&order=updated_at.desc&limit=50`,
      { token },
    );

    const existing = (rows ?? []).find((row) => {
      const url = clean(row.url);
      return url.startsWith(LANDING_CONFIG_PREFIX) || toSafePositiveInt(row.orden) === 999;
    });
    const existingId = toSafePositiveInt(existing?.id);

    if (existingId) {
      await requestPostgrest<unknown>(
        `barberia_assets?id=eq.${existingId}`,
        {
          method: "PATCH",
          token,
          body: {
            url: configPayload,
            orden: 999,
            activo: true,
          },
          preferRepresentation: true,
        },
      );
      return;
    }

    await requestPostgrest<unknown>("barberia_assets", {
      method: "POST",
      token,
      body: {
        barberia_id: barberiaId,
        tipo: "other",
        url: configPayload,
        orden: 999,
        activo: true,
      },
      preferRepresentation: true,
    });
  } catch (error) {
    const message = error instanceof Error ? clean(error.message) : "";
    if (
      isUndefinedTableError(message, "barberia_assets") ||
      isMissingColumnError(message, "tipo") ||
      isMissingColumnError(message, "url") ||
      isMissingColumnError(message, "orden")
    ) {
      return;
    }
    throw error;
  }
}

async function readLandingBrandingAsset(barberiaId: number) {
  try {
    const rows = await requestPostgrest<AssetRow[]>(
      `barberia_assets?select=id,tipo,url,orden&barberia_id=eq.${barberiaId}&tipo=eq.other&order=updated_at.desc&limit=50`,
      {},
    );
    for (const row of rows ?? []) {
      const config = decodeBrandingConfig(row.url);
      if (config) return config;
    }
    return null;
  } catch {
    return null;
  }
}

export async function ensureLandingPersistence(
  params: EnsureLandingParams,
): Promise<PublicLandingMeta> {
  let includeCover = true;
  let includeLogo = true;
  let includeCity = true;
  let includeAddress = true;
  let includePhone = true;
  let includeWhatsapp = true;
  let includeContactEmail = true;
  let includeQrEnabled = true;
  let includeMoneda = true;

  const rows = await requestPostgrest<PublicProfileRow[]>(
    `barberia_public_profiles?select=barberia_id,slug,enabled,qr_enabled&barberia_id=eq.${params.barberiaId}&limit=1`,
    { token: params.token },
  );
  const existing = rows?.[0] ?? null;
  const baseSlug =
    slugify(existing?.slug || params.fallbackSlug || `barberia-${params.barberiaId}`) ||
    `barberia-${params.barberiaId}`;
  const publicName = clean(params.fallbackName) || `Barberia ${params.barberiaId}`;

  let selectedSlug = baseSlug;

  for (let slugAttempt = 0; slugAttempt < 20; slugAttempt += 1) {
    selectedSlug = slugAttempt === 0 ? baseSlug : `${baseSlug}-${slugAttempt + 1}`;

    for (let schemaAttempt = 0; schemaAttempt < 10; schemaAttempt += 1) {
      const body: Record<string, unknown> = {
        barberia_id: params.barberiaId,
        slug: selectedSlug,
        enabled: true,
        nombre_publico: publicName,
      };
      if (includeQrEnabled) body.qr_enabled = true;
      if (includeLogo) body.logo_url = clean(params.logoUrl) || null;
      if (includeCover) body.cover_url = clean(params.coverUrl) || null;
      if (includeCity) body.ciudad = clean(params.city) || null;
      if (includeAddress) body.direccion = clean(params.address) || null;
      if (includePhone) body.telefono = clean(params.phone) || null;
      if (includeWhatsapp) body.whatsapp = clean(params.whatsapp) || null;
      if (includeContactEmail) body.email_contacto = clean(params.contactEmail).toLowerCase() || null;
      if (includeMoneda) body.moneda = "COP";

      try {
        if (existing?.barberia_id) {
          const patched = await requestPostgrest<PublicProfileRow[]>(
            `barberia_public_profiles?barberia_id=eq.${params.barberiaId}`,
            {
              method: "PATCH",
              token: params.token,
              body,
              preferRepresentation: true,
            },
          );
          selectedSlug = slugify(patched?.[0]?.slug || selectedSlug) || selectedSlug;
        } else {
          const created = await requestPostgrest<PublicProfileRow[]>(
            "barberia_public_profiles",
            {
              method: "POST",
              token: params.token,
              body,
              preferRepresentation: true,
            },
          );
          selectedSlug = slugify(created?.[0]?.slug || selectedSlug) || selectedSlug;
        }
        const publicUrl = buildPublicLandingUrl(params.origin, selectedSlug);
        const qrUrl = buildQrImageUrl(publicUrl);
        await upsertLandingBrandingAsset(params.token, params.barberiaId, params.branding);
        await upsertQrAsset(params.token, params.barberiaId, qrUrl);
        try {
          await upsertThemeForBarberia(params.token, params.barberiaId, params.branding);
        } catch (error) {
          const message = error instanceof Error ? clean(error.message) : "";
          // If only theme RLS is misconfigured, keep landing flow working
          // because branding data already drives the public landing render.
          if (!isRlsPolicyError(message, "barberia_theme")) throw error;
        }

        return {
          barberiaId: params.barberiaId,
          slug: selectedSlug,
          enabled: true,
          qrEnabled: true,
          publicPath: buildPublicLandingPath(selectedSlug),
          publicUrl,
          qrUrl,
        };
      } catch (error) {
        const message = error instanceof Error ? clean(error.message) : "";
        if (isUndefinedTableError(message, "barberia_public_profiles")) throw error;
        if (includeQrEnabled && isMissingColumnError(message, "qr_enabled")) {
          includeQrEnabled = false;
          continue;
        }
        if (includeMoneda && isMissingColumnError(message, "moneda")) {
          includeMoneda = false;
          continue;
        }
        if (includeLogo && isMissingColumnError(message, "logo_url")) {
          includeLogo = false;
          continue;
        }
        if (includeCover && isMissingColumnError(message, "cover_url")) {
          includeCover = false;
          continue;
        }
        if (includeCity && isMissingColumnError(message, "ciudad")) {
          includeCity = false;
          continue;
        }
        if (includeAddress && isMissingColumnError(message, "direccion")) {
          includeAddress = false;
          continue;
        }
        if (includePhone && isMissingColumnError(message, "telefono")) {
          includePhone = false;
          continue;
        }
        if (includeWhatsapp && isMissingColumnError(message, "whatsapp")) {
          includeWhatsapp = false;
          continue;
        }
        if (includeContactEmail && isMissingColumnError(message, "email_contacto")) {
          includeContactEmail = false;
          continue;
        }
        if (isUniqueConstraintError(message, "barberia_public_profiles_slug_key")) {
          break;
        }
        throw error;
      }
    }
  }

  throw new Error("No se pudo reservar un slug publico para la landing.");
}

export async function readPublicLandingContext(
  slugInput: string,
): Promise<PublicLandingContext | null> {
  const slug = slugify(slugInput);
  if (!slug) return null;

  const rows = await requestPostgrest<PublicProfileRow[]>(
    `barberia_public_profiles?select=barberia_id,slug,nombre_publico,logo_url,cover_url,ciudad,direccion,telefono,whatsapp,email_contacto,instagram,tiktok,politicas,moneda,enabled&slug=eq.${encodeURIComponent(slug)}&enabled=eq.true&limit=1`,
    {},
  );
  const row = rows?.[0];
  if (!row?.barberia_id) return null;

  const barberiaId = toSafePositiveInt(row.barberia_id);
  if (!barberiaId) return null;

  const themeRows = await requestPostgrest<ThemeRow[]>(
    `barberia_theme?select=barberia_id,primary_color,secondary_color,background_color,text_color&barberia_id=eq.${barberiaId}&limit=1`,
    {},
  ).catch(() => [] as ThemeRow[]);
  const theme = themeRows?.[0];
  const branding = await readLandingBrandingAsset(barberiaId);

  let ownerUserId: number | null = null;
  let ownerToken: string | null = null;
  const ownerAuth = await resolveOwnerAuthByEmail(clean(row.email_contacto)).catch(() => null);
  if (ownerAuth?.userId && ownerAuth.token) {
    ownerUserId = ownerAuth.userId;
    ownerToken = ownerAuth.token;
  }

  let services: Array<{
    id: number;
    nombre: string;
    duracionMin: number;
    precio: number;
  }> = [];
  let barbers: Array<{
    id: number;
    nombre: string;
  }> = [];

  if (ownerToken) {
    const [serviceRows, barberRows] = await Promise.all([
      requestPostgrest<ServiceRow[]>(
        `servicios?select=id,nombre,duracion_min,precio&barberia_id=eq.${barberiaId}&order=nombre.asc&limit=100`,
        { token: ownerToken },
      ).catch(() => [] as ServiceRow[]),
      requestPostgrest<BarberRow[]>(
        `barberos?select=id,nombre,activo&barberia_id=eq.${barberiaId}&activo=is.true&order=nombre.asc&limit=100`,
        { token: ownerToken },
      ).catch(() => [] as BarberRow[]),
    ]);

    services = (serviceRows ?? [])
      .map((service) => ({
        id: toSafePositiveInt(service.id),
        nombre: clean(service.nombre),
        duracionMin: Math.max(5, Number(service.duracion_min ?? 0)),
        precio: Math.max(0, Number(service.precio ?? 0)),
      }))
      .filter((service) => service.id > 0 && service.nombre);

    barbers = (barberRows ?? [])
      .map((barber) => ({
        id: toSafePositiveInt(barber.id),
        nombre: clean(barber.nombre),
      }))
      .filter((barber) => barber.id > 0 && barber.nombre);
  }

  return {
    profile: {
      barberiaId,
      slug: slugify(row.slug) || slug,
      nombrePublico: clean(row.nombre_publico) || "Barberia",
      logoUrl: clean(row.logo_url),
      coverUrl: clean(row.cover_url),
      ciudad: clean(row.ciudad),
      direccion: clean(row.direccion),
      telefono: clean(row.telefono),
      whatsapp: clean(row.whatsapp),
      emailContacto: clean(row.email_contacto),
      instagram: clean(row.instagram),
      tiktok: clean(row.tiktok),
      politicas: clean(row.politicas),
      moneda: clean(row.moneda) || "COP",
    },
    theme: {
      primaryColor: normalizeHexColor(theme?.primary_color, "#111827"),
      secondaryColor: normalizeHexColor(theme?.secondary_color, "#F59E0B"),
      backgroundColor: normalizeHexColor(theme?.background_color, "#FFFFFF"),
      textColor: normalizeHexColor(theme?.text_color, "#111827"),
    },
    branding,
    services,
    barbers,
    ownerUserId,
    ownerToken,
  };
}

export async function createPublicBooking(input: {
  slug: string;
  clienteNombre: string;
  clienteTel: string;
  fecha: string;
  horaInicio: string;
  servicioId: number;
  barberoId?: number | null;
}) {
  const ctx = await readPublicLandingContext(input.slug);
  if (!ctx) throw new Error("La landing publica no existe o esta desactivada.");
  if (!ctx.ownerToken) {
    throw new Error("No se pudo resolver el propietario de la barberia para registrar la reserva.");
  }

  const fecha = clean(input.fecha);
  const horaInicio = clean(input.horaInicio);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error("Fecha invalida.");
  }
  if (!/^\d{2}:\d{2}$/.test(horaInicio)) {
    throw new Error("Hora invalida.");
  }

  const servicioId = toSafePositiveInt(input.servicioId);
  if (!servicioId) throw new Error("Selecciona un servicio.");
  const serviceExists = ctx.services.some((service) => service.id === servicioId);
  if (!serviceExists) throw new Error("Servicio no disponible.");

  let barberoId = toSafePositiveInt(input.barberoId);
  if (!barberoId && ctx.barbers[0]?.id) barberoId = ctx.barbers[0].id;
  if (barberoId && !ctx.barbers.some((barber) => barber.id === barberoId)) {
    throw new Error("Barbero no disponible.");
  }

  const rows = await requestPostgrest<Array<{ id: number }>>("citas", {
    method: "POST",
    token: ctx.ownerToken,
    body: {
      barberia_id: ctx.profile.barberiaId,
      barbero_id: barberoId || null,
      servicio_id: servicioId,
      fecha,
      hora_inicio: `${horaInicio}:00`,
      cliente_nombre: clean(input.clienteNombre),
      cliente_tel: clean(input.clienteTel),
      estado: "pendiente",
    },
    preferRepresentation: true,
  });

  const citaId = toSafePositiveInt(rows?.[0]?.id);
  if (!citaId) throw new Error("No se pudo confirmar la reserva.");

  return {
    citaId,
    slug: ctx.profile.slug,
    barberiaId: ctx.profile.barberiaId,
    ownerUserId: ctx.ownerUserId,
  };
}
