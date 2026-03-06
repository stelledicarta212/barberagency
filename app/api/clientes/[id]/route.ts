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

type ClienteRow = {
  id: number;
  nombre: string;
  telefono: string;
};

async function parseClienteId(paramsPromise: RouteContext["params"]) {
  const params = await paramsPromise;
  return toPositiveInt(params?.id);
}

async function readCliente(id: number, barberiaId: number, token: string) {
  const rows = await postgrestRequest<ClienteRow[]>(
    `clientes_finales?select=id,nombre,telefono&id=eq.${id}&barberia_id=eq.${barberiaId}&deleted_at=is.null&limit=1`,
    token,
  );
  return Array.isArray(rows) ? rows[0] : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const clienteId = await parseClienteId(context.params);
  if (!clienteId) {
    return NextResponse.json({ ok: false, message: "ID de cliente invalido." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    nombre?: string;
    telefono?: string;
  };

  try {
    const current = await readCliente(clienteId, barberiaId, token);
    if (!current) {
      return NextResponse.json(
        { ok: false, message: "El cliente no existe o no pertenece a tu barberia." },
        { status: 404 },
      );
    }

    const nombre = normalizeText(body.nombre) || normalizeText(current.nombre);
    const telefono = normalizeText(body.telefono) || normalizeText(current.telefono);

    if (!nombre || !telefono) {
      return NextResponse.json(
        { ok: false, message: "Nombre y telefono son obligatorios." },
        { status: 400 },
      );
    }

    const rows = await postgrestRequest<ClienteRow[]>(
      `clientes_finales?id=eq.${clienteId}&barberia_id=eq.${barberiaId}&deleted_at=is.null`,
      token,
      {
        method: "PATCH",
        body: { nombre, telefono },
        preferRepresentation: true,
      },
    );

    const row = rows?.[0];
    return NextResponse.json({
      ok: true,
      cliente: row
        ? {
            id: toPositiveInt(row.id),
            nombre: normalizeText(row.nombre),
            telefono: normalizeText(row.telefono),
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el cliente.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const clienteId = await parseClienteId(context.params);
  if (!clienteId) {
    return NextResponse.json({ ok: false, message: "ID de cliente invalido." }, { status: 400 });
  }

  try {
    const current = await readCliente(clienteId, barberiaId, token);
    if (!current) {
      return NextResponse.json(
        { ok: false, message: "El cliente no existe o no pertenece a tu barberia." },
        { status: 404 },
      );
    }

    await postgrestRequest<unknown>(
      `clientes_finales?id=eq.${clienteId}&barberia_id=eq.${barberiaId}&deleted_at=is.null`,
      token,
      {
        method: "PATCH",
        body: {
          deleted_at: new Date().toISOString(),
        },
        preferRepresentation: true,
      },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar el cliente.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
