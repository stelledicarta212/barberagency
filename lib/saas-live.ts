import { getFrom } from "@/lib/api";
import {
  barberosRows,
  citasRows,
  clientesRows,
  dashboardMetrics,
  gastosRows,
  horariosRows,
  pagosRows,
  productosRows,
  serviciosRows,
  upcomingAppointments,
} from "@/lib/mock-data";
import type {
  BarberoRow,
  ClienteFinalRow,
  GastoRow,
  HorarioRow,
  PagoRow,
  ProductoRow,
  ServicioRow,
  VCitaCompletaRow,
} from "@/lib/types";

type TableValue = string | number | null | undefined;
type TableRow = Record<string, TableValue>;

type Source = "live" | "mock";

type ListResult<T> = {
  rows: T[];
  source: Source;
  error?: string;
};

type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

type UpcomingAppointment = {
  hora: string;
  cliente: string;
  servicio: string;
  barbero: string;
  estado: string;
};

export type DashboardSnapshot = {
  metrics: DashboardMetric[];
  upcoming: UpcomingAppointment[];
  source: Source;
  error?: string;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function timeHM(value: string | null | undefined) {
  if (!value) return "-";
  return value.slice(0, 5);
}

function boolToLabel(value: boolean | null | undefined) {
  return value ? "Si" : "No";
}

function dayLabel(value: number | string) {
  const byNumber: Record<number, string> = {
    1: "Lunes",
    2: "Martes",
    3: "Miercoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sabado",
    7: "Domingo",
  };

  if (typeof value === "number") {
    return byNumber[value] ?? String(value);
  }

  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && byNumber[asNumber]) {
    return byNumber[asNumber];
  }

  return value;
}

function formatMoneyCOP(value: number | null | undefined) {
  const safe = Number(value ?? 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(safe) ? safe : 0);
}

function cleanError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "No se pudo consultar la base de datos";
}

async function withFallback<T>(
  fetcher: () => Promise<T[]>,
  fallbackRows: T[],
): Promise<ListResult<T>> {
  try {
    const rows = await fetcher();
    return { rows, source: "live" };
  } catch (error) {
    return { rows: fallbackRows, source: "mock", error: cleanError(error) };
  }
}

export async function getCitasTableData(): Promise<ListResult<TableRow>> {
  return withFallback<TableRow>(
    async () => {
      const rows = await getFrom<VCitaCompletaRow[]>(
        "v_citas_completas",
        {
          select: "fecha,hora_inicio,barbero,servicio,cliente_nombre,estado",
          order: "fecha.desc,hora_inicio.asc",
          limit: 80,
        },
      );

      return rows.map((row) => ({
        fecha: row.fecha,
        hora_inicio: timeHM(row.hora_inicio),
        barbero: row.barbero,
        servicio: row.servicio,
        cliente_nombre: row.cliente_nombre,
        estado: row.estado ?? "pendiente",
      }));
    },
    citasRows,
  );
}

export async function getBarberosTableData(): Promise<ListResult<TableRow>> {
  return withFallback<TableRow>(
    async () => {
      const [barberos, citasHoy] = await Promise.all([
        getFrom<BarberoRow[]>(
          "barberos",
          { select: "id,nombre,activo", order: "id.asc", limit: 120 },
        ),
        getFrom<Pick<VCitaCompletaRow, "barbero" | "fecha">[]>(
          "v_citas_completas",
          {
            select: "barbero,fecha",
            fecha: `eq.${todayDate()}`,
            limit: 500,
          },
        ),
      ]);

      const countByName = new Map<string, number>();
      for (const cita of citasHoy) {
        const key = (cita.barbero ?? "").trim().toLowerCase();
        if (!key) continue;
        countByName.set(key, (countByName.get(key) ?? 0) + 1);
      }

      return barberos.map((barbero) => {
        const key = (barbero.nombre ?? "").trim().toLowerCase();
        const citas = countByName.get(key) ?? 0;
        return {
          nombre: barbero.nombre,
          activo: boolToLabel(barbero.activo),
          ocupacion_hoy: `${citas} citas`,
        };
      });
    },
    barberosRows,
  );
}

export async function getServiciosTableData(): Promise<ListResult<TableRow>> {
  return withFallback<TableRow>(
    async () => {
      const rows = await getFrom<ServicioRow[]>(
        "servicios",
        { select: "nombre,duracion_min,precio", order: "nombre.asc", limit: 150 },
      );

      return rows.map((row) => ({
        nombre: row.nombre,
        duracion_min: row.duracion_min,
        precio: formatMoneyCOP(row.precio),
      }));
    },
    serviciosRows,
  );
}

export async function getHorariosTableData(): Promise<ListResult<TableRow>> {
  return withFallback<TableRow>(
    async () => {
      const rows = await getFrom<HorarioRow[]>(
        "horarios",
        { select: "dia_semana,hora_abre,hora_cierra,activo", order: "dia_semana.asc" },
      );

      return rows.map((row) => ({
        dia_semana: dayLabel(row.dia_semana),
        hora_abre: timeHM(row.hora_abre),
        hora_cierra: timeHM(row.hora_cierra),
        activo: boolToLabel(row.activo),
      }));
    },
    horariosRows,
  );
}

