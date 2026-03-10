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

function luminance(hex: string) {
  const value = clean(hex).replace("#", "");
  if (value.length !== 6) return 0;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function textOnBackground(hex: string) {
  return luminance(hex) > 0.62 ? "#0F172A" : "#F8FAFC";
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

  const branding = landing.branding;
  const primaryColor = normalizeHexColor(
    branding?.palette.primary ?? landing.theme.primaryColor,
    "#111827",
  );
  const secondaryColor = normalizeHexColor(
    branding?.palette.secondary ?? landing.theme.secondaryColor,
    "#F59E0B",
  );
  const backgroundColor = normalizeHexColor(
    branding?.palette.background ?? landing.theme.backgroundColor,
    "#FFFFFF",
  );
  const textColor = normalizeHexColor(branding?.palette.text ?? landing.theme.textColor, "#111827");
  const themeMode = branding?.themeMode || (luminance(backgroundColor) > 0.62 ? "light" : "dark");
  const surfaceColor = normalizeHexColor(
    branding?.palette.surface,
    themeMode === "light" ? "#FFFFFF" : "#0F172A",
  );

  const panelBackground = themeMode === "light" ? "#FFFFFF" : hexToRgba(surfaceColor, 0.9);
  const panelMutedBackground = themeMode === "light" ? "#F4F7FC" : hexToRgba(surfaceColor, 0.72);
  const panelBorderColor = hexToRgba(secondaryColor, themeMode === "light" ? 0.3 : 0.52);
  const pageTextColor = themeMode === "light" ? "#0F172A" : textColor;
  const pageSoftText = hexToRgba(pageTextColor, themeMode === "light" ? 0.72 : 0.82);
  const primaryTextColor = textOnBackground(primaryColor);
  const secondaryTextColor = textOnBackground(secondaryColor);

  const publicUrl = buildPublicLandingUrl(origin, landing.profile.slug);
  const qrUrl = buildQrImageUrl(publicUrl);
  const heroImage =
    clean(branding?.heroImageUrl) || landing.profile.coverUrl || "/Fondoiniciodshb.jpg";
  const secondaryImage = clean(branding?.secondaryImageUrl) || heroImage;
  const tertiaryImage = clean(branding?.tertiaryImageUrl) || "/welcome-card-image.png";
  const logoImage = landing.profile.logoUrl || "/welcome-card-image.png";

  const heroBadge = clean(branding?.heroBadge) || "RESERVA ONLINE";
  const heroTitle =
    clean(branding?.heroTitle) || "Agenda tu cita en minutos con disponibilidad real.";
  const heroSubtitle =
    clean(branding?.heroSubtitle) ||
    "Selecciona servicio, fecha y hora. Te confirmamos al instante para que llegues sin esperas.";
  const bookingTitle = clean(branding?.bookingTitle) || "Reserva ahora";
  const bookingSubtitle =
    clean(branding?.bookingSubtitle) || "Tu cita queda guardada en la agenda de la barberia.";
  const ctaLabel = clean(branding?.ctaLabel) || "Reservar cita";
  const navItems =
    branding?.navItems && branding.navItems.length > 0
      ? branding.navItems
      : ["Inicio", "Servicios", "Equipo", "Reserva"];
  const benefitList = [branding?.benefit1, branding?.benefit2, branding?.benefit3]
    .map((item) => clean(item))
    .filter(Boolean);

  const heroOverlay =
    themeMode === "light"
      ? `linear-gradient(108deg, ${hexToRgba("#FFFFFF", 0.78)} 0%, ${hexToRgba(backgroundColor, 0.58)} 35%, ${hexToRgba("#0F172A", 0.56)} 100%)`
      : `linear-gradient(110deg, ${hexToRgba("#020617", 0.28)} 0%, ${hexToRgba("#020617", 0.58)} 42%, ${hexToRgba("#020617", 0.86)} 100%)`;

  return (
    <main
      className="min-h-screen px-0 pb-8"
      style={{
        color: pageTextColor,
        backgroundImage: `
          radial-gradient(circle at 10% 14%, ${hexToRgba(primaryColor, 0.2)} 0%, transparent 35%),
          radial-gradient(circle at 90% 0%, ${hexToRgba(secondaryColor, 0.16)} 0%, transparent 32%),
          linear-gradient(180deg, ${hexToRgba(backgroundColor, 0.92)} 0%, ${backgroundColor} 100%)
        `,
      }}
    >
      <section className="relative left-1/2 right-1/2 -mx-[50vw] mt-3 w-screen">
        <article
          className="relative h-[500px] overflow-hidden border-y"
          style={{ borderColor: panelBorderColor }}
        >
          <img
            src={heroImage}
            alt={`Portada ${landing.profile.nombrePublico}`}
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0" style={{ background: heroOverlay }} />

          <div className="absolute inset-0 z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={logoImage}
                  alt={landing.profile.nombrePublico}
                  className="size-14 rounded-xl border bg-white/85 object-cover p-1 sm:size-16"
                  style={{ borderColor: hexToRgba(secondaryColor, 0.72) }}
                />
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.2em]"
                    style={{ color: hexToRgba("#F8FAFC", 0.95) }}
                  >
                    {heroBadge}
                  </p>
                  <h1 className="text-3xl font-black leading-none sm:text-4xl" style={{ color: "#F8FAFC" }}>
                    {landing.profile.nombrePublico}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={publicUrl}
                  className="inline-flex rounded-lg border px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                  style={{
                    borderColor: hexToRgba(secondaryColor, 0.75),
                    backgroundColor: hexToRgba("#020617", 0.45),
                    color: "#F8FAFC",
                  }}
                >
                  Compartir URL
                </a>
                <ThemeToggle />
              </div>
            </header>

            <nav className="mt-3 hidden flex-wrap items-center gap-2 md:flex">
              {navItems.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{
                    borderColor: hexToRgba("#FFFFFF", 0.24),
                    backgroundColor: hexToRgba("#020617", 0.38),
                    color: "#F8FAFC",
                  }}
                >
                  {item}
                </span>
              ))}
            </nav>

            <div className="mt-auto grid gap-4 pb-2 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                <h2 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl" style={{ color: "#F8FAFC" }}>
                  {heroTitle}
                </h2>
                <p className="max-w-2xl text-base sm:text-lg" style={{ color: hexToRgba("#F8FAFC", 0.88) }}>
                  {heroSubtitle}
                </p>

                <div className="flex flex-wrap gap-2">
                  {landing.services.slice(0, 4).map((service) => (
                    <span
                      key={`${service.id}-${service.nombre}`}
                      className="rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{
                        borderColor: hexToRgba(secondaryColor, 0.75),
                        backgroundColor: hexToRgba(primaryColor, 0.56),
                        color: primaryTextColor,
                      }}
                    >
                      {service.nombre} ({service.duracionMin} min)
                    </span>
                  ))}
                </div>

                <div className="grid max-w-2xl gap-2 sm:grid-cols-3">
                  <div
                    className="rounded-xl border px-3 py-2"
                    style={{
                      borderColor: hexToRgba("#FFFFFF", 0.24),
                      backgroundColor: hexToRgba("#020617", 0.44),
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: hexToRgba("#F8FAFC", 0.72) }}>
                      Servicios
                    </p>
                    <p className="mt-1 text-2xl font-black text-white">{landing.services.length}</p>
                  </div>
                  <div
                    className="rounded-xl border px-3 py-2"
                    style={{
                      borderColor: hexToRgba("#FFFFFF", 0.24),
                      backgroundColor: hexToRgba("#020617", 0.44),
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: hexToRgba("#F8FAFC", 0.72) }}>
                      Barberos
                    </p>
                    <p className="mt-1 text-2xl font-black text-white">{landing.barbers.length}</p>
                  </div>
                  <div
                    className="rounded-xl border px-3 py-2"
                    style={{
                      borderColor: hexToRgba("#FFFFFF", 0.24),
                      backgroundColor: hexToRgba("#020617", 0.44),
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: hexToRgba("#F8FAFC", 0.72) }}>
                      URL
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">/{landing.profile.slug}</p>
                  </div>
                </div>
              </div>

              <aside
                className="rounded-2xl border p-4 shadow-xl"
                style={{
                  borderColor: panelBorderColor,
                  backgroundColor: hexToRgba(surfaceColor, themeMode === "light" ? 0.92 : 0.82),
                  boxShadow: `0 10px 26px ${hexToRgba("#020617", themeMode === "light" ? 0.12 : 0.5)}`,
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: pageSoftText }}>
                  Formulario global
                </p>
                <h3 className="mt-1 text-3xl font-black">{bookingTitle}</h3>
                <p className="mt-1 text-sm" style={{ color: pageSoftText }}>
                  {bookingSubtitle}
                </p>

                <div className="mt-3">
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
                    backgroundColor={themeMode === "light" ? "#FFFFFF" : "#0B1220"}
                    textColor={themeMode === "light" ? "#0F172A" : "#E2E8F0"}
                    borderColor={panelBorderColor}
                    submitLabel={ctaLabel}
                  />
                </div>
              </aside>
            </div>
          </div>
        </article>
      </section>

      <section className="mx-auto mt-5 grid w-full max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-[1fr_1fr_0.9fr] lg:px-8">
        <article
          className="rounded-2xl border p-4"
          style={{ borderColor: panelBorderColor, backgroundColor: panelBackground }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: pageSoftText }}>
            Servicios disponibles
          </p>
          <div className="mt-3 space-y-2">
            {landing.services.length === 0 ? (
              <p className="text-sm" style={{ color: pageSoftText }}>
                Pronto publicaremos el catalogo de servicios de esta barberia.
              </p>
            ) : (
              landing.services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: panelBorderColor,
                    backgroundColor: panelMutedBackground,
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
          className="rounded-2xl border p-4"
          style={{ borderColor: panelBorderColor, backgroundColor: panelBackground }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: pageSoftText }}>
            Contacto y politicas
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {landing.profile.telefono ? <p>Telefono: {landing.profile.telefono}</p> : null}
            {landing.profile.whatsapp ? <p>WhatsApp: {landing.profile.whatsapp}</p> : null}
            {landing.profile.direccion ? <p>Direccion: {landing.profile.direccion}</p> : null}
            {landing.profile.emailContacto ? <p>Email: {landing.profile.emailContacto}</p> : null}
            {landing.profile.instagram ? <p>Instagram: @{landing.profile.instagram}</p> : null}
            {landing.profile.tiktok ? <p>TikTok: @{landing.profile.tiktok}</p> : null}
            {landing.profile.politicas ? (
              <p style={{ color: pageSoftText }}>{landing.profile.politicas}</p>
            ) : benefitList.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5" style={{ color: pageSoftText }}>
                {benefitList.map((benefit, index) => (
                  <li key={`${benefit}-${index}`}>{benefit}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: pageSoftText }}>
                Reserva sujeta a disponibilidad real de barberos y horarios.
              </p>
            )}
          </div>
        </article>

        <article
          className="rounded-2xl border p-4"
          style={{ borderColor: panelBorderColor, backgroundColor: panelBackground }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: pageSoftText }}>
            QR de reservas
          </p>
          <div className="mt-3 flex flex-col items-center gap-3">
            <img
              src={qrUrl}
              alt={`QR reservas ${landing.profile.nombrePublico}`}
              className="size-36 rounded-lg border bg-white p-2"
              style={{ borderColor: panelBorderColor }}
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

      <section className="mx-auto mt-4 grid w-full max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: panelBorderColor, backgroundColor: panelBackground }}
        >
          <img src={secondaryImage} alt="Imagen secundaria barberia" className="h-56 w-full object-cover" />
          <div className="p-4">
            <p className="text-sm font-black">Experiencia y ambiente</p>
            <p className="mt-1 text-sm" style={{ color: pageSoftText }}>
              Diseno profesional con reservas online para convertir visitas en citas reales.
            </p>
          </div>
        </article>

        <article
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: panelBorderColor, backgroundColor: panelBackground }}
        >
          <img src={tertiaryImage} alt="Imagen terciaria barberia" className="h-56 w-full object-cover" />
          <div className="p-4">
            <p className="text-sm font-black">Equipo listo para atender</p>
            <p className="mt-1 text-sm" style={{ color: pageSoftText }}>
              {landing.barbers.length > 0
                ? landing.barbers.map((barber) => barber.nombre).join(" | ")
                : "Pronto publicaremos el equipo completo de barberos."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={publicUrl}
                className="rounded-lg px-3 py-2 text-xs font-bold"
                style={{ backgroundColor: primaryColor, color: primaryTextColor }}
              >
                {ctaLabel}
              </a>
              <span className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: panelBorderColor }}>
                Moneda: {landing.profile.moneda || "COP"}
              </span>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
