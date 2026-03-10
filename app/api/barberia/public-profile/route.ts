import { NextResponse } from "next/server";
import { postgrestRequest, requireAuth } from "@/app/api/citas/_helpers";
import {
  buildPublicLandingPath,
  buildPublicLandingUrl,
  buildQrImageUrl,
  ensureLandingPersistence,
  type PublicLandingBrandingInput,
} from "@/lib/public-landing";
import { signSessionToken } from "@/lib/session-token";

type BarberiaRow = {
  id: number;
  slug: string | null;
  nombre: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
};

type PublicProfileRow = {
  slug: string | null;
  enabled: boolean | null;
  qr_enabled: boolean | null;
};

type UpdateBody = {
  branding?: PublicLandingBrandingInput;
  barberia?: {
    nombre?: string;
    slug?: string;
    logo_url?: string | null;
    cover_url?: string | null;
    ciudad?: string | null;
    direccion?: string | null;
    telefono?: string | null;
  };
};

function clean(value: unknown) {
  return (value ?? "").toString().trim();
}

async function getBarberia(token: string, barberiaId: number) {
  const barberiaRows = await postgrestRequest<BarberiaRow[]>(
    `barberias?select=id,slug,nombre,logo_url,cover_url,ciudad,direccion,telefono&id=eq.${barberiaId}&limit=1`,
    token,
  );
  return barberiaRows?.[0];
}

export async function GET(request: Request) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { session, barberiaId } = auth.context;
  const ownerToken = signSessionToken({
    userId: session.user_id,
    role: session.role,
    email: session.email,
  });

  try {
    const barberia = await getBarberia(ownerToken, barberiaId);
    if (!barberia?.id) {
      return NextResponse.json(
        { ok: false, message: "No se encontro la barberia activa." },
        { status: 404 },
      );
    }

    const requestOrigin = new URL(request.url).origin;
    const fallbackSlug = clean(barberia.slug) || `barberia-${barberiaId}`;
    const fallbackName = clean(barberia.nombre) || "Mi barberia";

    let publicLanding = {
      barberiaId,
      slug: fallbackSlug,
      enabled: false,
      qrEnabled: true,
      publicPath: buildPublicLandingPath(fallbackSlug),
      publicUrl: buildPublicLandingUrl(requestOrigin, fallbackSlug),
      qrUrl: buildQrImageUrl(buildPublicLandingUrl(requestOrigin, fallbackSlug)),
    };
    let warning = "";

    try {
      publicLanding = await ensureLandingPersistence({
        token: ownerToken,
        barberiaId,
        fallbackSlug,
        fallbackName,
        origin: requestOrigin,
        logoUrl: clean(barberia.logo_url),
        coverUrl: clean(barberia.cover_url),
        city: clean(barberia.ciudad),
        address: clean(barberia.direccion),
        phone: clean(barberia.telefono),
      });
    } catch (error) {
      warning =
        error instanceof Error
          ? clean(error.message)
          : "No se pudo asegurar el perfil publico.";
      const profileRows = await postgrestRequest<PublicProfileRow[]>(
        `barberia_public_profiles?select=slug,enabled,qr_enabled&barberia_id=eq.${barberiaId}&limit=1`,
        ownerToken,
      ).catch(() => [] as PublicProfileRow[]);
      const profile = profileRows?.[0];
      const profileSlug = clean(profile?.slug) || fallbackSlug;
      publicLanding = {
        barberiaId,
        slug: profileSlug,
        enabled: Boolean(profile?.enabled),
        qrEnabled: profile?.qr_enabled !== false,
        publicPath: buildPublicLandingPath(profileSlug),
        publicUrl: buildPublicLandingUrl(requestOrigin, profileSlug),
        qrUrl: buildQrImageUrl(buildPublicLandingUrl(requestOrigin, profileSlug)),
      };
    }

    return NextResponse.json({
      ok: true,
      barberia_id: barberiaId,
      slug: publicLanding.slug,
      enabled: publicLanding.enabled,
      qr_enabled: publicLanding.qrEnabled,
      public_path: publicLanding.publicPath,
      public_url: publicLanding.publicUrl,
      qr_url: publicLanding.qrUrl,
      warning: warning || undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? clean(error.message) : "No se pudo cargar landing publica.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;

  const { barberiaId, session } = auth.context;
  const ownerToken = signSessionToken({
    userId: session.user_id,
    role: session.role,
    email: session.email,
  });

  try {
    const body = (await request.json().catch(() => ({}))) as UpdateBody;
    const barberia = await getBarberia(ownerToken, barberiaId);
    if (!barberia?.id) {
      return NextResponse.json(
        { ok: false, message: "No se encontro la barberia activa." },
        { status: 404 },
      );
    }

    const requestOrigin = new URL(request.url).origin;
    const fallbackSlug =
      clean(body?.barberia?.slug) || clean(barberia.slug) || `barberia-${barberiaId}`;
    const fallbackName = clean(body?.barberia?.nombre) || clean(barberia.nombre) || "Mi barberia";
    const heroImageFromBranding = clean(body?.branding?.hero_image_url);

    const publicLanding = await ensureLandingPersistence({
      token: ownerToken,
      barberiaId,
      fallbackSlug,
      fallbackName,
      origin: requestOrigin,
      logoUrl: clean(body?.barberia?.logo_url) || clean(barberia.logo_url),
      coverUrl:
        heroImageFromBranding ||
        clean(body?.barberia?.cover_url) ||
        clean(barberia.cover_url),
      city: clean(body?.barberia?.ciudad) || clean(barberia.ciudad),
      address: clean(body?.barberia?.direccion) || clean(barberia.direccion),
      phone: clean(body?.barberia?.telefono) || clean(barberia.telefono),
      whatsapp: clean(body?.barberia?.telefono) || clean(barberia.telefono),
      contactEmail: clean(session.email),
      branding: body?.branding,
    });

    return NextResponse.json({
      ok: true,
      message: "Landing publica actualizada.",
      barberia_id: barberiaId,
      slug: publicLanding.slug,
      public_path: publicLanding.publicPath,
      public_url: publicLanding.publicUrl,
      qr_url: publicLanding.qrUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? clean(error.message) : "No se pudo actualizar landing publica.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
