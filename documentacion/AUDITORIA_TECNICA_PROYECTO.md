# AUDITORÍA TÉCNICA DEL PROYECTO
**Sistema de Gestión Documental y Trámite Municipal — Municipalidad de Los Olivos (MDLO Docs)**  
*Documento de Inspección Técnica de Código, Arquitectura y Calidad de Software*

---

## 1. INFORMACIÓN GENERAL

* **Nombre del proyecto:** `sistema-gestion-olivos` (Nombre comercial/institucional en interfaz: **MDLO Docs** / *Sistema de Gestión Documental — Municipalidad de Los Olivos*).
* **Tipo de aplicación:** Aplicación Web Empresarial Full-Stack con arquitectura híbrida (Server-Side Rendering, React Server Components y Server Actions transaccionales acoplados a componentes cliente interactivos).
* **Propósito:** Gestión, registro, seguimiento, asignación por áreas, derivación interdepartamental, anexión de recaudos digitales, resolución/archivamiento y fiscalización pública del ciclo de vida de expedientes y trámites administrativos de la Municipalidad de Los Olivos mediante la generación de un Código Único de Trámite (CUT).
* **Framework:** Next.js versión `16.3.7` utilizando el paradigma **App Router** (`app/`), compilador **Turbopack** y soporte para **React 19 Server Actions**.
* **Lenguaje(s):** TypeScript `^5` (estricto en `tsconfig.json`), JavaScript moderno (ESM / Node.js).
* **Versión de Node.js:** Ejecutado sobre entorno Node.js `v24.14.1` (con tipado base `@types/node: ^20` definido en devDependencies).
* **Gestor de paquetes:** `npm` (evidenciado por la presencia de `package-lock.json` con árbol de resolución de 367 KB).
* **Dependencias principales:**
  * `next` (`16.3.7`): Framework base full-stack para SSR, enrutamiento dinámico y server actions.
  * `react` / `react-dom` (`19.2.8`): Biblioteca base para interfaz de usuario declarativa con React Server Components.
  * `@supabase/ssr` (`^0.12.7`): Adaptador de Supabase para App Router con manejo seguro de sesiones en cookies HTTP-only.
  * `@supabase/supabase-js` (`^2.117.2`): Cliente isomórfico oficial de Supabase para PostgreSQL, Auth y Storage.
  * `zod` (`^4.6.5`): Validación estricta de esquemas de datos tanto en cliente como en servidor.
  * `react-hook-form` (`^7.89.0`) + `@hookform/resolvers` (`^5.9.1`): Manejo reactivo de formularios con validación desacoplada.
  * `date-fns` (`^4.4.0`): Manipulación, cálculo y formateo de fechas con localización en español (`es`).
  * `lucide-react` (`^1.48.0`): Iconografía vectorial para interfaces de usuario.
  * `tailwindcss` (`^4`) + `@tailwindcss/postcss` (`^4`): Motor de estilos utilitarios CSS de última generación.
  * `class-variance-authority`, `clsx`, `tailwind-merge`: Utilidades para combinación dinámica y variante condicional de clases CSS.
  * `@base-ui/react` (`^1.8.0`), `@radix-ui/react-slot`, `@radix-ui/react-label`: Primitivas accesibles y headless UI para Shadcn UI.
* **Herramientas de desarrollo:** TypeScript Compiler (`tsc`), ESLint `^9` con `eslint-config-next`, PostCSS.
* **Sistema de autenticación:** Supabase Auth (flujo basado en contraseñas cifradas y JWT administrado en cookies de sesión HTTP-only mediante middleware de Next.js), enlazado con la tabla relacional `public.perfiles`.
* **Servicios externos:** Supabase Cloud Platform (PostgreSQL Database Engine, Supabase GoTrue Auth Service, Supabase Storage Bucket).
* **Base de datos:** PostgreSQL relacional hospedado en Supabase, implementando Row Level Security (RLS), triggers de auditoría y Vistas SQL de aislamiento ciudadano.
* **Servicio de almacenamiento:** Supabase Storage (Bucket parametrizado `documentos` para almacenamiento de archivos PDF y adjuntos documentales).
* **Sistema de despliegue:** Preparado para Vercel Platform / Docker Container / Node.js Server (`npm run build` genera bundle optimizado estático y funciones dinámicas bajo el runtime Node.js).

---

## 2. TECNOLOGÍAS

| Tecnología | Categoría | Propósito en el Proyecto |
| :--- | :--- | :--- |
| **Next.js 16.3.7** | Framework Web Full-Stack | Orquestador central de la aplicación. Maneja el enrutamiento (`app/`), renderizado en servidor (SSR), Server Components y Backend-for-Frontend mediante Server Actions. |
| **React 19.2.8** | Biblioteca UI | Provee el motor de reconciliación declarativa, transiciones concurrentes (`useTransition`) y soporte nativo para Server Actions. |
| **TypeScript 5.x** | Lenguaje de Programación | Aporta tipado estático estricto, interfaces de base de datos (`database.types.ts`) y prevención de errores en tiempo de compilación. |
| **Supabase SSR** | Autenticación y Middleware | Sincroniza y renueva tokens de sesión JWT entre cliente, servidor y middleware mediante cookies seguras. |
| **Supabase Client JS** | Conector Backend / DB | Permite la ejecución de queries relacionales a PostgreSQL, llamadas RPC, interacción con Storage y gestión de usuarios. |
| **Tailwind CSS v4** | Motor de Estilos | Implementa el diseño visual responsive, paleta semántica institucional y utilitarios de diseño. |
| **Shadcn UI / Radix / Base UI** | Componentes Headless | Provee componentes de interfaz accesibles (WAI-ARIA) como diálogos modales, selectores, tablas, alertas y pestañas. |
| **Zod v4** | Esquemas y Validación | Garantiza la integridad de datos validando los formularios en el cliente y protegiendo los Server Actions en el backend. |
| **React Hook Form** | Gestión de Formularios | Controla el ciclo de vida de los formularios en cliente con mínimo re-renderizado y vinculación con esquemas Zod. |
| **Date-fns v4** | Manejo de Fechas | Formatea marcas temporales UTC a formatos legibles oficiales (ej: `"dd MMM yyyy - hh:mm a"`) con localización en español. |
| **Lucide React** | Iconografía | Iconos vectoriales para estados de expedientes, navegación lateral, acciones y alertas visuales. |

---

## 3. ESTRUCTURA DEL PROYECTO

### Árbol Simplificado del Repositorio

```text
sistema-gestion-olivos/
├── app/
│   ├── (auth)/
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── login/
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── actions/
│   │   ├── admin.ts
│   │   ├── auth.ts
│   │   ├── bandeja.ts
│   │   ├── consulta.ts
│   │   ├── derivaciones.ts
│   │   └── expedientes.ts
│   ├── consulta/
│   │   └── page.tsx
│   ├── dashboard/
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   ├── bandeja/
│   │   │   └── page.tsx
│   │   ├── consulta/
│   │   │   └── page.tsx
│   │   ├── expedientes/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── nuevo/
│   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── admin/
│   │   ├── CrearEmpleadoDialog.tsx
│   │   ├── EditarEmpleadoDialog.tsx
│   │   └── EmpleadosTable.tsx
│   ├── expedientes/
│   │   └── FinalizarExpedienteModal.tsx
│   ├── modules/
│   │   ├── bandeja/
│   │   │   ├── BandejaFiltros.tsx
│   │   │   ├── BandejaPaginacion.tsx
│   │   │   ├── BandejaTable.tsx
│   │   │   └── BandejaTabsNav.tsx
│   │   ├── consulta/
│   │   │   └── ConsultaTracker.tsx
│   │   └── expedientes/
│   │       ├── DerivacionModal.tsx
│   │       ├── ExpedienteCreateForm.tsx
│   │       ├── FinalizarExpedienteModal.tsx
│   │       └── SubirDocumentosDialog.tsx
│   ├── shared/
│   │   ├── BackButton.tsx
│   │   ├── Navbar.tsx
│   │   ├── PdfViewerModal.tsx
│   │   ├── Sidebar.tsx
│   │   └── UserProfileMenu.tsx
│   └── ui/
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── toast.tsx
├── documentacion/
│   └── AUDITORIA_TECNICA_PROYECTO.md
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── middleware.ts
│   │   └── server.ts
│   ├── validators/
│   │   ├── admin.schema.ts
│   │   ├── auth.schema.ts
│   │   ├── derivacion.schema.ts
│   │   └── expediente.schema.ts
│   └── utils.ts
├── public/
├── types/
│   └── database.types.ts
├── middleware.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

### Descripción de Directorios Principales

* **`app/`**: Enrutador principal de Next.js (App Router). Agrupa páginas del servidor, layouts jerárquicos y grupos de rutas (`(auth)` para login/recuperación, `dashboard` para la intranet administrativa y `consulta` para acceso ciudadano libre).
* **`app/actions/`**: Capa de Servicios del Servidor (*Server Actions*). Contiene toda la lógica de negocio, validaciones de backend, transacciones a Supabase, control RBAC y llamadas de revalidación de caché (`revalidatePath`).
* **`components/admin/`**: Componentes visuales y de interacción específicos del módulo OTI (diálogos de creación/edición de empleados y tabla de gestión).
* **`components/modules/`**: Componentes modulares de negocio segregados por dominio funcional (`bandeja`, `expedientes`, `consulta`).
* **`components/shared/`**: Componentes globales reutilizables (Navegación lateral `Sidebar`, barra superior `Navbar`, botón de retroceso `BackButton`, modal visor de PDF `PdfViewerModal` y menú de usuario `UserProfileMenu`).
* **`components/ui/`**: Catálogo de primitivas de interfaz accesibles construidas sobre Shadcn UI y Tailwind CSS.
* **`lib/supabase/`**: Clientes de inicialización de Supabase con aislamiento contextual: navegador (`client.ts`), servidor con cookies (`server.ts`) y middleware de sesión (`middleware.ts`).
* **`lib/validators/`**: Esquemas de validación declarativa escritos con Zod para el tipado y validación bidireccional cliente-servidor.
* **`types/`**: Definiciones de tipos TypeScript generadas a partir del esquema de base de datos relacional de Supabase (`database.types.ts`).

---

## 4. ARQUITECTURA

### Diagrama Arquitectónico Conceptual

```text
+-----------------------------------------------------------------------------------+
|                              CAPA DE PRESENTACIÓN (CLIENTE)                      |
|  - Next.js Client Components ("use client")                                       |
|  - React Hook Form + Zod Resolvers                                                |
|  - Shadcn UI Components / Lucide Icons / PDF Iframe Modal                         |
+-----------------------------------------------------------------------------------+
                                         │  Invocación RPC / Server Actions (POST)
                                         ▼
+-----------------------------------------------------------------------------------+
|                        CAPA DE CONTROL Y SERVICIOS (BACKEND-FOR-FRONTEND)         |
|  - Next.js Server Actions ("use server") en app/actions/                          |
|  - Next.js Middleware (Verificación de tokens JWT y redirección RBAC)             |
|  - Esquemas de Validación en Servidor (Zod safeParse)                             |
|  - Revalidación reactiva de rutas (revalidatePath)                                 |
+-----------------------------------------------------------------------------------+
                                         │  Conexión Isomórfica TLS / PostgREST
                                         ▼
