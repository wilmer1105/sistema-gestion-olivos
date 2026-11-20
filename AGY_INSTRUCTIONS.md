## Skills Locales Activas
Consulta e implementa estrictamente los lineamientos de las skills ubicadas en `.agents/skills/`:
- `typescript-advanced-types`: Reglas de tipado estricto, genéricos y eliminación total de `any`.
- `supabase-postgres-best-practices`: Políticas RLS seguras, transacciones y diseño de esquemas en Supabase.
- `clerk-nextjs-patterns`: Patrones de autenticación y middleware para Next.js App Router (o referencia de sesión).
# Contexto Maestro del Proyecto: Sistema de Gestión Documental Municipal (SISGESDOC - MDLO)

## 1. Stack Tecnológico y Reglas Base
- **Framework:** Next.js 16+ (App Router), React 19, TypeScript 5+ (`strict: true`, `noImplicitAny: true`).
- **UI & Accesibilidad:** Tailwind CSS v4, Shadcn UI, Lucide React, Cumplimiento WCAG 2.1 AA.
- **Base de Datos, Auth & Storage:** Supabase (PostgreSQL 15+, RLS activo, Auth SSR, Storage Bucket `documentos`).
- **Testing:** Vitest (Pruebas Unitarias) + Cucumber.js (Pruebas BDD en Gherkin Español).
- **Directiva de Ejecución Autónoma (AGY):** Ejecución 100% autónoma, incremental y sin uso de `any` (`@typescript-eslint/no-explicit-any`).

---

## 2. Unidades Orgánicas Oficiales (`public.areas`)
- `OACGD-MDP`: Oficina de Atención al Ciudadano y Gestión Documental (Mesa de Partes)
- `GDU`: Gerencia de Desarrollo Urbano
- `SGOPCU`: Subgerencia de Obras Privadas y Control Urbano
- `SGFA`: Subgerencia de Fiscalización Administrativa
- `OGAJ`: Oficina General de Asesoría Jurídica

---

## 3. Estructura de Base de Datos (5 Tablas y 2 Vistas)
1. **`public.areas`**: `id`, `nombre`, `siglas`, `activo`, `created_at`.
2. **`public.perfiles`**: `id` (FK `auth.users`), `nombres`, `apellidos`, `dni` (8 dígitos), `correo`, `rol` (`rol_usuario`), `area_id` (FK `areas`, `NULL` para `ADMIN_TI`), `activo` (`boolean`), `created_at`.
3. **`public.expedientes`**: `id`, `cut` (generado por trigger `EXP-YYYY-NNNNNN-MDLO`), `tipo_doc_remitente` (`DNI` | `RUC` | `CE`), `remitente_dni_ruc`, `remitente_nombres`, `telefono`, `correo`, `direccion`, `tipo_tramite` (`tipo_documento_tramite`), `asunto`, `folios`, `estado` (`estado_expediente`), `area_actual_id`, `asignado_a` (FK `perfiles`), `registrado_por` (FK `perfiles`), `fecha_creacion`, `fecha_actualizacion`.
4. **`public.trazabilidad`**: `id`, `expediente_id`, `area_origen_id`, `area_destino_id`, `emisor_id`, `receptor_id`, `accion`, `proveido`, `estado_previo`, `estado_nuevo`, `fecha_envio`, `fecha_recepcion`.
5. **`public.adjuntos`**: `id`, `expediente_id`, `area_id`, `subido_por`, `tipo_documento` (`tipo_documento_tramite`), `nombre_archivo`, `ruta_almacenamiento`, `tipo_mime`, `peso_bytes`, `fecha_subida`.
6. **Vistas Públicas Anonimizadas (RNF-03)**:
   - `public.vista_consulta_ciudadana`: Expone `id`, `cut`, `tipo_tramite`, `asunto`, `estado`, `fecha_ingreso`, `fecha_actualizacion`, `area_actual`, `area_actual_siglas` (oculta DNI, teléfono, correo y dirección del ciudadano).
   - `public.vista_trazabilidad_ciudadana`: Expone `id`, `expediente_id`, `accion`, `proveido`, `estado_nuevo`, `area_origen`, `area_destino`, `fecha`, `fecha_envio`, `fecha_recepcion`.

