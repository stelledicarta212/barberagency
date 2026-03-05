import { ModuleShell } from "@/components/module-shell";
import { getClientesTableData } from "@/lib/saas-live";

export default async function ClientesPage() {
  const { rows, source } = await getClientesTableData();

  return (
    <ModuleShell
      title="Clientes"
      description={
        source === "live"
          ? "Base de clientes frecuentes del local (BD en vivo)"
          : "Base de clientes frecuentes del local (modo demo)"
      }
      actionLabel="Nuevo cliente"
      actionAdminOnly
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "telefono", label: "Telefono" },
        { key: "visitas", label: "Visitas" },
      ]}
      rows={rows}
    />
  );
}
