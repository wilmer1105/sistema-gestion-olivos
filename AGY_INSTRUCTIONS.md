# Contexto del Proyecto: Sistema de Trámite Documentario Municipal (MDLO)

## 1. Stack Tecnológico y Reglas Base
- **Framework:** Next.js (App Router), React, TypeScript.
- **UI:** Tailwind CSS, Shadcn UI, Lucide React.
- **Base de Datos & Auth:** Supabase.
- **Regla de Ejecución (AGY):** Eres un agente autónomo. NO pidas permiso para ejecutar comandos, leer o editar archivos. Asume las mejores prácticas de Next.js. Si hay errores, captúralos (try/catch) y muéstralos en UI.

## 2. Estructura de Base de Datos
- **expedientes:** `id`, `cut`, `remitente_nombres`, `asunto`, `estado` (Enum: REGISTRADO, EN_TRAMITE, DERIVADO, RECEPCIONADO, OBSERVADO, ATENDIDO, ARCHIVADO), `area_actual_id`.
- **adjuntos:** `id`, `expediente_id`, `nombre_archivo`, `ruta_almacenamiento`.
- **trazabilidad:** `id`, `expediente_id`, `area_origen_id`, `area_destino_id`, `accion`, `estado_nuevo`, `fecha`.
- **areas:** `id`, `nombre`.
- **perfiles / usuarios:** Relacionado a `auth.users`, contiene `rol` (Enum: ADMIN_TI, MESA_PARTES, ESPECIALISTA, JEFE_AREA) y `area_id`.

## 3. Reglas Críticas de Código
- **Supabase Server Actions:** Siempre encadenar `.select()` en INSERT/UPDATE. Verificar si hay fallo silencioso por RLS (`!data || data.length === 0`).
- **Refresco de UI:** Siempre usar `revalidatePath` después de una mutación exitosa.
- **Archivos (Storage):** Subir a bucket 'documentos', extraer URL pública (`getPublicUrl`), mapear a la columna `ruta_almacenamiento`.

## 4. Roadmap de Implementación (Pendientes)

**Fase 1: Módulo de Seguridad y Administración (OTI)**
- [x] Crear pantalla `/dashboard/admin` (solo accesible por rol ADMIN / ADMIN_TI).
- [x] Implementar gestión de empleados: Formulario para crear usuario con datos completos (`nombres`, `apellidos`, `dni`, `email`, `password`, `rol`, `area_id`).
- [x] Edición de empleados: Modal para editar `nombres`, `apellidos`, `dni`, `rol` y `area_id`.
- [x] Desactivación lógica: Acción para alternar estado (`activo` true/false: Activo / Dado de baja).
- [x] Pantalla `/forgot-password` (Recuperación).
- [x] Reglas reactivas de roles:
  - `MESA_PARTES`: Área forzada y bloqueada en Mesa de Partes.
  - `ADMIN_TI`: Área forzada a `null`, bloqueada ("No aplica / Global").
  - `ESPECIALISTA` / `JEFE_AREA`: Selección libre de área institucional.

**Fase 2: Vistas Dinámicas por Área (Flujo de Trabajo)**
- [ ] **Filtro de Bandeja:** La bandeja de entrada DEBE filtrar automáticamente `expedientes` donde `area_actual_id` coincida con el `area_id` del usuario logueado.
- [ ] **Bandeja de Salida:** Vista para ver los trámites que el área ya derivó.
- [ ] **Subida Intermedia de Documentos:** En la pantalla 'Ver / Atender', las áreas internas deben poder subir nuevos archivos adjuntos (Ej. Informes, Resoluciones) al expediente *antes* de derivarlo o finalizarlo.

**Fase 3: Cierre y Consulta Pública**
- [ ] **Botones de Cierre:** Permitir cambiar el estado a 'ATENDIDO' o 'ARCHIVADO' para finalizar el trámite.
- [ ] **Consulta Pública (`/consulta`):** Actualizar la vista para que el ciudadano vea la línea de tiempo real extraída de la tabla `trazabilidad`.

## 5. Matriz de Permisos (RBAC)
- **ADMIN_TI:** Solo acceso al `/dashboard/admin`. No opera expedientes.
- **MESA_PARTES:** Puede crear expedientes y derivar. NUNCA debe ver los botones de 'Finalizar' o 'Archivar'.
- **ESPECIALISTA:** Puede recibir, adjuntar documentos internos y derivar.
- **JEFE_AREA:** Puede hacer lo del Especialista y es el ÚNICO autorizado para ver y usar los botones de cambiar estado a 'ATENDIDO' o 'ARCHIVADO'.

