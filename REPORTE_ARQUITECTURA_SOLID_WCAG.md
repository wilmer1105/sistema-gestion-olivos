# Reporte de Auditoría Arquitectónica SOLID, Accesibilidad Web (WCAG 2.1/2.2 AA) y Automatización QA

**Proyecto:** Sistema de Trámite Documentario Municipal — MDLO Docs  
**Estándares Evaluados:** Clean Architecture, Principios SOLID, TypeScript Estricto (`no-explicit-any`), WCAG 2.1/2.2 Nivel AA (axe-core, WAVE, Lighthouse), TDD/BDD (Vitest + Cucumber)

---

## 1. Auditoría Arquitectónica y Refactorización SOLID (Fase 1)

### 1.1 Principio de Responsabilidad Única (SRP)
* **Diagnóstico (Violaciones Detectadas):**
  - Los módulos de Server Actions en `app/actions/expedientes.ts`, `app/actions/bandeja.ts` y `app/actions/admin.ts` concentraban hasta 6 responsabilidades en una misma función: (1) extracción y sanitización de `FormData`, (2) validación de reglas de negocio, (3) control de permisos RBAC, (4) subida binaria a Supabase Storage, (5) mutación de tablas en PostgreSQL y (6) inserción de eventos en `trazabilidad`.
* **Solución Aplicada:**
  - [`lib/services/ExpedienteValidator.ts`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/lib/services/ExpedienteValidator.ts): Clase dedicada exclusivamente a validar reglas de negocio de radicación, derivación, cierre, archivos adjuntos y construcción de asuntos descriptivos.
  - [`lib/services/EmpleadoAdminService.ts`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/lib/services/EmpleadoAdminService.ts): Clase `EmpleadoAdminValidator` dedicada a validar altas/actualizaciones de personal y resolver áreas de adscripción según el rol.
  - [`lib/services/StorageService.ts`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/lib/services/StorageService.ts): Clase dedicada a sanitizar nombres de archivo, construir rutas deterministas, subir binarios mediante `IStorageProvider` y registrar metadatos mediante `IAdjuntoRepository`.
  - [`lib/services/TrazabilidadLogger.ts`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/lib/services/TrazabilidadLogger.ts): Servicio enfocado exclusivamente en el registro de hitos de auditoría en la hoja de ruta (`REGISTRO_INICIAL`, `ANEXO_DOCUMENTAL`, etc.).
  - [`lib/services/ExpedienteService.ts`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/lib/services/ExpedienteService.ts): Orquestador de dominio limpio para los casos de uso (`radicarExpediente`, `recepcionarExpediente`, `derivarExpediente`, `finalizarExpediente`, `anexarDocumentosIntermedios`).

### 1.2 Principios Abierto/Cerrado (OCP) y Sustitución de Liskov (LSP)
* **Diagnóstico (Violaciones Detectadas):**
  - Existían condicionales rígidos (`if (rol !== 'JEFE_AREA' && ...)` y `if (rol === 'ADMIN_TI')`) dispersos en `app/actions/expedientes.ts` y `app/actions/admin.ts`.
  - Las transiciones de estado (`REGISTRADO` -> `RECEPCIONADO` -> `DERIVADO` -> `ATENDIDO` / `ARCHIVADO`) estaban codificadas de forma procedural en múltiples archivos sin un contrato común.
* **Solución Aplicada:**
  - [`lib/domain/policies/PoliticaPermisoRol.ts`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/lib/domain/policies/PoliticaPermisoRol.ts): Jerarquía polimórfica liderada por la clase abstracta `PoliticaPermisoRol` y sus subtipos concretos (`PoliticaMesaPartes`, `PoliticaEspecialista`, `PoliticaJefeArea`, `PoliticaAdminTI`, `PoliticaFuncionario`) gestionados por `PoliticaPermisoRolFactory`. Permite registrar nuevas políticas en tiempo de ejecución (`registrarPolitica`) sin modificar el código existente (**OCP**) y garantiza que cualquier subclase sustituya a la base devolviendo siempre un `ResultadoAutorizacion` determinista (**LSP**).
  - [`lib/domain/handlers/AccionExpedienteHandler.ts`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/lib/domain/handlers/AccionExpedienteHandler.ts): Clase base abstracta `AccionExpedienteHandler` con el método plantilla `ejecutar()` e implementaciones polimórficas `RegistroInicialHandler`, `RecepcionHandler`, `DerivacionHandler` y `CierreExpedienteHandler`.

