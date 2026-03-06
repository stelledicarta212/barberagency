import { NextResponse } from "next/server";
import {
  normalizeText,
  postgrestRequest,
  requireAuth,
  toPositiveInt,
} from "@/app/api/citas/_helpers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ServicioRow = {
  id: number;
  nombre: string;
  duracion_min: number;
  precio: number;
};

function toSafeNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function isServiceInUseError(message: string) {
  const text = normalizeText(message).toLowerCase();
  return (
    text.includes("violates foreign key constraint") &&
    (text.includes("citas_servicio_id_fkey") || text.includes("servicio_id"))
  );
}

async function parseServicioId(paramsPromise: RouteContext["params"]) {
  const params = await paramsPromise;
  return toPositiveInt(params?.id);
}

async function readServicio(id: number, barberiaId: number, token: string) {
  const rows = await postgrestRequest<ServicioRow[]>(
    `servicios?select=id,nombre,duracion_min,precio&id=eq.${id}&barberia_id=eq.${barberiaId}&limit=1`,
    token,
  );
  return Array.isArray(rows) ? rows[0] : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const servicioId = await parseServicioId(context.params);
  if (!servicioId) {
    return NextResponse.json({ ok: false, message: "ID de servicio invalido." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    nombre?: string;
    duracion_min?: number;
    precio?: number;
  };

  try {
    const current = await readServicio(servicioId, barberiaId, token);
    if (!current) {
      return NextResponse.json(
        { ok: false, message: "El servicio no existe o no pertenece a tu barberia." },
        { status: 404 },
      );
    }

    const nombre = normalizeText(body.nombre) || normalizeText(current.nombre);
    const duracionMin = Math.max(1, toSafeNumber(body.duracion_min ?? current.duracion_min));
    const precio = Math.max(0, toSafeNumber(body.precio ?? current.precio));

    if (!nombre || duracionMin <= 0 || precio < 0) {
      return NextResponse.json(
        { ok: false, message: "Nombre, duracion y precio son obligatorios." },
        { status: 400 },
      );
    }

    const rows = await postgrestRequest<ServicioRow[]>(
      `servicios?id=eq.${servicioId}&barberia_id=eq.${barberiaId}`,
      token,
      {
        method: "PATCH",
        body: {
          nombre,
          duracion_min: duracionMin,
          precio,
        },
        preferRepresentation: true,
      },
    );

    const row = rows?.[0];
    return NextResponse.json({
      ok: true,
      servicio: row
        ? {
            id: toPositiveInt(row.id),
            nombre: normalizeText(row.nombre),
            duracion_min: Math.max(1, toSafeNumber(row.duracion_min)),
            precio: Math.max(0, toSafeNumber(row.precio)),
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar servicio.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const servicioId = await parseServicioId(context.params);
  if (!servicioId) {
    return NextResponse.json({ ok: false, message: "ID de servicio invalido." }, { status: 400 });
  }

  try {
    const current = await readServicio(servicioId, barberiaId, token);
    if (!current) {
      return NextResponse.json(
        { ok: false, message: "El servicio no existe o no pertenece a tu barberia." },
        { status: 404 },
      );
    }

    await postgrestRequest<unknown>(
      `servicios?id=eq.${servicioId}&barberia_id=eq.${barberiaId}`,
      token,
      { method: "DELETE", preferRepresentation: true },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar servicio.";
    if (isServiceInUseError(message)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No se puede eliminar este servicio porque ya tiene citas asociadas. Editalo o crea uno nuevo.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

