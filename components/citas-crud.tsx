"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { useSessionRole } from "@/components/session-role-gate";

type CitaRow = {
  cita_id: number;
  fecha: string;
  hora_inicio: string;
  barbero: string;
  servicio: string;
  cliente_nombre: string;
  cliente_tel: string;
  estado: string;
  barbero_id: number;
  servicio_id: number;
};

type BarberoOption = {
  id: number;
  nombre: string;
  activo: boolean;
};

type ServicioOption = {
  id: number;
  nombre: string;
  duracion_min: number;
};

type ApiResponse = {
  ok?: boolean;
  message?: string;
  rows?: CitaRow[];
  barberos?: BarberoOption[];
  servicios?: ServicioOption[];
};

type CitaForm = {
  fecha: string;
  hora_inicio: string;
  barbero_id: number;
  servicio_id: number;
  cliente_nombre: string;
  cliente_tel: string;
  estado: "confirmada" | "pendiente" | "cancelada";
};

const STATE_OPTIONS: Array<CitaForm["estado"]> = ["confirmada", "pendiente", "cancelada"];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function openNativePicker(input: HTMLInputElement) {
  const picker = input as HTMLInputElement & { showPicker?: () => void };
  if (typeof picker.showPicker === "function") {
    try {
      picker.showPicker();
    } catch {}
  }
}

function statusClass(value: string) {
  const normalized = (value || "").toLowerCase();
  if (normalized === "confirmada") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  }
  if (normalized === "cancelada") {
    return "border-red-500/40 bg-red-500/10 text-red-200";
  }
  return "border-amber-500/40 bg-amber-500/10 text-amber-200";
}

function emptyForm(barberos: BarberoOption[], servicios: ServicioOption[]): CitaForm {
  const firstBarbero = barberos[0]?.id ?? 0;
  const firstServicio = servicios[0]?.id ?? 0;
  return {
    fecha: todayDate(),
    hora_inicio: "09:00",
    barbero_id: firstBarbero,
    servicio_id: firstServicio,
    cliente_nombre: "",
    cliente_tel: "",
    estado: "confirmada",
  };
}

