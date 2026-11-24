# Reporte de Accesibilidad WAVE/WCAG, Rendimiento Lighthouse (TBT) y Validación SonarQube

**Proyecto:** Sistema de Gestión Documentaria y Trámite Municipal — Municipalidad Distrital de Los Olivos (`SISGESDOC`)  
**Commit de referencia:** `b8880b5`  
**Estándares:** WCAG 2.1 / 2.2 Nivel AA, Ley N.° 29973, Core Web Vitals (Lighthouse TBT) y SonarQube (`@sonar/scan`)

---

## 1. Resolución de Alertas WAVE y Cumplimiento WCAG 2.1 AA

Además de las reglas de `axe-core`, se auditó y corrigió el conjunto completo de alertas heurísticas de **WAVE** en páginas públicas, bandejas, formularios y modales:

| Regla WAVE / WCAG | Causa Raíz Detectada | Solución Implementada | Archivos Modificados |
| :--- | :--- | :--- | :--- |
| `heading_possible` | `<CardTitle>` renderizado como `<div>` con texto grande en negrita sin etiqueta semántica `<h2>`; marca `SISGESDOC` en `Sidebar` con `text-lg font-extrabold`. | Se envolvieron los títulos de tarjetas en `<h2>` y se ajustó la marca en `Sidebar` de escritorio a `text-base`. | [`app/(auth)/login/page.tsx`](../app/(auth)/login/page.tsx), [`ConsultaTracker.tsx`](../components/modules/consulta/ConsultaTracker.tsx), [`app/dashboard/page.tsx`](../app/dashboard/page.tsx), [`ExpedienteCreateForm.tsx`](../components/modules/expedientes/ExpedienteCreateForm.tsx), [`Sidebar.tsx`](../components/shared/Sidebar.tsx) |
| `title_redundant` | Atributos `title` idénticos al texto visible o al `aria-label`. | Se eliminaron los atributos `title` duplicados. | [`BandejaTable.tsx`](../components/modules/bandeja/BandejaTable.tsx), [`app/dashboard/expedientes/[id]/page.tsx`](../app/dashboard/expedientes/%5Bid%5D/page.tsx), [`ExpedienteCreateForm.tsx`](../components/modules/expedientes/ExpedienteCreateForm.tsx), [`PdfViewerModal.tsx`](../components/shared/PdfViewerModal.tsx), [`UserProfileMenu.tsx`](../components/shared/UserProfileMenu.tsx) |
| `label_orphaned` | `<Label>` de solo lectura sin `for`; `<Label htmlFor>` apuntando a `<input type="file" className="hidden">` (`display: none`). | Se reemplazó el `<Label>` de solo lectura por `<p>` y se usó `className="sr-only" tabIndex={-1}` en los `<input type="file">`. | [`EditarEmpleadoDialog.tsx`](../components/admin/EditarEmpleadoDialog.tsx), [`ExpedienteCreateForm.tsx`](../components/modules/expedientes/ExpedienteCreateForm.tsx), [`SubirDocumentosDialog.tsx`](../components/modules/expedientes/SubirDocumentosDialog.tsx) |
| `nested-interactive` (WCAG 4.1.2) | `<Button>` anidado dentro de `<Link>`, y `<input type="file">` dentro de `<div role="button">`. | Se usó `buttonVariants` directamente en `<Link>` y se movió `<input>` como hermano previo al dropzone. | [`app/dashboard/bandeja/page.tsx`](../app/dashboard/bandeja/page.tsx), [`BandejaTable.tsx`](../components/modules/bandeja/BandejaTable.tsx), [`SubirDocumentosDialog.tsx`](../components/modules/expedientes/SubirDocumentosDialog.tsx) |
| `link_redundant` | Enlace duplicado en la celda CUT y botón de detalle hacia la misma ruta. | Se mantuvo la celda CUT como `<span>` y un único enlace descriptivo de acción. | [`BandejaTable.tsx`](../components/modules/bandeja/BandejaTable.tsx) |
| Landmarks, contraste e idioma | Texto `text-slate-600 sr-only` dentro de `<header>` oscuro; íconos sin `aria-hidden="true"`; textos de cierre en inglés (`Close`, `Close toast`). | Se definieron `role="banner"`, `main tabIndex={-1}`, `role="contentinfo"` con `text-slate-600`; `aria-hidden="true"` en íconos y etiquetas `Cerrar` / `Cerrar notificación`. | [`app/consulta/page.tsx`](../app/consulta/page.tsx), [`dialog.tsx`](../components/ui/dialog.tsx), [`toast.tsx`](../components/ui/toast.tsx), [`select.tsx`](../components/ui/select.tsx), [`dropdown-menu.tsx`](../components/ui/dropdown-menu.tsx) |

---

## 2. Pruebas Reales y Visibles de Accesibilidad

