import { NextResponse } from "next/server";
import {
  addMinutesToTime,
  normalizeDate,
  normalizeText,
  normalizeTime,
  postgrestRequest,
  requireAuth,
  toPositiveInt,
  toTimeWithSeconds,
} from "@/app/api/citas/_helpers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CitaStoredRow = {
  id: number;
  barbero_id: number | null;
  servicio_id: number | null;
  fecha: string;
  hora_inicio: string;
  cliente_nombre: string;
  cliente_tel: string;
  estado: string | null;
};

type CitaViewRow = {
  cita_id: number;
  fecha: string;
  hora_inicio: string;
  barbero: string;
  servicio: string;
  cliente_nombre: string;
  cliente_tel: string;
  estado: string | null;
};

type ServicioDuration = {
  id: number;
  duracion_min: number | null;
};

type BarberoValidate = {
  id: number;
};

const VALID_STATES = new Set(["confirmada", "pendiente", "cancelada"]);

function formatTime(value: string | null | undefined) {
  const normalized = normalizeTime(value);
  return normalized || "-";
}

async function parseCitaId(paramsPromise: RouteContext["params"]) {
  const params = await paramsPromise;
  const citaId = toPositiveInt(params?.id);
  return citaId;
}

async function readCurrentCita(citaId: number, barberiaId: number, token: string) {
  const rows = await postgrestRequest<CitaStoredRow[]>(
    `citas?select=id,barbero_id,servicio_id,fecha,hora_inicio,cliente_nombre,cliente_tel,estado&id=eq.${citaId}&barberia_id=eq.${barberiaId}&limit=1`,
    token,
  );
  return Array.isArray(rows) ? rows[0] : null;
}

async function readCitaView(citaId: number, token: string) {
  const viewRows = await postgrestRequest<CitaViewRow[]>(
    `v_citas_completas?select=cita_id,fecha,hora_inicio,barbero,servicio,cliente_nombre,cliente_tel,estado&cita_id=eq.${citaId}&limit=1`,
    token,
  );
  return Array.isArray(viewRows) ? viewRows[0] : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const citaId = await parseCitaId(context.params);
  if (!citaId) {
    return NextResponse.json({ ok: false, message: "ID de cita invalido." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    barbero_id?: number;
    servicio_id?: number;
    fecha?: string;
    hora_inicio?: string;
    cliente_nombre?: string;
    cliente_tel?: string;
    estado?: string;
  };

  try {
    const current = await readCurrentCita(citaId, barberiaId, token);
    if (!current) {
      return NextResponse.json(
        { ok: false, message: "La cita no existe o no pertenece a tu barberia." },
        { status: 404 },
      );
    }

    const nextBarberoId = toPositiveInt(body.barbero_id) || toPositiveInt(current.barbero_id);
    const nextServicioId = toPositiveInt(body.servicio_id) || toPositiveInt(current.servicio_id);
    const nextFecha = normalizeDate(body.fecha) || normalizeDate(current.fecha);
    const nextHoraInicio = normalizeTime(body.hora_inicio) || normalizeTime(current.hora_inicio);
    const nextClienteNombre = normalizeText(body.cliente_nombre) || normalizeText(current.cliente_nombre);
    const nextClienteTel = normalizeText(body.cliente_tel) || normalizeText(current.cliente_tel);
    const estadoRaw = normalizeText(body.estado || current.estado || "confirmada").toLowerCase();
    const nextEstado = VALID_STATES.has(estadoRaw) ? estadoRaw : "confirmada";

    if (
      !nextBarberoId ||
      !nextServicioId ||
      !nextFecha ||
      !nextHoraInicio ||
      !nextClienteNombre ||
      !nextClienteTel
    ) {
      return NextResponse.json(
        { ok: false, message: "Datos incompletos para actualizar la cita." },
        { status: 400 },
      );
    }

    const [barberos, servicios] = await Promise.all([
      postgrestRequest<BarberoValidate[]>(
        `barberos?select=id&id=eq.${nextBarberoId}&barberia_id=eq.${barberiaId}&limit=1`,
        token,
      ),
      postgrestRequest<ServicioDuration[]>(
        `servicios?select=id,duracion_min&id=eq.${nextServicioId}&barberia_id=eq.${barberiaId}&limit=1`,
        token,
      ),
    ]);

    if (!Array.isArray(barberos) || !barberos.length) {
      return NextResponse.json(
        { ok: false, message: "El barbero no pertenece a tu barberia." },
        { status: 400 },
      );
    }

    const duracionMin = Math.max(1, Number(servicios?.[0]?.duracion_min ?? 0));
    if (!Array.isArray(servicios) || !servicios.length || duracionMin <= 0) {
      return NextResponse.json(
        { ok: false, message: "El servicio no pertenece a tu barberia." },
        { status: 400 },
      );
    }

    await postgrestRequest<unknown>(
      `citas?id=eq.${citaId}&barberia_id=eq.${barberiaId}`,
      token,
      {
        method: "PATCH",
        body: {
          barbero_id: nextBarberoId,
          servicio_id: nextServicioId,
          fecha: nextFecha,
          hora_inicio: toTimeWithSeconds(nextHoraInicio),
          hora_fin: addMinutesToTime(nextHoraInicio, duracionMin),
          cliente_nombre: nextClienteNombre,
          cliente_tel: nextClienteTel,
          estado: nextEstado,
        },
        preferRepresentation: true,
      },
    );

    const view = await readCitaView(citaId, token);
    return NextResponse.json({
      ok: true,
      cita: view
        ? {
            cita_id: toPositiveInt(view.cita_id),
            fecha: view.fecha,
            hora_inicio: formatTime(view.hora_inicio),
            barbero: normalizeText(view.barbero),
            servicio: normalizeText(view.servicio),
            cliente_nombre: normalizeText(view.cliente_nombre),
            cliente_tel: normalizeText(view.cliente_tel),
            estado: normalizeText(view.estado || "pendiente") || "pendiente",
            barbero_id: nextBarberoId,
            servicio_id: nextServicioId,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la cita.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const citaId = await parseCitaId(context.params);
  if (!citaId) {
    return NextResponse.json({ ok: false, message: "ID de cita invalido." }, { status: 400 });
  }

  try {
    await postgrestRequest<unknown>(`citas?id=eq.${citaId}&barberia_id=eq.${barberiaId}`, token, {
      method: "DELETE",
      preferRepresentation: true,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar la cita.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
