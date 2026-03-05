import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";
import { AdminOnly } from "@/components/session-role-gate";
import { getDashboardSnapshot } from "@/lib/saas-live";

export default async function DashboardPage() {
  const { metrics, upcoming, source } = await getDashboardSnapshot();

  return (
    <section className="space-y-5">
      <div className="animate-rise flex items-start justify-between gap-3">
        <div>
          <h1 className="title-gradient text-2xl font-black tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {source === "live"
              ? "Vista general del negocio conectada a tu BD"
              : "Vista general del negocio en modo maqueta"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <AdminOnly>
            <Link
              href="/barberia"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--accent-strong)]"
            >
              <Building2 className="size-4" />
              Configurar mi barberia
            </Link>
          </AdminOnly>
          <AdminOnly
            fallback={
              <span className="inline-flex items-center rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-zinc-400">
                Barbero: solo lectura de agenda
              </span>
            }
          >
            <Link
              href="/citas"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-zinc-100 transition hover:border-zinc-500"
            >
              <PlusCircle className="size-4" />
              Agendar cita
            </Link>
          </AdminOnly>
        </div>
      </div>

      <article className="panel-muted animate-rise p-4" style={{ animationDelay: "50ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Primer paso recomendado
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              Completa la informacion de tu negocio para activar agenda, servicios y equipo.
            </p>
          </div>
          <AdminOnly
            fallback={
              <span className="inline-flex items-center rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Solo administrador puede configurar barberia
              </span>
            }
          >
            <Link
              href="/barberia"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-[var(--accent-strong)]"
            >
              Ir a mi barberia
              <ArrowRight className="size-4" />
            </Link>
          </AdminOnly>
        </div>
      </article>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <article
            key={metric.label}
            className="panel animate-rise p-4"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              {metric.label}
            </p>
            <p className="mt-2 text-3xl font-black text-zinc-100">{metric.value}</p>
            <p className="mt-2 text-xs font-semibold text-[var(--success)]">{metric.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <article className="panel animate-rise overflow-hidden" style={{ animationDelay: "140ms" }}>
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
            <h2 className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-zinc-300">
              <CalendarClock className="size-4 text-[var(--accent)]" />
              Proximas citas
            </h2>
            <Link
              href="/citas"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-300 transition hover:text-zinc-100"
            >
              ver agenda
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-zinc-950 text-left text-xs uppercase tracking-wide text-zinc-200">
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Barbero</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((item, index) => (
                  <tr
                    key={`${item.hora}-${item.cliente}-${index}`}
                    className="border-b border-[var(--line)] text-sm text-zinc-200 transition hover:bg-zinc-900/70"
                  >
                    <td className="px-4 py-3 font-semibold">{item.hora}</td>
                    <td className="px-4 py-3">{item.cliente}</td>
                    <td className="px-4 py-3">{item.servicio}</td>
                    <td className="px-4 py-3">{item.barbero}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-300">
                        {item.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel-muted animate-rise p-4" style={{ animationDelay: "200ms" }}>
          <h3 className="text-sm font-black uppercase tracking-wide text-zinc-300">
            Estado de avance
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            <li className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[var(--success)]" />
              Base Next.js + Tailwind lista
            </li>
            <li className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[var(--success)]" />
              Sidebar y rutas del SaaS creadas
            </li>
            <li className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[var(--success)]" />
              Modulos con data mock navegables
            </li>
          </ul>
          <p className="mt-4 text-xs text-zinc-400">
            Siguiente paso: tipado exacto y cliente API para reemplazar mocks.
          </p>
        </article>
      </div>
    </section>
  );
}
