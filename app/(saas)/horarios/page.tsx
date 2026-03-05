import { ModuleShell } from "@/components/module-shell";
import { getHorariosTableData } from "@/lib/saas-live";

export default async function HorariosPage() {
  const { rows, source } = await getHorariosTableData();

  return (
    <ModuleShell
      title="Horarios"
      description={
        source === "live"
          ? "Bloques activos por dia para agenda (BD en vivo)"
          : "Bloques activos por dia para agenda (modo demo)"
      }
      actionLabel="Actualizar horario"
      actionAdminOnly
      columns={[
        { key: "dia_semana", label: "Dia semana" },
        { key: "hora_abre", label: "Abre" },
        { key: "hora_cierra", label: "Cierra" },
        { key: "activo", label: "Activo" },
      ]}
      rows={rows}
    />
  );
}
