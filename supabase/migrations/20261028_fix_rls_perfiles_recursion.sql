-- Corrige: "infinite recursion detected in policy for relation perfiles"
-- Causa: la política FOR ALL de perfiles consultaba perfiles dentro de su propio USING.
-- Solución: helpers SECURITY DEFINER (omiten RLS, search_path fijo) + políticas separadas por comando.
-- Aplicar en Supabase Dashboard > SQL Editor.

BEGIN;

CREATE OR REPLACE FUNCTION public.rol_actual()
RETURNS public.rol_usuario
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.perfiles WHERE id = (SELECT auth.uid()) AND activo = true
$$;

CREATE OR REPLACE FUNCTION public.area_actual()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT area_id FROM public.perfiles WHERE id = (SELECT auth.uid()) AND activo = true
$$;

CREATE OR REPLACE FUNCTION public.usuario_activo()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT activo FROM public.perfiles WHERE id = (SELECT auth.uid())), false)
$$;

REVOKE EXECUTE ON FUNCTION public.rol_actual(), public.area_actual(), public.usuario_activo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rol_actual(), public.area_actual(), public.usuario_activo() TO authenticated;

-- PERFILES: la lectura queda abierta a autenticados; la escritura solo ADMIN_TI (sin recursión)
DROP POLICY IF EXISTS "Gestion de perfiles exclusiva ADMIN_TI" ON public.perfiles;
DROP POLICY IF EXISTS "Perfiles insert ADMIN_TI" ON public.perfiles;
DROP POLICY IF EXISTS "Perfiles update ADMIN_TI" ON public.perfiles;
DROP POLICY IF EXISTS "Perfiles delete ADMIN_TI" ON public.perfiles;

CREATE POLICY "Perfiles insert ADMIN_TI" ON public.perfiles
  FOR INSERT TO authenticated WITH CHECK (public.rol_actual() = 'ADMIN_TI');
CREATE POLICY "Perfiles update ADMIN_TI" ON public.perfiles
  FOR UPDATE TO authenticated
  USING (public.rol_actual() = 'ADMIN_TI') WITH CHECK (public.rol_actual() = 'ADMIN_TI');
CREATE POLICY "Perfiles delete ADMIN_TI" ON public.perfiles
  FOR DELETE TO authenticated USING (public.rol_actual() = 'ADMIN_TI');

-- AREAS
DROP POLICY IF EXISTS "Gestion de areas exclusiva ADMIN_TI" ON public.areas;
CREATE POLICY "Gestion de areas exclusiva ADMIN_TI" ON public.areas
  FOR ALL TO authenticated
  USING (public.rol_actual() = 'ADMIN_TI') WITH CHECK (public.rol_actual() = 'ADMIN_TI');

-- EXPEDIENTES: insertar solo MESA_PARTES; actualizar solo personal del área actual
DROP POLICY IF EXISTS "Insertar expediente exclusivo MESA_PARTES activo" ON public.expedientes;
CREATE POLICY "Insertar expediente exclusivo MESA_PARTES activo" ON public.expedientes
  FOR INSERT TO authenticated WITH CHECK (public.rol_actual() = 'MESA_PARTES');

DROP POLICY IF EXISTS "Actualizar expediente por personal activo del area actual" ON public.expedientes;
CREATE POLICY "Actualizar expediente por personal activo del area actual" ON public.expedientes
  FOR UPDATE TO authenticated
  USING (area_actual_id = public.area_actual()) WITH CHECK (true);

-- TRAZABILIDAD / ADJUNTOS
DROP POLICY IF EXISTS "Ver trazabilidad a usuarios autenticados activos" ON public.trazabilidad;
CREATE POLICY "Ver trazabilidad a usuarios autenticados activos" ON public.trazabilidad
  FOR SELECT TO authenticated USING (public.usuario_activo());

DROP POLICY IF EXISTS "Insertar trazabilidad a usuarios autenticados activos" ON public.trazabilidad;
CREATE POLICY "Insertar trazabilidad a usuarios autenticados activos" ON public.trazabilidad
  FOR INSERT TO authenticated
  WITH CHECK (emisor_id = (SELECT auth.uid()) AND public.usuario_activo());

DROP POLICY IF EXISTS "Actualizar recepcion en trazabilidad" ON public.trazabilidad;
CREATE POLICY "Actualizar recepcion en trazabilidad" ON public.trazabilidad
  FOR UPDATE TO authenticated
  USING (area_destino_id = public.area_actual()) WITH CHECK (true);

DROP POLICY IF EXISTS "Ver adjuntos a usuarios autenticados activos" ON public.adjuntos;
CREATE POLICY "Ver adjuntos a usuarios autenticados activos" ON public.adjuntos
  FOR SELECT TO authenticated USING (public.usuario_activo());

DROP POLICY IF EXISTS "Subir adjuntos por personal activo del area" ON public.adjuntos;
CREATE POLICY "Subir adjuntos por personal activo del area" ON public.adjuntos
  FOR INSERT TO authenticated
  WITH CHECK (subido_por = (SELECT auth.uid()) AND area_id = public.area_actual());

COMMIT;
