import { ModuleShell } from "@/components/module-shell";
import { getServiciosTableData } from "@/lib/saas-live";

export default async function ServiciosPage() {
  const { rows, source } = await getServiciosTableData();

  return (
    <ModuleShell
      title="Servicios"
      description={
        source === "live"
          ? "Catalogo base de servicios y duraciones (BD en vivo)"
          : "Catalogo base de servicios y duraciones (modo demo)"
      }
      actionLabel="Nuevo servicio"
      actionHref="/servicios/nuevo"
      actionAdminOnly
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "duracion_min", label: "Duracion (min)" },
        { key: "precio", label: "Precio" },
      ]}
      rows={rows}
    />
  );
}
