import { ModuleShell } from "@/components/module-shell";
import { getPagosTableData } from "@/lib/saas-live";

export default async function PagosPage() {
  const { rows, source } = await getPagosTableData();

  return (
    <ModuleShell
      title="Pagos"
      description={
        source === "live"
          ? "Registro de cobros por cita (BD en vivo)"
          : "Registro de cobros por cita (modo demo)"
      }
      actionLabel="Registrar pago"
      actionAdminOnly
      columns={[
        { key: "cita_id", label: "Cita ID" },
        { key: "total", label: "Total" },
        { key: "metodo", label: "Metodo" },
        { key: "pagado_en", label: "Pagado en" },
      ]}
      rows={rows}
    />
  );
}
