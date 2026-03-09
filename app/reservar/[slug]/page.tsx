import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PublicBookingForm } from "@/components/public-booking-form";
import {
  buildPublicLandingUrl,
  buildQrImageUrl,
  readPublicLandingContext,
} from "@/lib/public-landing";

type PageContext = {
  params: Promise<{
    slug: string;
  }>;
};

function clean(value: unknown) {
  return (value ?? "").toString().trim();
}

function formatMoneyCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(value || 0)));
}

function textOnBackground(hex: string) {
  const value = clean(hex).replace("#", "");
  if (value.length !== 6) return "#F8FAFC";
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? "#0F172A" : "#F8FAFC";
}

export default async function PublicBookingPage(context: PageContext) {
  const params = await context.params;
  const landing = await readPublicLandingContext(params.slug);
  if (!landing) notFound();

  const headerStore = await headers();
  const proto = clean(headerStore.get("x-forwarded-proto")) || "https";
  const host =
    clean(headerStore.get("x-forwarded-host")) ||
    clean(headerStore.get("host")) ||
    "barberagency-app.gymh5g.easypanel.host";
  const origin = `${proto}://${host}`;

  const publicUrl = buildPublicLandingUrl(origin, landing.profile.slug);
  const qrUrl = buildQrImageUrl(publicUrl);
  const heroImage = landing.profile.coverUrl || "/Fondoiniciodshb.jpg";
  const logoImage = landing.profile.logoUrl || "/welcome-card-image.png";
  const primaryColor = landing.theme.primaryColor;
  const secondaryColor = landing.theme.secondaryColor;
  const textColor = landing.theme.textColor;
  const cardTextColor = textOnBackground(secondaryColor);

  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6 lg:px-10"
      style={{
        backgroundColor: landing.theme.backgroundColor,
        color: textColor,
      }}
    >
      <section className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="overflow-hidden rounded-3xl border border-zinc-700/40 bg-zinc-950/80 shadow-2xl">
          <div
            className="relative min-h-[380px] bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/75" />
            <div className="relative z-10 flex min-h-[380px] flex-col justify-between p-5 sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={logoImage}
                    alt={landing.profile.nombrePublico}
                    className="size-14 rounded-xl border border-white/30 object-cover"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300">
                      Reserva online
                    </p>
                    <h1 className="text-2xl font-black sm:text-3xl">
                      {landing.profile.nombrePublico}
                    </h1>
                    {landing.profile.ciudad ? (
                      <p className="text-sm text-zinc-300">{landing.profile.ciudad}</p>
                    ) : null}
                  </div>
                </div>

                <a
                  href={publicUrl}
                  className="hidden rounded-lg border px-3 py-2 text-xs font-semibold text-zinc-100 transition hover:bg-white/10 sm:inline-flex"
                  style={{ borderColor: `${primaryColor}80` }}
                >
                  Compartir URL
                </a>
              </div>

              <div className="space-y-3">
                <h2 className="max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                  Agenda tu cita en minutos con disponibilidad real.
                </h2>
                <p className="max-w-2xl text-sm text-zinc-200">
                  Selecciona servicio, fecha y hora. Te confirmamos al instante para que llegues
                  sin esperas.
                </p>
                <div className="flex flex-wrap gap-2">
                  {landing.services.slice(0, 3).map((service) => (
                    <span
                      key={`${service.id}-${service.nombre}`}
                      className="rounded-full border px-3 py-1 text-xs font-semibold text-zinc-100"
                      style={{ borderColor: `${secondaryColor}80` }}
                    >
                      {service.nombre} ({service.duracionMin} min)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-zinc-700/40 bg-zinc-950/80 p-4 shadow-2xl sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Formulario global
          </p>
          <h3 className="mt-1 text-xl font-black">Reserva ahora</h3>
          <p className="mt-1 text-sm text-zinc-300">
            Tu cita queda guardada en la agenda de la barberia.
          </p>

          <div className="mt-4">
            <PublicBookingForm
              slug={landing.profile.slug}
              services={landing.services.map((service) => ({
                id: service.id,
                nombre: service.nombre,
                duracion_min: service.duracionMin,
                precio: service.precio,
              }))}
              barbers={landing.barbers}
              primaryColor={primaryColor}
              backgroundColor={landing.theme.backgroundColor}
              textColor={textColor}
            />
          </div>
        </article>
      </section>

      <section className="mx-auto mt-5 grid w-full max-w-6xl gap-4 md:grid-cols-[1fr_0.9fr_0.9fr]">
        <article className="rounded-2xl border border-zinc-700/40 bg-zinc-950/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Servicios disponibles
          </p>
          <div className="mt-3 space-y-2">
            {landing.services.length === 0 ? (
              <p className="text-sm text-zinc-300">Pronto publicaremos el catalogo de servicios.</p>
            ) : (
              landing.services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-700/40 bg-zinc-900/70 px-3 py-2 text-sm"
                >
                  <span>{service.nombre}</span>
                  <span className="font-semibold">
                    {service.duracionMin} min | {formatMoneyCOP(service.precio)}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-700/40 bg-zinc-950/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Contacto rapido
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {landing.profile.telefono ? <p>Telefono: {landing.profile.telefono}</p> : null}
            {landing.profile.whatsapp ? <p>WhatsApp: {landing.profile.whatsapp}</p> : null}
            {landing.profile.direccion ? <p>Direccion: {landing.profile.direccion}</p> : null}
            {landing.profile.emailContacto ? <p>Email: {landing.profile.emailContacto}</p> : null}
            {!landing.profile.telefono &&
            !landing.profile.whatsapp &&
            !landing.profile.direccion &&
            !landing.profile.emailContacto ? (
              <p className="text-zinc-300">Contacto disponible al confirmar la reserva.</p>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-700/40 bg-zinc-950/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            QR de reservas
          </p>
          <div className="mt-3 flex flex-col items-center gap-3">
            <img
              src={qrUrl}
              alt={`QR reservas ${landing.profile.nombrePublico}`}
              className="size-36 rounded-lg border border-zinc-700/50 bg-white p-2"
            />
            <a
              href={publicUrl}
              className="w-full rounded-lg px-3 py-2 text-center text-sm font-bold transition"
              style={{ backgroundColor: secondaryColor, color: cardTextColor }}
            >
              Abrir landing
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}
