"use client";

import { useMemo, useState } from "react";

type ServiceOption = {
  id: number;
  nombre: string;
  duracion_min: number;
  precio: number;
};

type BarberOption = {
  id: number;
  nombre: string;
};

type SubmitState =
  | { type: "idle"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type Props = {
  slug: string;
  services: ServiceOption[];
  barbers: BarberOption[];
  primaryColor: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  submitLabel?: string;
  fontFamily?: string;
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

function normalizeHexColor(value: unknown, fallback: string) {
  const color = clean(value);
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toUpperCase();
  return fallback.toUpperCase();
}

function luminance(hex: string) {
  const cleanHex = normalizeHexColor(hex, "#000000").replace("#", "");
  const r = Number.parseInt(cleanHex.slice(0, 2), 16);
  const g = Number.parseInt(cleanHex.slice(2, 4), 16);
  const b = Number.parseInt(cleanHex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function hasReasonableContrast(backgroundHex: string, foregroundHex: string) {
  const diff = Math.abs(luminance(backgroundHex) - luminance(foregroundHex));
  return diff >= 0.45;
}

function textOnBackground(hex: string) {
  return luminance(hex) > 0.62 ? "#0F172A" : "#F8FAFC";
}

function getTodayISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function PublicBookingForm({
  slug,
  services,
  barbers,
  primaryColor,
  backgroundColor,
  textColor,
  borderColor,
  submitLabel,
  fontFamily,
}: Props) {
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTel, setClienteTel] = useState("");
  const [fecha, setFecha] = useState(getTodayISODate());
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [servicioId, setServicioId] = useState<number>(services[0]?.id ?? 0);
  const [barberoId, setBarberoId] = useState<number>(barbers[0]?.id ?? 0);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<SubmitState>({ type: "idle", message: "" });

  const selectedService = useMemo(
    () => services.find((service) => service.id === servicioId) ?? null,
    [servicioId, services],
  );
  const inputBackgroundColor = normalizeHexColor(backgroundColor, "#F8FAFC");
  const preferredInputText = normalizeHexColor(textColor, "#0F172A");
  const inputTextColor = hasReasonableContrast(inputBackgroundColor, preferredInputText)
    ? preferredInputText
    : textOnBackground(inputBackgroundColor);
  const primaryTextColor = textOnBackground(primaryColor);
  const inputStyle = {
    borderColor: clean(borderColor) || "var(--line)",
    backgroundColor: inputBackgroundColor,
    color: inputTextColor,
  } as const;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setState({ type: "idle", message: "" });

    const response = await fetch("/api/public/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        cliente_nombre: clean(clienteNombre),
        cliente_tel: clean(clienteTel),
        fecha: clean(fecha),
        hora_inicio: clean(horaInicio),
        servicio_id: servicioId,
        barbero_id: barberoId || null,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      cita_id?: number;
    };

    if (!response.ok || !data.ok) {
      setState({
        type: "error",
        message: clean(data.message) || "No se pudo crear la reserva.",
      });
      setLoading(false);
      return;
    }

    setState({
      type: "success",
      message: `Reserva confirmada. Codigo #${data.cita_id ?? "-"}.`,
    });
    setClienteNombre("");
    setClienteTel("");
    setLoading(false);
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit} style={fontFamily ? { fontFamily } : undefined}>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide opacity-75">
            Nombre
          </span>
          <input
            required
            value={clienteNombre}
            onChange={(event) => setClienteNombre(event.target.value)}
            className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
            style={inputStyle}
            placeholder="Tu nombre"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide opacity-75">
            Telefono
          </span>
          <input
            required
            value={clienteTel}
            onChange={(event) => setClienteTel(event.target.value)}
            className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
            style={inputStyle}
            placeholder="3001234567"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide opacity-75">
            Fecha
          </span>
          <input
            required
            type="date"
            min={getTodayISODate()}
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
            style={inputStyle}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide opacity-75">
            Hora
          </span>
          <input
            required
            type="time"
            value={horaInicio}
            onChange={(event) => setHoraInicio(event.target.value)}
            className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
            style={inputStyle}
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide opacity-75">
            Servicio
          </span>
          <select
            required
            value={servicioId}
            onChange={(event) => setServicioId(Number(event.target.value))}
            className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
            style={inputStyle}
          >
            {services.length === 0 ? <option value={0}>Sin servicios disponibles</option> : null}
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.nombre} ({service.duracion_min} min) - {formatMoneyCOP(service.precio)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide opacity-75">
            Barbero
          </span>
          <select
            value={barberoId}
            onChange={(event) => setBarberoId(Number(event.target.value))}
            className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
            style={inputStyle}
          >
            {barbers.length === 0 ? <option value={0}>Primer barbero disponible</option> : null}
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedService ? (
        <p className="text-xs opacity-80">
          Tiempo estimado: {selectedService.duracion_min} min
        </p>
      ) : null}

      {state.message ? (
        <p
          className="rounded-lg border px-3 py-2 text-sm font-semibold"
          style={
            state.type === "success"
              ? {
                  borderColor: "rgba(16, 185, 129, 0.45)",
                  backgroundColor: "rgba(16, 185, 129, 0.14)",
                  color: "#34D399",
                }
              : state.type === "error"
                ? {
                    borderColor: "rgba(239, 68, 68, 0.45)",
                    backgroundColor: "rgba(239, 68, 68, 0.14)",
                    color: "#FCA5A5",
                  }
                : {}
          }
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || services.length === 0}
        className="inline-flex h-10 w-full items-center justify-center rounded-lg px-4 text-sm font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: primaryColor, color: primaryTextColor }}
      >
        {loading ? "Guardando..." : clean(submitLabel) || "Reservar cita"}
      </button>
    </form>
  );
}
