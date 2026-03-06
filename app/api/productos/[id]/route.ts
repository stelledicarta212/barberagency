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

type ProductoRow = {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  activo: boolean | null;
};

function toSafeNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function parseProductoId(paramsPromise: RouteContext["params"]) {
  const params = await paramsPromise;
  return toPositiveInt(params?.id);
}

async function readProducto(id: number, barberiaId: number, token: string) {
  const rows = await postgrestRequest<ProductoRow[]>(
    `productos?select=id,nombre,precio,stock,activo&id=eq.${id}&barberia_id=eq.${barberiaId}&limit=1`,
    token,
  );
  return Array.isArray(rows) ? rows[0] : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const productoId = await parseProductoId(context.params);
  if (!productoId) {
    return NextResponse.json({ ok: false, message: "ID de producto invalido." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    nombre?: string;
    precio?: number;
    stock?: number;
    activo?: boolean;
  };

  try {
    const current = await readProducto(productoId, barberiaId, token);
    if (!current) {
      return NextResponse.json(
        { ok: false, message: "El producto no existe o no pertenece a tu barberia." },
        { status: 404 },
      );
    }

    const nombre = normalizeText(body.nombre) || normalizeText(current.nombre);
    const precio = Math.max(0, toSafeNumber(body.precio ?? current.precio));
    const stock = Math.max(0, toSafeNumber(body.stock ?? current.stock));
    const activo = typeof body.activo === "boolean" ? body.activo : Boolean(current.activo ?? true);

    if (!nombre) {
      return NextResponse.json(
        { ok: false, message: "Nombre es obligatorio." },
        { status: 400 },
      );
    }

    const rows = await postgrestRequest<ProductoRow[]>(
      `productos?id=eq.${productoId}&barberia_id=eq.${barberiaId}`,
      token,
      {
        method: "PATCH",
        body: { nombre, precio, stock, activo },
        preferRepresentation: true,
      },
    );

    const row = rows?.[0];
    return NextResponse.json({
      ok: true,
      producto: row
        ? {
            id: toPositiveInt(row.id),
            nombre: normalizeText(row.nombre),
            precio: toSafeNumber(row.precio),
            stock: toSafeNumber(row.stock),
            activo: Boolean(row.activo ?? true),
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el producto.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const productoId = await parseProductoId(context.params);
  if (!productoId) {
    return NextResponse.json({ ok: false, message: "ID de producto invalido." }, { status: 400 });
  }

  try {
    const current = await readProducto(productoId, barberiaId, token);
    if (!current) {
      return NextResponse.json(
        { ok: false, message: "El producto no existe o no pertenece a tu barberia." },
        { status: 404 },
      );
    }

    await postgrestRequest<unknown>(
      `productos?id=eq.${productoId}&barberia_id=eq.${barberiaId}`,
      token,
      { method: "DELETE", preferRepresentation: true },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar el producto.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
