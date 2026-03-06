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

type CitaBaseRow = {
  id: number;
  barbero_id: number | null;
  servicio_id: number | null;
};

type BarberoOption = {
  id: number;
  nombre: string;
  activo: boolean | null;
};

type ServicioOption = {
  id: number;
  nombre: string;
  duracion_min: number;
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

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { token, barberiaId, session } = auth.context;

  try {
    const rows = await postgrestRequest<CitaViewRow[]>(
      `v_citas_completas?select=cita_id,fecha,hora_inicio,barbero,servicio,cliente_nombre,cliente_tel,estado&barberia_id=eq.${barberiaId}&order=fecha.desc,hora_inicio.asc&limit=250`,
      token,
    );

    const baseRows =
      session.role === "admin"
        ? await postgrestRequest<CitaBaseRow[]>(
            `citas?select=id,barbero_id,servicio_id&barberia_id=eq.${barberiaId}&order=fecha.desc,hora_inicio.asc&limit=250`,
            token,
          )
        : [];

    const barberos =
      session.role === "admin"
        ? await postgrestRequest<BarberoOption[]>(
            `barberos?select=id,nombre,activo&barberia_id=eq.${barberiaId}&order=nombre.asc&limit=200`,
            token,
          )
        : [];

    const servicios =
      session.role === "admin"
        ? await postgrestRequest<ServicioOption[]>(
            `servicios?select=id,nombre,duracion_min&barberia_id=eq.${barberiaId}&order=nombre.asc&limit=200`,
            token,
          )
        : [];

    const baseById = new Map<number, CitaBaseRow>();
    for (const row of Array.isArray(baseRows) ? baseRows : []) {
      if (Number.isInteger(Number(row.id))) {
        baseById.set(Number(row.id), row);
      }
    }

    const normalizedRows = (Array.isArray(rows) ? rows : []).map((row) => {
      const detail = baseById.get(Number(row.cita_id));
      return {
        cita_id: Number(row.cita_id),
        fecha: row.fecha,
        hora_inicio: formatTime(row.hora_inicio),
        barbero: normalizeText(row.barbero) || "-",
        servicio: normalizeText(row.servicio) || "-",
        cliente_nombre: normalizeText(row.cliente_nombre) || "-",
        cliente_tel: normalizeText(row.cliente_tel) || "-",
        estado: normalizeText(row.estado || "pendiente") || "pendiente",
        barbero_id: toPositiveInt(detail?.barbero_id),
        servicio_id: toPositiveInt(detail?.servicio_id),
      };
    });

    return NextResponse.json({
      ok: true,
      role: session.role,
      rows: normalizedRows,
      barberos: Array.isArray(barberos)
        ? barberos
            .filter((row) => toPositiveInt(row.id) > 0)
            .map((row) => ({
              id: toPositiveInt(row.id),
              nombre: normalizeText(row.nombre) || `Barbero ${row.id}`,
              activo: Boolean(row.activo ?? true),
            }))
        : [],
      servicios: Array.isArray(servicios)
        ? servicios
            .filter((row) => toPositiveInt(row.id) > 0)
            .map((row) => ({
              id: toPositiveInt(row.id),
              nombre: normalizeText(row.nombre) || `Servicio ${row.id}`,
              duracion_min: Math.max(1, Number(row.duracion_min ?? 0)),
            }))
        : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo listar citas.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const body = (await request.json().catch(() => ({}))) as {
    barbero_id?: number;
    servicio_id?: number;
    fecha?: string;
    hora_inicio?: string;
    cliente_nombre?: string;
    cliente_tel?: string;
    estado?: string;
  };

  const barberoId = toPositiveInt(body.barbero_id);
  const servicioId = toPositiveInt(body.servicio_id);
  const fecha = normalizeDate(body.fecha);
  const horaInicio = normalizeTime(body.hora_inicio);
  const clienteNombre = normalizeText(body.cliente_nombre);
  const clienteTel = normalizeText(body.cliente_tel);
  const estadoRaw = normalizeText(body.estado).toLowerCase();
  const estado = VALID_STATES.has(estadoRaw) ? estadoRaw : "confirmada";

  if (!barberoId || !servicioId || !fecha || !horaInicio || !clienteNombre || !clienteTel) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Barbero, servicio, fecha, hora de inicio, cliente y telefono son obligatorios.",
      },
      { status: 400 },
    );
  }

  try {
    const [barberos, servicios] = await Promise.all([
      postgrestRequest<BarberoValidate[]>(
        `barberos?select=id&id=eq.${barberoId}&barberia_id=eq.${barberiaId}&limit=1`,
        token,
      ),
      postgrestRequest<ServicioDuration[]>(
        `servicios?select=id,duracion_min&id=eq.${servicioId}&barberia_id=eq.${barberiaId}&limit=1`,
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

    const created = await postgrestRequest<Array<{ id: number }>>("citas", token, {
      method: "POST",
      body: {
        barberia_id: barberiaId,
        barbero_id: barberoId,
        servicio_id: servicioId,
        cliente_id: null,
        fecha,
        hora_inicio: toTimeWithSeconds(horaInicio),
        hora_fin: addMinutesToTime(horaInicio, duracionMin),
        cliente_nombre: clienteNombre,
        cliente_tel: clienteTel,
        estado,
      },
      preferRepresentation: true,
    });

    const citaId = toPositiveInt(created?.[0]?.id);
    if (!citaId) {
      return NextResponse.json({ ok: true, message: "Cita creada." });
    }

    const [viewRows, baseRows] = await Promise.all([
      postgrestRequest<CitaViewRow[]>(
        `v_citas_completas?select=cita_id,fecha,hora_inicio,barbero,servicio,cliente_nombre,cliente_tel,estado&cita_id=eq.${citaId}&limit=1`,
        token,
      ),
      postgrestRequest<CitaBaseRow[]>(
        `citas?select=id,barbero_id,servicio_id&id=eq.${citaId}&limit=1`,
        token,
      ),
    ]);

    const view = viewRows?.[0];
    const base = baseRows?.[0];

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
            barbero_id: toPositiveInt(base?.barbero_id),
            servicio_id: toPositiveInt(base?.servicio_id),
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la cita.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
