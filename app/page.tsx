import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Scissors,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

type BenefitItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type StepItem = {
  step: string;
  title: string;
  description: string;
};

const brand = {
  name: "BARBERAGENCY",
  whatsapp: "https://wa.me/573001112233",
};

const benefits: BenefitItem[] = [
  {
    title: "Agenda llena sin perseguir clientes",
    description:
      "Tus clientes reservan facil y rapido, y tu equipo trabaja con horarios claros.",
    icon: CalendarCheck2,
  },
  {
    title: "Mas control del negocio",
    description:
      "Visualiza servicios, barberos, horarios y disponibilidad en un solo lugar.",
    icon: ShieldCheck,
  },
  {
    title: "Mas ingresos con mejor orden",
    description:
      "Reduce espacios vacios y mejora la ocupacion diaria de tu barberia.",
    icon: TrendingUp,
  },
];

const steps: StepItem[] = [
  {
    step: "01",
    title: "Crea tu barberia",
    description:
      "Registra nombre, logo, servicios, horarios y tu equipo en pocos minutos.",
  },
  {
    step: "02",
    title: "Activa tu agenda",
    description:
      "Define bloques de tiempo y deja lista la disponibilidad real de cada barbero.",
  },
  {
    step: "03",
    title: "Recibe y organiza citas",
    description:
      "Gestiona reservas, clientes y operacion diaria con una vista simple.",
  },
];

const quickWins = [
  "Menos desorden por WhatsApp y llamadas.",
  "Mejor experiencia para el cliente desde la reserva.",
  "Equipo alineado con horarios y servicios claros.",
  "Mas tiempo para atender y vender, menos tiempo en caos.",
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--accent)_24%,transparent)] blur-3xl" />
        <div className="absolute -left-12 top-1/3 h-72 w-72 rounded-full bg-[color-mix(in_srgb,#3b82f6_20%,transparent)] blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[color-mix(in_srgb,#14b8a6_16%,transparent)] blur-3xl" />
      </div>

      <header className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-8">
        <div className="panel animate-rise flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
              Plataforma para barberias
            </p>
            <h1 className="text-sm font-black text-zinc-100 sm:text-base">{brand.name}</h1>
          </div>

          <nav className="hidden items-center gap-5 text-xs font-semibold uppercase tracking-wide text-zinc-300 md:flex">
            <a href="#beneficios" className="transition hover:text-zinc-100">
              Beneficios
            </a>
            <a href="#como-funciona" className="transition hover:text-zinc-100">
              Como funciona
            </a>
            <a href="#faq" className="transition hover:text-zinc-100">
              Preguntas
            </a>
          </nav>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <ThemeToggle />
            <Link href="/barberia" className="btn btn-primary">
              Empezar ahora
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto mt-6 grid w-full max-w-6xl gap-6 px-4 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="panel animate-rise p-6 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-300">
            <Sparkles className="size-3.5 text-[var(--accent)]" />
            Hecho para crecer tu barberia
          </div>

          <h2 className="title-gradient mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Tu barberia mas organizada, con mas citas y menos caos.
          </h2>

          <p className="mt-5 max-w-2xl text-base text-zinc-300 sm:text-lg">
            Centraliza horarios, servicios y equipo para ofrecer una experiencia profesional y
            aumentar tus ingresos sin complicarte.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={brand.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="btn btn-success"
            >
              <MessageCircle className="size-4" />
              Agendar llamada
            </a>
            <Link href="/barberia" className="btn btn-secondary">
              Crear mi barberia
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </article>

        <aside className="panel-muted animate-rise p-6" style={{ animationDelay: "90ms" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Lo ganas desde el primer dia
          </p>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            {quickWins.map((item) => (
              <li key={item} className="inline-flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 text-[var(--success)]" />
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section id="beneficios" className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-8">
        <div className="animate-rise flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-zinc-400">
          <Users className="size-4 text-[var(--accent)]" />
          Beneficios
        </div>

        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <article
                key={benefit.title}
                className="panel animate-rise p-5"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-2">
                  <Icon className="size-4 text-[var(--accent)]" />
                </div>
                <h3 className="mt-4 text-lg font-black text-zinc-100">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="como-funciona" className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-8">
        <div className="panel animate-rise p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-zinc-400">
            <Clock3 className="size-4 text-[var(--accent)]" />
            Como funciona
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {steps.map((item, index) => (
              <article
                key={item.step}
                className="panel-muted animate-rise p-4"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                  Paso {item.step}
                </p>
                <h3 className="mt-2 text-lg font-black text-zinc-100">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-300">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-8">
        <div className="panel animate-rise p-6 sm:p-8">
          <h3 className="inline-flex items-center gap-2 text-base font-black uppercase tracking-wide text-zinc-200">
            <Scissors className="size-4 text-[var(--accent)]" />
            Preguntas frecuentes
          </h3>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <article className="panel-muted p-4">
              <p className="text-sm font-black text-zinc-100">Cuanto tarda empezar?</p>
              <p className="mt-1 text-sm text-zinc-300">
                En minutos puedes dejar tu barberia configurada y lista para operar.
              </p>
            </article>
            <article className="panel-muted p-4">
              <p className="text-sm font-black text-zinc-100">Sirve para equipos pequenos?</p>
              <p className="mt-1 text-sm text-zinc-300">
                Si. Funciona tanto para una silla como para varios barberos.
              </p>
            </article>
            <article className="panel-muted p-4">
              <p className="text-sm font-black text-zinc-100">Necesito conocimientos tecnicos?</p>
              <p className="mt-1 text-sm text-zinc-300">
                No. La interfaz esta pensada para que cualquier barbero la use sin friccion.
              </p>
            </article>
            <article className="panel-muted p-4">
              <p className="text-sm font-black text-zinc-100">Puedo cambiar mi informacion despues?</p>
              <p className="mt-1 text-sm text-zinc-300">
                Claro. Puedes ajustar servicios, horarios y equipo cuando lo necesites.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-8">
        <div className="panel animate-rise overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                Listo para empezar
              </p>
              <h3 className="mt-2 text-2xl font-black text-zinc-100 sm:text-3xl">
                Activa tu barberia hoy y ordena tu operacion.
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              <a href={brand.whatsapp} target="_blank" rel="noreferrer" className="btn btn-success">
                Hablar por WhatsApp
                <MessageCircle className="size-4" />
              </a>
              <Link href="/barberia" className="btn btn-primary">
                Empezar configuracion
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-8 w-full max-w-6xl px-4 text-center text-xs text-zinc-500 sm:px-8">
        <p className="inline-flex items-center gap-2">
          <CalendarCheck2 className="size-3.5" />
          {brand.name} - Gestion para barberias
        </p>
      </footer>
    </main>
  );
}
