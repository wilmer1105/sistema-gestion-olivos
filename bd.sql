
CREATE TYPE public.estado_expediente AS ENUM (

  'REGISTRADO',

  'DERIVADO',

  'RECEPCIONADO',

  'EN_TRAMITE',

  'OBSERVADO',

  'ATENDIDO',

  'ARCHIVADO'

);

CREATE TYPE public.rol_usuario AS ENUM (

  'ADMIN_TI',

  'MESA_PARTES',

  'ASISTENTE_AREA',

  'ESPECIALISTA',

  'JEFE_AREA'

);

CREATE TYPE public.tipo_documento_tramite AS ENUM (

  'FUT',

  'CARTA',

  'OFICIO',

  'SOLICITUD',

  'INFORME_TECNICO',

  'INFORME_LEGAL',

  'ACTA_FISCALIZACION',

  'RESOLUCION',

  'NOTIFICACION',

  'OTRO'

);

-- 2. SECUENCIA CORRELATIVA PARA EL CÓDIGO ÚNICO DE TRÁMITE (CUT)

CREATE SEQUENCE IF NOT EXISTS public.seq_cut START 1;

-- 3. TABLA DE UNIDADES ORGÁNICAS (ÁREAS)

CREATE TABLE public.areas (

  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  nombre TEXT NOT NULL UNIQUE,

  siglas VARCHAR(15) NOT NULL UNIQUE,

  activo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL

);

-- 4. TABLA DE PERFILES DE USUARIO (EXTENSIÓN DE auth.users)

CREATE TABLE public.perfiles (

  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  nombres TEXT NOT NULL,

  apellidos TEXT NOT NULL,

  dni VARCHAR(8) NOT NULL UNIQUE,

  correo TEXT NOT NULL UNIQUE,

  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,

  rol public.rol_usuario NOT NULL DEFAULT 'ESPECIALISTA',

  activo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  CONSTRAINT chk_admin_sin_area CHECK (

    (rol = 'ADMIN_TI' AND area_id IS NULL) OR

    (rol <> 'ADMIN_TI' AND area_id IS NOT NULL)

  )

);

-- 5. TABLA PRINCIPAL DE EXPEDIENTES

CREATE TABLE public.expedientes (

  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  cut TEXT UNIQUE, -- Formato: EXP-2026-000001-MDLO

  tipo_doc_remitente VARCHAR(10) NOT NULL DEFAULT 'DNI', -- DNI, RUC, CE

  remitente_dni_ruc VARCHAR(15) NOT NULL,

  remitente_nombres TEXT NOT NULL,

  telefono VARCHAR(20),

  correo TEXT,

  direccion TEXT,

  tipo_tramite public.tipo_documento_tramite NOT NULL DEFAULT 'FUT',

  asunto TEXT NOT NULL,

  folios INTEGER NOT NULL DEFAULT 1 CHECK (folios > 0),

  estado public.estado_expediente NOT NULL DEFAULT 'REGISTRADO',

  area_actual_id UUID NOT NULL REFERENCES public.areas(id),

  asignado_a UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,

  registrado_por UUID NOT NULL REFERENCES public.perfiles(id),

  fecha_creacion TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  fecha_actualizacion TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL

);

-- 6. TABLA DE TRAZABILIDAD (HOJA DE RUTA INMUTABLE)

CREATE TABLE public.trazabilidad (

  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  expediente_id UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,

  area_origen_id UUID REFERENCES public.areas(id),

  area_destino_id UUID NOT NULL REFERENCES public.areas(id),

  emisor_id UUID NOT NULL REFERENCES public.perfiles(id),

  receptor_id UUID REFERENCES public.perfiles(id),

  accion TEXT NOT NULL, -- 'REGISTRO', 'DERIVACIÓN', 'RECEPCIÓN', 'ASIGNACIÓN', 'OBSERVACIÓN', 'CIERRE'

  proveido TEXT NOT NULL,

  estado_previo public.estado_expediente,

  estado_nuevo public.estado_expediente NOT NULL,

  fecha_envio TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  fecha_recepcion TIMESTAMPTZ

);

-- 7. TABLA DE DOCUMENTOS ADJUNTOS (INICIALES E INTERMEDIOS)

