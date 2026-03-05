import { AdminOnly } from "@/components/session-role-gate";
import Link from "next/link";

type TableColumn = {
  key: string;
  label: string;
};

type TableValue = string | number | null | undefined;

type TableRow = Record<string, TableValue>;

type ModuleShellProps = {
  title: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
  columns: TableColumn[];
  rows: TableRow[];
  actionAdminOnly?: boolean;
  readOnlyHint?: string;
};

function formatCellValue(value: TableValue) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

export function ModuleShell({
  title,
  description,
  actionLabel,
  actionHref,
  columns,
  rows,
  actionAdminOnly = false,
  readOnlyHint = "Modo solo lectura para barbero",
}: ModuleShellProps) {
  const actionClassName =
    "w-full rounded-xl bg-[var(--accent)] px-4 py-2 text-center text-sm font-bold text-white shadow-sm transition hover:bg-[var(--accent-strong)] sm:w-auto";

  const actionNode = actionHref ? (
    <Link href={actionHref} className={actionClassName}>
      {actionLabel}
    </Link>
  ) : (
    <button type="button" className={actionClassName}>
      {actionLabel}
    </button>
  );

  return (
    <section className="space-y-5">
      <div className="animate-rise flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="title-gradient text-2xl font-black tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        </div>

        {actionAdminOnly ? (
          <AdminOnly
            fallback={
              <span className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-semibold text-zinc-400 sm:w-auto">
                {readOnlyHint}
              </span>
            }
          >
            {actionNode}
          </AdminOnly>
        ) : (
          actionNode
        )}
      </div>

      <div className="panel animate-rise overflow-hidden" style={{ animationDelay: "90ms" }}>
        <div className="space-y-3 p-3 md:hidden">
          {rows.map((row, index) => (
            <article
              key={`${title}-mobile-${index}`}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3"
            >
              <div className="space-y-2">
                {columns.map((column) => {
                  const value = formatCellValue(row[column.key]);
                  const isStatus = column.key.toLowerCase().includes("estado");

                  return (
                    <div key={column.key} className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                        {column.label}
                      </span>
                      {isStatus ? (
                        <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
                          {value}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-zinc-200">{value}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-zinc-950 text-left text-xs uppercase tracking-wide text-zinc-200">
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 font-semibold">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${title}-${index}`}
                  className="border-b border-[var(--line)] text-sm text-zinc-200 transition hover:bg-zinc-900/70"
                >
                  {columns.map((column) => {
                    const value = formatCellValue(row[column.key]);
                    const isStatus = column.key.toLowerCase().includes("estado");

                    return (
                      <td key={column.key} className="px-4 py-3">
                        {isStatus ? (
                          <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-300">
                            {value}
                          </span>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
