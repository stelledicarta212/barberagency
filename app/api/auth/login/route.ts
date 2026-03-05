import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  sessionCookieOptions,
  type SessionRole,
} from "@/lib/session-token";

type LoginResponseRow = {
  user_id: number;
  role: SessionRole;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };

    const email = (body.email ?? "").toString().trim().toLowerCase();
    const password = (body.password ?? "").toString();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Email y password son obligatorios." },
        { status: 400 },
      );
    }

    const response = await fetch(`${env.apiUrl}/rpc/auth_login_password`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_email: email,
        p_password: password,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => ({}))) as {
        message?: string;
        details?: string;
      };
      const backendMessage =
        (errorPayload.message ?? "").toString().trim() ||
        (errorPayload.details ?? "").toString().trim();
      return NextResponse.json(
        {
          ok: false,
          message: backendMessage || "No se pudo validar el acceso.",
        },
        { status: 401 },
      );
    }

    const rows = (await response.json().catch(() => [])) as LoginResponseRow[];
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row?.user_id || !row?.role) {
      return NextResponse.json(
        { ok: false, message: "Credenciales invalidas." },
        { status: 401 },
      );
    }

    const role: SessionRole = row.role === "barbero" ? "barbero" : "admin";
    const token = signSessionToken({
      userId: Number(row.user_id),
      role,
      email,
    });

    const result = NextResponse.json({
      ok: true,
      user_id: Number(row.user_id),
      role,
      email,
    });

    result.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    return result;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Error interno de autenticacion." },
      { status: 500 },
    );
  }
}
