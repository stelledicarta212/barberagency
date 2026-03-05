"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

type LoginState = {
  loading: boolean;
  message: string;
};

type OnboardingDraft = {
  accesos?: {
    admin?: {
      email?: string;
      password?: string;
    };
  };
};

function clean(value: string | null | undefined) {
  return (value ?? "").toString().trim();
}

function readOnboardingPrefill() {
  if (typeof window === "undefined") return { email: "", password: "" };

  const storageEmail = clean(localStorage.getItem("ba_login_prefill_email")).toLowerCase();
  const storagePassword = (localStorage.getItem("ba_login_prefill_password") ?? "").toString();
  if (storageEmail || storagePassword) {
    return { email: storageEmail, password: storagePassword };
  }

  try {
    const raw = localStorage.getItem("ba_onboarding_barberia");
    if (!raw) return { email: "", password: "" };
    const draft = JSON.parse(raw) as OnboardingDraft;
    return {
      email: clean(draft?.accesos?.admin?.email).toLowerCase(),
      password: (draft?.accesos?.admin?.password ?? "").toString(),
    };
  } catch {
    return { email: "", password: "" };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [fromOnboarding, setFromOnboarding] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<LoginState>({ loading: false, message: "" });

  useEffect(() => {
    let alive = true;
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      const onboardingFlow = q.get("onboarding") === "1";
      setFromOnboarding(onboardingFlow);

      if (onboardingFlow) {
        const prefill = readOnboardingPrefill();
        if (prefill.email) setEmail(prefill.email);
        if (prefill.password) setPassword(prefill.password);

        // On some mobile browsers/password managers, autofill can override initial values.
        // Force the onboarding credentials once after mount.
        window.setTimeout(() => {
          if (!alive) return;
          const latest = readOnboardingPrefill();
          if (latest.email) setEmail(latest.email);
          if (latest.password) setPassword(latest.password);
        }, 120);
      }
    }

    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!alive || !response.ok) return;
        router.replace("/dashboard");
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true, message: "" });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        role?: string;
        user_id?: number;
        email?: string;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "No fue posible iniciar sesion.");
      }

      localStorage.setItem("ba_user_role", data.role === "barbero" ? "barbero" : "admin");
      localStorage.setItem("ba_user_id", String(data.user_id ?? ""));
      localStorage.setItem("ba_user_email", data.email ?? "");
      localStorage.setItem("ba_show_login_welcome", "1");
      localStorage.removeItem("ba_login_prefill_email");
      localStorage.removeItem("ba_login_prefill_password");
      localStorage.removeItem("ba_login_prefill_source");

      setState({ loading: false, message: "" });
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error inesperado al iniciar sesion.";
      setState({ loading: false, message });
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--accent)_24%,transparent)] blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-5xl justify-end">
        <ThemeToggle />
      </div>

      <section className="mx-auto mt-6 w-full max-w-md">
        <article className="panel animate-rise p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Acceso SaaS
          </p>
          <h1 className="title-gradient mt-2 text-3xl font-black tracking-tight">Iniciar sesion</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Admin y barbero ingresan aqui con sus permisos.
          </p>

          {fromOnboarding ? (
            <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300">
              Onboarding completado. Entra con el email/password del admin o barbero.
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Email
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3">
                <Mail className="size-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@correo.com"
                  autoComplete="username"
                  name="ba_login_email"
                  className="h-11 w-full bg-transparent text-sm text-zinc-100 outline-none"
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Password
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3">
                <LockKeyhole className="size-4 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Tu password"
                  autoComplete="current-password"
                  name="ba_login_password"
                  className="h-11 w-full bg-transparent text-sm text-zinc-100 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                  aria-label={showPassword ? "Ocultar password" : "Mostrar password"}
                  title={showPassword ? "Ocultar password" : "Mostrar password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            {state.message ? (
              <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {state.message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={state.loading}
              className="w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state.loading ? "Ingresando..." : "Entrar"}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
