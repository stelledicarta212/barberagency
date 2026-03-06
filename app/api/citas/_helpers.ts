import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type SessionContext,
} from "@/lib/session-token";

type RequestMethod = "GET" | "POST" | "PATCH" | "DELETE";

type PostgrestOptions = {
  method?: RequestMethod;
  body?: unknown;
  preferRepresentation?: boolean;
};

type PostgrestErrorPayload = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

type BarberiaOwnerRow = {
  id: number | null;
};

type BarberoSelfRow = {
  barberia_id: number | null;
};

export type AuthContext = {
  token: string;
  session: SessionContext;
  barberiaId: number;
};

type AuthResult =
  | { ok: true; context: AuthContext }
  | { ok: false; response: NextResponse };

function clean(value: unknown) {
  return (value ?? "").toString().trim();
}

function parsePostgrestError(raw: string) {
  if (!raw) return "Error desconocido de PostgREST.";
  try {
    const parsed = JSON.parse(raw) as PostgrestErrorPayload;
    return clean(parsed.message) || clean(parsed.details) || clean(parsed.hint) || raw;
  } catch {
    return raw;
  }
}

async function getPostgrestArray<T>(path: string, token: string) {
  const response = await fetch(`${env.apiUrl}/${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(parsePostgrestError(raw));
  }

  try {
    const data = raw ? (JSON.parse(raw) as T[]) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [] as T[];
  }
}

async function resolveBarberiaId(session: SessionContext, token: string) {
  if (session.role === "admin") {
    const barberias = await getPostgrestArray<BarberiaOwnerRow>(
      `barberias?select=id&owner_id=eq.${session.user_id}&order=created_at.asc&limit=1`,
      token,
    );
    return Number(barberias[0]?.id ?? 0);
  }

  const barberos = await getPostgrestArray<BarberoSelfRow>(
    `barberos?select=barberia_id&usuario_id=eq.${session.user_id}&limit=1`,
    token,
  );
  return Number(barberos[0]?.barberia_id ?? 0);
}

export async function requireAuth(options?: { adminOnly?: boolean }): Promise<AuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = verifySessionToken(token);

  if (!token || !session) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: "Sesion no valida." },
        { status: 401 },
      ),
    };
  }

  if (options?.adminOnly && session.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: "Solo admin puede realizar esta accion." },
        { status: 403 },
      ),
    };
  }

  try {
    const barberiaId = await resolveBarberiaId(session, token);
    if (!barberiaId) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, message: "No hay barberia asociada a tu usuario." },
          { status: 400 },
        ),
      };
    }

    return {
      ok: true,
      context: { token, session, barberiaId },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo resolver la barberia.";
    return {
      ok: false,
      response: NextResponse.json({ ok: false, message }, { status: 400 }),
    };
  }
}

export async function postgrestRequest<T>(
  path: string,
  token: string,
  options: PostgrestOptions = {},
) {
  const method = options.method ?? "GET";
  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.preferRepresentation || options.body !== undefined) {
    headers.set("Prefer", "return=representation");
  }

  const response = await fetch(`${env.apiUrl}/${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(parsePostgrestError(raw));
  }

  if (!raw) return null as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null as T;
  }
}

export function normalizeText(value: unknown) {
  return clean(value).replace(/\s+/g, " ");
}

export function normalizeDate(value: unknown) {
  const input = clean(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(input) ? input : "";
}

export function normalizeTime(value: unknown) {
  const input = clean(value);
  const match = input.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return "";
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function toTimeWithSeconds(hhmm: string) {
  return `${hhmm}:00`;
}

export function addMinutesToTime(hhmm: string, minutesToAdd: number) {
  const base = normalizeTime(hhmm);
  const safeMinutes = Number(minutesToAdd);
  if (!base || !Number.isFinite(safeMinutes)) return "";

  const [hours, minutes] = base.split(":").map(Number);
  const total = hours * 60 + minutes + safeMinutes;
  const normalized = ((total % 1440) + 1440) % 1440;
  const outHours = Math.floor(normalized / 60);
  const outMinutes = normalized % 60;
  return `${String(outHours).padStart(2, "0")}:${String(outMinutes).padStart(2, "0")}:00`;
}

export function toPositiveInt(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return 0;
  return parsed;
}
