import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "ba_pgrst_token";
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/citas",
  "/clientes",
  "/barberos",
  "/servicios",
  "/horarios",
  "/pagos",
  "/productos",
  "/gastos",
];

const LANDING_BASE_DOMAIN = normalizeBaseDomain(
  process.env.LANDING_BASE_DOMAIN || process.env.NEXT_PUBLIC_LANDING_BASE_DOMAIN || "",
);

function clean(value: unknown) {
  return (value ?? "").toString().trim();
}

function normalizeBaseDomain(value: string) {
  const raw = clean(value).toLowerCase();
  if (!raw) return "";

  const noProtocol = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
  return noProtocol.replace(/:\d+$/, "");
}

function normalizeHost(value: string) {
  const raw = clean(value).toLowerCase();
  if (!raw) return "";
  const first = raw.split(",")[0]?.trim() || "";
  return first.replace(/:\d+$/, "");
}

function extractLandingSlugFromHost(host: string) {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost || !LANDING_BASE_DOMAIN) return "";
  if (normalizedHost === LANDING_BASE_DOMAIN) return "";
  if (!normalizedHost.endsWith(`.${LANDING_BASE_DOMAIN}`)) return "";

  const candidate = normalizedHost.slice(0, -(LANDING_BASE_DOMAIN.length + 1));
  if (!candidate || candidate.includes(".")) return "";
  if (candidate === "www" || candidate === "app") return "";
  return candidate;
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostHeader =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const landingSlug = extractLandingSlugFromHost(hostHeader);

  if (landingSlug && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/reservar/${landingSlug}`;
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
