import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

type OnboardingDraft = {
  barberia?: {
    nombre?: string;
    slug?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    timezone?: string;
    slot_min?: number;
  };
  servicios?: Array<{
    nombre?: string;
    duracion_min?: number;
    precio?: number;
  }>;
  barberos?: Array<{
    nombre?: string;
    activo?: boolean;
  }>;
  horarios?: Array<{
    dia?: string;
    activo?: boolean;
    hora_abre?: string;
    hora_cierra?: string;
  }>;
  accesos?: {
    admin?: {
      nombre?: string;
      email?: string;
      password?: string;
    };
    barberos?: Array<{
      nombre?: string;
      email?: string;
      password?: string;
      activo?: boolean;
    }>;
  };
};

type UserRow = {
  id: number;
  nombre: string;
  email: string;
  role?: string;
};

type BarberiaRow = {
  id: number;
  owner_id: number | null;
  slug: string;
};

const ONE_HOUR = 60 * 60;

function clean(value: unknown) {
  return (value ?? "").toString().trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function toBase64Url(input: Buffer | string) {
  const source = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return source
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signPostgrestToken(
  userId: number,
  options?: { role?: "authenticated" | "admin" | "barbero"; email?: string },
) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const role = options?.role ?? "authenticated";
  const claims = {
    sub: String(Number(userId)),
    role,
    user_id: Number(userId),
    email: clean(options?.email),
    iat: now,
    exp: now + ONE_HOUR,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedClaims = toBase64Url(JSON.stringify(claims));
  const unsigned = `${encodedHeader}.${encodedClaims}`;

  const signature = toBase64Url(
    crypto
      .createHmac("sha256", (process.env.PGRST_JWT_SECRET ?? "").trim())
      .update(unsigned)
      .digest(),
  );

  return `${unsigned}.${signature}`;
}

function postgrestErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const value = payload as { message?: string; details?: string; hint?: string };
  return clean(value.message) || clean(value.details) || clean(value.hint);
}

function isMissingColumnError(message: string, column: string) {
  const msg = clean(message).toLowerCase();
  const col = column.toLowerCase();
  return (
    msg.includes(`could not find the '${col}' column`) ||
    (msg.includes("column") && msg.includes(col) && msg.includes("does not exist")) ||
    (msg.includes("schema cache") && msg.includes(col))
  );
}

function isUniqueConstraintError(message: string, constraintName: string) {
  const msg = clean(message).toLowerCase();
  const constraint = constraintName.toLowerCase();
  return msg.includes("duplicate key value violates unique constraint") && msg.includes(constraint);
}

async function requestPostgrest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    token: string;
    body?: unknown;
    preferRepresentation?: boolean;
  },
) {
  const method = options.method ?? "GET";
  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${options.token}`,
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.preferRepresentation) {
    headers.set("Prefer", "return=representation");
  }

  const response = await fetch(`${env.apiUrl}/${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const raw = (await response.json().catch(() => null)) as unknown;
    throw new Error(postgrestErrorMessage(raw) || `PostgREST error (${response.status})`);
  }

  if (response.status === 204) return null as T;
  const text = await response.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

async function hashPassword(token: string, plainPassword: string) {
  const value = await requestPostgrest<unknown>("rpc/fn_password_hash", {
    method: "POST",
    token,
    body: { p_plain: plainPassword },
  });

  if (typeof value === "string" && value.length > 20) return value;
  if (Array.isArray(value) && typeof value[0]?.fn_password_hash === "string") {
    return value[0].fn_password_hash;
  }

  throw new Error("No se pudo generar hash de password.");
}

async function ensureUser(params: {
  bootstrapToken: string;
  name: string;
  email: string;
  role: "admin" | "barbero";
  password: string;
}) {
  const email = clean(params.email).toLowerCase();
  const passwordHash = await hashPassword(params.bootstrapToken, params.password);

  const existing = await requestPostgrest<UserRow[]>(
    `usuarios?select=id,nombre,email,role&email=eq.${encodeURIComponent(email)}&limit=1`,
    {
      token: params.bootstrapToken,
    },
  );

  if (existing?.[0]?.id) {
    const id = Number(existing[0].id);
    const rows = await requestPostgrest<UserRow[]>(
      `usuarios?id=eq.${id}`,
      {
        method: "PATCH",
        token: params.bootstrapToken,
        body: {
          nombre: params.name,
          role: params.role,
          password_hash: passwordHash,
        },
        preferRepresentation: true,
      },
    );
    const row = rows?.[0];
    if (!row?.id) throw new Error("No se pudo actualizar usuario existente.");
    return row;
  }

  const created = await requestPostgrest<UserRow[]>("usuarios", {
    method: "POST",
    token: params.bootstrapToken,
    body: {
      nombre: params.name,
      email,
      role: params.role,
      password_hash: passwordHash,
    },
    preferRepresentation: true,
  });
  const row = created?.[0];
  if (!row?.id) throw new Error("No se pudo crear usuario.");
  return row;
}

async function ensureBarberia(params: {
  ownerToken: string;
  ownerId: number;
  nombre: string;
  slug: string;
  timezone: string;
  slotMin: number;
}) {
  const baseSlug = clean(params.slug) || "barberia";
  let includeTimezone = true;
  let includeSlotMin = true;

  for (let slugAttempt = 0; slugAttempt < 20; slugAttempt += 1) {
    const currentSlug = slugAttempt === 0 ? baseSlug : `${baseSlug}-${slugAttempt + 1}`;

    for (let schemaAttempt = 0; schemaAttempt < 3; schemaAttempt += 1) {
      const existing = await requestPostgrest<BarberiaRow[]>(
        `barberias?select=id,owner_id,slug&slug=eq.${encodeURIComponent(currentSlug)}&limit=1`,
        { token: params.ownerToken },
      );

      const body: Record<string, unknown> = {
        nombre: params.nombre,
        slug: currentSlug,
        owner_id: params.ownerId,
      };
      if (includeTimezone) body.timezone = params.timezone;
      if (includeSlotMin) body.slot_min = params.slotMin;

      try {
        if (existing?.[0]?.id) {
          const row = existing[0];
          if (row.owner_id && Number(row.owner_id) !== Number(params.ownerId)) {
            break;
          }
          const updated = await requestPostgrest<BarberiaRow[]>(
            `barberias?id=eq.${row.id}`,
            {
              method: "PATCH",
              token: params.ownerToken,
              body,
              preferRepresentation: true,
            },
          );
          const out = updated?.[0];
          if (!out?.id) throw new Error("No se pudo actualizar barberia.");
          return out;
        }

        const created = await requestPostgrest<BarberiaRow[]>("barberias", {
          method: "POST",
          token: params.ownerToken,
          body,
          preferRepresentation: true,
        });
        const out = created?.[0];
        if (!out?.id) throw new Error("No se pudo crear barberia.");
        return out;
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (includeTimezone && isMissingColumnError(message, "timezone")) {
          includeTimezone = false;
          continue;
        }
        if (includeSlotMin && isMissingColumnError(message, "slot_min")) {
          includeSlotMin = false;
          continue;
        }
        if (isUniqueConstraintError(message, "barberias_slug_key")) {
          break;
        }
        throw error;
      }
    }
  }

  throw new Error("No se pudo reservar un slug disponible para la barberia.");
}

function dayToNumber(dayName: string) {
  const key = clean(dayName).toLowerCase();
  const map: Record<string, number> = {
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    domingo: 0,
  };
  return map[key] ?? 1;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      draft?: OnboardingDraft;
    };
    const draft = body?.draft;

    const nombreBarberia = clean(draft?.barberia?.nombre);
    const slugInput = clean(draft?.barberia?.slug) || slugify(nombreBarberia);
    const slug = slugify(slugInput || nombreBarberia);
    const timezone = clean(draft?.barberia?.timezone) || "America/Bogota";
    const slotMin = Number(draft?.barberia?.slot_min ?? 15);

    const adminName = clean(draft?.accesos?.admin?.nombre) || "Administrador";
    const adminEmail = clean(draft?.accesos?.admin?.email).toLowerCase();
    const adminPassword = (draft?.accesos?.admin?.password ?? "").toString();

    if (!nombreBarberia || !slug) {
      return NextResponse.json(
        { ok: false, message: "Nombre y slug de barberia son obligatorios." },
        { status: 400 },
      );
    }

    if (!isValidEmail(adminEmail) || adminPassword.length < 6) {
      return NextResponse.json(
        { ok: false, message: "Credenciales del administrador no validas." },
        { status: 400 },
      );
    }

    const bootstrapToken = signPostgrestToken(1);
    const adminUser = await ensureUser({
      bootstrapToken,
      name: adminName,
      email: adminEmail,
      role: "admin",
      password: adminPassword,
    });

    const ownerToken = signPostgrestToken(Number(adminUser.id), {
      role: "authenticated",
      email: adminEmail,
    });
    const barberia = await ensureBarberia({
      ownerToken,
      ownerId: Number(adminUser.id),
      nombre: nombreBarberia,
      slug,
      timezone,
      slotMin: [5, 10, 15, 20, 30].includes(slotMin) ? slotMin : 15,
    });

    const barberiaId = Number(barberia.id);

    await requestPostgrest<null>(`servicios?barberia_id=eq.${barberiaId}`, {
      method: "DELETE",
      token: ownerToken,
    });

    const servicios = Array.isArray(draft?.servicios)
      ? draft!.servicios
          .filter((s) => clean(s.nombre))
          .map((s) => ({
            barberia_id: barberiaId,
            nombre: clean(s.nombre),
            duracion_min: Math.max(5, Number(s.duracion_min ?? 0)),
            precio: Math.max(0, Number(s.precio ?? 0)),
          }))
      : [];

    if (servicios.length > 0) {
      await requestPostgrest<unknown[]>("servicios", {
        method: "POST",
        token: ownerToken,
        body: servicios,
        preferRepresentation: false,
      });
    }

    await requestPostgrest<null>(`horarios?barberia_id=eq.${barberiaId}`, {
      method: "DELETE",
      token: ownerToken,
    });

    const horarios = Array.isArray(draft?.horarios)
      ? draft!.horarios
          .filter((h) => Boolean(h.activo))
          .map((h) => ({
            barberia_id: barberiaId,
            dia_semana: dayToNumber(clean(h.dia)),
            hora_abre: clean(h.hora_abre) || "08:00",
            hora_cierra: clean(h.hora_cierra) || "19:00",
            activo: true,
          }))
      : [];

    if (horarios.length > 0) {
      await requestPostgrest<unknown[]>("horarios", {
        method: "POST",
        token: ownerToken,
        body: horarios,
        preferRepresentation: false,
      });
    }

    await requestPostgrest<null>(`barberos?barberia_id=eq.${barberiaId}`, {
      method: "DELETE",
      token: ownerToken,
    });

    const activeBarberosWithAccess = (Array.isArray(draft?.barberos) ? draft!.barberos : [])
      .map((barber, index) => {
        const access = draft?.accesos?.barberos?.[index];
        return {
          nombre: clean(barber.nombre) || clean(access?.nombre),
          activo: Boolean(barber.activo ?? access?.activo),
          email: clean(access?.email).toLowerCase(),
          password: (access?.password ?? "").toString(),
        };
      })
      .filter((barber) => barber.activo && barber.nombre);

    const barberosForInsert: Array<{
      barberia_id: number;
      nombre: string;
      activo: boolean;
      usuario_id?: number;
    }> = [];

    for (const barber of activeBarberosWithAccess) {
      if (!isValidEmail(barber.email) || barber.password.length < 6) {
        continue;
      }
      const user = await ensureUser({
        bootstrapToken,
        name: barber.nombre,
        email: barber.email,
        role: "barbero",
        password: barber.password,
      });
      barberosForInsert.push({
        barberia_id: barberiaId,
        nombre: barber.nombre,
        activo: true,
        usuario_id: Number(user.id),
      });
    }

    if (barberosForInsert.length > 0) {
      await requestPostgrest<unknown[]>("barberos", {
        method: "POST",
        token: ownerToken,
        body: barberosForInsert,
        preferRepresentation: false,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Onboarding creado en BD correctamente.",
      admin: {
        id: Number(adminUser.id),
        email: adminEmail,
      },
      barberia: {
        id: barberiaId,
        slug: barberia.slug,
      },
      created: {
        servicios: servicios.length,
        horarios: horarios.length,
        barberos: barberosForInsert.length,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && clean(error.message)
        ? clean(error.message)
        : "No se pudo crear el onboarding en BD.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
