import { NextResponse } from "next/server";
import {
  normalizeText,
  postgrestRequest,
  requireAuth,
  toPositiveInt,
} from "@/app/api/citas/_helpers";

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

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { token, barberiaId, session } = auth.context;

  try {
    const rows = await postgrestRequest<ServicioRow[]>(
      `servicios?select=id,nombre,duracion_min,precio&barberia_id=eq.${barberiaId}&order=nombre.asc&limit=500`,
      token,
    );

    return NextResponse.json({
      ok: true,
      role: session.role,
      rows: (Array.isArray(rows) ? rows : []).map((row) => ({
        id: toPositiveInt(row.id),
        nombre: normalizeText(row.nombre) || `Servicio ${row.id}`,
        duracion_min: Math.max(1, toSafeNumber(row.duracion_min)),
        precio: Math.max(0, toSafeNumber(row.precio)),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo listar servicios.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const body = (await request.json().catch(() => ({}))) as {
    nombre?: string;
    duracion_min?: number;
    precio?: number;
  };

  const nombre = normalizeText(body.nombre);
  const duracionMin = Math.max(1, toSafeNumber(body.duracion_min));
  const precio = Math.max(0, toSafeNumber(body.precio));

  if (!nombre || duracionMin <= 0 || precio < 0) {
    return NextResponse.json(
      { ok: false, message: "Nombre, duracion y precio son obligatorios." },
      { status: 400 },
    );
  }

  try {
    const created = await postgrestRequest<ServicioRow[]>("servicios", token, {
      method: "POST",
      body: {
        barberia_id: barberiaId,
        nombre,
        duracion_min: duracionMin,
        precio,
      },
      preferRepresentation: true,
    });

    const row = created?.[0];
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
    const message = error instanceof Error ? error.message : "No se pudo crear servicio.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