1. **Suite DOM Real en Vitest (`jsdom` + `axe-core` + motor WAVE):**  
   [`tests/unit/accessibility-dom.test.tsx`](../tests/unit/accessibility-dom.test.tsx) ejecuta **23 pruebas** sobre páginas públicas, vistas del dashboard y **7 modales abiertos**, verificando `0` violaciones `axe-core` y `0` alertas WAVE (`heading_possible`, `title_redundant`, `label_orphaned`, `link_redundant`, `nested_interactive`, `heading_skipped`, `english_a11y_label`, `unhidden_decorative_svg`).
2. **Suite E2E en Google Chrome + Reporte HTML/JSON Visible:**  
   [`tests/e2e/accesibilidad.selenium.mjs`](../tests/e2e/accesibilidad.selenium.mjs) (`npm run test:a11y`, o `npm run test:a11y:visible` con ventana visible `HEADLESS=false`) audita **8 escenarios** en Chrome real (Desktop `1280x800`, Móvil `390x844` y validación interactiva con errores en `/login`, `/consulta` y `/forgot-password`), incluyendo cálculo computado de contraste RGBA/OKLCH.
   - **Resultado:** `8/8` escenarios aprobados — **0 violaciones axe-core**, **0 errores WAVE**, **0 errores de contraste**, **0 alertas WAVE**.
   - **Reportes generados:** [`reports/accessibility-report.html`](../reports/accessibility-report.html) y [`reports/accessibility-report.json`](../reports/accessibility-report.json).

---

## 3. Optimización de Total Blocking Time (TBT) en Lighthouse

### Cambios aplicados
- Se removió `<Toaster />` del layout raíz [`app/layout.tsx`](../app/layout.tsx) y se cargó de forma diferida (`next/dynamic` con `ssr: false`) únicamente donde se utiliza ([`EmpleadosTable.tsx`](../components/admin/EmpleadosTable.tsx)).
- Se reemplazaron `react-hook-form`, `@hookform/resolvers/zod` y `zod` en [`app/(auth)/login/page.tsx`](../app/(auth)/login/page.tsx) y [`app/(auth)/forgot-password/page.tsx`](../app/(auth)/forgot-password/page.tsx) por validación nativa ligera.
- Se reemplazaron los wrappers `@base-ui/react/button` e `@base-ui/react/input` en [`button.tsx`](../components/ui/button.tsx) e [`input.tsx`](../components/ui/input.tsx) por elementos nativos `<button>` e `<input>`.
- Se sustituyó `date-fns` + `date-fns/locale/es` en [`ConsultaTracker.tsx`](../components/modules/consulta/ConsultaTracker.tsx) por `Intl.DateTimeFormat('es-PE', ...)`, y se removió `force-dynamic` en [`app/consulta/page.tsx`](../app/consulta/page.tsx) habilitando prerenderizado estático.
- Se configuró `experimental.optimizePackageImports: ["lucide-react", "date-fns", "@base-ui/react"]` en [`next.config.ts`](../next.config.ts) y se migró `middleware.ts` a [`proxy.ts`](../proxy.ts) con vía rápida en [`lib/supabase/middleware.ts`](../lib/supabase/middleware.ts) cuando no existen cookies `sb-*`.

### Resultados Medidos (Build de Producción)

| Ruta | Performance (antes → después) | A11y / BP / SEO | TBT (antes → después) | Reducción de TBT | FCP / LCP |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/login` | 79 → **97** | 100 / 100 / 100 | 958 ms → **207 ms** | **-78.4%** | 1.0 s / 1.0 s |
| `/consulta` | 87 → **96** | 100 / 100 / 100 | 503 ms → **238 ms** | **-52.7%** | 0.9 s / 0.9 s |
| `/forgot-password` | 85 → **98** | 100 / 100 / 100 | 607 ms → **176 ms** | **-71.0%** | 0.9 s / 0.9 s |

---

## 4. Validación de Reportes SonarQube

- [`vitest.config.ts`](../vitest.config.ts) limita la cobertura a `app/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}` y `lib/**/*.{ts,tsx}`, excluyendo `tests/**` y mocks.
- [`sonar-project.properties`](../sonar-project.properties) define `sonar.sourceEncoding=UTF-8`, `sonar.test.exclusions`, `sonar.coverage.exclusions` y exclusiones de carpetas generadas.
- [`scripts/verify-sonar-reports.mjs`](../scripts/verify-sonar-reports.mjs) (`npm run sonar:report`) valida:
  - [`reports/sonar-report.xml`](../reports/sonar-report.xml): **6 archivos de prueba, 85 casos ejecutados, 0 fallos/errores**.
  - `coverage/lcov.info`: **75 archivos fuente** (100% dentro de `app`, `components`, `lib`), **693 / 2044 líneas (`33.90%`)**.
  - `@sonar/scan` v5.1.0: resolución válida de `sonar-project.properties` (`projectKey="sistema-gestion-olivos"`, 25 propiedades).
