import { NextResponse } from "next/server";
import {
  buildPublicLandingPath,
  buildPublicLandingUrl,
  buildQrImageUrl,
  readPublicLandingContext,
} from "@/lib/public-landing";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function clean(value: unknown) {
  return (value ?? "").toString().trim();
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const slug = clean(params?.slug);
    if (!slug) {
      return NextResponse.json({ ok: false, message: "Slug invalido." }, { status: 400 });
    }

    const landing = await readPublicLandingContext(slug);
    if (!landing) {
      return NextResponse.json(
        { ok: false, message: "No existe una landing publica activa para este slug." },
        { status: 404 },
      );
    }

    const origin = new URL(request.url).origin;
    const publicPath = buildPublicLandingPath(landing.profile.slug);
    const publicUrl = buildPublicLandingUrl(origin, landing.profile.slug);
    const qrUrl = buildQrImageUrl(publicUrl);

    return NextResponse.json({
      ok: true,
      profile: {
        barberia_id: landing.profile.barberiaId,
        slug: landing.profile.slug,
        nombre_publico: landing.profile.nombrePublico,
        logo_url: landing.profile.logoUrl,
        cover_url: landing.profile.coverUrl,
        ciudad: landing.profile.ciudad,
        direccion: landing.profile.direccion,
        telefono: landing.profile.telefono,
        whatsapp: landing.profile.whatsapp,
        email_contacto: landing.profile.emailContacto,
        instagram: landing.profile.instagram,
        tiktok: landing.profile.tiktok,
        politicas: landing.profile.politicas,
        moneda: landing.profile.moneda,
      },
      theme: {
        primary_color: landing.theme.primaryColor,
        secondary_color: landing.theme.secondaryColor,
        background_color: landing.theme.backgroundColor,
        text_color: landing.theme.textColor,
      },
      services: landing.services.map((service) => ({
        id: service.id,
        nombre: service.nombre,
        duracion_min: service.duracionMin,
        precio: service.precio,
      })),
      barbers: landing.barbers.map((barber) => ({
        id: barber.id,
        nombre: barber.nombre,
      })),
      booking_enabled: true,
      public_path: publicPath,
      public_url: publicUrl,
      qr_url: qrUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? clean(error.message) : "No se pudo cargar la landing publica.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
