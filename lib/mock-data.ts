export const dashboardMetrics = [
  { label: "Citas hoy", value: "18", detail: "+4 vs ayer" },
  { label: "Ingresos del dia", value: "$1,280", detail: "Meta 82%" },
  { label: "No show", value: "2", detail: "-1 vs semana pasada" },
  { label: "Ticket promedio", value: "$41", detail: "+6%" },
];

export const upcomingAppointments = [
  {
    hora: "09:00",
    cliente: "Carlos M.",
    servicio: "Fade + Barba",
    barbero: "David",
    estado: "confirmada",
  },
  {
    hora: "09:30",
    cliente: "Jose R.",
    servicio: "Corte clasico",
    barbero: "Andres",
    estado: "pendiente",
  },
  {
    hora: "10:00",
    cliente: "Luis O.",
    servicio: "Beard trim",
    barbero: "David",
    estado: "confirmada",
  },
  {
    hora: "10:30",
    cliente: "Marcos T.",
    servicio: "Corte + lavado",
    barbero: "Mateo",
    estado: "confirmada",
  },
];

export const citasRows = [
  {
    fecha: "2026-02-12",
    hora_inicio: "09:00",
    barbero: "David",
    servicio: "Fade + Barba",
    cliente_nombre: "Carlos M.",
    estado: "confirmada",
  },
  {
    fecha: "2026-02-12",
    hora_inicio: "09:30",
    barbero: "Andres",
    servicio: "Corte clasico",
    cliente_nombre: "Jose R.",
    estado: "pendiente",
  },
  {
    fecha: "2026-02-12",
    hora_inicio: "10:30",
    barbero: "Mateo",
    servicio: "Corte + lavado",
    cliente_nombre: "Marcos T.",
    estado: "cancelada",
  },
];

export const barberosRows = [
  { nombre: "David", activo: "true", ocupacion_hoy: "8 citas" },
  { nombre: "Andres", activo: "true", ocupacion_hoy: "6 citas" },
  { nombre: "Mateo", activo: "true", ocupacion_hoy: "4 citas" },
];

export const serviciosRows = [
  { nombre: "Fade + Barba", duracion_min: 45, precio: "$35" },
  { nombre: "Corte clasico", duracion_min: 30, precio: "$22" },
  { nombre: "Corte + lavado", duracion_min: 40, precio: "$28" },
];

export const horariosRows = [
  { dia_semana: 1, hora_abre: "08:00", hora_cierra: "19:00", activo: "true" },
  { dia_semana: 2, hora_abre: "08:00", hora_cierra: "19:00", activo: "true" },
  { dia_semana: 3, hora_abre: "08:00", hora_cierra: "19:00", activo: "true" },
  { dia_semana: 4, hora_abre: "08:00", hora_cierra: "19:00", activo: "true" },
  { dia_semana: 5, hora_abre: "08:00", hora_cierra: "20:00", activo: "true" },
  { dia_semana: 6, hora_abre: "09:00", hora_cierra: "15:00", activo: "true" },
];

export const clientesRows = [
  { nombre: "Carlos M.", telefono: "3001112233", visitas: 13 },
  { nombre: "Jose R.", telefono: "3002223344", visitas: 8 },
  { nombre: "Luis O.", telefono: "3003334455", visitas: 4 },
];

export const pagosRows = [
  { cita_id: 1042, total: "$35", metodo: "efectivo", pagado_en: "2026-02-12 09:48" },
  { cita_id: 1043, total: "$22", metodo: "digital", pagado_en: "2026-02-12 10:01" },
  { cita_id: 1044, total: "$28", metodo: "digital", pagado_en: "2026-02-12 10:44" },
];

export const productosRows = [
  { nombre: "Pomada Matte", precio: "$18", stock: 12, activo: "true" },
  { nombre: "Aceite de barba", precio: "$14", stock: 18, activo: "true" },
  { nombre: "Shampoo anti-frizz", precio: "$16", stock: 7, activo: "true" },
];

export const gastosRows = [
  { concepto: "Arriendo local", total: "$980", fecha: "2026-02-01" },
  { concepto: "Servicios publicos", total: "$230", fecha: "2026-02-05" },
  { concepto: "Insumos", total: "$160", fecha: "2026-02-08" },
];

