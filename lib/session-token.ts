import crypto from "node:crypto";

export type SessionRole = "admin" | "barbero";

export type SessionClaims = {
  sub: string;
  user_id: number;
  role: "authenticated";
  app_role?: SessionRole;
  email: string;
  iat: number;
  exp: number;
};

export type SessionContext = {
  sub: string;
  user_id: number;
  role: SessionRole;
  email: string;
  iat: number;
  exp: number;
  db_role: string;
};

export const SESSION_COOKIE_NAME = "ba_pgrst_token";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = (process.env.PGRST_JWT_SECRET ?? "").trim();
  if (!secret) {
    throw new Error("Missing PGRST_JWT_SECRET on server");
  }
  return secret;
}

function toBase64Url(input: Buffer | string) {
  const source = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return source
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

export function signSessionToken(payload: {
  userId: number;
  role: SessionRole;
  email: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const claims: SessionClaims = {
    sub: String(payload.userId),
    user_id: Number(payload.userId),
    role: "authenticated",
    app_role: payload.role,
    email: payload.email,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedClaims = toBase64Url(JSON.stringify(claims));
  const unsigned = `${encodedHeader}.${encodedClaims}`;

  const signature = toBase64Url(
    crypto.createHmac("sha256", getSecret()).update(unsigned).digest(),
  );

  return `${unsigned}.${signature}`;
}

export function verifySessionToken(token: string | null | undefined) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedClaims, encodedSignature] = parts;
  const unsigned = `${encodedHeader}.${encodedClaims}`;
  const expectedSignature = toBase64Url(
    crypto.createHmac("sha256", getSecret()).update(unsigned).digest(),
  );

  const a = Buffer.from(encodedSignature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    const claims = JSON.parse(fromBase64Url(encodedClaims)) as {
      sub?: string | number;
      user_id?: number;
      role?: string;
      app_role?: SessionRole;
      email?: string;
      iat?: number;
      exp?: number;
    };
    const now = Math.floor(Date.now() / 1000);
    const roleClaim = (claims.app_role ?? claims.role ?? "").toString().trim().toLowerCase();
    const role = roleClaim === "barbero" ? "barbero" : "admin";

    const userId = Number(claims.user_id ?? 0);
    const exp = Number(claims.exp ?? 0);
    const iat = Number(claims.iat ?? 0);
    if (!Number.isFinite(userId) || userId <= 0) return null;
    if (!Number.isFinite(exp) || exp <= now) return null;

    return {
      sub: (claims.sub ?? userId).toString(),
      user_id: userId,
      role,
      db_role: (claims.role ?? "").toString(),
      email: (claims.email ?? "").toString(),
      iat,
      exp,
    } satisfies SessionContext;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
