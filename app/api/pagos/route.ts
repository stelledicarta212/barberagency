import { NextResponse } from "next/server";
import {
  normalizeText,
  postgrestRequest,
  requireAuth,
  toPositiveInt,
} from "@/app/api/citas/_helpers";

type PagoMetodo = "efectivo" | "digital";

type PagoRow = {
  id: number;
  cita_id: number;
  total: number;
  metodo: string;
  pagado_en: string | null;
};

type CitaRow = {
  id: number;
};

function toSafeNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeMetodo(value: unknown): PagoMetodo | "" {
  const method = normalizeText(value).toLowerCase();
  if (method === "efectivo" || method === "digital") return method;
  return "";
}

function normalizeDateTime(value: unknown) {
  const input = normalizeText(value);
  if (!input) return "";
  const dateOnly = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T00:00:00`;
  }
  const match = input.match(
    /^(\d{4})-(\d{2})-(\d{2})[ tT](\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!match) return "";
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6] ?? "00"}`;
}

function isDuplicatePaymentError(message: string) {
  const text = normalizeText(message).toLowerCase();
  return text.includes("duplicate key value") && text.includes("cita_id");
}

async function readCita(citaId: number, barberiaId: number, token: string) {
  const rows = await postgrestRequest<CitaRow[]>(
    `citas?select=id&id=eq.${citaId}&barberia_id=eq.${barberiaId}&limit=1`,
    token,
  );
  return Array.isArray(rows) ? rows[0] : null;
}

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { token, barberiaId, session } = auth.context;

  try {
    const rows = await postgrestRequest<PagoRow[]>(
      `pagos?select=id,cita_id,total,metodo,pagado_en,citas!inner(barberia_id)&citas.barberia_id=eq.${barberiaId}&order=pagado_en.desc.nullslast,id.desc&limit=500`,
      token,
    );

    return NextResponse.json({
      ok: true,
      role: session.role,
      rows: (Array.isArray(rows) ? rows : []).map((row) => ({
        id: toPositiveInt(row.id),
        cita_id: toPositiveInt(row.cita_id),
        total: Math.max(0, toSafeNumber(row.total)),
        metodo: normalizeMetodo(row.metodo) || "efectivo",
        pagado_en: normalizeDateTime(row.pagado_en) || null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo listar pagos.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const body = (await request.json().catch(() => ({}))) as {
    cita_id?: number;
    total?: number;
    metodo?: string;
    pagado_en?: string | null;
  };

  const citaId = toPositiveInt(body.cita_id);
  const total = Math.max(0, toSafeNumber(body.total));
  const metodo = normalizeMetodo(body.metodo);
  const pagadoEn = normalizeDateTime(body.pagado_en);

  if (!citaId || !metodo) {
    return NextResponse.json(
      { ok: false, message: "Cita y metodo son obligatorios." },
      { status: 400 },
    );
  }

  try {
    const cita = await readCita(citaId, barberiaId, token);
    if (!cita) {
      return NextResponse.json(
        { ok: false, message: "La cita no existe o no pertenece a tu barberia." },
        { status: 404 },
      );
    }

    const created = await postgrestRequest<PagoRow[]>("pagos", token, {
      method: "POST",
      body: {
        cita_id: citaId,
        total,
        metodo,
        pagado_en: pagadoEn || null,
      },
      preferRepresentation: true,
    });

    const row = created?.[0];
    return NextResponse.json({
      ok: true,
      pago: row
        ? {
            id: toPositiveInt(row.id),
            cita_id: toPositiveInt(row.cita_id),
            total: Math.max(0, toSafeNumber(row.total)),
            metodo: normalizeMetodo(row.metodo) || "efectivo",
            pagado_en: normalizeDateTime(row.pagado_en) || null,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el pago.";
    if (isDuplicatePaymentError(message)) {
      return NextResponse.json(
        { ok: false, message: "Ya existe un pago registrado para esta cita." },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
