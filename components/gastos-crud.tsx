"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { useSessionRole } from "@/components/session-role-gate";

type GastoRow = {
  id: number;
  concepto: string;
  total: number;
  fecha: string;
};

type ApiResponse = {
  ok?: boolean;
  message?: string;
  rows?: GastoRow[];
};

type GastoForm = {
  concepto: string;
  total: number;
  fecha: string;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM: GastoForm = {
  concepto: "",
  total: 0,
  fecha: todayDate(),
};

function formatMoneyCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function GastosCrud() {
  const role = useSessionRole();
  const canManage = role === "admin";

  const [rows, setRows] = useState<GastoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<GastoRow | null>(null);
  const [form, setForm] = useState<GastoForm>(EMPTY_FORM);

  async function loadRows() {
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const response = await fetch("/api/gastos", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as ApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "No se pudo cargar gastos.");
      }

      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (err) {
      const text = err instanceof Error ? err.message : "No se pudo cargar gastos.";
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
    setForm({ ...EMPTY_FORM, fecha: todayDate() });
    setMessage("");
    setError(false);
    setModalOpen(true);
  }

  function openEditModal(row: GastoRow) {
    setEditingRow(row);
    setForm({
      concepto: row.concepto,
      total: row.total,
      fecha: row.fecha,
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
      const endpoint = isEdit ? `/api/gastos/${editingRow!.id}` : "/api/gastos";
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
        throw new Error(data.message || "No se pudo guardar el gasto.");
      }

      setModalOpen(false);
      setEditingRow(null);
      setForm(EMPTY_FORM);
      await loadRows();
      setMessage(isEdit ? "Gasto actualizado correctamente." : "Gasto creado correctamente.");
      setError(false);
    } catch (err) {
      const text = err instanceof Error ? err.message : "No se pudo guardar el gasto.";
      setMessage(text);
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: GastoRow) {
    if (!canManage) return;
    const confirmed = window.confirm(`Eliminar gasto ${row.concepto}?`);
    if (!confirmed) return;

    setDeletingId(row.id);
    setMessage("");
    setError(false);

    try {
      const response = await fetch(`/api/gastos/${row.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "No se pudo eliminar el gasto.");
      }

      await loadRows();
      setMessage("Gasto eliminado correctamente.");
      setError(false);
    } catch (err) {
      const text = err instanceof Error ? err.message : "No se pudo eliminar el gasto.";
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
            Gastos
          </h1>
          <p className="mt-1 text-sm text-zinc-400">Control de egresos operativos (BD en vivo)</p>
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
              Nuevo gasto
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
          <div className="p-4 text-sm text-zinc-400">Cargando gastos...</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-zinc-400">No hay gastos registrados.</div>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {rows.map((row) => (
                <article
                  key={`gasto-mobile-${row.id}`}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3"
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Concepto
                      </span>
                      <span className="font-semibold text-zinc-200">{row.concepto}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Total
                      </span>
                      <span className="font-semibold text-zinc-200">{formatMoneyCOP(row.total)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        Fecha
                      </span>
                      <span className="font-semibold text-zinc-200">{row.fecha}</span>
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
                        disabled={deletingId === row.id}
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
                    <th className="px-4 py-3 font-semibold">Concepto</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    {canManage ? <th className="px-4 py-3 font-semibold">Acciones</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={`gasto-${row.id}`}
                      className="border-b border-[var(--line)] text-sm text-zinc-200 transition hover:bg-zinc-900/70"
                    >
                      <td className="px-4 py-3">{row.concepto}</td>
                      <td className="px-4 py-3">{formatMoneyCOP(row.total)}</td>
                      <td className="px-4 py-3">{row.fecha}</td>
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
                              disabled={deletingId === row.id}
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
          <article className="w-full max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-zinc-100">
                  {editingRow ? "Editar gasto" : "Nuevo gasto"}
                </h2>
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
              <label className="space-y-1 text-sm">
                <span className="text-zinc-300">Concepto</span>
                <input
                  required
                  value={form.concepto}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, concepto: event.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-zinc-300">Total</span>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.total}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, total: Number(event.target.value || 0) }))
                    }
                    className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-zinc-300">Fecha</span>
                  <input
                    required
                    type="date"
                    value={form.fecha}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, fecha: event.target.value }))
                    }
                    className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  />
                </label>
              </div>

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
                  {saving ? "Guardando..." : editingRow ? "Guardar cambios" : "Crear gasto"}
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </section>
  );
}
