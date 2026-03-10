import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PublicBookingForm } from "@/components/public-booking-form";
import { ThemeToggle } from "@/components/theme-toggle";
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

function normalizeHexColor(value: unknown, fallback: string) {
  const color = clean(value);
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toUpperCase();
  return fallback.toUpperCase();
}

function hexToRgba(hex: string, alpha: number) {
  const cleanHex = normalizeHexColor(hex, "#000000").replace("#", "");
  const r = Number.parseInt(cleanHex.slice(0, 2), 16);
  const g = Number.parseInt(cleanHex.slice(2, 4), 16);
  const b = Number.parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.min(Math.max(alpha, 0), 1)})`;
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
  return luminance > 0.62 ? "#0F172A" : "#F8FAFC";
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

  const primaryColor = normalizeHexColor(landing.theme.primaryColor, "#111827");
  const secondaryColor = normalizeHexColor(landing.theme.secondaryColor, "#F59E0B");
  const backgroundColor = normalizeHexColor(landing.theme.backgroundColor, "#FFFFFF");
  const textColor = normalizeHexColor(landing.theme.textColor, "#111827");
  const primaryTextColor = textOnBackground(primaryColor);
  const secondaryTextColor = textOnBackground(secondaryColor);

  return (
    <main
      className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
      style={{
        color: "var(--foreground)",
        backgroundImage: `
          radial-gradient(circle at 8% 15%, ${hexToRgba(primaryColor, 0.22)} 0%, transparent 34%),
          radial-gradient(circle at 90% 4%, ${hexToRgba(secondaryColor, 0.2)} 0%, transparent 32%),
          linear-gradient(180deg, var(--background) 0%, ${hexToRgba(backgroundColor, 0.18)} 100%)
        `,
      }}
    >
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
        <article
          className="relative h-[500px] overflow-hidden border-y shadow-2xl"
          style={{
            borderColor: hexToRgba(primaryColor, 0.45),
            backgroundColor: "var(--surface)",
          }}
        >
          <img
            src={heroImage}
            alt={`Portada ${landing.profile.nombrePublico}`}
            className="h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(112deg, ${hexToRgba(backgroundColor, 0.7)} 0%, ${hexToRgba("#020617", 0.62)} 45%, ${hexToRgba("#020617", 0.82)} 100%)`,
            }}
          />

          <div className="absolute inset-0 z-10 mx-auto flex h-full w-full max-w-6xl flex-col justify-between px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={logoImage}
                  alt={landing.profile.nombrePublico}
                  className="size-14 rounded-xl border object-cover sm:size-16"
                  style={{ borderColor: hexToRgba(secondaryColor, 0.65) }}
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-200">
                    Reserva online
                  </p>
                  <h1 className="text-3xl font-black text-zinc-50 sm:text-4xl">
                    {landing.profile.nombrePublico}
                  </h1>
                  {landing.profile.ciudad ? (
                    <p className="text-sm text-zinc-200">{landing.profile.ciudad}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={publicUrl}
                  className="inline-flex rounded-lg border px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                  style={{
                    backgroundColor: hexToRgba(primaryColor, 0.5),
                    borderColor: hexToRgba(secondaryColor, 0.55),
                    color: primaryTextColor,
                  }}
                >
                  Compartir URL
                </a>
                <ThemeToggle />
              </div>
            </div>

            <div className="max-w-3xl space-y-3">
              <h2 className="text-4xl font-black leading-tight text-zinc-50 sm:text-5xl">
                Agenda tu cita en minutos con disponibilidad real.
              </h2>
              <p className="text-base text-zinc-100 sm:text-lg">
                Selecciona servicio, fecha y hora. Te confirmamos al instante para que llegues sin
                esperas.
              </p>
              <div className="flex flex-wrap gap-2">
                {landing.services.slice(0, 4).map((service) => (
                  <span
                    key={`${service.id}-${service.nombre}`}
                    className="rounded-full border px-3 py-1 text-xs font-semibold"
                    style={{
                      borderColor: hexToRgba(secondaryColor, 0.72),
                      backgroundColor: hexToRgba(primaryColor, 0.48),
                      color: primaryTextColor,
                    }}
                  >
                    {service.nombre} ({service.duracionMin} min)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="mx-auto mt-5 grid w-full max-w-6xl gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article
          className="rounded-2xl border p-4 shadow-xl sm:p-5"
          style={{ borderColor: "var(--line)", backgroundColor: "var(--surface)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Servicios disponibles
          </p>
          <div className="mt-3 space-y-2">
            {landing.services.length === 0 ? (
              <p className="text-sm text-zinc-300">
                Pronto publicaremos el catalogo de servicios de esta barberia.
              </p>
            ) : (
              landing.services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--line)",
                    backgroundColor: "var(--surface-muted)",
                  }}
                >
                  <span className="font-semibold">{service.nombre}</span>
                  <span className="text-xs sm:text-sm">
                    {service.duracionMin} min | {formatMoneyCOP(service.precio)}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>

        <article
          className="rounded-2xl border p-4 shadow-xl sm:p-5"
          style={{ borderColor: "var(--line)", backgroundColor: "var(--surface)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Formulario global
          </p>
          <h3 className="mt-1 text-3xl font-black">Reserva ahora</h3>
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
              primaryColor={secondaryColor}
              backgroundColor={backgroundColor}
              textColor={textColor}
            />
          </div>
        </article>
      </section>

      <section className="mx-auto mt-4 grid w-full max-w-6xl gap-4 md:grid-cols-[1fr_1fr_0.9fr]">
        <article
          className="rounded-2xl border p-4"
          style={{ borderColor: "var(--line)", backgroundColor: "var(--surface)" }}
        >
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

        <article
          className="rounded-2xl border p-4"
          style={{ borderColor: "var(--line)", backgroundColor: "var(--surface)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Politicas y redes
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <p>
              Moneda: <strong>{landing.profile.moneda || "COP"}</strong>
            </p>
            {landing.profile.instagram ? <p>Instagram: @{landing.profile.instagram}</p> : null}
            {landing.profile.tiktok ? <p>TikTok: @{landing.profile.tiktok}</p> : null}
            {landing.profile.politicas ? (
              <p className="text-zinc-300">{landing.profile.politicas}</p>
            ) : (
              <p className="text-zinc-300">
                Reserva sujeta a disponibilidad real de barberos y horarios.
              </p>
            )}
          </div>
        </article>

        <article
          className="rounded-2xl border p-4"
          style={{ borderColor: "var(--line)", backgroundColor: "var(--surface)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            QR de reservas
          </p>
          <div className="mt-3 flex flex-col items-center gap-3">
            <img
              src={qrUrl}
              alt={`QR reservas ${landing.profile.nombrePublico}`}
              className="size-36 rounded-lg border bg-white p-2"
              style={{ borderColor: "var(--line)" }}
            />
            <a
              href={publicUrl}
              className="w-full rounded-lg px-3 py-2 text-center text-sm font-bold transition hover:opacity-90"
              style={{ backgroundColor: secondaryColor, color: secondaryTextColor }}
            >
              Abrir landing
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}
