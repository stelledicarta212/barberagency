import { NextResponse } from "next/server";
import {
  normalizeText,
  postgrestRequest,
  requireAuth,
  toPositiveInt,
} from "@/app/api/citas/_helpers";

type ClienteRow = {
  id: number;
  nombre: string;
  telefono: string;
};

type CitaPhoneRow = {
  cliente_tel: string | null;
};

function normalizePhone(value: unknown) {
  return normalizeText(value).replace(/\s+/g, "");
}

function isMissingDeletedAtColumn(message: string) {
  const text = normalizeText(message).toLowerCase();
  return (
    text.includes("deleted_at") &&
    (text.includes("does not exist") || text.includes("could not find") || text.includes("schema cache"))
  );
}

async function fetchClientes(token: string, barberiaId: number) {
  const baseSelect = `clientes_finales?select=id,nombre,telefono&barberia_id=eq.${barberiaId}&order=created_at.desc&limit=500`;

  try {
    return await postgrestRequest<ClienteRow[]>(
      `${baseSelect}&deleted_at=is.null`,
      token,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!isMissingDeletedAtColumn(message)) throw error;
    return postgrestRequest<ClienteRow[]>(baseSelect, token);
  }
}

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { token, barberiaId, session } = auth.context;

  try {
    const [clientes, citas] = await Promise.all([
      fetchClientes(token, barberiaId),
      postgrestRequest<CitaPhoneRow[]>(
        `v_citas_completas?select=cliente_tel&barberia_id=eq.${barberiaId}&limit=2000`,
        token,
      ),
    ]);

    const visitsByPhone = new Map<string, number>();
    for (const row of Array.isArray(citas) ? citas : []) {
      const phone = normalizePhone(row?.cliente_tel);
      if (!phone) continue;
      visitsByPhone.set(phone, (visitsByPhone.get(phone) ?? 0) + 1);
    }

    return NextResponse.json({
      ok: true,
      role: session.role,
      rows: (Array.isArray(clientes) ? clientes : []).map((row) => {
        const phone = normalizePhone(row.telefono);
        return {
          id: toPositiveInt(row.id),
          nombre: normalizeText(row.nombre) || `Cliente ${row.id}`,
          telefono: normalizeText(row.telefono) || "-",
          visitas: visitsByPhone.get(phone) ?? 0,
        };
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo listar clientes.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const body = (await request.json().catch(() => ({}))) as {
    nombre?: string;
    telefono?: string;
  };

  const nombre = normalizeText(body.nombre);
  const telefono = normalizeText(body.telefono);

  if (!nombre || !telefono) {
    return NextResponse.json(
      { ok: false, message: "Nombre y telefono son obligatorios." },
      { status: 400 },
    );
  }

  try {
    const created = await postgrestRequest<ClienteRow[]>("clientes_finales", token, {
      method: "POST",
      body: {
        barberia_id: barberiaId,
        nombre,
        telefono,
      },
      preferRepresentation: true,
    });

    const row = created?.[0];
    return NextResponse.json({
      ok: true,
      cliente: row
        ? {
            id: toPositiveInt(row.id),
            nombre: normalizeText(row.nombre),
            telefono: normalizeText(row.telefono),
            visitas: 0,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el cliente.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
