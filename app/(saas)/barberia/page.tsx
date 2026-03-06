"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";

type ServiceForm = {
  id: string;
  nombre: string;
  duracionMin: number;
  precio: number;
};

type BarberForm = {
  id: string;
  nombre: string;
  especialidad: string;
  fotoUrl: string;
  email: string;
  password: string;
  activo: boolean;
};

type ScheduleForm = {
  dia: string;
  activo: boolean;
  abre: string;
  cierra: string;
};

type SaveState =
  | { type: "idle"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type CreationState = {
  adminCreated: boolean;
  barberosCreated: number;
};

type OnboardingDraft = {
  barberia: {
    nombre: string;
    slug: string;
    descripcion: string;
    logo_url: string | null;
    telefono: string;
    direccion: string;
    ciudad: string;
    timezone: string;
    slot_min: number;
  };
  servicios: Array<{
    nombre: string;
    duracion_min: number;
    precio: number;
  }>;
  barberos: Array<{
    nombre: string;
    especialidad: string | null;
    foto_url: string | null;
    activo: boolean;
  }>;
  horarios: Array<{
    dia: string;
    activo: boolean;
    hora_abre: string;
    hora_cierra: string;
  }>;
  accesos?: {
    admin: {
      nombre: string;
      email: string;
      password: string;
    };
    barberos: Array<{
      nombre: string;
      email: string;
      password: string;
      activo: boolean;
    }>;
  };
  branding?: Record<string, unknown>;
};

const weekDays = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function isValidEmail(input: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

function readDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem("ba_onboarding_barberia");
    if (!raw) return null;
    const data = JSON.parse(raw) as OnboardingDraft;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export default function BarberiaDataPage() {
  const router = useRouter();
  const [showOnboardingNotice] = useState(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("onboarding") === "1";
  });
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [timezone, setTimezone] = useState("America/Bogota");
  const [slotMin, setSlotMin] = useState(15);
  const [adminNombre, setAdminNombre] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showAdminPasswordConfirm, setShowAdminPasswordConfirm] = useState(false);
  const [showBarberPasswords, setShowBarberPasswords] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  const [services, setServices] = useState<ServiceForm[]>([
    { id: makeId("service"), nombre: "", duracionMin: 30, precio: 0 },
  ]);
  const [barbers, setBarbers] = useState<BarberForm[]>([
    {
      id: makeId("barber"),
      nombre: "",
      especialidad: "",
      fotoUrl: "",
      email: "",
      password: "",
      activo: true,
    },
  ]);
  const [schedules, setSchedules] = useState<ScheduleForm[]>(
    weekDays.map((dia) => ({
      dia,
      activo: dia !== "Domingo",
      abre: "08:00",
      cierra: "19:00",
    })),
  );
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });
  const [creationState, setCreationState] = useState<CreationState>({
    adminCreated: false,
    barberosCreated: 0,
  });

  if (!hydrated && typeof window !== "undefined") {
    const draft = readDraft();
    if (draft) {
      setNombre(draft.barberia?.nombre || "");
      setSlug(draft.barberia?.slug || "");
      setDescripcion(draft.barberia?.descripcion || "");
      setLogoUrl(draft.barberia?.logo_url || "");
      setTelefono(draft.barberia?.telefono || "");
      setDireccion(draft.barberia?.direccion || "");
      setCiudad(draft.barberia?.ciudad || "");
      setTimezone(draft.barberia?.timezone || "America/Bogota");
      setSlotMin(draft.barberia?.slot_min || 15);
      setAdminNombre(draft.accesos?.admin?.nombre || "");
      setAdminEmail(draft.accesos?.admin?.email || "");
      setAdminPassword(draft.accesos?.admin?.password || "");
      setAdminPasswordConfirm(draft.accesos?.admin?.password || "");

      if (Array.isArray(draft.servicios) && draft.servicios.length > 0) {
        setServices(
          draft.servicios.map((s) => ({
            id: makeId("service"),
            nombre: s.nombre || "",
            duracionMin: Number(s.duracion_min || 0),
            precio: Number(s.precio || 0),
          })),
        );
      }

      if (Array.isArray(draft.barberos) && draft.barberos.length > 0) {
        setBarbers(
          draft.barberos.map((b, index) => ({
            id: makeId("barber"),
            nombre: b.nombre || "",
            especialidad: b.especialidad || "",
            fotoUrl: b.foto_url || "",
            email: draft.accesos?.barberos?.[index]?.email || "",
            password: draft.accesos?.barberos?.[index]?.password || "",
            activo: b.activo ?? true,
          })),
        );
      }

      if (Array.isArray(draft.horarios) && draft.horarios.length > 0) {
        setSchedules(
          draft.horarios.map((h) => ({
            dia: h.dia,
            activo: h.activo,
            abre: h.hora_abre,
            cierra: h.hora_cierra,
          })),
        );
      }
    }
    setHydrated(true);
  }

  const activeServices = useMemo(
    () => services.filter((s) => s.nombre.trim() && s.duracionMin > 0).length,
    [services],
  );
  const activeBarbers = useMemo(
    () => barbers.filter((b) => b.nombre.trim() && b.activo).length,
    [barbers],
  );
  const activeDays = useMemo(() => schedules.filter((s) => s.activo).length, [schedules]);
  const adminReady = useMemo(
    () =>
      adminNombre.trim().length > 2 &&
      isValidEmail(adminEmail) &&
      adminPassword.length >= 6 &&
      adminPassword === adminPasswordConfirm,
    [adminEmail, adminNombre, adminPassword, adminPasswordConfirm],
  );
  const barberosConAcceso = useMemo(
    () =>
      barbers.filter(
        (barber) =>
          barber.activo &&
          barber.nombre.trim().length > 0 &&
          isValidEmail(barber.email) &&
          barber.password.length >= 6,
      ).length,
    [barbers],
  );

  function updateService(id: string, key: keyof Omit<ServiceForm, "id">, value: string | number) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  }

  function updateBarber(
    id: string,
    key: keyof Omit<BarberForm, "id">,
    value: string | boolean,
  ) {
    setBarbers((prev) => prev.map((b) => (b.id === id ? { ...b, [key]: value } : b)));
  }

  function updateSchedule(
    dia: string,
    key: keyof Omit<ScheduleForm, "dia">,
    value: string | boolean,
  ) {
    setSchedules((prev) => prev.map((d) => (d.dia === dia ? { ...d, [key]: value } : d)));
  }

  function addService() {
    setServices((prev) => [
      ...prev,
      { id: makeId("service"), nombre: "", duracionMin: 30, precio: 0 },
    ]);
  }

  function removeService(id: string) {
    setServices((prev) => (prev.length === 1 ? prev : prev.filter((s) => s.id !== id)));
  }

  function addBarber() {
    setBarbers((prev) => [
      ...prev,
      {
        id: makeId("barber"),
        nombre: "",
        especialidad: "",
        fotoUrl: "",
        email: "",
        password: "",
        activo: true,
      },
    ]);
  }

  function removeBarber(id: string) {
    setBarbers((prev) => (prev.length === 1 ? prev : prev.filter((b) => b.id !== id)));
  }

  function toggleBarberPassword(id: string) {
    setShowBarberPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function buildDraft(): OnboardingDraft {
    const existing = typeof window !== "undefined" ? readDraft() : null;
    return {
      barberia: {
        nombre: nombre.trim(),
        slug: (slug || slugify(nombre)).trim(),
        descripcion: descripcion.trim(),
        logo_url: logoUrl.trim() || null,
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        ciudad: ciudad.trim(),
        timezone,
        slot_min: slotMin,
      },
      servicios: services
        .filter((s) => s.nombre.trim())
        .map((s) => ({
          nombre: s.nombre.trim(),
          duracion_min: Number(s.duracionMin),
          precio: Number(s.precio),
        })),
      barberos: barbers
        .filter((b) => b.nombre.trim())
        .map((b) => ({
          nombre: b.nombre.trim(),
          especialidad: b.especialidad.trim() || null,
          foto_url: b.fotoUrl.trim() || null,
          activo: b.activo,
        })),
      horarios: schedules.map((d) => ({
        dia: d.dia,
        activo: d.activo,
        hora_abre: d.abre,
        hora_cierra: d.cierra,
      })),
      accesos: {
        admin: {
          nombre: adminNombre.trim(),
          email: adminEmail.trim().toLowerCase(),
          password: adminPassword,
        },
        barberos: barbers
          .filter((b) => b.nombre.trim())
          .map((b) => ({
            nombre: b.nombre.trim(),
            email: b.email.trim().toLowerCase(),
            password: b.password,
            activo: b.activo,
          })),
      },
      branding: existing?.branding,
    };
  }

  function saveDraft(validateRequired: boolean) {
    const hasBusinessName = nombre.trim().length > 2;
    const hasServices = services.some((s) => s.nombre.trim());
    const hasBarbers = barbers.some((b) => b.nombre.trim());
    const hasActiveDay = schedules.some((s) => s.activo);
    const activeBarbersWithName = barbers.filter((b) => b.activo && b.nombre.trim().length > 0);
    const activeBarbersWithCredentials = activeBarbersWithName.filter(
      (barber) => isValidEmail(barber.email) && barber.password.length >= 6,
    );

    if (validateRequired && (!hasBusinessName || !hasServices || !hasBarbers || !hasActiveDay)) {
      setCreationState({ adminCreated: false, barberosCreated: 0 });
      setSaveState({
        type: "error",
        message:
          "Completa nombre de barberia, al menos 1 servicio, 1 barbero y 1 dia activo.",
      });
      return false;
    }

    if (validateRequired && !adminReady) {
      setCreationState({ adminCreated: false, barberosCreated: 0 });
      setSaveState({
        type: "error",
        message: "Configura credenciales validas para el administrador (email y password).",
      });
      return false;
    }

    if (validateRequired && activeBarbersWithName.length !== activeBarbersWithCredentials.length) {
      setCreationState({ adminCreated: false, barberosCreated: 0 });
      setSaveState({
        type: "error",
        message:
          "Cada barbero activo debe tener email valido y password de minimo 6 caracteres.",
      });
      return false;
    }

    localStorage.setItem("ba_onboarding_barberia", JSON.stringify(buildDraft()));
    localStorage.removeItem("ba_onboarding_done");
    setCreationState({
      adminCreated: true,
      barberosCreated: activeBarbersWithCredentials.length,
    });
    setSaveState({
      type: "success",
      message: "Datos guardados. Continua al paso de plantilla para finalizar.",
    });
    return true;
  }

  function createAdminAccess() {
    if (!adminReady) {
      setCreationState((prev) => ({ ...prev, adminCreated: false }));
      setSaveState({
        type: "error",
        message: "Completa nombre, email valido y password del administrador para crearlo.",
      });
      return;
    }

    localStorage.setItem("ba_onboarding_barberia", JSON.stringify(buildDraft()));
    localStorage.removeItem("ba_onboarding_done");
    setCreationState((prev) => ({ ...prev, adminCreated: true }));
    setSaveState({
      type: "success",
      message: "Administrador creado con exito.",
    });
  }

  function createBarberosAccess() {
    const activeBarbersWithName = barbers.filter((b) => b.activo && b.nombre.trim().length > 0);
    const activeBarbersWithCredentials = activeBarbersWithName.filter(
      (barber) => isValidEmail(barber.email) && barber.password.length >= 6,
    );

    if (activeBarbersWithCredentials.length === 0) {
      setCreationState((prev) => ({ ...prev, barberosCreated: 0 }));
      setSaveState({
        type: "error",
        message: "Agrega al menos 1 barbero activo con email valido y password para crearlo.",
      });
      return;
    }

    if (activeBarbersWithName.length !== activeBarbersWithCredentials.length) {
      setCreationState((prev) => ({ ...prev, barberosCreated: 0 }));
      setSaveState({
        type: "error",
        message:
          "Todos los barberos activos deben tener email valido y password de minimo 6 caracteres.",
      });
      return;
    }

    localStorage.setItem("ba_onboarding_barberia", JSON.stringify(buildDraft()));
    localStorage.removeItem("ba_onboarding_done");
    setCreationState((prev) => ({
      ...prev,
      barberosCreated: activeBarbersWithCredentials.length,
    }));
    setSaveState({
      type: "success",
      message:
        activeBarbersWithCredentials.length === 1
          ? "Barbero creado con exito."
          : `Barberos creados con exito: ${activeBarbersWithCredentials.length}.`,
    });
  }

  function goToTemplate() {
    const ok = saveDraft(true);
    if (ok) router.push("/barberia/plantilla");
  }

  return (
    <section className="space-y-5 overflow-x-hidden pb-8 [&_input]:text-base [&_select]:text-base [&_textarea]:text-base sm:[&_input]:text-sm sm:[&_select]:text-sm sm:[&_textarea]:text-sm">
      <div className="animate-rise flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="title-gradient text-2xl font-black tracking-tight sm:text-3xl">
            Paso 1: Datos de tu barberia
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Ingresa negocio, equipo y credenciales de acceso.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => saveDraft(false)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-bold text-zinc-100 transition hover:border-zinc-500 sm:w-auto"
          >
            <Save className="size-4" />
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={goToTemplate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--accent-strong)] sm:w-auto"
          >
            Siguiente: plantilla
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      {showOnboardingNotice ? (
        <div className="panel-muted animate-rise border-[var(--accent)] p-3 text-sm">
          <p className="font-bold text-zinc-100">
            Primero debes crear tu barberia para desbloquear el resto del SaaS.
          </p>
        </div>
      ) : null}

      {saveState.message ? (
        <div
          className={`panel animate-rise p-3 text-sm font-semibold ${
            saveState.type === "error" ? "text-red-300" : "text-emerald-300"
          }`}
        >
          {saveState.message}
        </div>
      ) : null}

      <article className="panel animate-rise p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-zinc-300">Datos generales</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={nombre}
            onChange={(e) => {
              const value = e.target.value;
              setNombre(value);
              if (!slug.trim()) setSlug(slugify(value));
            }}
            placeholder="Nombre comercial"
            className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="Slug"
            className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            placeholder="Descripcion"
            className="sm:col-span-2 w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Logo URL"
            className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Telefono"
            className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Direccion"
            className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
          <input
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Ciudad"
            className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          >
            <option value="America/Bogota">America/Bogota</option>
            <option value="America/Lima">America/Lima</option>
            <option value="America/Mexico_City">America/Mexico_City</option>
          </select>
          <select
            value={slotMin}
            onChange={(e) => setSlotMin(Number(e.target.value))}
            className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          >
            {[5, 10, 15, 20, 30].map((v) => (
              <option key={v} value={v}>
                {v} minutos
              </option>
            ))}
          </select>
        </div>
      </article>

      <article className="panel animate-rise p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-zinc-300">
          Credenciales de administrador
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={adminNombre}
            onChange={(e) => setAdminNombre(e.target.value)}
            placeholder="Nombre admin"
            className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="Email admin"
            className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
          <div className="relative">
            <input
              type={showAdminPassword ? "text" : "password"}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Password admin"
              autoComplete="new-password"
              className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 pr-10 text-zinc-100 outline-none focus:border-zinc-500"
            />
            <button
              type="button"
              onClick={() => setShowAdminPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              aria-label={showAdminPassword ? "Ocultar password admin" : "Mostrar password admin"}
              title={showAdminPassword ? "Ocultar password admin" : "Mostrar password admin"}
            >
              {showAdminPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showAdminPasswordConfirm ? "text" : "password"}
              value={adminPasswordConfirm}
              onChange={(e) => setAdminPasswordConfirm(e.target.value)}
              placeholder="Confirmar password"
              autoComplete="new-password"
              className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 pr-10 text-zinc-100 outline-none focus:border-zinc-500"
            />
            <button
              type="button"
              onClick={() => setShowAdminPasswordConfirm((prev) => !prev)}
              className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              aria-label={
                showAdminPasswordConfirm
                  ? "Ocultar confirmacion de password"
                  : "Mostrar confirmacion de password"
              }
              title={
                showAdminPasswordConfirm
                  ? "Ocultar confirmacion de password"
                  : "Mostrar confirmacion de password"
              }
            >
              {showAdminPasswordConfirm ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={createAdminAccess}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--accent-strong)]"
          >
            Crear administrador
          </button>
        </div>
        {creationState.adminCreated ? (
          <p className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300">
            Administrador creado con exito.
          </p>
        ) : null}
      </article>

      <article className="panel animate-rise overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-300">Servicios</h2>
          <button
            type="button"
            onClick={addService}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500"
          >
            <Plus className="size-4" />
            Agregar
          </button>
        </div>
        <div className="space-y-3 p-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3 sm:grid-cols-[1.2fr_0.7fr_0.7fr_auto]"
            >
              <input
                value={service.nombre}
                onChange={(e) => updateService(service.id, "nombre", e.target.value)}
                placeholder="Nombre servicio"
                className="rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
              <input
                type="number"
                min={5}
                value={service.duracionMin}
                onChange={(e) =>
                  updateService(service.id, "duracionMin", Number(e.target.value || 0))
                }
                placeholder="Duracion"
                className="rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
              <input
                type="number"
                min={0}
                step={1000}
                value={service.precio}
                onChange={(e) => updateService(service.id, "precio", Number(e.target.value || 0))}
                placeholder="Precio"
                className="rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
              <button
                type="button"
                onClick={() => removeService(service.id)}
                className="inline-flex items-center justify-center rounded-lg border border-[var(--line)] px-3 py-2 text-zinc-300 transition hover:border-red-500 hover:text-red-300"
                aria-label="Eliminar servicio"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </article>

      <article className="panel animate-rise overflow-hidden">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-300">
            Horarios de atencion
          </h2>
        </div>
        <div className="grid gap-2 p-4 sm:grid-cols-2">
          {schedules.map((day) => (
            <div key={day.dia} className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-100">{day.dia}</p>
                <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={day.activo}
                    onChange={(e) => updateSchedule(day.dia, "activo", e.target.checked)}
                    className="size-4"
                  />
                  Activo
                </label>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={day.abre}
                  disabled={!day.activo}
                  onChange={(e) => updateSchedule(day.dia, "abre", e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-2 py-1.5 text-zinc-100 outline-none focus:border-zinc-500 disabled:opacity-50"
                />
                <input
                  type="time"
                  value={day.cierra}
                  disabled={!day.activo}
                  onChange={(e) => updateSchedule(day.dia, "cierra", e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-2 py-1.5 text-zinc-100 outline-none focus:border-zinc-500 disabled:opacity-50"
                />
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="panel animate-rise overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-zinc-300">
            Equipo de barberos y accesos
          </h2>
          <button
            type="button"
            onClick={addBarber}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500"
          >
            <Plus className="size-4" />
            Agregar
          </button>
        </div>
        <div className="space-y-3 p-4">
          {barbers.map((barber) => (
            <div key={barber.id} className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3">
              <input
                value={barber.nombre}
                onChange={(e) => updateBarber(barber.id, "nombre", e.target.value)}
                placeholder="Nombre barbero"
                className="rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={barber.especialidad}
                  onChange={(e) => updateBarber(barber.id, "especialidad", e.target.value)}
                  placeholder="Especialidad"
                  className="rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                />
                <input
                  value={barber.fotoUrl}
                  onChange={(e) => updateBarber(barber.id, "fotoUrl", e.target.value)}
                  placeholder="Foto URL"
                  className="rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="email"
                  value={barber.email}
                  onChange={(e) => updateBarber(barber.id, "email", e.target.value)}
                  placeholder="Email acceso"
                  className="rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                />
                <div className="relative">
                  <input
                    type={showBarberPasswords[barber.id] ? "text" : "password"}
                    value={barber.password}
                    onChange={(e) => updateBarber(barber.id, "password", e.target.value)}
                    placeholder="Password acceso"
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-[var(--line)] bg-zinc-950 px-3 py-2 pr-10 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => toggleBarberPassword(barber.id)}
                    className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                    aria-label={
                      showBarberPasswords[barber.id]
                        ? "Ocultar password barbero"
                        : "Mostrar password barbero"
                    }
                    title={
                      showBarberPasswords[barber.id]
                        ? "Ocultar password barbero"
                        : "Mostrar password barbero"
                    }
                  >
                    {showBarberPasswords[barber.id] ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:w-fit sm:grid-cols-[auto_auto]">
                <label className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold text-zinc-300">
                  <input
                    type="checkbox"
                    checked={barber.activo}
                    onChange={(e) => updateBarber(barber.id, "activo", e.target.checked)}
                    className="size-4"
                  />
                  Activo
                </label>
                <button
                  type="button"
                  onClick={() => removeBarber(barber.id)}
                  className="inline-flex items-center justify-center rounded-lg border border-[var(--line)] px-3 py-2 text-zinc-300 transition hover:border-red-500 hover:text-red-300"
                  aria-label="Eliminar barbero"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={createBarberosAccess}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--accent-strong)]"
          >
            Crear barbero(s)
          </button>
        </div>
        {creationState.barberosCreated > 0 ? (
          <div className="px-4 pb-4">
            <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300">
              {creationState.barberosCreated === 1
                ? "Barbero creado con exito."
                : `Barberos creados con exito: ${creationState.barberosCreated}.`}
            </p>
          </div>
        ) : null}
      </article>

      <article className="panel-muted animate-rise p-4 text-sm">
        <div className="grid gap-2 text-zinc-200 sm:grid-cols-2">
          <p>Servicios activos: {activeServices}</p>
          <p>Barberos activos: {activeBarbers}</p>
          <p>Dias de atencion: {activeDays}</p>
          <p>Admin configurado: {adminReady ? "Si" : "No"}</p>
          <p>Barberos con acceso: {barberosConAcceso}</p>
        </div>
      </article>
    </section>
  );
}
