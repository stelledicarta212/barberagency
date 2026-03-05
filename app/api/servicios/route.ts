import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session-token";

type BarberiaLite = { id: number };

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ ok: false, message: "Sesion no valida." }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Solo admin puede crear servicios." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    nombre?: string;
    duracion_min?: number;
    precio?: number;
  };

  const nombre = (body.nombre ?? "").toString().trim();
  const duracionMin = Number(body.duracion_min ?? 0);
  const precio = Number(body.precio ?? 0);

  if (!nombre || duracionMin <= 0 || precio < 0) {
    return NextResponse.json(
      { ok: false, message: "Nombre, duracion y precio son obligatorios." },
      { status: 400 },
    );
  }

  const authHeaders = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  const barberiaResponse = await fetch(
    `${env.apiUrl}/barberias?select=id&order=created_at.asc&limit=1`,
    {
      method: "GET",
      headers: authHeaders,
      cache: "no-store",
    },
  );

  if (!barberiaResponse.ok) {
    return NextResponse.json(
      { ok: false, message: "No se pudo resolver la barberia del admin." },
      { status: 400 },
    );
  }

  const barberias = (await barberiaResponse.json().catch(() => [])) as BarberiaLite[];
  const barberiaId = Number(barberias[0]?.id ?? 0);

  if (!barberiaId) {
    return NextResponse.json(
      {
        ok: false,
        message: "No hay barberia asociada. Crea tu barberia primero.",
      },
      { status: 400 },
    );
  }

  const insertResponse = await fetch(`${env.apiUrl}/servicios`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      barberia_id: barberiaId,
      nombre,
      duracion_min: duracionMin,
      precio,
    }),
    cache: "no-store",
  });

  if (!insertResponse.ok) {
    const raw = await insertResponse.text();
    return NextResponse.json(
      { ok: false, message: `No se pudo crear servicio. ${raw.slice(0, 200)}` },
      { status: 400 },
    );
  }

  const rows = await insertResponse.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;

  return NextResponse.json({
    ok: true,
    servicio: row,
  });
}
