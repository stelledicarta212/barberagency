"use client";

import clsx from "clsx";
import {
  Building2,
  Calendar,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  Package,
  Scissors,
  Sparkles,
  Users,
  UserSquare2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
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

  return (
    <>
      <div className="panel sticky top-2 z-40 mx-3 mt-3 p-2 lg:hidden">
        <div className="mb-2 flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2 text-zinc-100">
          <span className="text-sm font-black tracking-wide">BARBERAGENCY</span>
          <Users className="size-4 text-zinc-400" />
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return <NavLink key={item.href} {...item} active={active} />;
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
              Primer paso
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-200">
              Configura tu barberia en el modulo inicial
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
