import { ModuleShell } from "@/components/module-shell";
import { getGastosTableData } from "@/lib/saas-live";

export default async function GastosPage() {
  const { rows, source } = await getGastosTableData();

  return (
    <ModuleShell
      title="Gastos"
      description={
        source === "live"
          ? "Control de egresos operativos (BD en vivo)"
          : "Control de egresos operativos (modo demo)"
      }
      actionLabel="Nuevo gasto"
      actionAdminOnly
      columns={[
        { key: "concepto", label: "Concepto" },
        { key: "total", label: "Total" },
        { key: "fecha", label: "Fecha" },
      ]}
      rows={rows}
    />
  );
}
