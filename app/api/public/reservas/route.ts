import { NextResponse } from "next/server";
import { createPublicBooking } from "@/lib/public-landing";

function clean(value: unknown) {
  return (value ?? "").toString().trim();
}

function toSafePositiveInt(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return 0;
  return parsed;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      slug?: string;
      cliente_nombre?: string;
      cliente_tel?: string;
      fecha?: string;
      hora_inicio?: string;
      servicio_id?: number;
      barbero_id?: number | null;
    };

    const slug = clean(body.slug);
    const clienteNombre = clean(body.cliente_nombre);
    const clienteTel = clean(body.cliente_tel);
    const fecha = clean(body.fecha);
    const horaInicio = clean(body.hora_inicio);
    const servicioId = toSafePositiveInt(body.servicio_id);
    const barberoId = toSafePositiveInt(body.barbero_id);

    if (!slug) {
      return NextResponse.json({ ok: false, message: "Slug obligatorio." }, { status: 400 });
    }
    if (!clienteNombre || clienteNombre.length < 3) {
      return NextResponse.json(
        { ok: false, message: "Ingresa un nombre valido." },
        { status: 400 },
      );
    }
    if (!clienteTel || clienteTel.length < 7) {
      return NextResponse.json(
        { ok: false, message: "Ingresa un telefono valido." },
        { status: 400 },
      );
    }
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json({ ok: false, message: "Fecha invalida." }, { status: 400 });
    }
    if (!horaInicio || !/^\d{2}:\d{2}$/.test(horaInicio)) {
      return NextResponse.json({ ok: false, message: "Hora invalida." }, { status: 400 });
    }
    if (!servicioId) {
      return NextResponse.json(
        { ok: false, message: "Selecciona un servicio." },
        { status: 400 },
      );
    }

    const created = await createPublicBooking({
      slug,
      clienteNombre,
      clienteTel,
      fecha,
      horaInicio,
      servicioId,
      barberoId: barberoId || null,
    });

    return NextResponse.json({
      ok: true,
      message: "Reserva creada con exito.",
      cita_id: created.citaId,
      barberia_id: created.barberiaId,
      slug: created.slug,
    });
  } catch (error) {
    const message =
      error instanceof Error ? clean(error.message) : "No se pudo crear la reserva.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
