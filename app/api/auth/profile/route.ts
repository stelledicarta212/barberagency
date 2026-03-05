import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session-token";

type UserLite = {
  id: number;
  nombre: string | null;
  email: string | null;
};

type BarberiaLite = {
  id: number;
  owner_id: number | null;
  plan_id: number | null;
};

type PlanLite = {
  id: number;
  nombre: string | null;
};

function clean(value: string | null | undefined) {
  return (value ?? "").toString().trim();
}

async function fetchArray<T>(url: string, token: string) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return [] as T[];
    const data = (await response.json().catch(() => [])) as T[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [] as T[];
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = verifySessionToken(token);

  if (!session || !token) {
    return NextResponse.json(
      { ok: false, message: "Sesion no valida." },
      { status: 401 },
    );
  }

  const [users, barberias] = await Promise.all([
    fetchArray<UserLite>(
      `${env.apiUrl}/usuarios?select=id,nombre,email&id=eq.${session.user_id}&limit=1`,
      token,
    ),
    fetchArray<BarberiaLite>(
      `${env.apiUrl}/barberias?select=id,owner_id,plan_id&owner_id=eq.${session.user_id}&order=created_at.desc&limit=1`,
      token,
    ),
  ]);

  const user = users[0];
  const barberia = barberias[0];

  let planName = "Sin plan";
  let planStatus = "Pendiente";

  if (barberia?.plan_id && Number(barberia.plan_id) > 0) {
    const plans = await fetchArray<PlanLite>(
      `${env.apiUrl}/planes?select=id,nombre&id=eq.${barberia.plan_id}&limit=1`,
      token,
    );
    const plan = plans[0];
    const candidateName = clean(plan?.nombre);
    if (candidateName) {
      planName = candidateName;
      planStatus = "Activo";
    }
  }

  return NextResponse.json({
    ok: true,
    user_id: session.user_id,
    role: session.role,
    name: clean(user?.nombre),
    email: clean(user?.email) || session.email,
    plan_name: planName,
    plan_status: planStatus,
  });
}
