export type ISODate = string;
export type ISOTime = string;
export type ISODateTime = string;

export type CitaEstado = "confirmada" | "pendiente" | "cancelada";
export type PagoMetodo = "efectivo" | "digital";
export type BarberiaSlotMin = 5 | 10 | 15 | 20 | 30;

export interface UsuarioRow {
  id: number;
  nombre: string;
  email: string;
  created_at: ISODateTime;
}

export interface PlanRow {
  id: number;
  nombre: string;
  precio: number;
  created_at: ISODateTime;
}

export interface BarberiaRow {
  id: number;
  nombre: string;
  slug: string;
  estado: string;
  owner_id: number | null;
  plan_id: number | null;
  slot_min: BarberiaSlotMin;
  timezone: string;
  deleted_at: ISODateTime | null;
  created_at: ISODateTime;
}

export interface HorarioRow {
  id: number;
  barberia_id: number;
  dia_semana: number;
  hora_abre: ISOTime;
  hora_cierra: ISOTime;
  activo: boolean | null;
}

export interface BarberoRow {
  id: number;
  barberia_id: number;
  nombre: string;
  activo: boolean | null;
}

export interface ServicioRow {
  id: number;
  barberia_id: number;
  nombre: string;
  duracion_min: number;
  precio: number;
}

export interface ClienteFinalRow {
  id: number;
  barberia_id: number;
  nombre: string;
  telefono: string;
  created_at: ISODateTime;
  deleted_at: ISODateTime | null;
}

export interface CitaRow {
  id: number;
  barberia_id: number;
  barbero_id: number | null;
  servicio_id: number | null;
  cliente_id: number | null;
  fecha: ISODate;
  hora_inicio: ISOTime;
  hora_fin: ISOTime;
  cliente_nombre: string;
  cliente_tel: string;
  estado: CitaEstado | null;
  created_at: ISODateTime;
}

export interface PagoRow {
  id: number;
  cita_id: number;
  total: number;
  metodo: PagoMetodo;
  pagado_en: ISODateTime | null;
}

export interface ProductoRow {
  id: number;
  barberia_id: number;
  nombre: string;
  precio: number;
  stock: number;
  activo: boolean | null;
  created_at: ISODateTime;
}

export interface GastoRow {
  id: number;
  barberia_id: number;
  concepto: string;
  total: number;
  fecha: ISODate;
  created_at: ISODateTime;
}

export interface VCitaCompletaRow {
  cita_id: number;
  barberia_id: number;
  fecha: ISODate;
  hora_inicio: ISOTime;
  hora_fin: ISOTime;
  estado: CitaEstado | null;
  barbero: string;
  servicio: string;
  precio_servicio: number;
  cliente_nombre: string;
  cliente_tel: string;
  pago_total: number | null;
  pago_metodo: PagoMetodo | null;
  pagado_en: ISODateTime | null;
}

export interface VSlotDisponibleRow {
  barberia_id: number;
  barbero_id: number;
  fecha: ISODate;
  hora_inicio: ISOTime;
  hora_fin: ISOTime;
}

export interface CitaInsert {
  barberia_id: number;
  barbero_id: number;
  servicio_id: number;
  cliente_id?: number | null;
  fecha: ISODate;
  hora_inicio: ISOTime;
  cliente_nombre: string;
  cliente_tel: string;
  estado?: CitaEstado;
}

export type CitaPatch = Partial<Pick<CitaRow, "estado" | "fecha" | "hora_inicio" | "barbero_id" | "servicio_id" | "cliente_id" | "cliente_nombre" | "cliente_tel">>;

export type TableName =
  | "usuarios"
  | "planes"
  | "barberias"
  | "horarios"
  | "barberos"
  | "servicios"
  | "clientes_finales"
  | "citas"
  | "pagos"
  | "productos"
  | "gastos"
  | "v_citas_completas"
  | "v_slots_disponibles";

