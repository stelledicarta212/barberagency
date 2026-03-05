import { ModuleShell } from "@/components/module-shell";
import { getCitasTableData } from "@/lib/saas-live";

export default async function CitasPage() {
  const { rows, source } = await getCitasTableData();

  return (
    <ModuleShell
      title="Citas"
      description={
        source === "live"
          ? "Agenda del dia y seguimiento de estados (BD en vivo)"
          : "Agenda del dia y seguimiento de estados (modo demo)"
      }
      actionLabel="Nueva cita"
      actionAdminOnly
      readOnlyHint="Solo admin puede crear/eliminar/agendar"
      columns={[
        { key: "fecha", label: "Fecha" },
        { key: "hora_inicio", label: "Hora inicio" },
        { key: "barbero", label: "Barbero" },
        { key: "servicio", label: "Servicio" },
        { key: "cliente_nombre", label: "Cliente" },
        { key: "estado", label: "Estado" },
      ]}
      rows={rows}
    />
  );
}
