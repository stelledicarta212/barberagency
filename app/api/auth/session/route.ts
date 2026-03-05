import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/session-token";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ ok: false, message: "Sesion no valida." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user_id: session.user_id,
    role: session.role,
    email: session.email,
    exp: session.exp,
  });
}

export async function DELETE() {
  const result = NextResponse.json({ ok: true });
  result.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return result;
}
