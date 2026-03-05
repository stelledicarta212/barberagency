"use client";

import clsx from "clsx";
import {
  Bell,
  Building2,
  CalendarDays,
  Home,
  LayoutDashboard,
  LogOut,
  Search,
  Settings2,
  Undo2,
  UserSquare2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

type QuickRoute = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const quickRoutes: QuickRoute[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/barberia", label: "Mi barberia", icon: Building2 },
  { href: "/citas", label: "Citas", icon: CalendarDays },
  { href: "/clientes", label: "Clientes", icon: UserSquare2 },
];

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  async function handleLogout() {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
    localStorage.removeItem("ba_user_role");
    localStorage.removeItem("ba_user_id");
    localStorage.removeItem("ba_user_email");
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="animate-rise px-4 pt-3 sm:px-6 lg:px-10 lg:pt-6">
      <div className="panel px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Vista local
            </p>
            <h2 className="text-sm font-bold text-zinc-100 sm:text-base">{today}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
            >
              <Undo2 className="size-4" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            <ThemeToggle />
            <button
              type="button"
              className="hidden h-10 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100 md:inline-flex"
            >
              <Search className="size-4" />
              Buscar
            </button>
            <Link
              href="/citas"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-white transition hover:bg-[var(--accent-strong)]"
            >
              <CalendarDays className="size-4" />
              <span className="hidden sm:inline">Agenda</span>
            </Link>
            <button
              type="button"
              className="hidden h-10 items-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100 lg:inline-flex"
              aria-label="Notificaciones"
            >
              <Bell className="size-4" />
            </button>
            <button
              type="button"
              className="hidden h-10 items-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100 lg:inline-flex"
              aria-label="Configuracion"
            >
              <Settings2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 items-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
              aria-label="Cerrar sesion"
              title="Cerrar sesion"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {quickRoutes.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-semibold transition sm:text-xs",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--line)] bg-[var(--surface-muted)] text-zinc-300 hover:border-zinc-600 hover:text-zinc-100",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