+-----------------------------------------------------------------------------------+
|                        CAPA DE PERSISTENCIA Y SERVICIOS (SUPABASE)                |
|  - PostgreSQL Engine (Tablas transaccionales: expedientes, trazabilidad, etc.)    |
|  - Vistas de Seguridad Ciudadana (vista_consulta_ciudadana, trazabilidad)        |
|  - Supabase Auth Service (Gestión de Identidad y Hash de Contraseñas)             |
|  - Supabase Storage Bucket ('documentos' para PDFs multipart)                    |
|  - Row Level Security (Políticas restrictivas basadas en roles y usuarios)        |
+-----------------------------------------------------------------------------------+
```

### Evidencia de Patrones Arquitectónicos Detectados

1. **BFF (Backend-for-Frontend) mediante Server Actions:**  
   *Evidencia:* No existen carpetas ni endpoints `app/api/...`. Todas las operaciones de mutación se definen en `app/actions/*.ts` con la directiva `'use server'` (`loginAction`, `createExpedienteAction`, `derivarExpedienteAction`, `finalizarExpedienteAction`, `crearEmpleado`).
2. **Arquitectura Híbrida Server/Client Components:**  
   *Evidencia:* Las páginas que leen datos iniciales (`app/dashboard/page.tsx`, `app/dashboard/bandeja/page.tsx`, `app/dashboard/expedientes/[id]/page.tsx`, `app/dashboard/admin/page.tsx`) son funciones `async` del servidor que consultan la base de datos sin exponer secretos al navegador. Los componentes interactivos portan `'use client'` (`BandejaTable.tsx`, `DerivacionModal.tsx`, `ExpedienteCreateForm.tsx`).
3. **Service Layer (Capa de Servicios de Dominio):**  
   *Evidencia:* Los componentes de UI nunca ejecutan mutaciones SQL directas; delegan la responsabilidad a funciones exportadas en `app/actions/`.
4. **Data Isolation via Database Views:**  
   *Evidencia:* En `app/actions/consulta.ts`, la consulta pública ya no lee de las tablas maestras `expedientes` ni `trazabilidad`, sino de `vista_consulta_ciudadana` y `vista_trazabilidad_ciudadana`.
5. **Role-Based Access Control (RBAC) en Capas:**  
   *Evidencia:*  
   * Enrutamiento perimetral: `middleware.ts` intercepta peticiones a `/dashboard/*` verificando `supabase.auth.getUser()`.  
   * Enrutamiento de interfaz: `Sidebar.tsx` filtra enlaces según `userRole`.  
   * Páginas protegidas: `admin/page.tsx` redirige a usuarios sin rol `ADMIN` o `ADMIN_TI`.  
   * Lógica de acciones: `finalizarExpedienteAction` valida en servidor que el rol sea `JEFE_AREA` o `ADMIN_TI`.
6. **No se encontraron patrones como Redux, Zustand o Context API:**  
   *Evidencia:* La sincronización de estado se maneja vía URL search parameters (`useSearchParams`, `router.push`), transiciones de React (`useTransition`) y revalidación de caché del servidor (`revalidatePath`).

---

## 5. MÓDULOS DEL SISTEMA

### M-01: Autenticación y Control de Sesión
* **Finalidad:** Permitir el acceso seguro a la intranet municipal, verificar credenciales y gestionar la recuperación de contraseñas.
* **Usuarios/Roles:** Todos los empleados municipales y administradores (`ADMIN_TI`, `MESA_PARTES`, `ESPECIALISTA`, `JEFE_AREA`, `FUNCIONARIO`).
* **Páginas y Rutas:** `/login` (`app/(auth)/login/page.tsx`), `/forgot-password` (`app/(auth)/forgot-password/page.tsx`).
* **Componentes:** `LoginPage`, `ForgotPasswordPage`, `UserProfileMenu`.
* **Servicios / Actions:** `app/actions/auth.ts` (`loginAction`, `logoutAction`, `forgotPasswordAction`).
* **Tablas utilizadas:** `auth.users`, `public.perfiles`, `public.areas`.
* **Operaciones CRUD:** Read / Verify (SignIn, ResetPassword, SignOut).
* **Estado:** **IMPLEMENTADO**.

### M-02: Administración y Gestión de Empleados (OTI)
* **Finalidad:** Administración del ciclo de vida de las cuentas de personal: alta de usuario, vinculación institucional de área, asignación de rol, edición y baja lógica.
* **Usuarios/Roles:** Exclusivo para `ADMIN_TI` y `ADMIN`.
* **Páginas y Rutas:** `/dashboard/admin` (`app/dashboard/admin/page.tsx`).
* **Componentes:** `CrearEmpleadoDialog`, `EditarEmpleadoDialog`, `EmpleadosTable`.
* **Servicios / Actions:** `app/actions/admin.ts` (`obtenerAreas`, `obtenerEmpleados`, `crearEmpleado`, `actualizarEmpleado`, `cambiarEstadoEmpleado`).
* **Tablas utilizadas:** `auth.users`, `public.perfiles`, `public.areas`.
* **Operaciones CRUD:** Create (`auth.admin.createUser` e insert en `perfiles`), Read (SELECT perfiles con JOIN areas), Update (`perfiles` y metadata de `auth.users`), Delete Lógico (toggle de columna `activo`).
* **Estado:** **IMPLEMENTADO**.

### M-03: Mesa de Partes (Registro e Ingreso Documental)
* **Finalidad:** Recepción y digitalización del documento inicial presentado por el administrado o entidad externa, generando el Código CUT y su primer hito de trazabilidad.
* **Usuarios/Roles:** Operador de `MESA_PARTES` (y supervisores autorizados).
* **Páginas y Rutas:** `/dashboard/expedientes/nuevo` (`app/dashboard/expedientes/nuevo/page.tsx`).
* **Componentes:** `ExpedienteCreateForm`.
* **Servicios / Actions:** `app/actions/expedientes.ts` (`createExpedienteAction`).
* **Tablas utilizadas:** `public.expedientes`, `public.adjuntos`, `public.trazabilidad`, `storage.objects` (bucket `documentos`).
* **Operaciones CRUD:** Create (Expediente, Adjuntos iniciales, Trazabilidad inicial con acción `REGISTRO_INICIAL`), Upload de archivos a Storage.
* **Estado:** **IMPLEMENTADO**.

### M-04: Bandeja de Entrada y Flujo de Trabajo
* **Finalidad:** Gestión visual de la carga de trabajo asignada al área del usuario logueado. Permite recepcionar expedientes derivados, filtrar por estado, buscar por texto y paginar resultados.
* **Usuarios/Roles:** `MESA_PARTES`, `ESPECIALISTA`, `JEFE_AREA`, `FUNCIONARIO`.
* **Páginas y Rutas:** `/dashboard/bandeja` (`app/dashboard/bandeja/page.tsx`).
* **Componentes:** `BandejaTabsNav`, `BandejaFiltros`, `BandejaTable`, `BandejaPaginacion`.
* **Servicios / Actions:** `app/actions/bandeja.ts` (`recepcionarExpedienteAction`).
* **Tablas utilizadas:** `public.expedientes`, `public.trazabilidad`, `public.perfiles`.
* **Operaciones CRUD:** Read (SELECT paginado y filtrado de expedientes por `area_actual_id`), Update (cambio de estado de `DERIVADO` o `REGISTRADO` a `RECEPCIONADO`), Create (trazabilidad con acción `RECEPCION`).
* **Estado:** **IMPLEMENTADO**.

### M-05: Gestión de Detalle, Visor PDF y Derivación
* **Finalidad:** Examen minucioso del expediente, visualización de recaudos en PDF integrado sin descarga obligatoria, anexión de nuevos documentos intermedios generados por el área, y pase (derivación) formal hacia otra unidad orgánica.
* **Usuarios/Roles:** `ESPECIALISTA`, `JEFE_AREA`, `MESA_PARTES`, `ADMIN_TI`.
* **Páginas y Rutas:** `/dashboard/expedientes/[id]` (`app/dashboard/expedientes/[id]/page.tsx`).
* **Componentes:** `PdfViewerModal`, `DerivacionModal`, `SubirDocumentosDialog`.
* **Servicios / Actions:** `app/actions/expedientes.ts` (`derivarExpedienteAction`, `subirDocumentosIntermediosAction`), `app/actions/derivaciones.ts`.
* **Tablas utilizadas:** `public.expedientes`, `public.adjuntos`, `public.trazabilidad`, `public.areas`, `public.perfiles`, Storage bucket `documentos`.
* **Operaciones CRUD:** Read (Detalle de expediente, adjuntos y tracking), Update (Reasignación de `area_actual_id` y estado a `DERIVADO`), Create (Nuevos registros en `adjuntos` y `trazabilidad`).
* **Estado:** **IMPLEMENTADO**.

### M-06: Cierre y Archivo de Expedientes
* **Finalidad:** Culminación formal del ciclo de vida administrativo del expediente registrando la emisión de un informe/resolución final (`ATENDIDO`) o el pase a custodia pasiva (`ARCHIVADO`).
* **Usuarios/Roles:** Exclusivo de `JEFE_AREA` y `ADMIN_TI`. Bloqueado estrictamente para `MESA_PARTES` y `ESPECIALISTA`.
* **Páginas y Rutas:** Modal integrado en `/dashboard/expedientes/[id]`.
* **Componentes:** `FinalizarExpedienteModal`.
* **Servicios / Actions:** `app/actions/expedientes.ts` (`finalizarExpedienteAction`).
* **Tablas utilizadas:** `public.expedientes`, `public.trazabilidad`, `public.perfiles`.
* **Operaciones CRUD:** Update (Estado de expediente a `ATENDIDO` o `ARCHIVADO`), Create (Hito de cierre en `trazabilidad` detallando el proveído final).
* **Estado:** **IMPLEMENTADO**.

### M-07: Consulta Pública Ciudadana
* **Finalidad:** Permitir al ciudadano o administrado ingresar su código CUT desde cualquier dispositivo sin requerir autenticación para consultar el estado actual de su trámite y ver la línea de tiempo histórica real.
* **Usuarios/Roles:** Ciudadanos (Público general / Anónimo) y funcionarios vía `/dashboard/consulta`.
* **Páginas y Rutas:** `/consulta` (`app/consulta/page.tsx`), `/dashboard/consulta` (`app/dashboard/consulta/page.tsx`).
* **Componentes:** `ConsultaTracker`.
* **Servicios / Actions:** `app/actions/consulta.ts` (`buscarExpedientePorCut`).
* **Tablas/Vistas utilizadas:** `public.vista_consulta_ciudadana`, `public.vista_trazabilidad_ciudadana`.
* **Operaciones CRUD:** Read (SELECT sobre Vistas SQL de aislamiento de seguridad).
* **Estado:** **IMPLEMENTADO**.

### M-08: Resumen Operativo y Analítica
* **Finalidad:** Proveer un panel de control inicial con métricas agregadas del volumen documental (Total, Registrados, Derivados, Recepcionados).
* **Usuarios/Roles:** Usuarios con acceso al dashboard.
* **Páginas y Rutas:** `/dashboard` (`app/dashboard/page.tsx`).
* **Tablas utilizadas:** `public.expedientes`.
* **Operaciones CRUD:** Read (Conteo de filas `{ count: 'exact', head: true }`).
* **Estado:** **IMPLEMENTADO**.

### M-09: Bandeja de Salida (Trámites derivados por el área)
* **Finalidad:** Visualizar los trámites que el área actual ya derivó y que se encuentran en tránsito o pendientes de recepción por otra área.
* **Mención en requisitos:** Aparece enunciada en el roadmap de `AGY_INSTRUCTIONS.md` (Fase 2, ítem 2).
* **Estado:** **PLANIFICADO / NO IMPLEMENTADO** (No existe página ni filtro específico de bandeja de salida en el código).

---

## 6. RUTAS Y NAVEGACIÓN

| Ruta | Componente de Página | Tipo de Acceso | Roles Permitidos | Protección / Mecanismo | Datos que Consume |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `app/page.tsx` | Redirección | Todos | Redirect automático a `/login` | Ninguno |
| `/login` | `app/(auth)/login/page.tsx` | Pública | Anónimo | Redirige a `/dashboard` si ya tiene sesión activa | Formulario de autenticación |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Pública | Anónimo | Redirige a `/dashboard` si ya tiene sesión activa | Envío de correo de reseteo |
| `/consulta` | `app/consulta/page.tsx` | Pública | Ciudadano / Todos | Acceso libre sin credenciales ni tokens | `vista_consulta_ciudadana`, `vista_trazabilidad_ciudadana` |
| `/dashboard` | `app/dashboard/page.tsx` | Privada | Todos los empleados autenticados | `middleware.ts` + `supabase.auth.getUser()` | Conteo general de `expedientes` |
| `/dashboard/bandeja` | `app/dashboard/bandeja/page.tsx` | Privada | `MESA_PARTES`, `ESPECIALISTA`, `JEFE_AREA`, `FUNCIONARIO` | `middleware.ts` + Verificación de `area_id` en perfil | `expedientes`, `perfiles`, `areas` |
| `/dashboard/expedientes/nuevo` | `app/dashboard/expedientes/nuevo/page.tsx` | Privada | `MESA_PARTES` (filtrado en Sidebar) | `middleware.ts` | Formulario multipart, catálogo de trámites |
| `/dashboard/expedientes/[id]` | `app/dashboard/expedientes/[id]/page.tsx` | Privada | Todos los empleados autenticados | `middleware.ts` + `notFound()` si no existe | `expedientes`, `adjuntos`, `trazabilidad`, `areas`, `perfiles` |
| `/dashboard/consulta` | `app/dashboard/consulta/page.tsx` | Privada | Todos los empleados autenticados | `middleware.ts` (Redirige a `/consulta` si no hay sesión) | `vista_consulta_ciudadana`, `vista_trazabilidad_ciudadana` |
| `/dashboard/admin` | `app/dashboard/admin/page.tsx` | Privada (Crítica) | Exclusivo `ADMIN_TI`, `ADMIN` | `middleware.ts` + Verificación explícita de rol en servidor | `auth.users`, `perfiles`, `areas` |

---

## 7. USUARIOS Y ROLES

### Estructura de Roles y Matriz de Autorización Real

El sistema utiliza un modelo RBAC estricto controlado en tres niveles: Interfaz (`Sidebar.tsx`), Enrutamiento de Servidor (`admin/page.tsx`) y Transacciones Backend (`expedientes.ts`).

| Rol | Alcance Geográfico / Área | Crear Expediente | Recepcionar | Derivar | Anexar Docs | Finalizar / Archivar | Panel Admin |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`ADMIN_TI` / `ADMIN`** | Global (Área forzada a `null`) | No (Bloqueado) | Sí | Sí | Sí | Sí | **Sí (Exclusivo)** |
| **`MESA_PARTES`** | Fijo: Área "Mesa de Partes" | **Sí (Exclusivo)** | Sí | Sí | No | No (Prohibido) | No |
| **`ESPECIALISTA`** | Asignado a su Gerencia/Subgerencia | No | Sí | Sí | **Sí** | No (Prohibido) | No |
| **`JEFE_AREA`** | Líder de su Gerencia/Subgerencia | No | Sí | Sí | **Sí** | **Sí (Exclusivo)** | No |
| **`FUNCIONARIO`** | Rol genérico / base de lectura | No | Sí | Sí | No | No | No |

### Reglas de Negocio en la Creación de Usuarios

1. **`MESA_PARTES`:** Debe adscribirse obligatoriamente al área de Mesa de Partes en la base de datos.
2. **`ADMIN_TI`:** Se fuerza su `area_id` a `null` de forma invariable (en `admin.ts`: `const finalAreaId = rol === 'ADMIN_TI' ? null : area_id`).
3. **`ESPECIALISTA` / `JEFE_AREA`:** Requieren obligatoriamente la selección de un área institucional registrada en la tabla `areas`.
4. **Desactivación Lógica:** La columna `activo` (booleano) permite suspender empleados sin destruir su historial ni violar la integridad referencial en `trazabilidad.emisor_id` o `adjuntos.subido_por`.

---

## 8. AUDITORÍA DE SUPABASE

### Arquitectura de Clientes

1. **Cliente del Navegador (`lib/supabase/client.ts`):**  
   Utiliza `createBrowserClient<Database>` de `@supabase/ssr` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. **Cliente del Servidor (`lib/supabase/server.ts`):**  
   Utiliza `createServerClient<Database>` con el gestor asíncrono `cookies()` de Next.js. Provee lectura y escritura segura de cookies de sesión para Server Components y Server Actions.
3. **Middleware de Sesión (`lib/supabase/middleware.ts`):**  
   Ejecuta `supabase.auth.getUser()` en cada ciclo de petición de ruta protegida, renovando las cookies en la respuesta HTTP (`NextResponse`).
4. **Cliente de Aislamiento Administrativo (Service Role Key):**  
   Se utiliza de forma restringida y controlada en `app/actions/admin.ts` mediante `createSupabaseClient(supabaseUrl, serviceRoleKey)` para operaciones de administración de usuarios que requieren privilegios de `auth.admin.createUser`, `listUsers` y bypass de RLS transaccional en expedientes y derivaciones (`app/actions/expedientes.ts`).
5. **Cliente Público de Consulta Ciudadana:**  
   En `app/actions/consulta.ts`, la Service Role Key fue **eliminada por completo**, operando exclusivamente con el cliente estándar anónimo sobre vistas SQL seguras.

### Integración de Almacenamiento (Supabase Storage)

* **Bucket:** `documentos`.
* **Ruta de almacenamiento:** `{expedienteId}/{timestamp}_{nombreArchivoSanitizado}`.
* **Métodos utilizados:**  
  * `supabase.storage.from('documentos').upload(storagePath, fileBuffer, { contentType, upsert: false })`.
  * `supabase.storage.from('documentos').getPublicUrl(uploadData.path)`.
* **Persistencia referencial:** La URL devuelta se inserta en la columna `adjuntos.ruta_almacenamiento`.

---

## 9. BASE DE DATOS

A partir del archivo de definición de tipos `types/database.types.ts` y las consultas e inserciones ejecutadas en los Server Actions, se reconstruye el esquema técnico de la base de datos relacional:

### Tabla: `areas`
*Propósito: Catálogo de gerencias, subgerencias y dependencias municipales de la MDLO.*

| Campo | Tipo | PK | FK | Nullable | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `uuid` | **PK** | No | No | Identificador único del área (UUID). |
| `nombre` | `text` / `varchar` | No | No | No | Nombre oficial de la unidad orgánica (ej: "Mesa de Partes", "Gerencia de Fiscalización"). |
| `siglas` | `text` / `varchar` | No | No | No | Siglas representativas (ej: "MP", "GF", "AJ"). |
| `created_at` | `timestamptz` | No | No | Sí / Default | Marca de tiempo de registro. |

### Tabla: `perfiles`
*Propósito: Perfil laboral del empleado municipal vinculado a la tabla de autenticación `auth.users`.*

| Campo | Tipo | PK | FK | Nullable | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `uuid` | **PK** | `auth.users(id)` | No | Identificador del usuario, coincide con el UID de Supabase Auth. |
| `nombres` | `text` | No | No | No | Nombres de pila del empleado. |
| `apellidos` | `text` | No | No | No | Apellidos del empleado. |
| `dni` | `varchar(8)` | No | No | No | Documento Nacional de Identidad (8 dígitos). |
| `area_id` | `uuid` | No | `areas(id)` | Sí | Área a la que pertenece el usuario (NULL en administradores TI). |
| `rol` | `varchar` | No | No | No | Rol del sistema (`ADMIN_TI`, `MESA_PARTES`, `ESPECIALISTA`, `JEFE_AREA`, `ADMIN`, `FUNCIONARIO`). |
| `activo` | `boolean` | No | No | No | Estado de baja lógica (`true` = Activo, `false` = Suspendido). |
| `created_at` | `timestamptz` | No | No | Sí / Default | Fecha de creación del perfil. |

### Tabla: `expedientes`
*Propósito: Registro maestro de cada expediente administrativo tramitado ante la municipalidad.*

| Campo | Tipo | PK | FK | Nullable | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `uuid` | **PK** | No | No | Identificador único del expediente. |
| `cut` | `varchar` | No | No | Sí / Unique | Código Único de Trámite generado (ej: `EXP-2026-000008-MDLO`). |
| `remitente_nombres` | `text` | No | No | No | Nombre del ciudadano o razón social del remitente. |
| `remitente_dni_ruc` | `varchar` | No | No | No | Documento de identidad del remitente (DNI o RUC). |
| `telefono` | `varchar` | No | No | Sí | Teléfono o celular de contacto. |
| `correo` | `varchar` | No | No | Sí | Correo electrónico de notificación. |
| `asunto` | `text` | No | No | No | Descripción del requerimiento (incluye prefijo de tipo de trámite y dirección). |
| `folios` | `integer` | No | No | No | Cantidad de folios/hojas declaradas. |
| `estado` | `varchar` | No | No | No | Estado (`REGISTRADO`, `DERIVADO`, `RECEPCIONADO`, `ATENDIDO`, `ARCHIVADO`). |
| `area_actual_id` | `uuid` | No | `areas(id)` | Sí | Unidad orgánica que posee físicamente/digitalmente el trámite en el momento. |
| `registrado_por` | `uuid` | No | `perfiles(id)` | Sí | Usuario operador que originó el registro. |
| `fecha_creacion` | `timestamptz` | No | No | Sí / Default | Marca temporal de ingreso inicial. |
| `fecha_actualizacion` | `timestamptz` | No | No | Sí / Default | Marca temporal del último cambio de estado o derivación. |

### Tabla: `adjuntos`
*Propósito: Archivos digitales anexados al expediente (iniciales e intermedios).*

| Campo | Tipo | PK | FK | Nullable | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `uuid` | **PK** | No | No | Identificador único del adjunto. |
| `expediente_id` | `uuid` | No | `expedientes(id)` | No | Expediente al que pertenece el archivo. |
| `nombre_archivo` | `text` | No | No | No | Nombre original del documento (ej: "solicitud_firmada.pdf"). |
| `ruta_almacenamiento` | `text` | No | No | No | URL pública o path dentro de Supabase Storage. |
| `tipo_mime` | `varchar` | No | No | Sí | Tipo de contenido (ej: `application/pdf`). |
| `peso_bytes` | `bigint` | No | No | Sí | Tamaño del archivo en bytes. |
| `subido_por` | `uuid` | No | `perfiles(id)` | Sí | Usuario que realizó la carga. |
| `area_id` | `uuid` | No | `areas(id)` | Sí | Área que emitió o anexó el documento. |
| `fecha_subida` | `timestamptz` | No | No | Sí / Default | Marca de tiempo de la carga. |

### Tabla: `trazabilidad`
*Propósito: Pistas de auditoría y línea de tiempo (hoja de ruta) de cada acción sobre el expediente.*

| Campo | Tipo | PK | FK | Nullable | Descripción |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `uuid` | **PK** | No | No | Identificador único del hito. |
| `expediente_id` | `uuid` | No | `expedientes(id)` | No | Expediente objeto del movimiento. |
| `area_origen_id` | `uuid` | No | `areas(id)` | Sí | Unidad orgánica que remite o despacha. |
| `area_destino_id` | `uuid` | No | `areas(id)` | Sí | Unidad orgánica receptora. |
| `emisor_id` | `uuid` | No | `perfiles(id)` | Sí | Funcionario responsable de la acción. |
| `receptor_id` | `uuid` | No | `perfiles(id)` | Sí | Funcionario receptor (si aplica). |
| `accion` | `text` | No | No | No | Acción ejecutada (`REGISTRO_INICIAL`, `RECEPCION`, `DERIVADO`, `ANEXO_DOCUMENTAL`, `ATENDIDO`, `ARCHIVADO`, etc.). |
| `proveido` | `text` | No | No | Sí | Proveído, instrucción, observación o fundamentación técnica. |
| `estado_previo` | `varchar` | No | No | Sí | Estado del trámite antes del evento. |
| `estado_nuevo` | `varchar` | No | No | Sí | Estado resultante del trámite. |
| `fecha_envio` | `timestamptz` | No | No | No | Marca de tiempo exacta del hito. |
| `fecha_recepcion` | `timestamptz` | No | No | Sí | Marca de tiempo de confirmación de recepción. |

### Vistas SQL de Seguridad Ciudadana (Vistas Públicas)

1. **`vista_consulta_ciudadana`:**  
   *Campos expuestos:* `id`, `cut`, `asunto`, `estado`, `fecha_ingreso`, `fecha_actualizacion`.  
   *Finalidad:* Permite a la ciudadanía consultar el estado del trámite sin exponer datos sensibles del remitente (DNI, teléfono, dirección, correo) ni llaves foráneas de auditoría interna.
2. **`vista_trazabilidad_ciudadana`:**  
   *Campos expuestos:* `expediente_id`, `accion`, `estado_nuevo`, `fecha`, `area_origen`, `area_destino`.  
   *Finalidad:* Expone los movimientos entre áreas con sus nombres textuales directos (`area_origen` y `area_destino` como `text`), sin exponer los UUIDs de áreas ni los nombres ni identificadores de los funcionarios en `emisor_id` ni `receptor_id`.

---

## 10. RELACIONES ENTRE TABLAS

```text
                  +-------------------+
                  |    auth.users     |
                  +-------------------+
                            | 1:1
                            v
                  +-------------------+
      +---------->|     perfiles      |<---------+
      |           +-------------------+          |
      |                     |                    |
      | 1:N                 | 1:N                | 1:N
      | (registrado_por)    | (emisor_id)        | (subido_por)
      |                     v                    |
+-------------+      +--------------+      +-------------+
| expedientes |<1:N--| trazabilidad |      |  adjuntos   |
+-------------+      +--------------+      +-------------+
      |   ^                 |                    |
      |   | 1:N             | N:1                | N:1
      |   +-----------------+--------------------+
      |   (expediente_id)   (expediente_id)
      |
      | N:1 (area_actual_id)
      v
+-------------+
|    areas    |<---+ (area_id en perfiles, N:1)
+-------------+<---+ (area_origen_id y area_destino_id en trazabilidad, N:1)
               <---+ (area_id en adjuntos, N:1)
```

* **`auth.users` &rarr; `perfiles`:** Relación 1 a 1 mediante `perfiles.id = auth.users.id`.
* **`areas` &rarr; `perfiles`:** Relación 1 a N (`perfiles.area_id` referencia `areas.id`).
* **`areas` &rarr; `expedientes`:** Relación 1 a N (`expedientes.area_actual_id` referencia `areas.id`).
* **`expedientes` &rarr; `adjuntos`:** Relación 1 a N (`adjuntos.expediente_id` referencia `expedientes.id`).
* **`areas` &rarr; `adjuntos`:** Relación 1 a N (`adjuntos.area_id` referencia `areas.id`).
* **`expedientes` &rarr; `trazabilidad`:** Relación 1 a N (`trazabilidad.expediente_id` referencia `expedientes.id`).
* **`areas` &rarr; `trazabilidad` (Origen y Destino):** Dos relaciones N a 1 (`area_origen_id` y `area_destino_id` referencian `areas.id`).
* **`perfiles` &rarr; `trazabilidad`:** Relación N a 1 (`trazabilidad.emisor_id` referencia `perfiles.id`).

---

## 11. ROW LEVEL SECURITY (RLS)

| Tabla / Objeto | RLS Habilitado | Política / Comportamiento Detectado | Operaciones | Roles Afectados | Evidencia en el Código |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **`areas`** | **Sí** | Restringe lectura anónima. Disponible para autenticados. | `SELECT` | `anon` bloqueado; `authenticated` permitido. | Al consultar con cliente anónimo devolvió 0 filas. Funciona con usuario logueado o Service Role. |
| **`perfiles`** | **Sí** | Aislamiento por usuario. Los usuarios solo pueden ver su propio perfil; no pueden ver perfiles de terceros a menos que sean admin. | `SELECT`, `UPDATE` | Empleados estándar limitados a su UID. | Durante las pruebas, un usuario logueado como `mpmp@muni.gop.pe` devolvía `emisor: null` al cruzar con perfiles ajenos. |
| **`expedientes`** | **Sí** | Permite lectura de datos generales; la edición (`UPDATE`) requiere validación de área/usuario o bypass de contingencia. | `SELECT`, `INSERT`, `UPDATE` | Toda la intranet. | El Server Action `recepcionarExpedienteAction` y `derivarExpedienteAction` verifican `!data || data.length === 0` ante fallos silenciosos por RLS. |
| **`adjuntos`** | **Sí** | Restringe subida y lectura según autenticación. | `SELECT`, `INSERT` | Empleados autenticados. | Implementado con bypass controlado en Server Actions para asegurar la asignación del `area_id`. |
| **`trazabilidad`** | **Sí** | Restricción total para `anon`. Requiere sesión activa en la intranet. | `SELECT`, `INSERT` | Bloqueado para público; permitido para autenticados. | La consulta directa anónima arrojaba 0 filas. La solución arquitectónica fue crear `vista_trazabilidad_ciudadana`. |
| **`vista_consulta_ciudadana`** | **No** (Vista pública) | Permite lectura irrestricta de campos no confidenciales filtrando por `cut`. | `SELECT` | `anon`, `authenticated`. | `app/actions/consulta.ts` realiza `.from('vista_consulta_ciudadana').select('*')` con cliente público. |
| **`vista_trazabilidad_ciudadana`** | **No** (Vista pública) | Permite lectura pública de hitos históricos anonimizados filtrando por `expediente_id`. | `SELECT` | `anon`, `authenticated`. | `app/actions/consulta.ts` realiza `.from('vista_trazabilidad_ciudadana').select('*')` con cliente público. |

---

## 12. AUTENTICACIÓN Y SEGURIDAD

1. **Gestión de Identidad:**  
   * Basada en el motor GoTrue de Supabase Auth.
   * Contraseñas con hash seguro gestionado por Supabase (bcrypt/argon2 en la nube). Ninguna contraseña se almacena en texto plano en la base de datos municipal.
2. **Tokens y Manejo de Sesiones:**  
   * Tokens JWT transmitidos en cookies seguras HTTP-only cifradas mediante `@supabase/ssr`.
   * El archivo `middleware.ts` y `lib/supabase/middleware.ts` interceptan cualquier ruta bajo `/dashboard/*`. Si `user` es nulo, fuerza redirección HTTP 307 a `/login`.
3. **Manejo de Secretos:**  
   * `NEXT_PUBLIC_SUPABASE_URL`: Pública para inicialización de clientes.
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Llave pública sujeta a las reglas de RLS de la base de datos.
   * `SUPABASE_SERVICE_ROLE_KEY`: Clave maestra privada accesible únicamente en el entorno Node.js del servidor. Se encuentra en `.env.local` y está excluida del repositorio mediante `.gitignore`.
4. **Protección Perimetral contra Exposición de Datos Sensibles:**  
   * Los endpoints ciudadanos (`/consulta`) no tocan tablas con datos sensibles de personas naturales (como teléfonos o direcciones privadas). Se comunican exclusivamente a través de las vistas SQL anonimizadas.
   * Los Server Actions sanitizan y limpian inputs contra inyecciones y caracteres inválidos (ej: `replace(/[^a-zA-Z0-9._-]/g, '_')` en nombres de archivos).

---

## 13. OPERACIONES CRUD

| Módulo | Operación | Tipo | Componente Involucrado | Server Action / Función | Tabla / Objeto Afectado | Roles Autorizados |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **Autenticación** | Iniciar Sesión | **R** | `LoginPage` | `loginAction` | `auth.users` | Todos |
| **Autenticación** | Cerrar Sesión | **U** | `UserProfileMenu` | `logoutAction` | `auth.users` | Todos |
| **Autenticación** | Recuperar Clave | **U** | `ForgotPasswordPage` | `forgotPasswordAction` | `auth.users` | Todos |
| **Administración** | Listar Empleados | **R** | `EmpleadosTable` | `obtenerEmpleados` | `perfiles`, `areas`, `auth.users` | `ADMIN_TI`, `ADMIN` |
| **Administración** | Registrar Empleado | **C** | `CrearEmpleadoDialog` | `crearEmpleado` | `auth.users`, `perfiles` | `ADMIN_TI`, `ADMIN` |
| **Administración** | Editar Empleado | **U** | `EditarEmpleadoDialog` | `actualizarEmpleado` | `perfiles`, `auth.users` | `ADMIN_TI`, `ADMIN` |
| **Administración** | Desactivar / Activar | **U** | `EmpleadosTable` | `cambiarEstadoEmpleado` | `perfiles` | `ADMIN_TI`, `ADMIN` |
| **Mesa de Partes** | Radicar Expediente | **C** | `ExpedienteCreateForm` | `createExpedienteAction` | `expedientes`, `adjuntos`, `trazabilidad`, Storage | `MESA_PARTES` |
| **Bandeja** | Listar Expedientes | **R** | `BandejaTable` | SSR en `BandejaPage` | `expedientes`, `areas` | Todos los funcionarios |
| **Bandeja** | Recepcionar Trámite | **U / C**| `BandejaTable` | `recepcionarExpedienteAction`| `expedientes`, `trazabilidad` | Funcionarios del área |
| **Expedientes** | Consultar Detalle | **R** | `ExpedienteDetailPage`| SSR en `page.tsx` | `expedientes`, `adjuntos`, `trazabilidad` | Todos los funcionarios |
| **Expedientes** | Anexar Documentos | **C** | `SubirDocumentosDialog`| `subirDocumentosIntermediosAction` | `adjuntos`, `trazabilidad`, Storage | `ESPECIALISTA`, `JEFE_AREA`, `ADMIN_TI` |
| **Expedientes** | Derivar a Otra Área | **U / C**| `DerivacionModal` | `derivarExpedienteAction` | `expedientes`, `trazabilidad` | Funcionarios del área |
| **Expedientes** | Finalizar / Archivar | **U / C**| `FinalizarExpedienteModal`| `finalizarExpedienteAction` | `expedientes`, `trazabilidad` | `JEFE_AREA`, `ADMIN_TI` |
| **Consulta Pública**| Rastrear CUT | **R** | `ConsultaTracker` | `buscarExpedientePorCut` | `vista_consulta_ciudadana`, `vista_trazabilidad_ciudadana` | Ciudadano (Anónimo / Público) |

---

## 14. VALIDACIONES

### 1. Validaciones en Frontend (React Hook Form + Zod)
* **Login (`loginSchema`):**  
  * `email`: Debe ser una dirección de correo electrónico válida con formato RFC 5322.  
  * `password`: Mínimo 6 caracteres.
* **Creación de Empleados (`adminCreateUserSchema`):**  
  * `nombres`: Mínimo 2 caracteres.  
  * `apellidos`: Mínimo 2 caracteres.  
  * `dni`: Expresión regular `^\d{8}$` (exactamente 8 dígitos numéricos).  
  * `email`: Correo válido.  
  * `password`: Mínimo 6 caracteres.  
  * `rol`: Enum cerrado (`ADMIN_TI`, `MESA_PARTES`, `ESPECIALISTA`, `JEFE_AREA`, `ADMIN`, `FUNCIONARIO`).  
  * `area_id`: Mínimo 1 carácter (requerido si no es `ADMIN_TI`).
* **Derivación (`derivacionSchema`):**  
  * `area_destino_id`: Obligatorio (mínimo 1 carácter).  
  * `proveido`: Obligatorio (mínimo 1 carácter).
* **Archivos Adjuntos (`ExpedienteCreateForm` y `SubirDocumentosDialog`):**  
  * Límite estricto de tamaño en cliente: Máximo 5 MB por archivo (`file.size > 5 * 1024 * 1024`).  
  * Filtro de duplicados por nombre y tamaño exacto.

### 2. Validaciones en Backend (Server Actions)
* **`createExpedienteAction`:**  
  * Valida que el usuario tenga sesión activa.  
  * Valida longitud de `remitente_nombres` &ge; 3 caracteres.  
  * Valida longitud de `remitente_dni_ruc` &ge; 8 caracteres.  
  * Valida longitud de `asunto` &ge; 5 caracteres.  
  * Sanitización de nombres de archivo para Storage mediante regex: `cleanFileName = archivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')`.
* **`derivarExpedienteAction`:**  
  * Comprueba que `area_origen_id`, `area_destino_id` y `expediente_id` no sean `null`, `undefined` ni vacíos.  
  * Verifica el retorno del `update` (`!data || data.length === 0`) para interceptar fallos silenciosos provocados por RLS.
* **`finalizarExpedienteAction`:**  
  * Restringe el estado final estrictamente a `'ATENDIDO'` o `'ARCHIVADO'`.  
  * Valida RBAC en servidor consultando el perfil del usuario: bloquea si el rol no es `JEFE_AREA` ni `ADMIN_TI`.

---

## 15. MANEJO DE ERRORES

* **Bloques Try / Catch Exhaustivos:** Todas las Server Actions (`admin.ts`, `bandeja.ts`, `expedientes.ts`, `consulta.ts`) encapsulan su ejecución en bloques `try / catch` asegurando que los fallos del servidor no tumben la aplicación Next.js y retornen objetos estructurados `{ success: false, error: string }`.
* **Alertas Destructivas Visuales:** Los componentes cliente renderizan alertas visuales (`<Alert variant="destructive">`) con iconos `ShieldAlert` o `AlertCircle` mostrando el mensaje exacto retornado por el servidor.
* **Estados de Carga Concurrentes:** Uso intensivo de `useTransition` (`isPending`), mostrando spinners `Loader2` y deshabilitando botones de submit para evitar envíos múltiples (doble submit).
* **Estados Vacíos (*Empty States*):**  
  * En la bandeja: Si no hay expedientes pendientes, se presenta un contenedor punteado con el icono `Clock` y el texto *"No hay expedientes pendientes en su bandeja actual"*.  
  * En la consulta pública: Si el trámite no registra movimientos, se presenta el mensaje *"No se registran movimientos ni derivaciones para este expediente aún"*.  
  * En adjuntos: Mensaje descriptivo si no hay archivos cargados.
* **Formateo Seguro de Fechas:** Las funciones de formateo temporal (`formatDateSafe`) atrapan posibles fechas nulas o malformadas mediante bloques `try / catch` y comprobaciones `isNaN(d.getTime())`, evitando la excepción `RangeError: Invalid time value` de `date-fns`.

---

## 16. FLUJOS FUNCIONALES

### Flujo 1: Radicación de Expediente en Mesa de Partes
```text
[Operador Mesa Partes] -> Abre /dashboard/expedientes/nuevo
                       -> Completa Formulario (Remitente, DNI/RUC, Asunto, Tipo, Folios)
                       -> Selecciona PDFs (Validación < 5MB en cliente)
                       -> Submit -> createExpedienteAction(FormData)
                                 -> Supabase INSERT en 'expedientes' (Genera CUT)
                                 -> Supabase INSERT en 'trazabilidad' (Acción: REGISTRO_INICIAL)
                                 -> Supabase Storage UPLOAD (Bucket 'documentos')
                                 -> Supabase INSERT en 'adjuntos'
                                 -> revalidatePath()
                       -> Redirección a /dashboard/bandeja con mensaje de éxito
```

### Flujo 2: Recepción y Derivación Interna por Área
```text
[Especialista / Jefe de Área] -> Accede a /dashboard/bandeja (Filtro automático por su area_id)
                              -> Identifica expediente en estado 'DERIVADO'
                              -> Clic en 'Recepcionar' -> recepcionarExpedienteAction()
                                                       -> UPDATE expedientes.estado = 'RECEPCIONADO'
                                                       -> INSERT trazabilidad (Acción: RECEPCION)
                              -> Clic en 'Ver / Atender' -> /dashboard/expedientes/[id]
                              -> [Opcional] Abre 'Anexar Documentos' -> Sube Informes/Resoluciones
                              -> Clic en 'Derivar Expediente' -> Abre DerivacionModal
                              -> Selecciona Área Destino + Proveído de pase
                              -> derivarExpedienteAction()
                                 -> UPDATE expedientes (area_actual_id = destino, estado = 'DERIVADO')
                                 -> INSERT trazabilidad (accion = proveido, estado_nuevo = 'DERIVADO')
                                 -> revalidatePath()
                              -> Expediente desaparece de su bandeja y viaja al área receptora
```

### Flujo 3: Cierre o Archivo Definitivo del Trámite
```text
[Jefe de Área] -> Accede a /dashboard/expedientes/[id]
               -> Verifica estado 'RECEPCIONADO' (Botonera habilitada por RBAC)
               -> Clic en 'Finalizar / Archivar' -> Abre FinalizarExpedienteModal
               -> Selecciona acción: 'ATENDIDO' o 'ARCHIVADO' + Observación final
               -> finalizarExpedienteAction()
                  -> Validación en servidor: rol === 'JEFE_AREA' | 'ADMIN_TI'
                  -> UPDATE expedientes.estado = 'ATENDIDO' | 'ARCHIVADO'
                  -> INSERT trazabilidad (Acción: estadoNuevo, emisor_id = user.id)
                  -> revalidatePath()
               -> Expediente pasa a la pestaña 'Finalizados' de la bandeja
```

### Flujo 4: Consulta y Trazabilidad Ciudadana
```text
[Ciudadano / Público] -> Ingresa a /consulta (sin iniciar sesión)
                      -> Digita CUT (Ej: EXP-2026-000008-MDLO) -> Clic en Buscar
                      -> buscarExpedientePorCut(cut)
                         -> Cliente público anon consulta 'vista_consulta_ciudadana'
                         -> Cliente público anon consulta 'vista_trazabilidad_ciudadana'
                      -> Retorno de datos higienizados
                      -> Interfaz renderiza:
                         - Asunto, Estado general, Fecha de ingreso, Última actualización
                         - Ubicación actual (deducida del último destino de la vista)
                         - Línea de tiempo visual ascendente con cada pase entre dependencias
```

---

## 17. COMPONENTES

| Componente | Ubicación | Tipo | Responsabilidad Principal | Hooks Empleados |
| :--- | :--- | :---: | :--- | :--- |
| **`Sidebar`** | `components/shared/Sidebar.tsx` | Client | Navegación principal con menú reactivo según el rol RBAC del usuario. | `usePathname` |
| **`Navbar`** | `components/shared/Navbar.tsx` | Server | Cabecera superior, muestra el área activa y el rol del usuario logueado. | Ninguno (RSC) |
| **`UserProfileMenu`** | `components/shared/UserProfileMenu.tsx` | Client | Menú contextual con avatar, detalles de ficha del empleado y disparador de logout. | `useState`, `useRef`, `useEffect` |
| **`PdfViewerModal`** | `components/shared/PdfViewerModal.tsx` | Client | Visor de documentos PDF embebido en iframe sin salir del flujo de trabajo. | Integrado con Shadcn Dialog |
| **`BackButton`** | `components/shared/BackButton.tsx` | Client | Botón de retorno inteligente con soporte de `router.back()` y URL de respaldo. | `useRouter` |
| **`ExpedienteCreateForm`**| `components/modules/expedientes/ExpedienteCreateForm.tsx` | Client | Formulario de captura y carga masiva de archivos con validación en cliente. | `useState`, `useRef`, `useTransition`, `useRouter` |
| **`DerivacionModal`** | `components/modules/expedientes/DerivacionModal.tsx` | Client | Modal para reasignar el expediente a otra área con validación Zod. | `useForm`, `useTransition`, `useRouter`, `useState` |
| **`SubirDocumentosDialog`**| `components/modules/expedientes/SubirDocumentosDialog.tsx` | Client | Carga de archivos intermedios complementarios con drag and drop. | `useState`, `useRef`, `useTransition`, `useRouter` |
| **`FinalizarExpedienteModal`**| `components/expedientes/FinalizarExpedienteModal.tsx` | Client | Modal de cierre formal (`ATENDIDO` / `ARCHIVADO`) con confirmación de proveído. | `useState`, `useTransition`, `useRouter` |
| **`BandejaTabsNav`** | `components/modules/bandeja/BandejaTabsNav.tsx` | Client | Selector de pestañas ("Pendientes" vs "Finalizados") con contadores sincronizados en URL. | `useTransition`, `useRouter`, `useSearchParams`, `usePathname` |
| **`BandejaFiltros`** | `components/modules/bandeja/BandejaFiltros.tsx` | Client | Buscador por texto (CUT/Asunto) y selector de estado con debounce/submit. | `useState`, `useTransition`, `useRouter`, `useSearchParams` |
| **`BandejaTable`** | `components/modules/bandeja/BandejaTable.tsx` | Client | Tabla de expedientes del área con badges de estado y botón interactivo de recepción. | `useState`, `useTransition`, `useRouter` |
| **`BandejaPaginacion`** | `components/modules/bandeja/BandejaPaginacion.tsx` | Client | Controles de paginación previa/siguiente sincronizados en URL (`?page=N`). | `useTransition`, `useRouter`, `useSearchParams`, `usePathname` |
| **`ConsultaTracker`** | `components/modules/consulta/ConsultaTracker.tsx` | Client | Buscador ciudadano por CUT y renderizado de línea de tiempo basada en vistas SQL. | `useState`, `useTransition` |
| **`EmpleadosTable`** | `components/admin/EmpleadosTable.tsx` | Client | Tabla administrativa con badges de rol/estado y botones de edición y baja lógica. | `useState`, `useTransition`, `useRouter` |
| **`CrearEmpleadoDialog`**| `components/admin/CrearEmpleadoDialog.tsx` | Client | Formulario modal de creación de cuentas de usuario con validaciones reactivas. | `useForm`, `useTransition`, `useRouter`, `useState` |
| **`EditarEmpleadoDialog`**| `components/admin/EditarEmpleadoDialog.tsx` | Client | Formulario modal para actualizar datos y áreas de personal existente. | `useForm`, `useTransition`, `useRouter`, `useState` |

---

## 18. ESTADO DE LA APLICACIÓN

La aplicación no implementa librerías externas de estado global (como Redux Toolkit o Zustand). Su arquitectura de estado se divide en tres niveles:

1. **Estado en la URL (*URL Search Parameters*):**  
   * Parámetros gestionados: `?tab=pendientes|finalizados`, `?estado=REGISTRADO|DERIVADO|...`, `?query=CUT_O_ASUNTO`, `?page=1..N`.  
   * Ventaja: Mantiene la aplicación completamente "bookmarkable", permitiendo recargar o compartir la vista exacta preservando filtros y paginación.
2. **Estado Efímero Local en Componentes (*React Hooks*):**  
   * `useState`: Apertura/cierre de diálogos modales, listas temporales de archivos seleccionados pendientes de subida, mensajes de error locales.  
   * `useTransition`: Control de concurrencia y retroalimentación de carga no bloqueante (`isPending`) para ejecuciones de Server Actions.  
   * `useRef`: Manejo de referencias al DOM (ej: inputs de tipo `file` ocultos y detección de clics externos en `UserProfileMenu`).
3. **Estado del Servidor y Caché de Datos:**  
   * Administrado por Next.js App Router Data Cache.  
   * Se invalida y sincroniza automáticamente mediante llamadas a `revalidatePath('/dashboard/bandeja')`, `revalidatePath('/dashboard/admin')` y `revalidatePath('/dashboard/expedientes/[id]')` al completarse cualquier mutación exitosa.

---

## 19. DEPENDENCIAS

A partir del archivo `package.json`:

| Dependencia | Versión | Propósito Técnico | Ubicación de Uso |
| :--- | :--- | :--- | :--- |
| `next` | `16.3.7` | Framework full-stack, enrutador App Router y SSR. | Global (`app/`, `middleware.ts`) |
| `react` | `19.2.8` | Biblioteca base de interfaz de usuario. | Global en todos los componentes |
| `react-dom` | `19.2.8` | Renderizador de React en el DOM. | Global |
| `@supabase/ssr` | `^0.12.7` | Manejador de autenticación y cookies en Next.js. | `lib/supabase/server.ts`, `client.ts`, `middleware.ts` |
| `@supabase/supabase-js` | `^2.117.2`| SDK para consultas PostgreSQL, Auth y Storage. | `lib/supabase/`, `app/actions/` |
| `zod` | `^4.6.5` | Validación declarativa de esquemas y tipos. | `lib/validators/`, formularios, Server Actions |
| `react-hook-form` | `^7.89.0` | Manejo de formularios controlados en React. | `login`, `forgot-password`, `CrearEmpleado`, `Derivacion` |
| `@hookform/resolvers`| `^5.9.1` | Conector entre React Hook Form y esquemas Zod. | Formularios en componentes cliente |
| `date-fns` | `^4.4.0` | Manipulación y formateo de fechas en español. | `ConsultaTracker`, `page.tsx`, `BandejaTable` |
| `lucide-react` | `^1.48.0` | Paquete de iconos SVG vectoriales. | Todos los componentes de presentación |
| `tailwindcss` | `^4` | Motor de estilos CSS utilitario. | `app/globals.css`, configuración visual |
| `@tailwindcss/postcss`| `^4` | Plugin de integración PostCSS para Tailwind. | `postcss.config.mjs` |
| `@base-ui/react` | `^1.8.0` | Componentes primitivos headless de Base UI (Tabs).| `components/ui/tabs.tsx` |
| `@radix-ui/react-slot`| `^1.3.3` | Composición polimórfica para componentes Shadcn. | `components/ui/button.tsx` |
| `@radix-ui/react-label`|`^2.1.15` | Componente accesible de etiqueta de formulario. | `components/ui/label.tsx` |
| `class-variance-authority`|`^0.7.1`| Definición de variantes visuales de componentes (CVA).| `components/ui/button.tsx`, `badge.tsx`, `tabs.tsx` |
| `clsx` / `tailwind-merge`| `^2.1.1` / `^3.7.0` | Fusión condicional y libre de conflictos de clases CSS. | `lib/utils.ts` |
| `typescript` | `^5` | Compilador y analizador de tipos. | Entorno de desarrollo |
| `eslint` / `eslint-config-next`| `^9` / `16.3.7` | Linter de código estático. | Configuración de desarrollo (`eslint.config.mjs`) |

---

## 20. VARIABLES DE ENTORNO

| Variable | Propósito | Ámbito de Exposición | Sensible |
| :--- | :--- | :--- | :---: |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (endpoint REST/Auth). | Cliente y Servidor (Público) | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anónima sujeta a RLS. | Cliente y Servidor (Público) | Media |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave maestra administrativa con bypass de RLS. | Exclusivo Servidor (Node.js) | **CRÍTICA / ALTA** |

*Nota de seguridad:* De acuerdo con las mejores prácticas y los lineamientos de auditoría, ningún valor real se muestra en este reporte; se mantienen etiquetados como `[OCULTO]`.

---

## 21. PRUEBAS EXISTENTES

* **Auditoría de Suites de Prueba:**  
  Tras inspeccionar exhaustivamente la raíz y los subdirectorios del proyecto, se constató que **no existen archivos de pruebas automatizadas** (no se encontraron archivos con terminación `.test.ts`, `.spec.ts`, `.test.tsx` ni `.spec.tsx`).
* **Herramientas de Testing:**  
  No están instaladas ni configuradas dependencias tales como *Jest*, *Vitest*, *React Testing Library*, *Cypress* o *Playwright*.
* **Comprobaciones Existentes en `package.json`:**  
  * `"lint": "eslint"`: Validación estática de código según reglas de ESLint y Next.js.  
  * `"build": "next build"`: Verificación de compilación estricta de TypeScript (`Finished TypeScript in 2.5s`) y generación exitosa de rutas estáticas y dinámicas.
* **Cobertura de Código:** **0% comprobable mediante herramientas automatizadas**.

---

## 22. HISTORIAL DE PROBLEMAS Y ERRORES SOLUCIONADOS

A partir del historial del repositorio de control de versiones Git (`git log -p`), se identifican los siguientes incidentes técnicos reales que fueron solventados:

1. **Incidente de Ocultamiento Silencioso de Trazabilidad en Consulta Pública (Commit `1b66343`):**  
   * *Problema:* El componente de rastreo ciudadano (`/consulta`) no mostraba la línea de tiempo de movimientos ni la ubicación actual de los expedientes al buscar por CUT.  
   * *Causa:* Las tablas `trazabilidad` y `areas` tenían RLS activado permitiendo únicamente lecturas a usuarios autenticados. Al consultar desde un contexto anónimo, PostgREST devolvía un array vacío `[]` y `areas: null` sin generar un error HTTP explícito.  
   * *Solución Inicial:* Uso temporal de cliente con service role key y validación estricta de joins.
2. **Vulnerabilidad de Exposición de Service Role Key en Capa de Consulta (Commit `c3e877c`):**  
   * *Problema:* Riesgo crítico de seguridad por el uso potencial de la clave maestra `SUPABASE_SERVICE_ROLE_KEY` en la acción pública `buscarExpedientePorCut`.  
   * *Causa:* Necesidad de eludir el bloqueo de RLS para el ciudadano sin una capa de desacoplamiento en la base de datos.  
   * *Solución Definitiva:* Creación e integración de dos Vistas SQL públicas (`vista_consulta_ciudadana` y `vista_trazabilidad_ciudadana`) en PostgreSQL, eliminando por completo la Service Role Key de `consulta.ts` y restableciendo el cliente anónimo estándar.
3. **Excepción por Formateo de Fechas Inválidas o Nulas:**  
   * *Problema:* Potencial caída de componentes cliente con error `RangeError: Invalid time value` al procesar campos de fecha vacíos mediante `date-fns`.  
   * *Causa:* Registros históricos o estados intermedios sin `fecha_envio` formalizada.  
   * *Solución:* Implementación de la función defensiva `formatDateSafe` con bloques `try / catch` y verificación de `isNaN(d.getTime())`.

---

## 23. EVALUACIÓN PRELIMINAR DE CALIDAD DE SOFTWARE (ISO/IEC 25010)

| Característica ISO 25010 | Evidencia en el Código | Nivel de Implementación | Observaciones y Limitaciones Técnicas |
| :--- | :--- | :---: | :--- |
| **Adecuación Funcional** | Flujo completo de radicación, recepción, derivación, anexo documental, cierre y consulta ciudadana. | **Alto** | Cumple con los requerimientos operativos esenciales del trámite municipal. Falta la Bandeja de Salida. |
| **Eficiencia de Desempeño** | Compilación Turbopack en 1.1s; consultas indexadas por PK/CUT; conteos paralelos con `Promise.all` y paginación en servidor. | **Alto** | Excelente respuesta. La carga de adjuntos delega el binario a Supabase Storage optimizando el ancho de banda del servidor Next.js. |
| **Compatibilidad** | Diseño responsive estructurado con Tailwind CSS; visualizador PDF estándar basado en iframe nativo del navegador. | **Alto** | Compatible con navegadores modernos (Chrome, Firefox, Edge, Safari). No requiere plugins propietarios. |
| **Usabilidad** | Notificaciones visuales (`Alert`), indicadores de estado por colores, diálogos modales claros y menú de perfil. | **Medio-Alto** | Interfaz intuitiva. Podría enriquecerse con retroalimentación tipo toast no intrusiva y breadcrumbs explícitos. |
| **Fiabilidad** | Captura exhaustiva de errores en Server Actions, transacciones controladas con validación `!data`, verificación de fechas. | **Medio-Alto** | Alta robustez en tiempo de ejecución. La ausencia de tests unitarios automáticos limita la garantía ante regresiones. |
| **Seguridad** | Tokens JWT en cookies HTTP-only, middleware perimetral, RBAC en servidor, Vistas SQL para el ciudadano, Zod schemas. | **Alto** | Buen aislamiento. Las credenciales maestras están resguardadas en el entorno Node.js y no se exponen al navegador. |
| **Mantenibilidad** | Código fuertemente tipado en TypeScript, modularización por dominios (`components/modules/`), esquemas desacoplados. | **Alto** | Código limpio, legible y modular. Fácilmente extensible para nuevos módulos o tipos de trámite. |
| **Portabilidad** | Desacoplamiento de plataforma gracias a Next.js y Supabase; empaquetable en contenedores estándar Node.js. | **Alto** | Desplegable indistintamente en Vercel, AWS ECS, Google Cloud Run o infraestructura on-premise con Node.js. |

---

## 24. REQUISITOS FUNCIONALES DETECTABLES (RF)

| ID | Requisito Funcional | Actor Principal | Módulo | Evidencia en Código |
| :---: | :--- | :--- | :--- | :--- |
| **RF-001** | El sistema debe permitir iniciar sesión mediante correo institucional y contraseña cifrada. | Todos los empleados | Autenticación | `app/actions/auth.ts` (`loginAction`) |
| **RF-002** | El sistema debe permitir cerrar la sesión activa revocando las cookies de autenticación. | Todos los empleados | Autenticación | `app/actions/auth.ts` (`logoutAction`) |
| **RF-003** | El sistema debe permitir solicitar la recuperación de contraseña mediante correo institucional. | Todos los empleados | Autenticación | `app/actions/auth.ts` (`forgotPasswordAction`) |
| **RF-004** | El Administrador de TI debe poder registrar nuevos empleados asignando nombre, DNI, rol y área. | `ADMIN_TI` | Administración | `app/actions/admin.ts` (`crearEmpleado`) |
| **RF-005** | El Administrador de TI debe poder modificar los datos laborales y el área de un empleado. | `ADMIN_TI` | Administración | `app/actions/admin.ts` (`actualizarEmpleado`) |
| **RF-006** | El Administrador de TI debe poder activar o desactivar lógicamente a un empleado municipal. | `ADMIN_TI` | Administración | `app/actions/admin.ts` (`cambiarEstadoEmpleado`) |
| **RF-007** | El sistema debe forzar el área a NULL cuando se crea o edita un usuario con rol `ADMIN_TI`. | `ADMIN_TI` | Administración | `app/actions/admin.ts` (Línea 204 y 341) |
| **RF-008** | Mesa de Partes debe poder registrar un expediente ingresando datos del administrado y generando CUT. | `MESA_PARTES` | Mesa de Partes | `app/actions/expedientes.ts` (`createExpedienteAction`) |
| **RF-009** | El sistema debe permitir la carga inicial de archivos adjuntos (máximo 5MB por archivo) a Storage. | `MESA_PARTES` | Mesa de Partes | `app/actions/expedientes.ts` (`upload` a bucket `documentos`) |
| **RF-010** | El sistema debe listar en la bandeja de entrada únicamente los expedientes situados en el área del usuario. | Funcionarios | Bandeja | `app/dashboard/bandeja/page.tsx` (`.eq('area_actual_id', areaId)`) |
| **RF-011** | El sistema debe permitir filtrar la bandeja por pestañas ("Pendientes" vs "Finalizados"), estado y búsqueda por texto. | Funcionarios | Bandeja | `components/modules/bandeja/BandejaFiltros.tsx` |
| **RF-012** | El usuario del área debe poder confirmar la recepción de un trámite en estado DERIVADO o REGISTRADO. | Funcionarios | Bandeja | `app/actions/bandeja.ts` (`recepcionarExpedienteAction`) |
| **RF-013** | El sistema debe visualizar documentos PDF en un modal embebido sin necesidad de descargarlos. | Funcionarios | Expedientes | `components/shared/PdfViewerModal.tsx` |
| **RF-014** | Los especialistas y jefes deben poder adjuntar documentos intermedios identificados con su `area_id`. | `ESPECIALISTA`, `JEFE_AREA` | Expedientes | `app/actions/expedientes.ts` (`subirDocumentosIntermediosAction`) |
| **RF-015** | El usuario debe poder derivar un expediente a otra área registrando el proveído de pase. | Funcionarios | Expedientes | `app/actions/expedientes.ts` (`derivarExpedienteAction`) |
| **RF-016** | Solo el Jefe de Área o Admin TI debe poder finalizar o archivar un expediente recepcionado. | `JEFE_AREA`, `ADMIN_TI` | Expedientes | `app/actions/expedientes.ts` (`finalizarExpedienteAction`) |
| **RF-017** | El ciudadano debe poder consultar el estado y la línea de tiempo de su trámite ingresando su CUT de forma anónima. | Ciudadano | Consulta | `app/actions/consulta.ts` (`buscarExpedientePorCut`) |
| **RF-018** | El sistema debe mostrar un resumen cuantitativo en tiempo real del estado general de expedientes. | Funcionarios | Dashboard | `app/dashboard/page.tsx` (`Promise.all` conteos exactos) |

---

## 25. REQUISITOS NO FUNCIONALES DETECTABLES (RNF)

| ID | Categoría | Descripción Técnica del Requisito | Evidencia en el Código |
| :---: | :--- | :--- | :--- |
| **RNF-001** | **Seguridad** | Todas las contraseñas deben estar protegidas mediante algoritmos de hash criptográfico gestionados en Supabase Auth. | Integración con Supabase GoTrue Auth en `admin.ts` y `auth.ts`. |
| **RNF-002** | **Seguridad** | Las rutas administrativas y de intranet deben requerir sesión activa validada en el servidor perimetral antes de procesar la página. | `middleware.ts` y `lib/supabase/middleware.ts`. |
| **RNF-003** | **Seguridad** | La consulta pública ciudadana no debe exponer credenciales privilegiadas (`SUPABASE_SERVICE_ROLE_KEY`) ni datos personales del administrado. | `app/actions/consulta.ts` consumiendo Vistas SQL anonimizadas. |
| **RNF-004** | **Rendimiento** | Las consultas masivas de listado de expedientes deben implementar paginación en servidor con tamaño de página predeterminado de 10 registros. | `app/dashboard/bandeja/page.tsx` (`range(from, to)` con `pageSize = 10`). |
| **RNF-005** | **Integridad** | Cada cambio de estado, pase entre áreas o anexo documental debe registrar una huella inmutable en la tabla `trazabilidad`. | Inserciones en `trazabilidad` en `expedientes.ts` y `bandeja.ts`. |
| **RNF-006** | **Integridad de Datos** | La información de formularios debe ser verificada de forma idéntica en frontend y backend mediante esquemas Zod compartidos. | `lib/validators/*.schema.ts`. |
| **RNF-007** | **Disponibilidad / UX** | El fallo en la carga de un archivo o una consulta individual no debe provocar la caída del servidor; debe capturarse y presentarse amigablemente. | Try/catch en Server Actions y renderizado en `<Alert variant="destructive">`. |
| **RNF-008** | **Mantenibilidad** | Todo el código base debe compilar bajo el modo estricto de TypeScript (`strict: true`) sin errores de tipado. | Archivo `tsconfig.json` y salida exitosa de `npx tsc --noEmit`. |
| **RNF-009** | **Usabilidad** | La interfaz debe adaptarse fluidamente a dispositivos móviles, tablets y escritorios utilizando breakpoints Tailwind CSS. | Uso de clases `sm:`, `md:`, `lg:` en layouts y tablas con scroll horizontal. |
| **RNF-010** | **Almacenamiento** | Los archivos adjuntos no deben guardarse como blobs en la base de datos relacional, sino en un servicio de almacenamiento de objetos independiente. | Subida a Supabase Storage bucket `documentos` guardando solo la URL en PostgreSQL. |

---

## 26. CASOS DE USO DETECTABLES

### CU-01: Iniciar Sesión en la Intranet
* **Actor:** Empleado Municipal / Administrador.
* **Objetivo:** Autenticarse para acceder a las funciones de su rol y área.
* **Módulo:** Autenticación (`M-01`).
* **Precondiciones:** El empleado debe estar registrado y en estado `activo: true`.
* **Flujo Principal:**
  1. El usuario ingresa a `/login`.
  2. Digita su correo institucional y contraseña.
  3. Presiona "Iniciar Sesión".
  4. El sistema valida los datos con `loginAction`.
  5. Se emite la cookie de sesión y se redirige a `/dashboard`.
* **Flujo Alternativo:** Si las credenciales son incorrectas, se muestra una alerta destructiva: *"Correo o contraseña incorrectos"*.
* **Evidencia:** `app/(auth)/login/page.tsx`, `app/actions/auth.ts`.

### CU-02: Radicar Nuevo Expediente con Adjuntos
* **Actor:** Operador de Mesa de Partes (`MESA_PARTES`).
* **Objetivo:** Registrar el trámite de un ciudadano y generar el CUT oficial.
* **Módulo:** Mesa de Partes (`M-03`).
* **Precondiciones:** Usuario con rol `MESA_PARTES` con sesión activa.
* **Flujo Principal:**
  1. Ingresa a `/dashboard/expedientes/nuevo`.
  2. Completa los datos del administrado (DNI/RUC, nombres, teléfono, correo).
  3. Selecciona tipo de trámite, folios y detalla el asunto.
  4. Adjunta uno o más archivos PDF (validados < 5MB).
  5. Envía el formulario.
  6. El sistema crea el registro en `expedientes`, sube los archivos a Storage, crea los registros en `adjuntos` e inserta el primer hito en `trazabilidad`.
  7. El sistema redirige a la bandeja confirmando el CUT generado.
* **Evidencia:** `ExpedienteCreateForm.tsx`, `app/actions/expedientes.ts`.

### CU-03: Recepcionar Expediente en Bandeja de Área
* **Actor:** Funcionario del Área Destino (`ESPECIALISTA`, `JEFE_AREA`).
* **Objetivo:** Dar conformidad de ingreso físico/digital al trámite derivado.
* **Módulo:** Bandeja de Entrada (`M-04`).
* **Precondiciones:** Expediente asignado a `area_actual_id` del usuario en estado `DERIVADO` o `REGISTRADO`.
* **Flujo Principal:**
  1. El funcionario ingresa a `/dashboard/bandeja`.
  2. Localiza el expediente y presiona el botón "Recepcionar".
  3. Se ejecuta `recepcionarExpedienteAction`.
  4. El estado del expediente cambia a `RECEPCIONADO` y se registra el hito en `trazabilidad`.
  5. La tabla se refresca mostrando el badge verde `RECEPCIONADO`.
* **Evidencia:** `BandejaTable.tsx`, `app/actions/bandeja.ts`.

### CU-04: Derivar Expediente a Otra Dependencia
* **Actor:** Funcionario con expediente en estado `RECEPCIONADO`.
* **Objetivo:** Remitir el trámite hacia otra gerencia o subgerencia para informe técnico o prosecución.
* **Módulo:** Gestión de Expedientes (`M-05`).
* **Precondiciones:** Expediente debe encontrarse en estado `RECEPCIONADO`.
* **Flujo Principal:**
  1. Ingresa al detalle `/dashboard/expedientes/[id]`.
  2. Clic en "Derivar Expediente".
  3. En el modal, selecciona el área de destino y redacta la instrucción/proveído.
  4. Presiona "Derivar Documento".
  5. Se ejecuta `derivarExpedienteAction`: actualiza `area_actual_id`, cambia estado a `DERIVADO` e inserta en `trazabilidad`.
  6. Redirige a la bandeja del usuario; el expediente ya no está en su área.
* **Evidencia:** `DerivacionModal.tsx`, `app/actions/expedientes.ts`.

### CU-05: Anexar Documentos Intermedios al Trámite
* **Actor:** `ESPECIALISTA`, `JEFE_AREA`, `ADMIN_TI`.
* **Objetivo:** Adjuntar informes, planos o resoluciones emitidas por el área antes de derivar o finalizar.
* **Módulo:** Gestión de Expedientes (`M-05`).
* **Flujo Principal:**
  1. En `/dashboard/expedientes/[id]`, presiona "Anexar Documentos".
  2. Arrastra o selecciona los archivos PDF generados por su gerencia.
  3. Presiona "Subir Archivos".
  4. Se ejecuta `subirDocumentosIntermediosAction`: sube a Storage, crea filas en `adjuntos` asignando el `area_id` del usuario logueado e inserta hito `ANEXO_DOCUMENTAL` en `trazabilidad`.
  5. La vista se actualiza mostrando los nuevos archivos agrupados bajo el nombre de su área.
* **Evidencia:** `SubirDocumentosDialog.tsx`, `app/actions/expedientes.ts`.

### CU-06: Finalizar o Archivar Expediente
* **Actor:** Exclusivo de `JEFE_AREA` o `ADMIN_TI`.
* **Objetivo:** Declarar atendido o archivar definitivamente el trámite administrativo.
* **Módulo:** Cierre de Expedientes (`M-06`).
* **Precondiciones:** Expediente recepcionado en el área del jefe.
* **Flujo Principal:**
  1. En `/dashboard/expedientes/[id]`, presiona el botón rojo "Finalizar / Archivar".
  2. Selecciona si el trámite concluyó con informe/resolución (`ATENDIDO`) o concluyó y pasa a custodia (`ARCHIVADO`).
  3. Ingresa la observación o proveído final.
  4. Presiona "Confirmar Cierre".
  5. `finalizarExpedienteAction` valida rol, actualiza `expedientes.estado` e inserta la huella final en `trazabilidad`.
* **Evidencia:** `FinalizarExpedienteModal.tsx`, `app/actions/expedientes.ts`.

### CU-07: Consulta y Seguimiento Ciudadano por CUT
* **Actor:** Ciudadano / Administrado (Anónimo).
* **Objetivo:** Conocer la ubicación, estado y ruta de su expediente sin acudir a la municipalidad.
* **Módulo:** Consulta Pública (`M-07`).
* **Flujo Principal:**
  1. Ingresa libremente a `/consulta`.
  2. Digita el código CUT (ej: `EXP-2026-000008-MDLO`).
  3. Presiona "Buscar".
  4. Se ejecuta `buscarExpedientePorCut(cut)` consultando las Vistas SQL públicas.
  5. La interfaz despliega la cabecera con el Asunto, Estado, Ubicación Actual y una línea de tiempo interactiva con cada uno de los pases institucionales.
* **Evidencia:** `app/consulta/page.tsx`, `ConsultaTracker.tsx`, `app/actions/consulta.ts`.

### CU-08: Gestión de Personal y Asignación de Áreas
* **Actor:** Administrador de TI (`ADMIN_TI`).
* **Objetivo:** Dar de alta a un nuevo empleado, editar su adscripción o revocar acceso.
* **Módulo:** Administración OTI (`M-02`).
* **Precondiciones:** Rol `ADMIN_TI` autenticado en `/dashboard/admin`.
* **Flujo Principal:**
  1. Presiona "Nuevo Empleado".
  2. Digita Nombres, Apellidos, DNI (8 dígitos), Email institucional, Contraseña, Rol y Área.
  3. Presiona "Registrar Empleado".
  4. `crearEmpleado` genera el usuario en `auth.users` y en `public.perfiles`.
  5. La tabla se refresca automáticamente listando al nuevo colaborador.
* **Evidencia:** `CrearEmpleadoDialog.tsx`, `EmpleadosTable.tsx`, `app/actions/admin.ts`.

---

## 27. MATRIZ DE TRAZABILIDAD PRELIMINAR

| Requisito Funcional | Caso de Uso | Módulo | Archivo / Implementación Principal | Prueba Existente |
| :--- | :---: | :---: | :--- | :---: |
| **RF-001** (Login) | `CU-01` | `M-01` | `app/actions/auth.ts` &bull; `app/(auth)/login/page.tsx` | Compilación `next build` |
| **RF-002** (Logout) | `CU-01` | `M-01` | `app/actions/auth.ts` &bull; `UserProfileMenu.tsx` | Compilación `next build` |
| **RF-003** (Forgot Password)| `CU-01` | `M-01` | `app/actions/auth.ts` &bull; `forgot-password/page.tsx` | Compilación `next build` |
| **RF-004** (Crear Empleado) | `CU-08` | `M-02` | `app/actions/admin.ts` &bull; `CrearEmpleadoDialog.tsx` | Compilación `next build` |
| **RF-005** (Editar Empleado)| `CU-08` | `M-02` | `app/actions/admin.ts` &bull; `EditarEmpleadoDialog.tsx` | Compilación `next build` |
| **RF-006** (Desactivar Emp.)| `CU-08` | `M-02` | `app/actions/admin.ts` &bull; `EmpleadosTable.tsx` | Compilación `next build` |
| **RF-007** (Regla ADMIN_TI)| `CU-08` | `M-02` | `app/actions/admin.ts` (Líneas 204 y 341) | Verificado en código |
| **RF-008** (Crear Expediente)| `CU-02` | `M-03` | `app/actions/expedientes.ts` &bull; `ExpedienteCreateForm.tsx`| Compilación `next build` |
| **RF-009** (Upload Storage)| `CU-02` | `M-03` | `app/actions/expedientes.ts` (`supabase.storage.upload`) | Compilación `next build` |
| **RF-010** (Filtro por Área)| `CU-03` | `M-04` | `app/dashboard/bandeja/page.tsx` (`.eq('area_actual_id', areaId)`)| Compilación `next build` |
| **RF-011** (Filtros/Paginación)|`CU-03`| `M-04` | `BandejaFiltros.tsx` &bull; `BandejaPaginacion.tsx`| Compilación `next build` |
| **RF-012** (Recepcionar) | `CU-03` | `M-04` | `app/actions/bandeja.ts` &bull; `BandejaTable.tsx` | Compilación `next build` |
| **RF-013** (Visor PDF) | `CU-04` | `M-05` | `components/shared/PdfViewerModal.tsx` | Compilación `next build` |
| **RF-014** (Anexos Intermedios)|`CU-05`| `M-05` | `app/actions/expedientes.ts` &bull; `SubirDocumentosDialog.tsx`| Compilación `next build` |
| **RF-015** (Derivación) | `CU-04` | `M-05` | `app/actions/expedientes.ts` &bull; `DerivacionModal.tsx` | Compilación `next build` |
| **RF-016** (Cierre / Archivo)| `CU-06` | `M-06` | `app/actions/expedientes.ts` &bull; `FinalizarExpedienteModal.tsx`| Compilación `next build` |
| **RF-017** (Consulta CUT) | `CU-07` | `M-07` | `app/actions/consulta.ts` &bull; `ConsultaTracker.tsx` | Compilación `next build` |
| **RF-018** (Resumen Métricas)| `CU-01` | `M-08` | `app/dashboard/page.tsx` (`Promise.all` conteos) | Compilación `next build` |

---

## 28. ARCHIVOS CRÍTICOS DEL SISTEMA

1. **`middleware.ts` & `lib/supabase/middleware.ts`:**  
   *Importancia:* Primera línea de defensa perimetral. Intercepta todas las solicitudes, refresca tokens JWT y bloquea accesos no autenticados hacia `/dashboard/*`.
2. **`app/actions/expedientes.ts`:**  
   *Importancia:* Núcleo transaccional del sistema (625 líneas). Orquesta la creación de expedientes con generación de CUT, la carga de adjuntos multipart a Storage, la derivación entre áreas con control de concurrencia y la finalización/archivamiento protegida por RBAC.
3. **`app/actions/consulta.ts`:**  
   *Importancia:* Puerta de enlace pública ciudadana. Desacoplada de tablas maestras; consume exclusivamente Vistas SQL sanitizadas mediante el cliente anónimo, garantizando transparencia sin riesgo de fuga de datos sensibles.
4. **`app/actions/admin.ts`:**  
   *Importancia:* Módulo de seguridad y gestión de personal OTI (446 líneas). Administra la sincronización dual entre `auth.users` y `public.perfiles`, aplicando reglas de negocio estrictas para roles y áreas.
5. **`app/dashboard/bandeja/page.tsx`:**  
   *Importancia:* Vista operativa central de los funcionarios. Implementa la lógica de filtrado de expedientes por área, separación en pestañas reactivas, búsqueda compuesta y paginación desde el servidor.
6. **`app/dashboard/expedientes/[id]/page.tsx`:**  
   *Importancia:* Pantalla de trabajo y expediente electrónico. Reúne el visor de PDFs, la línea de tiempo cronológica, los anexos clasificados por área emisora y los controles de derivación y cierre según el rol del usuario.
7. **`types/database.types.ts`:**  
   *Importancia:* Contrato de tipos TypeScript del modelo relacional. Garantiza coherencia en consultas, inserciones y actualizaciones en todo el proyecto.

---

## 29. RESUMEN EJECUTIVO

### 1. Naturaleza y Propósito del Sistema
El **Sistema de Gestión Documental de la Municipalidad de Los Olivos (MDLO Docs)** es una solución tecnológica empresarial concebida para modernizar y digitalizar integralmente el flujo de trámite documentario de la corporación edilicia. Resuelve la problemática histórica de extravío de expedientes físicos, retrasos en la atención ciudadana, falta de visibilidad en los pases interdepartamentales y ausencia de auditoría en la gestión pública local. Provee a la administración municipal un flujo controlado y trazable desde la radicación en Mesa de Partes hasta el archivo final, y ofrece a los ciudadanos una ventana transparente para el seguimiento en tiempo real mediante el Código Único de Trámite (CUT).

### 2. Stack Tecnológico y Arquitectura
El sistema se encuentra desarrollado sobre el framework **Next.js 16.3.7** bajo el paradigma **App Router**, aprovechando el motor de renderizado concurrente de **React 19** y tipado estricto en **TypeScript 5**. La arquitectura adopta el patrón **Backend-for-Frontend (BFF)** implementado puramente mediante **Server Actions** (`'use server'`), eliminando la necesidad de endpoints REST tradicionales y asegurando transacciones atómicas desde el servidor. La interfaz visual se basa en **Tailwind CSS v4** y componentes accesibles derivados de **Shadcn UI**, optimizados para un rendimiento fluido y responsivo.

### 3. Persistencia, Seguridad y Supabase
La infraestructura de persistencia descansa en la plataforma en la nube **Supabase**, utilizando una base de datos relacional **PostgreSQL** estructurada en cinco entidades maestras (`areas`, `perfiles`, `expedientes`, `adjuntos`, `trazabilidad`) y dos vistas públicas seguras (`vista_consulta_ciudadana` y `vista_trazabilidad_ciudadana`). El almacenamiento de documentos digitalizados se realiza a través de **Supabase Storage** (bucket `documentos`), guardando únicamente metadatos y rutas de acceso en la base relacional. La seguridad perimetral se encuentra garantizada por un middleware que custodia las sesiones JWT en cookies HTTP-only, políticas de **Row Level Security (RLS)** y una matriz estricta de control de acceso basada en roles (**RBAC**) que distingue claramente las facultades del Administrador TI, operadores de Mesa de Partes, Especialistas técnicos y Jefes de Área.

### 4. Estado de Implementación y Diagnóstico de Calidad
De los nueve módulos funcionales analizados, ocho se encuentran **completamente implementados y funcionales**, incluyendo autenticación, administración de usuarios, registro de expedientes con generación de CUT, bandeja de entrada dinámica con filtros y paginación en servidor, visor de PDFs integrado, derivación con proveído, cierre por jefatura y consulta ciudadana aislada. Únicamente la *Bandeja de Salida* figura como funcionalidad planificada pendiente de una vista dedicada. 

En términos de calidad de software según el estándar **ISO/IEC 25010**, la solución exhibe niveles sobresalientes en **Adecuación Funcional, Seguridad, Rendimiento y Mantenibilidad**, habiendo solucionado en su ciclo de desarrollo incidentes de aislamiento de datos en consultas anónimas. Su principal área de mejora técnica reside en la **Fiabilidad / Calidad de Pruebas**, dado que actualmente carece de suites automatizadas de pruebas unitarias o de integración, sustentando su estabilidad exclusivamente en la compilación estricta de TypeScript y el linter estático.

---

## 30. INFORMACIÓN QUE NO PUDO SER VERIFICADA

Con el propósito de mantener el rigor técnico y no realizar suposiciones no respaldadas en el código real:

1. **Definiciones DDL Exactas de PostgreSQL en Servidor:**  
   No existen archivos `.sql` ni carpetas de migraciones locales (`supabase/migrations/`) dentro del repositorio. El esquema de tablas y vistas fue auditado e inferido a través de `types/database.types.ts`, los payloads de los Server Actions y las respuestas JSON en vivo de PostgREST.
2. **Políticas RLS en el Panel de Supabase:**  
   Las reglas de Row Level Security fueron verificadas experimentalmente mediante llamadas con clientes anon y autenticados (constatando bloqueos y permisos efectivos), pero la sintaxis SQL exacta de los `CREATE POLICY ... USING (...)` reside en la consola de Supabase Cloud y no en archivos versionados del proyecto.
3. **Configuraciones de Proveedores SMTP / Correo:**  
   La función de recuperación de contraseñas (`forgotPasswordAction`) invoca `resetPasswordForEmail`, pero la plantilla de correo y la pasarela SMTP configurada en Supabase Auth corresponden a la infraestructura en la nube y no son visibles en el código local.
4. **Métricas de Cobertura de Código (*Code Coverage*):**  
   Al no existir librerías de prueba (Jest, Vitest, etc.), es imposible determinar una cifra porcentual objetiva de cobertura de ramas (*branch coverage*) o líneas.
5. **Configuración de Dominio y Producción Final:**  
   No se evidencian archivos de infraestructura como código (Terraform, Dockerfile o `k8s.yaml`), por lo que los recursos finales de CPU/RAM y dominio institucional de producción se gestionan externamente.