export function CitasCrud() {
  const role = useSessionRole();
  const canManage = role === "admin";

  const [rows, setRows] = useState<CitaRow[]>([]);
  const [barberos, setBarberos] = useState<BarberoOption[]>([]);
  const [servicios, setServicios] = useState<ServicioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<CitaRow | null>(null);
  const [form, setForm] = useState<CitaForm>(() => emptyForm([], []));

  const availableBarberos = useMemo(
    () => barberos.filter((item) => item.activo),
    [barberos],
  );

  async function loadRows() {
    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch("/api/citas", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "No se pudo cargar citas.");
      }

      const nextRows = Array.isArray(data.rows) ? data.rows : [];
      const nextBarberos = Array.isArray(data.barberos) ? data.barberos : [];
      const nextServicios = Array.isArray(data.servicios) ? data.servicios : [];

      setRows(nextRows);
      setBarberos(nextBarberos);
      setServicios(nextServicios);
    } catch (err) {
      const text = err instanceof Error ? err.message : "No se pudo cargar citas.";
      setMessage(text);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  function openCreateModal() {
    setEditingRow(null);
    setForm(emptyForm(availableBarberos, servicios));
    setMessage("");
    setError(false);
    setModalOpen(true);
  }

  function openEditModal(row: CitaRow) {
    setEditingRow(row);
    setForm({
      fecha: row.fecha,
      hora_inicio: row.hora_inicio.slice(0, 5),
      barbero_id: row.barbero_id,
      servicio_id: row.servicio_id,
      cliente_nombre: row.cliente_nombre,
      cliente_tel: row.cliente_tel,
      estado: (STATE_OPTIONS.includes(row.estado as CitaForm["estado"])
        ? row.estado
        : "confirmada") as CitaForm["estado"],
    });
    setMessage("");
    setError(false);
    setModalOpen(true);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;

    setSaving(true);
    setMessage("");
    setError(false);

    try {
      const isEdit = Boolean(editingRow);
      const endpoint = isEdit ? `/api/citas/${editingRow!.cita_id}` : "/api/citas";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "No se pudo guardar la cita.");
      }

      setModalOpen(false);
      setEditingRow(null);
      await loadRows();
      setMessage(isEdit ? "Cita actualizada correctamente." : "Cita creada correctamente.");
      setError(false);
    } catch (err) {
      const text = err instanceof Error ? err.message : "No se pudo guardar la cita.";
      setMessage(text);
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: CitaRow) {
    if (!canManage) return;
    const confirmed = window.confirm(
      `Eliminar la cita de ${row.cliente_nombre} (${row.fecha} ${row.hora_inicio})?`,
    );
    if (!confirmed) return;

    setDeletingId(row.cita_id);
    setMessage("");
    setError(false);

    try {
      const response = await fetch(`/api/citas/${row.cita_id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "No se pudo eliminar la cita.");
      }

      await loadRows();
      setMessage("Cita eliminada correctamente.");
      setError(false);
    } catch (err) {
      const text = err instanceof Error ? err.message : "No se pudo eliminar la cita.";
      setMessage(text);
      setError(true);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div className="animate-rise flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="title-gradient text-2xl font-black tracking-tight sm:text-3xl">
            Citas
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Agenda del dia y seguimiento de estados (BD en vivo)
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => void loadRows()}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            <RefreshCw className="size-4" />
            Refrescar
          </button>

          {canManage ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--accent-strong)]"
            >
              <Plus className="size-4" />
              Nueva cita
            </button>
          ) : (
            <span className="inline-flex h-10 items-center rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-zinc-400">
              Solo admin puede crear/editar/eliminar
            </span>
          )}
        </div>
      </div>

      {message ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            error
              ? "border-red-500/40 bg-red-500/10 text-red-300"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {message}
        </p>
      ) : null}

      <div className="panel animate-rise overflow-hidden" style={{ animationDelay: "90ms" }}>
        {loading ? (
          <div className="p-4 text-sm text-zinc-400">Cargando citas...</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-zinc-400">No hay citas registradas.</div>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {rows.map((row) => (
                <article
                  key={`cita-mobile-${row.cita_id}`}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3"
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Fecha
                      </span>
                      <span className="font-semibold text-zinc-200">{row.fecha}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Hora
                      </span>
                      <span className="font-semibold text-zinc-200">{row.hora_inicio}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Barbero
                      </span>
                      <span className="font-semibold text-zinc-200">{row.barbero}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Servicio
                      </span>
                      <span className="font-semibold text-zinc-200">{row.servicio}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Cliente
                      </span>
                      <span className="font-semibold text-zinc-200">{row.cliente_nombre}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Estado
                      </span>
                      <span
                        className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClass(
                          row.estado,
                        )}`}
                      >
                        {row.estado}
                      </span>
                    </div>
                  </div>

                  {canManage ? (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(row)}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-zinc-900 px-3 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500"
                      >
                        <Pencil className="size-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === row.cita_id}
                        onClick={() => void handleDelete(row)}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 text-xs font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="size-4" />
                        Eliminar
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-zinc-950 text-left text-xs uppercase tracking-wide text-zinc-200">
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Hora inicio</th>
                    <th className="px-4 py-3 font-semibold">Barbero</th>
                    <th className="px-4 py-3 font-semibold">Servicio</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    {canManage ? <th className="px-4 py-3 font-semibold">Acciones</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={`cita-${row.cita_id}`}
                      className="border-b border-[var(--line)] text-sm text-zinc-200 transition hover:bg-zinc-900/70"
                    >
                      <td className="px-4 py-3">{row.fecha}</td>
                      <td className="px-4 py-3">{row.hora_inicio}</td>
                      <td className="px-4 py-3">{row.barbero}</td>
                      <td className="px-4 py-3">{row.servicio}</td>
                      <td className="px-4 py-3">{row.cliente_nombre}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${statusClass(
                            row.estado,
                          )}`}
                        >
                          {row.estado}
                        </span>
                      </td>
                      {canManage ? (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(row)}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--line)] bg-zinc-900 px-2 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500"
                            >
                              <Pencil className="size-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === row.cita_id}
                              onClick={() => void handleDelete(row)}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="size-3.5" />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <article className="w-full max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-zinc-100">
                  {editingRow ? "Editar cita" : "Nueva cita"}
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Completa la informacion para guardar en la agenda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] text-zinc-300 transition hover:text-zinc-100"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-zinc-300">Fecha</span>
                  <input
                    required
                    type="date"
                    value={form.fecha}
                    onChange={(event) => setForm((prev) => ({ ...prev, fecha: event.target.value }))}
                    onFocus={(event) => openNativePicker(event.currentTarget)}
                    onClick={(event) => openNativePicker(event.currentTarget)}
                    className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-zinc-300">Hora inicio</span>
                  <input
                    required
                    type="time"
                    value={form.hora_inicio}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, hora_inicio: event.target.value }))
                    }
                    onFocus={(event) => openNativePicker(event.currentTarget)}
                    onClick={(event) => openNativePicker(event.currentTarget)}
                    className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-zinc-300">Barbero</span>
                  <select
                    required
                    value={form.barbero_id}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, barbero_id: Number(event.target.value || 0) }))
                    }
                    className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  >
                    <option value={0}>Selecciona barbero</option>
                    {availableBarberos.map((item) => (
                      <option key={`barbero-${item.id}`} value={item.id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-zinc-300">Servicio</span>
                  <select
                    required
                    value={form.servicio_id}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        servicio_id: Number(event.target.value || 0),
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  >
                    <option value={0}>Selecciona servicio</option>
                    {servicios.map((item) => (
                      <option key={`servicio-${item.id}`} value={item.id}>
                        {item.nombre} ({item.duracion_min} min)
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-zinc-300">Cliente</span>
                  <input
                    required
                    value={form.cliente_nombre}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, cliente_nombre: event.target.value }))
                    }
                    placeholder="Nombre del cliente"
                    className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-zinc-300">Telefono</span>
                  <input
                    required
                    value={form.cliente_tel}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, cliente_tel: event.target.value }))
                    }
                    placeholder="3001234567"
                    className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  />
                </label>
              </div>

              <label className="space-y-1 text-sm">
                <span className="text-zinc-300">Estado</span>
                <select
                  value={form.estado}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      estado: (event.target.value || "confirmada") as CitaForm["estado"],
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                >
                  {STATE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="inline-flex h-10 items-center rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="size-4" />
                  {saving ? "Guardando..." : editingRow ? "Guardar cambios" : "Crear cita"}
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </section>
  );
}
