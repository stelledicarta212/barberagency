import { NextResponse } from "next/server";
import {
  normalizeDate,
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

type GastoRow = {
  id: number;
  concepto: string;
  total: number;
  fecha: string;
};

function toSafeNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

async function parseGastoId(paramsPromise: RouteContext["params"]) {
  const params = await paramsPromise;
  return toPositiveInt(params?.id);
}

async function readGasto(id: number, barberiaId: number, token: string) {
  const rows = await postgrestRequest<GastoRow[]>(
    `gastos?select=id,concepto,total,fecha&id=eq.${id}&barberia_id=eq.${barberiaId}&limit=1`,
    token,
  );
  return Array.isArray(rows) ? rows[0] : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const gastoId = await parseGastoId(context.params);
  if (!gastoId) {
    return NextResponse.json({ ok: false, message: "ID de gasto invalido." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    concepto?: string;
    total?: number;
    fecha?: string;
  };

  try {
    const current = await readGasto(gastoId, barberiaId, token);
    if (!current) {
      return NextResponse.json(
        { ok: false, message: "El gasto no existe o no pertenece a tu barberia." },
        { status: 404 },
      );
    }

    const concepto = normalizeText(body.concepto) || normalizeText(current.concepto);
    const total = Math.max(0, toSafeNumber(body.total ?? current.total));
    const fecha = normalizeDate(body.fecha) || normalizeDate(current.fecha) || todayDate();

    if (!concepto) {
      return NextResponse.json(
        { ok: false, message: "Concepto es obligatorio." },
        { status: 400 },
      );
    }

    const rows = await postgrestRequest<GastoRow[]>(
      `gastos?id=eq.${gastoId}&barberia_id=eq.${barberiaId}`,
      token,
      {
        method: "PATCH",
        body: { concepto, total, fecha },
        preferRepresentation: true,
      },
    );

    const row = rows?.[0];
    return NextResponse.json({
      ok: true,
      gasto: row
        ? {
            id: toPositiveInt(row.id),
            concepto: normalizeText(row.concepto),
            total: Math.max(0, toSafeNumber(row.total)),
            fecha: normalizeDate(row.fecha) || todayDate(),
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el gasto.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const gastoId = await parseGastoId(context.params);
  if (!gastoId) {
    return NextResponse.json({ ok: false, message: "ID de gasto invalido." }, { status: 400 });
  }

  try {
    const current = await readGasto(gastoId, barberiaId, token);
    if (!current) {
      return NextResponse.json(
        { ok: false, message: "El gasto no existe o no pertenece a tu barberia." },
        { status: 404 },
      );
    }

    await postgrestRequest<unknown>(
      `gastos?id=eq.${gastoId}&barberia_id=eq.${barberiaId}`,
      token,
      { method: "DELETE", preferRepresentation: true },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar el gasto.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
