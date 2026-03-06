import { NextResponse } from "next/server";
import {
  normalizeText,
  postgrestRequest,
  requireAuth,
  toPositiveInt,
} from "@/app/api/citas/_helpers";

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

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { token, barberiaId, session } = auth.context;

  try {
    const rows = await postgrestRequest<ProductoRow[]>(
      `productos?select=id,nombre,precio,stock,activo&barberia_id=eq.${barberiaId}&order=created_at.desc&limit=500`,
      token,
    );

    return NextResponse.json({
      ok: true,
      role: session.role,
      rows: (Array.isArray(rows) ? rows : []).map((row) => ({
        id: toPositiveInt(row.id),
        nombre: normalizeText(row.nombre) || `Producto ${row.id}`,
        precio: toSafeNumber(row.precio),
        stock: toSafeNumber(row.stock),
        activo: Boolean(row.activo ?? true),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo listar productos.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth.ok) return auth.response;
  const { token, barberiaId } = auth.context;

  const body = (await request.json().catch(() => ({}))) as {
    nombre?: string;
    precio?: number;
    stock?: number;
    activo?: boolean;
  };

  const nombre = normalizeText(body.nombre);
  const precio = Math.max(0, toSafeNumber(body.precio));
  const stock = Math.max(0, toSafeNumber(body.stock));
  const activo = Boolean(body.activo ?? true);

  if (!nombre) {
    return NextResponse.json(
      { ok: false, message: "Nombre es obligatorio." },
      { status: 400 },
    );
  }

  try {
    const created = await postgrestRequest<ProductoRow[]>("productos", token, {
      method: "POST",
      body: {
        barberia_id: barberiaId,
        nombre,
        precio,
        stock,
        activo,
      },
      preferRepresentation: true,
    });

    const row = created?.[0];
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
    const message = error instanceof Error ? error.message : "No se pudo crear el producto.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