### 1.3 Principios de Segregación de Interfaces (ISP) e Inversión de Dependencias (DIP)
* **Diagnóstico (Violaciones Detectadas):**
  - Acoplamiento directo al cliente concreto de Supabase (`createClient()`) dentro de la lógica de negocio y uso masivo de `as any` (más de 65 ocurrencias) debido a interfaces monolíticas e incompletas.
  - Componentes como `BandejaTable.tsx` recibían `data: any[]` en lugar de un contrato de lectura acotado.
* **Solución Aplicada:**
  - **ISP** ([`lib/domain/contracts/expediente.contracts.ts`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/lib/domain/contracts/expediente.contracts.ts)): Segregación en contratos cohesivos: `IExpedienteIdentidad`, `IExpedienteLectura`, `IExpedienteDetalle`, `IExpedienteRadicacion`, `IExpedienteRecepcion`, `IExpedienteDerivacion`, `IExpedienteCierre`, `IArchivoAdjuntoInput`, `IAdjuntoRegistro`, `ITrazabilidadRegistro`, `IConsultaCiudadanaExpediente` e `IConsultaCiudadanaMovimiento`.
  - **DIP** ([`lib/domain/repositories/expediente.repository.ts`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/lib/domain/repositories/expediente.repository.ts) y [`lib/infrastructure/supabase/SupabaseRepositories.ts`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/lib/infrastructure/supabase/SupabaseRepositories.ts)): Creación de las abstracciones `IExpedienteRepository`, `ITrazabilidadRepository`, `IAdjuntoRepository` e `IStorageProvider`, junto con sus adaptadores concretos para Supabase (`SupabaseExpedienteRepository`, `SupabaseTrazabilidadRepository`, `SupabaseAdjuntoRepository`, `SupabaseStorageProvider`) y dobles de prueba en memoria (`MockExpedienteRepository`, `MockTrazabilidadRepository`, `MockAdjuntoRepository`, `MockStorageProvider`).
  - Eliminación del **100% de usos de `any`** en todo el repositorio (`0` ocurrencias).

---

## 2. Auditoría y Remediación de Accesibilidad Web (WCAG 2.1/2.2 AA - Fase 2)