CREATE TABLE public.adjuntos (

  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  expediente_id UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,

  area_id UUID NOT NULL REFERENCES public.areas(id),

  subido_por UUID NOT NULL REFERENCES public.perfiles(id),

  tipo_documento public.tipo_documento_tramite NOT NULL DEFAULT 'FUT',

  nombre_archivo TEXT NOT NULL,

  ruta_almacenamiento TEXT NOT NULL,

  tipo_mime TEXT NOT NULL DEFAULT 'application/pdf',

  peso_bytes INTEGER NOT NULL CHECK (peso_bytes > 0 AND peso_bytes <= 10485760),

  fecha_subida TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL

);

-- 8. ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS Y BANDEJAS

CREATE INDEX idx_expedientes_cut ON public.expedientes(cut);

CREATE INDEX idx_expedientes_area_estado ON public.expedientes(area_actual_id, estado);

CREATE INDEX idx_expedientes_remitente ON public.expedientes(remitente_dni_ruc);

CREATE INDEX idx_trazabilidad_expediente ON public.trazabilidad(expediente_id, fecha_envio DESC);

CREATE INDEX idx_adjuntos_expediente_area ON public.adjuntos(expediente_id, area_id);

-- 9. FUNCIONES Y TRIGGERS (BLINDADOS CONTRA EJECUCIÓN ANÓNIMA)

CREATE OR REPLACE FUNCTION public.generar_cut_expediente()

RETURNS TRIGGER

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = public

AS $$

BEGIN

  IF NEW.cut IS NULL OR NEW.cut = '' THEN

    NEW.cut := 'EXP-' || to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('public.seq_cut')::text, 6, '0') || '-MDLO';

  END IF;

  RETURN NEW;

END;

$$;

REVOKE EXECUTE ON FUNCTION public.generar_cut_expediente() FROM anon, authenticated, public;

CREATE TRIGGER trigger_generar_cut

BEFORE INSERT ON public.expedientes

FOR EACH ROW EXECUTE FUNCTION public.generar_cut_expediente();

CREATE OR REPLACE FUNCTION public.actualizar_fecha_modificacion()

RETURNS TRIGGER

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = public

AS $$

BEGIN

  NEW.fecha_actualizacion = timezone('utc'::text, now());

  RETURN NEW;

END;

$$;

REVOKE EXECUTE ON FUNCTION public.actualizar_fecha_modificacion() FROM anon, authenticated, public;

CREATE TRIGGER trigger_update_expedientes

BEFORE UPDATE ON public.expedientes

FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();

-- 10. VISTAS SEGURAS PARA CONSULTA PÚBLICA CIUDADANA (ROL anon)

CREATE OR REPLACE VIEW public.vista_consulta_ciudadana AS

SELECT

  e.id,

  e.cut,

  e.tipo_tramite,

  e.asunto,

  e.estado,

  a.nombre AS area_actual,

  a.siglas AS area_actual_siglas,

  e.fecha_creacion AS fecha_ingreso,

  e.fecha_actualizacion

FROM public.expedientes e

INNER JOIN public.areas a ON e.area_actual_id = a.id;

CREATE OR REPLACE VIEW public.vista_trazabilidad_ciudadana AS

SELECT

  t.id,

  t.expediente_id,

  t.accion,

  t.proveido,

  t.estado_nuevo,

  t.fecha_envio,

  t.fecha_recepcion,

  ao.nombre AS area_origen,

  ad.nombre AS area_destino

FROM public.trazabilidad t

LEFT JOIN public.areas ao ON t.area_origen_id = ao.id

INNER JOIN public.areas ad ON t.area_destino_id = ad.id;

GRANT SELECT ON public.vista_consulta_ciudadana TO anon, authenticated;

GRANT SELECT ON public.vista_trazabilidad_ciudadana TO anon, authenticated;

-- 11. SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS)

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.expedientes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.trazabilidad ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.adjuntos ENABLE ROW LEVEL SECURITY;

-- Políticas de Áreas

