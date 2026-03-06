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

function isMissingDeletedAtColumn(message: string) {
  const text = normalizeText(message).toLowerCase();
  return (
    text.includes("deleted_at") &&
    (text.includes("does not exist") || text.includes("could not find") || text.includes("schema cache"))
  );
}

async function parseClienteId(paramsPromise: RouteContext["params"]) {
  const params = await paramsPromise;
  return toPositiveInt(params?.id);
}

async function readCliente(id: number, barberiaId: number, token: string) {
  const basePath = `clientes_finales?select=id,nombre,telefono&id=eq.${id}&barberia_id=eq.${barberiaId}&limit=1`;
  try {
    const rows = await postgrestRequest<ClienteRow[]>(
      `${basePath}&deleted_at=is.null`,
      token,
    );
    return Array.isArray(rows) ? rows[0] : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!isMissingDeletedAtColumn(message)) throw error;
    const rows = await postgrestRequest<ClienteRow[]>(basePath, token);
    return Array.isArray(rows) ? rows[0] : null;
  }
}

async function updateCliente(params: {
  token: string;
  clienteId: number;
  barberiaId: number;
  body: Record<string, unknown>;
}) {
  const basePath = `clientes_finales?id=eq.${params.clienteId}&barberia_id=eq.${params.barberiaId}`;
  try {
    return await postgrestRequest<ClienteRow[]>(
      `${basePath}&deleted_at=is.null`,
      params.token,
      {
        method: "PATCH",
        body: params.body,
        preferRepresentation: true,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!isMissingDeletedAtColumn(message)) throw error;
    return postgrestRequest<ClienteRow[]>(basePath, params.token, {
      method: "PATCH",
      body: params.body,
      preferRepresentation: true,
    });
  }
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

    const rows = await updateCliente({
      token,
      clienteId,
      barberiaId,
      body: { nombre, telefono },
    });

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

    try {
      await updateCliente({
        token,
        clienteId,
        barberiaId,
        body: {
          deleted_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!isMissingDeletedAtColumn(message)) {
        throw error;
      }

      await postgrestRequest<unknown>(
        `clientes_finales?id=eq.${clienteId}&barberia_id=eq.${barberiaId}`,
        token,
        {
          method: "DELETE",
          preferRepresentation: true,
        },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar el cliente.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
