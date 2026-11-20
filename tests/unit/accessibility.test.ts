// tests/unit/accessibility.test.ts

import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

function readComponentSource(relativePath: string): string {
  const fullPath = path.resolve(process.cwd(), relativePath)
  return fs.readFileSync(fullPath, 'utf-8')
}

describe('Auditoría de Accesibilidad Web (WCAG 2.1/2.2 AA - axe / WAVE / Lighthouse)', () => {
  it('Navbar.tsx implementa landmark <header role="banner"> y atributos aria-label descriptivos', () => {
    const src = readComponentSource('components/shared/Navbar.tsx')
    expect(src).toContain('<header')
    expect(src).toContain('role="banner"')
    expect(src).toContain('aria-label="Barra superior institucional"')
  })

  it('Sidebar.tsx implementa <aside>, <nav>, aria-current="page", íconos con aria-hidden y contraste AA', () => {
    const src = readComponentSource('components/shared/Sidebar.tsx')
    expect(src).toContain('<aside')
    expect(src).toContain('aria-label="Barra lateral del sistema"')
    expect(src).toContain('<nav')
    expect(src).toContain('aria-label="Navegación principal"')
    expect(src).toContain("aria-current={isActive ? 'page' : undefined}")
    expect(src).toContain('aria-hidden="true"')
    // Contraste mejorado en el pie de página (text-slate-600 en lugar de text-slate-400)
    expect(src).toContain('text-slate-600')
    expect(src).not.toContain('text-slate-400')
  })

  it('BandejaTable.tsx cumple WCAG 1.3.1 (caption, scope="col"), WCAG 1.4.3 (contraste de badges) y WCAG 2.4.4 (aria-label contextual por fila)', () => {
    const src = readComponentSource('components/modules/bandeja/BandejaTable.tsx')
    expect(src).toContain('<caption className="sr-only">')
    expect(src).toContain('scope="col"')
    expect(src).toContain('aria-live=')
    expect(src).toContain('aria-label={`Recibir expediente ${cutLabel}`}')
    expect(src).toContain('aria-label=')
    // Contraste AA en estado DERIVADO (bg-amber-700 text-white > 4.5:1 en lugar de bg-amber-500)
    expect(src).toContain('bg-amber-700 text-white')
    expect(src).not.toContain('bg-amber-500 text-white')
  })

  it('ExpedienteCreateForm.tsx implementa zona de carga operable por teclado (role="button", tabIndex=0, onKeyDown) y asociación Label/Input', () => {
    const src = readComponentSource(
      'components/modules/expedientes/ExpedienteCreateForm.tsx'
    )
    expect(src).toContain('role="alert"')
    expect(src).toContain('aria-live="assertive"')
    expect(src).toContain('htmlFor="archivos_adjuntos"')
    expect(src).toContain('id="archivos_adjuntos"')
    expect(src).toContain('role="button"')
    expect(src).toContain('tabIndex={0}')
    expect(src).toContain('onKeyDown={handleDropzoneKeyDown}')
    expect(src).toContain('aria-required="true"')
    expect(src).toContain('aria-label={`Eliminar archivo adjunto ${archivo.name}`}')
  })

  it('DerivacionModal.tsx asocia explícitamente <Label htmlFor> con <SelectTrigger id> y <Textarea id> e incluye aria-invalid y aria-describedby', () => {
    const src = readComponentSource('components/modules/expedientes/DerivacionModal.tsx')
    expect(src).toContain('htmlFor="area_destino_id"')
    expect(src).toContain('id="area_destino_id"')
    expect(src).toContain('htmlFor="proveido"')
    expect(src).toContain('id="proveido"')
    expect(src).toContain('aria-invalid={Boolean(errors.area_destino_id)}')
    expect(src).toContain('aria-invalid={Boolean(errors.proveido)}')
    expect(src).toContain('aria-describedby=')
    expect(src).toContain('id="area-destino-error"')
    expect(src).toContain('id="proveido-error"')
  })

  it('PdfViewerModal.tsx proporciona aria-label con el nombre del archivo en el disparador, enlace externo y título descriptivo en iframe', () => {
    const src = readComponentSource('components/shared/PdfViewerModal.tsx')
    expect(src).toContain('aria-label={`Ver documento adjunto ${nombreArchivo}`}')
    expect(src).toContain('aria-label={`Abrir documento ${nombreArchivo} en una pestaña nueva`}')
    expect(src).toContain('title={`Visor de documento PDF: ${nombreArchivo}`}')
    expect(src).toContain('rel="noopener noreferrer"')
  })

  it('ConsultaTracker.tsx incluye <Label htmlFor="cut-search-input">, regiones aria-live y lista ordenada semántica <ol> para la línea de tiempo', () => {
    const src = readComponentSource('components/modules/consulta/ConsultaTracker.tsx')
    expect(src).toContain('htmlFor="cut-search-input"')
    expect(src).toContain('id="cut-search-input"')
    expect(src).toContain('role="search"')
    expect(src).toContain('aria-invalid={Boolean(errorMsg)}')
    expect(src).toContain('aria-describedby=')
    expect(src).toContain('aria-live="polite"')
    expect(src).toContain('<ol')
    expect(src).toContain('<li')
  })

  it('app/(auth)/login/page.tsx incluye landmark <main>, alerta aria-live, campos con aria-required/aria-invalid y foco visible', () => {
    const src = readComponentSource('app/(auth)/login/page.tsx')
    expect(src).toContain('<main')
    expect(src).toContain('role="alert"')
    expect(src).toContain('aria-live="assertive"')
    expect(src).toContain('autoComplete="email"')
    expect(src).toContain('autoComplete="current-password"')
    expect(src).toContain('aria-required="true"')
    expect(src).toContain('aria-invalid={Boolean(errors.email)}')
    expect(src).toContain('aria-invalid={Boolean(errors.password)}')
    expect(src).toContain('aria-busy={isPending}')
  })

  it('app/consulta/page.tsx implementa landmarks <main> y <header>, ícono decorativo oculto y contraste AA', () => {
    const src = readComponentSource('app/consulta/page.tsx')
    expect(src).toContain('<main')
    expect(src).toContain('<header')
    expect(src).toContain('aria-hidden="true"')
    expect(src).toContain('text-slate-600')
    expect(src).not.toContain('text-slate-500')
  })

  it('BandejaPaginacion.tsx y BandejaTabsNav.tsx usan landmark <nav>, aria-live y etiquetas accesibles', () => {
    const pagSrc = readComponentSource('components/modules/bandeja/BandejaPaginacion.tsx')
    expect(pagSrc).toContain('<nav')
    expect(pagSrc).toContain('aria-label="Paginación de expedientes"')
    expect(pagSrc).toContain('aria-label="Ir a la página anterior"')
    expect(pagSrc).toContain('aria-label="Ir a la página siguiente"')
    expect(pagSrc).toContain('aria-live="polite"')

    const tabsSrc = readComponentSource('components/modules/bandeja/BandejaTabsNav.tsx')
    expect(tabsSrc).toContain('<nav')
    expect(tabsSrc).toContain('aria-label="Vistas de bandeja de expedientes"')
    expect(tabsSrc).toContain('role="status"')
  })

  it('SubirDocumentosDialog.tsx ofrece zona PDF operable por teclado, foco visible y lista semántica <ul>', () => {
    const src = readComponentSource('components/modules/expedientes/SubirDocumentosDialog.tsx')
    expect(src).toContain('htmlFor="archivos_pdf_intermedio"')
    expect(src).toContain('id="archivos_pdf_intermedio"')
    expect(src).toContain('role="button"')
    expect(src).toContain('tabIndex={0}')
    expect(src).toContain('onKeyDown=')
    expect(src).toContain('focus-visible:ring-2')
    expect(src).toContain('<ul')
  })
})