export async function getClientesTableData(): Promise<ListResult<TableRow>> {
  return withFallback<TableRow>(
    async () => {
      const [clientes, citas] = await Promise.all([
        getFrom<ClienteFinalRow[]>(
          "clientes_finales",
          { select: "nombre,telefono", order: "nombre.asc", limit: 300 },
        ),
        getFrom<Pick<VCitaCompletaRow, "cliente_tel">[]>(
          "v_citas_completas",
          { select: "cliente_tel", limit: 1200 },
        ),
      ]);

      const visitsByPhone = new Map<string, number>();
      for (const cita of citas) {
        const tel = (cita.cliente_tel ?? "").trim();
        if (!tel) continue;
        visitsByPhone.set(tel, (visitsByPhone.get(tel) ?? 0) + 1);
      }

      return clientes.map((cliente) => ({
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        visitas: visitsByPhone.get(cliente.telefono) ?? 0,
      }));
    },
    clientesRows,
  );
}

export async function getPagosTableData(): Promise<ListResult<TableRow>> {
  return withFallback<TableRow>(
    async () => {
      const rows = await getFrom<PagoRow[]>(
        "pagos",
        { select: "cita_id,total,metodo,pagado_en", order: "pagado_en.desc", limit: 200 },
      );

      return rows.map((row) => ({
        cita_id: row.cita_id,
        total: formatMoneyCOP(row.total),
        metodo: row.metodo,
        pagado_en: row.pagado_en ? row.pagado_en.replace("T", " ").slice(0, 16) : "-",
      }));
    },
    pagosRows,
  );
}

export async function getProductosTableData(): Promise<ListResult<TableRow>> {
  return withFallback<TableRow>(
    async () => {
      const rows = await getFrom<ProductoRow[]>(
        "productos",
        { select: "nombre,precio,stock,activo", order: "nombre.asc", limit: 200 },
      );

      return rows.map((row) => ({
        nombre: row.nombre,
        precio: formatMoneyCOP(row.precio),
        stock: row.stock,
        activo: boolToLabel(row.activo),
      }));
    },
    productosRows,
  );
}

export async function getGastosTableData(): Promise<ListResult<TableRow>> {
  return withFallback<TableRow>(
    async () => {
      const rows = await getFrom<GastoRow[]>(
        "gastos",
        { select: "concepto,total,fecha", order: "fecha.desc", limit: 200 },
      );

      return rows.map((row) => ({
        concepto: row.concepto,
        total: formatMoneyCOP(row.total),
        fecha: row.fecha,
      }));
    },
    gastosRows,
  );
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  try {
    const today = todayDate();
    const [todayRows, upcomingRows] = await Promise.all([
      getFrom<VCitaCompletaRow[]>(
        "v_citas_completas",
        {
          select:
            "fecha,hora_inicio,barbero,servicio,cliente_nombre,estado,pago_total",
          fecha: `eq.${today}`,
          order: "hora_inicio.asc",
          limit: 300,
        },
      ),
      getFrom<VCitaCompletaRow[]>(
        "v_citas_completas",
        {
          select: "fecha,hora_inicio,barbero,servicio,cliente_nombre,estado",
          fecha: `gte.${today}`,
          order: "fecha.asc,hora_inicio.asc",
          limit: 8,
        },
      ),
    ]);

    const ingresosDia = todayRows.reduce(
      (acc, row) => acc + Number(row.pago_total ?? 0),
      0,
    );
    const pagosContados = todayRows.filter(
      (row) => Number(row.pago_total ?? 0) > 0,
    ).length;
    const noShow = todayRows.filter((row) => row.estado === "cancelada").length;
    const ticketPromedio = pagosContados > 0 ? ingresosDia / pagosContados : 0;

    const metrics: DashboardMetric[] = [
      {
        label: "Citas hoy",
        value: String(todayRows.length),
        detail: "Datos en vivo",
      },
      {
        label: "Ingresos del dia",
        value: formatMoneyCOP(ingresosDia),
        detail: pagosContados > 0 ? `${pagosContados} pagos` : "Sin pagos",
      },
      {
        label: "No show",
        value: String(noShow),
        detail: "Estado cancelada",
      },
      {
        label: "Ticket promedio",
        value: formatMoneyCOP(ticketPromedio),
        detail: "Pagos del dia",
      },
    ];

    const upcoming: UpcomingAppointment[] = upcomingRows.map((row) => ({
      hora: `${row.fecha} ${timeHM(row.hora_inicio)}`,
      cliente: row.cliente_nombre,
      servicio: row.servicio,
      barbero: row.barbero,
      estado: row.estado ?? "pendiente",
    }));

    return { metrics, upcoming, source: "live" };
  } catch (error) {
    return {
      metrics: dashboardMetrics,
      upcoming: upcomingAppointments,
      source: "mock",
      error: cleanError(error),
    };
  }
}