| Componente | Hallazgos Detectados (WCAG / axe / WAVE / Lighthouse) | Mejoras de Accesibilidad Aplicadas |
| :--- | :--- | :--- |
| [`Navbar.tsx`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/components/shared/Navbar.tsx) | `<header>` sin `role="banner"` ni `aria-label`; texto secundario con bajo contraste (`text-slate-500`). | Se añadió `role="banner"`, `aria-label="Barra superior institucional"`, etiqueta de grupo para unidad orgánica/cargo y mejora de contraste a `text-slate-600`. |
| [`Sidebar.tsx`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/components/shared/Sidebar.tsx) | Enlaces sin `aria-current="page"`; `<aside>` y `<nav>` sin `aria-label`; íconos sin `aria-hidden="true"`; pie de página `text-slate-400` con ratio ~2.5:1 (falla WCAG 1.4.3 AA). | Se agregó `aria-label` en `<aside>` y `<nav>`, `aria-current={isActive ? 'page' : undefined}`, `aria-hidden="true"` en íconos y contraste `text-slate-600` (>5.7:1). |
| [`BandejaTable.tsx`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/components/modules/bandeja/BandejaTable.tsx) | Tabla sin `<caption>` ni `scope="col"`; badge `DERIVADO` con `bg-amber-500 text-white` (ratio 2.15:1, falla WCAG 1.4.3); botones de fila ambiguos ("Recibir", "Ver Detalle") sin contexto del CUT (WCAG 2.4.4). | Se añadió `<caption className="sr-only">`, `scope="col"` en cabeceras, `bg-amber-700 text-white` (ratio >5.0:1), `role="alert"`/`aria-live` en banners y `aria-label` con el CUT en cada botón de acción. |
| [`ExpedienteCreateForm.tsx`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/components/modules/expedientes/ExpedienteCreateForm.tsx) | Zona de arrastrar/soltar archivos implementada con `<div>` no enfocable por teclado (falla crítica WCAG 2.1.1); `<input type="file">` sin `id` asociado a `<Label>`; botón de eliminar archivo sin `aria-label` con el nombre del documento. | Se añadió `role="button"`, `tabIndex={0}`, manejador `onKeyDown` (`Enter`/`Space`), `aria-describedby`, asociación `<Label htmlFor="archivos_adjuntos">`, `aria-required="true"` y `aria-label` específico por archivo. |
| [`DerivacionModal.tsx`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/components/modules/expedientes/DerivacionModal.tsx) | `<Label>` sin `htmlFor`; `<SelectTrigger>` y `<Textarea>` sin `id`, `aria-invalid` ni `aria-describedby` vinculado a los mensajes de error (falla WCAG 1.3.1 y 3.3.1). | Se vinculó `<Label htmlFor="area_destino_id">` y `<Label htmlFor="proveido">`, se añadieron `aria-invalid`, `aria-required="true"`, `aria-describedby` e identificadores `role="alert"` en errores. |
| [`PdfViewerModal.tsx`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/components/shared/PdfViewerModal.tsx) | Botón disparador genérico ("Ver") sin identificar el archivo adjunto; enlace externo sin `noopener` ni `aria-label` descriptivo. | Se añadió `aria-label="Ver documento adjunto {nombreArchivo}"`, `rel="noopener noreferrer"` y `title`/`aria-label` descriptivos en el `<iframe>`. |
| [`ConsultaTracker.tsx`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/components/modules/consulta/ConsultaTracker.tsx) | Campo de búsqueda CUT sin `<Label>` asociado (falla axe/Lighthouse `label`); errores sin `role="alert"`; línea de tiempo construida con `<div>` en lugar de lista ordenada semántica `<ol>`. | Se agregó `<Label htmlFor="cut-search-input" className="sr-only">`, `role="search"`, `aria-invalid`, `aria-describedby`, región `aria-live="polite"` para resultados y estructura semántica `<ol>` / `<li>`. |

---

## 3. Resultados de Pruebas Automatizadas (Fase 3)

### 3.1 Verificación Estática de Tipos (`npx tsc --noEmit`)
* **Estado:** `0 errores` (Compilación limpia en modo `strict: true` y `noImplicitAny: true`).
* **Uso de `any`:** `0 ocurrencias` en `app/`, `lib/`, `components/`, `types/` y `tests/`.

### 3.2 Pruebas Unitarias y SOLID con Vitest (`npm run test:unit`)
* **Archivos ejecutados:**
  - [`tests/unit/solid.test.ts`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/tests/unit/solid.test.ts) (8 suites/tests: SRP en validadores/servicios, OCP/LSP polimórfico en políticas y manejadores, DIP/ISP con `MockExpedienteRepository`).
  - [`tests/unit/accessibility.test.ts`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/tests/unit/accessibility.test.ts) (7 tests de cumplimiento estructural WCAG 2.1 AA en los componentes UI).
* **Resultado:** `2 passed (2 test files)`, `15 passed (15 tests)`.

### 3.3 Pruebas BDD de Aceptación con Cucumber (`npm run test:bdd`)
* **Archivos ejecutados:**
  - [`tests/features/rbac_y_flujo_expedientes.feature`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/tests/features/rbac_y_flujo_expedientes.feature)
  - [`tests/features/step_definitions/expedientes.steps.ts`](file:///home/wilmerabanto/Proyectos/sistema-gestion-olivos/tests/features/step_definitions/expedientes.steps.ts)
* **Resultado:** `5 scenarios (5 passed)`, `38 steps (38 passed)`.
