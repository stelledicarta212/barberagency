import { ModuleShell } from "@/components/module-shell";
import { getBarberosTableData } from "@/lib/saas-live";

export default async function BarberosPage() {
  const { rows, source } = await getBarberosTableData();

  return (
    <ModuleShell
      title="Barberos"
      description={
        source === "live"
          ? "Gestion de equipo y carga diaria (BD en vivo)"
          : "Gestion de equipo y carga diaria (modo demo)"
      }
      actionLabel="Nuevo barbero"
      actionAdminOnly
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "activo", label: "Activo" },
        { key: "ocupacion_hoy", label: "Ocupacion hoy" },
      ]}
      rows={rows}
    />
  );
}
