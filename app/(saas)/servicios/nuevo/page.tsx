"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

type FormState = {
  loading: boolean;
  message: string;
  error: boolean;
};

export default function NuevoServicioPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [duracionMin, setDuracionMin] = useState(30);
  const [precio, setPrecio] = useState(25000);
  const [state, setState] = useState<FormState>({
    loading: false,
    message: "",
    error: false,
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true, message: "", error: false });

    try {
      const response = await fetch("/api/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          duracion_min: Number(duracionMin),
          precio: Number(precio),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "No fue posible crear el servicio.");
      }

      setState({
        loading: false,
        message: "Servicio creado correctamente.",
        error: false,
      });

      setTimeout(() => {
        router.replace("/servicios");
        router.refresh();
      }, 500);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error inesperado al crear servicio.";
      setState({ loading: false, message, error: true });
    }
  }

  return (
    <section className="space-y-5">
      <div className="animate-rise flex items-center justify-between gap-3">
        <div>
          <h1 className="title-gradient text-2xl font-black tracking-tight sm:text-3xl">
            Nuevo servicio
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Solo administrador puede crear servicios.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/servicios")}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>
      </div>

      <article className="panel animate-rise max-w-xl p-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="text-zinc-300">Nombre del servicio</span>
            <input
              required
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Corte clasico"
              className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-zinc-300">Duracion (min)</span>
              <input
                required
                type="number"
                min={5}
                value={duracionMin}
                onChange={(event) => setDuracionMin(Number(event.target.value || 0))}
                className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-zinc-300">Precio</span>
              <input
                required
                type="number"
                min={0}
                step={1000}
                value={precio}
                onChange={(event) => setPrecio(Number(event.target.value || 0))}
                className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
          </div>

          {state.message ? (
            <p
              className={`rounded-lg border px-3 py-2 text-sm ${
                state.error
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={state.loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="size-4" />
            {state.loading ? "Guardando..." : "Crear servicio"}
          </button>
        </form>
      </article>
    </section>
  );
}
