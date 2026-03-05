BEGIN;

-- Policy temporal usada para probar lectura anonima en servicios.
DROP POLICY IF EXISTS servicios_anon_demo_select ON public.servicios;

-- Opcionales por si se crearon durante pruebas.
DROP POLICY IF EXISTS barberos_anon_demo_select ON public.barberos;
DROP POLICY IF EXISTS citas_anon_demo_select ON public.citas;
DROP POLICY IF EXISTS horarios_anon_demo_select ON public.horarios;
DROP POLICY IF EXISTS clientes_anon_demo_select ON public.clientes_finales;
DROP POLICY IF EXISTS pagos_anon_demo_select ON public.pagos;
DROP POLICY IF EXISTS productos_anon_demo_select ON public.productos;
DROP POLICY IF EXISTS gastos_anon_demo_select ON public.gastos;

COMMIT;