---

## 4. Actores, Roles (`public.rol_usuario`) y Matriz RBAC con Aislamiento por `area_id`
1. **Ciudadano / Administrado (`anon`)**:
   - Sin sesión (`area_id = null`). Consulta pública por CUT en `/consulta` vía `vista_consulta_ciudadana` y `vista_trazabilidad_ciudadana`.
2. **Operador de Mesa de Partes (`MESA_PARTES`)**:
   - `area_id` fijo en Mesa de Partes (`OACGD-MDP`).
   - Exclusivo para radicar expedientes iniciales (generando CUT y subiendo PDF inicial), ver bandeja de Mesa de Partes, recepcionar devoluciones y realizar la primera derivación. No puede finalizar expedientes.
3. **Asistente / Receptor Documental de Área (`ASISTENTE_AREA`)**:
   - Rol transversal en gerencias/subgerencias (`GDU`, `SGOPCU`, `SGFA`, `OGAJ`).
   - Puede ver bandeja de su `area_id`, acusar recepción (`DERIVADO` -> `RECEPCIONADO`), asignar internamente a un `ESPECIALISTA` de su misma área (`RECEPCIONADO` -> `EN_TRAMITE`), subir cargos/notificaciones PDF y derivar por encargo con proveído. No puede finalizar expedientes.
4. **Especialista / Asesor Técnico-Legal (`ESPECIALISTA`)**:
   - Rol transversal en gerencias/subgerencias.
   - Puede ver bandeja de su `area_id`, previsualizar PDFs, adjuntar documentos sustentatorios intermedios (`INFORME_TECNICO`, `INFORME_LEGAL`, `ACTA_FISCALIZACION`) agrupados bajo su `area_id`, observar expedientes (`OBSERVADO`) y derivar/elevar con proveído. No puede finalizar expedientes.
5. **Jefe de Área / Autoridad Resolutiva (`JEFE_AREA`)**:
   - Presente en cada unidad orgánica.
   - Puede realizar todas las operaciones de su área (ver bandeja, recepcionar, asignar especialista, adjuntar `RESOLUCION` o informes, derivar) + **Potestad Exclusiva** de finalizar/cerrar el expediente cambiando su estado a `ATENDIDO` o `ARCHIVADO` con proveído de cierre.
6. **Administrador del Sistema OGTIC (`ADMIN_TI`)**:
   - Rol global con `area_id = NULL` obligatorio (`chk_admin_sin_area`).
   - Exclusivamente gestiona el catálogo de áreas y el CRUD de usuarios en `/dashboard/admin` (Crear, Editar, Asignar Rol/Área con regla reactiva y Baja Lógica `activo: boolean`). No tramita ni finaliza expedientes.

---

## 5. Directrices Estrictas de Ingeniería de Software
1. **Prohibición de `any`:** Queda estrictamente prohibido usar `any` o `as any`. Usar siempre los tipos exportados de `types/database.types.ts` y validación en tiempo de ejecución con **Zod**.
2. **React Server Components (RSC):** Componentes de servidor por defecto; `'use client'` solo en hojas interactivas.
3. **Mutaciones Seguras en Supabase (RNF-06):** Toda operación `INSERT` o `UPDATE` debe encadenar `.select()` y verificar `!data || data.length === 0` para detectar bloqueos silenciosos por RLS. Invocar siempre `revalidatePath` tras mutaciones exitosas.
4. **Aislamiento de Credenciales:** Jamás exponer `SUPABASE_SERVICE_ROLE_KEY` en el cliente ni en la consulta ciudadana pública (`/consulta`). Usarla únicamente en el servidor (`app/actions/admin.ts`) para administración de cuentas en `auth.admin`.
5. **Accesibilidad Web (WCAG 2.1 AA):** Uso de HTML semántico (`<header role="banner">`, `<nav>`, `<main>`, `<ol>`), atributos `aria-label`, `aria-invalid`, `aria-describedby`, asociación `<Label htmlFor>` con `<Input id>` y contraste mínimo 4.5:1.
