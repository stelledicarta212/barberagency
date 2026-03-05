"use client";

import clsx from "clsx";
import {
  Building2,
  Calendar,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  LogOut,
  Package,
  Scissors,
  Sparkles,
  Users,
  UserSquare2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type AccountSummary = {
  name: string;
  email: string;
  planName: string;
  planStatus: string;
  planRenewal?: string;
};

type OnboardingDraft = {
  accesos?: {
    admin?: {
      nombre?: string;
      email?: string;
    };
  };
};

const navItems: NavItem[] = [
  { href: "/barberia", label: "Mi barberia", icon: Building2 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/citas", label: "Citas", icon: Calendar },
  { href: "/barberos", label: "Barberos", icon: Scissors },
  { href: "/servicios", label: "Servicios", icon: Sparkles },
  { href: "/horarios", label: "Horarios", icon: Clock3 },
  { href: "/clientes", label: "Clientes", icon: UserSquare2 },
  { href: "/pagos", label: "Pagos", icon: Wallet },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/gastos", label: "Gastos", icon: CircleDollarSign },
];

function clean(value: string | null | undefined) {
  return (value ?? "").toString().trim();
}

function getNameFromEmail(email: string) {
  const safe = clean(email);
  if (!safe.includes("@")) return safe || "Usuario";
  return safe.split("@")[0];
}

function isActiveStatus(status: string) {
  const text = clean(status).toLowerCase();
  return (
    text === "activo" ||
    text === "active" ||
    text === "vigente" ||
    text === "paid" ||
    text === "pagado"
  );
}

function readOnboardingAdminAccount() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("ba_onboarding_barberia");
    if (!raw) return null;

    const draft = JSON.parse(raw) as OnboardingDraft;
    const name = clean(draft?.accesos?.admin?.nombre);
    const email = clean(draft?.accesos?.admin?.email);
    if (!name && !email) return null;

    return {
      name,
      email,
      planName: "Sin plan",
      planStatus: "Pendiente",
    } satisfies AccountSummary;
  } catch {
    return null;
  }
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        "group inline-flex h-10 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm",
        active
          ? "bg-[var(--accent)] text-white shadow-sm"
          : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isOnboardingRoute =
    pathname === "/barberia" || pathname.startsWith("/barberia/");
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const [account, setAccount] = useState<AccountSummary | null>(() => {
    if (typeof window === "undefined") return null;

    const localName = [
      clean(localStorage.getItem("ba_user_nombre_manual")),
      clean(localStorage.getItem("ba_user_apellido_manual")),
      clean(localStorage.getItem("ba_user_nombre")),
      clean(localStorage.getItem("ba_user_apellido")),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    const localEmail = clean(localStorage.getItem("ba_user_email"));
    const localPlanName = clean(localStorage.getItem("ba_plan_name")) || "Sin plan";
    const localPlanStatus =
      clean(localStorage.getItem("ba_plan_status")) ||
      (localPlanName === "Sin plan" ? "Pendiente" : "Activo");
    const localPlanRenewal = clean(localStorage.getItem("ba_plan_renovacion"));

    if (!localName && !localEmail) return readOnboardingAdminAccount();

    return {
      name: localName,
      email: localEmail,
      planName: localPlanName,
      planStatus: localPlanStatus,
      planRenewal: localPlanRenewal,
    };
  });

  const normalizedAccount = useMemo(() => {
    if (!account) return null;

    const email = clean(account.email);
    const name = clean(account.name) || getNameFromEmail(email);
    const planName = clean(account.planName) || "Sin plan";
    const planStatus =
      clean(account.planStatus) || (planName === "Sin plan" ? "Pendiente" : "Activo");
    const planRenewal = clean(account.planRenewal);

    return { name, email, planName, planStatus, planRenewal };
  }, [account]);

  useEffect(() => {
    fetch("/api/auth/profile", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json().catch(() => null)) as
          | {
              ok?: boolean;
              name?: string;
              email?: string;
              plan_name?: string;
              plan_status?: string;
              plan_renewal?: string;
            }
          | null;
      })
      .then((data) => {
        if (!data?.ok) return;

        const name = clean(data.name);
        const email = clean(data.email);
        const planName = clean(data.plan_name) || "Sin plan";
        const planStatus =
          clean(data.plan_status) || (planName === "Sin plan" ? "Pendiente" : "Activo");
        const planRenewal = clean(data.plan_renewal);

        if (name) localStorage.setItem("ba_user_nombre", name);
        if (email) localStorage.setItem("ba_user_email", email);
        localStorage.setItem("ba_plan_name", planName);
        localStorage.setItem("ba_plan_status", planStatus);
        if (planRenewal) localStorage.setItem("ba_plan_renovacion", planRenewal);

        setAccount({ name, email, planName, planStatus, planRenewal });
      })
      .catch(() => undefined);
  }, []);

  async function handleMobileLogout() {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
    localStorage.removeItem("ba_user_role");
    localStorage.removeItem("ba_user_id");
    localStorage.removeItem("ba_user_email");
    localStorage.removeItem("ba_user_nombre");
    localStorage.removeItem("ba_user_apellido");
    localStorage.removeItem("ba_user_nombre_manual");
    localStorage.removeItem("ba_user_apellido_manual");
    localStorage.removeItem("ba_plan_name");
    localStorage.removeItem("ba_plan_status");
    localStorage.removeItem("ba_plan_renovacion");
    setMobileAccountOpen(false);
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <div className="panel sticky top-2 z-40 mx-3 mt-3 p-2 lg:hidden">
        <div className="mb-2 flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2 text-zinc-100">
          <span className="text-sm font-black tracking-wide">BARBERAGENCY</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMobileAccountOpen((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface-muted)] text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
              aria-label="Cuenta"
              title="Cuenta"
            >
              <Users className="size-4" />
            </button>

            {mobileAccountOpen ? (
              <div className="absolute right-0 top-10 z-50 w-[min(19rem,calc(100vw-2.2rem))] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Cuenta y plan
                </p>

                {normalizedAccount ? (
                  <>
                    <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
                      {normalizedAccount.name}
                    </p>
                    <p className="truncate text-xs text-zinc-300">{normalizedAccount.email}</p>

                    <div className="mt-2 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Plan actual
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-zinc-100">
                          {normalizedAccount.planName}
                        </span>
                        <span
                          className={clsx(
                            "rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                            isActiveStatus(normalizedAccount.planStatus)
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                              : "border-amber-500/40 bg-amber-500/10 text-amber-300",
                          )}
                        >
                          {normalizedAccount.planStatus}
                        </span>
                      </div>
                      {clean(normalizedAccount.planRenewal) ? (
                        <p className="mt-1 text-[11px] text-zinc-400">
                          Renovacion: {normalizedAccount.planRenewal}
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={handleMobileLogout}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-bold text-white transition hover:bg-[var(--accent-strong)]"
                    >
                      <LogOut className="size-4" />
                      Cerrar sesion
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-xs text-zinc-300">
                      Primero completa la creacion de la barberia. Luego inicia sesion con las
                      credenciales creadas.
                    </p>
                    {isOnboardingRoute ? (
                      <button
                        type="button"
                        onClick={() => setMobileAccountOpen(false)}
                        className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-zinc-200"
                      >
                        Continuar onboarding
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setMobileAccountOpen(false)}
                        className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-zinc-200"
                      >
                        Ir a login
                      </Link>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <div key={item.href} onClick={() => setMobileAccountOpen(false)}>
                <NavLink {...item} active={active} />
              </div>
            );
          })}
        </div>
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 p-4 lg:block">
        <div className="panel flex h-full flex-col p-4">
          <div className="rounded-xl bg-zinc-950 p-4 text-zinc-100">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              SaaS Control Panel
            </p>
            <h1 className="mt-1 text-xl font-black tracking-wide">BARBERAGENCY</h1>
            <p className="mt-2 text-sm text-zinc-400">Lectura en vivo cuando la API responde</p>
          </div>

          <nav className="mt-4 flex flex-1 flex-col gap-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return <NavLink key={item.href} {...item} active={active} />;
            })}
          </nav>

          <div className="panel-muted mt-4 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Cuenta y plan
            </p>
            {normalizedAccount ? (
              <>
                <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
                  {normalizedAccount.name}
                </p>
                <p className="truncate text-xs text-zinc-300">{normalizedAccount.email}</p>

                <div className="mt-2 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    Plan actual
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-zinc-100">
                      {normalizedAccount.planName}
                    </span>
                    <span
                      className={clsx(
                        "rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                        isActiveStatus(normalizedAccount.planStatus)
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-300",
                      )}
                    >
                      {normalizedAccount.planStatus}
                    </span>
                  </div>
                  {clean(normalizedAccount.planRenewal) ? (
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Renovacion: {normalizedAccount.planRenewal}
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm font-semibold text-zinc-200">
                Configura tu barberia en el modulo inicial
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