CREATE POLICY "Lectura de areas para autenticados" ON public.areas

  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestion de areas exclusiva ADMIN_TI" ON public.areas

  FOR ALL TO authenticated

  USING ((SELECT rol FROM public.perfiles WHERE id = auth.uid() AND activo = true) = 'ADMIN_TI')

  WITH CHECK ((SELECT rol FROM public.perfiles WHERE id = auth.uid() AND activo = true) = 'ADMIN_TI');

-- Políticas de Perfiles

CREATE POLICY "Lectura de perfiles para autenticados activos" ON public.perfiles

  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestion de perfiles exclusiva ADMIN_TI" ON public.perfiles

  FOR ALL TO authenticated

  USING ((SELECT rol FROM public.perfiles WHERE id = auth.uid() AND activo = true) = 'ADMIN_TI')

  WITH CHECK ((SELECT rol FROM public.perfiles WHERE id = auth.uid() AND activo = true) = 'ADMIN_TI');

-- Políticas de Expedientes

CREATE POLICY "Ver expedientes de su area o historicos del area" ON public.expedientes

  FOR SELECT TO authenticated

  USING (

    area_actual_id = (SELECT area_id FROM public.perfiles WHERE id = auth.uid() AND activo = true)

    OR registrado_por = auth.uid()

    OR EXISTS (

      SELECT 1 FROM public.trazabilidad t

      WHERE t.expediente_id = expedientes.id

        AND (t.area_origen_id = (SELECT area_id FROM public.perfiles WHERE id = auth.uid())

             OR t.area_destino_id = (SELECT area_id FROM public.perfiles WHERE id = auth.uid()))

    )

  );

CREATE POLICY "Insertar expediente exclusivo MESA_PARTES activo" ON public.expedientes

  FOR INSERT TO authenticated

  WITH CHECK (

    (SELECT rol FROM public.perfiles WHERE id = auth.uid() AND activo = true) = 'MESA_PARTES'

  );

CREATE POLICY "Actualizar expediente por personal activo del area actual" ON public.expedientes

  FOR UPDATE TO authenticated

  USING (

    area_actual_id = (SELECT area_id FROM public.perfiles WHERE id = auth.uid() AND activo = true)

  )

  WITH CHECK (true);

-- Políticas de Trazabilidad (Inmutable: solo SELECT, INSERT y UPDATE de recepción)

CREATE POLICY "Ver trazabilidad a usuarios autenticados activos" ON public.trazabilidad

  FOR SELECT TO authenticated

  USING ((SELECT activo FROM public.perfiles WHERE id = auth.uid()) = true);

CREATE POLICY "Insertar trazabilidad a usuarios autenticados activos" ON public.trazabilidad

  FOR INSERT TO authenticated

  WITH CHECK (

    emisor_id = auth.uid() AND

    (SELECT activo FROM public.perfiles WHERE id = auth.uid()) = true

  );

CREATE POLICY "Actualizar recepcion en trazabilidad" ON public.trazabilidad

  FOR UPDATE TO authenticated

  USING (

    area_destino_id = (SELECT area_id FROM public.perfiles WHERE id = auth.uid() AND activo = true)

  )

  WITH CHECK (true);

-- Políticas de Adjuntos

CREATE POLICY "Ver adjuntos a usuarios autenticados activos" ON public.adjuntos

  FOR SELECT TO authenticated

  USING ((SELECT activo FROM public.perfiles WHERE id = auth.uid()) = true);

CREATE POLICY "Subir adjuntos por personal activo del area" ON public.adjuntos

  FOR INSERT TO authenticated

  WITH CHECK (

    subido_por = auth.uid() AND

    area_id = (SELECT area_id FROM public.perfiles WHERE id = auth.uid() AND activo = true)

  );

-- 12. SEMILLA INICIAL DE UNIDADES ORGÁNICAS OFICIALES (ORGANIGRAMA MDLO)

INSERT INTO public.areas (nombre, siglas) VALUES

  ('Oficina de Atención al Ciudadano y Gestión Documental (Mesa de Partes)', 'OACGD-MDP'),

  ('Gerencia de Desarrollo Urbano', 'GDU'),

  ('Subgerencia de Obras Privadas y Control Urbano', 'SGOPCU'),

  ('Subgerencia de Fiscalización Administrativa', 'SGFA'),

  ('Oficina General de Asesoría Jurídica', 'OGAJ');
