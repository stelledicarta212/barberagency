import { ModuleShell } from "@/components/module-shell";
import { getProductosTableData } from "@/lib/saas-live";

export default async function ProductosPage() {
  const { rows, source } = await getProductosTableData();

  return (
    <ModuleShell
      title="Productos"
      description={
        source === "live"
          ? "Inventario de productos para venta y uso interno (BD en vivo)"
          : "Inventario de productos para venta y uso interno (modo demo)"
      }
      actionLabel="Nuevo producto"
      actionAdminOnly
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "precio", label: "Precio" },
        { key: "stock", label: "Stock" },
        { key: "activo", label: "Activo" },
      ]}
      rows={rows}
    />
  );
}
