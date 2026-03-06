import { NextResponse } from "next/server";
import {
  normalizeDate,
  normalizeText,
  postgrestRequest,
  requireAuth,
  toPositiveInt,
} from "@/app/api/citas/_helpers";

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

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { token, barberiaId, session } = auth.context;

  try {
    const rows = await postgrestRequest<GastoRow[]>(
      `gastos?select=id,concepto,total,fecha&barberia_id=eq.${barberiaId}&order=fecha.desc,created_at.desc&limit=500`,
      token,
    );

    return NextResponse.json({
      ok: true,
      role: session.role,
      rows: (Array.isArray(rows) ? rows : []).map((row) => ({
        id: toPositiveInt(row.id),
        concepto: normalizeText(row.concepto) || `Gasto ${row.id}`,
        total: Math.max(0, toSafeNumber(row.total)),
        fecha: normalizeDate(row.fecha) || todayDate(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo listar gastos.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const body = (await request.json().catch(() => ({}))) as {
    concepto?: string;
    total?: number;
    fecha?: string;
  };

  const concepto = normalizeText(body.concepto);
  const total = Math.max(0, toSafeNumber(body.total));
  const fecha = normalizeDate(body.fecha) || todayDate();

  if (!concepto) {
    return NextResponse.json(
      { ok: false, message: "Concepto es obligatorio." },
      { status: 400 },
    );
  }

  try {
    const created = await postgrestRequest<GastoRow[]>("gastos", token, {
      method: "POST",
      body: {
        barberia_id: barberiaId,
        concepto,
        total,
        fecha,
      },
      preferRepresentation: true,
    });

    const row = created?.[0];
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
    const message = error instanceof Error ? error.message : "No se pudo crear el gasto.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
