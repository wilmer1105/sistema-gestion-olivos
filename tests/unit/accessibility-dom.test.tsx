// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axe from 'axe-core'

import type {
  IExpedienteLectura,
  IConsultaCiudadanaMovimiento,
} from '@/lib/domain/contracts/expediente.contracts'
import type { EmpleadoItem } from '@/app/actions/admin'
import type { EspecialistaAreaOption } from '@/components/modules/expedientes/AsignarEspecialistaModal'

// Habilitar entorno React act() en Vitest + jsdom
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// Polyfills mínimos para librerías UI en jsdom
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (typeof HTMLCanvasElement !== 'undefined') {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => null,
  })
}

// Mocks de Next.js y Server Actions (no red ni Supabase real en tests DOM)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard/bandeja',
  useSearchParams: () => new URLSearchParams('tab=pendientes'),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={String(href)} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('next/dynamic', () => ({
  default: () => {
    const DummyDynamic = () => null
    return DummyDynamic
  },
}))

vi.mock('@/app/actions/auth', () => ({
  loginAction: vi.fn(async () => ({ success: true })),
  forgotPasswordAction: vi.fn(async () => ({ success: true, message: 'OK' })),
  logoutAction: vi.fn(async () => undefined),
}))

vi.mock('@/app/actions/consulta', () => ({
  consultarExpedientePorCut: vi.fn(async () => ({ success: true })),
}))

vi.mock('@/app/actions/bandeja', () => ({
  recepcionarExpedienteAction: vi.fn(async () => ({ success: true })),
}))

vi.mock('@/app/actions/expedientes', () => ({
  createExpedienteAction: vi.fn(async () => ({ success: true })),
  subirDocumentoIntermedioAction: vi.fn(async () => ({ success: true })),
  finalizarExpedienteAction: vi.fn(async () => ({ success: true })),
}))

vi.mock('@/app/actions/derivaciones', () => ({
  derivarExpedienteAction: vi.fn(async () => ({ success: true })),
  asignarEspecialistaAction: vi.fn(async () => ({ success: true })),
}))

vi.mock('@/app/actions/admin', () => ({
  cambiarEstadoEmpleado: vi.fn(async () => ({ success: true })),
  crearEmpleadoAction: vi.fn(async () => ({ success: true })),
  editarEmpleadoAction: vi.fn(async () => ({ success: true })),
  crearEmpleado: vi.fn(async () => ({ success: true })),
  editarEmpleado: vi.fn(async () => ({ success: true })),
}))

import LoginPage from '@/app/(auth)/login/page'
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page'
import ConsultaPublicaPage from '@/app/consulta/page'
import { ConsultaTracker, HojaDeRutaTimeline } from '@/components/modules/consulta/ConsultaTracker'
import { Sidebar } from '@/components/shared/Sidebar'
import { UserProfileMenu } from '@/components/shared/UserProfileMenu'
import { BackButton } from '@/components/shared/BackButton'
import { PdfViewerModal } from '@/components/shared/PdfViewerModal'
import { BandejaTable } from '@/components/modules/bandeja/BandejaTable'
import { BandejaFiltros } from '@/components/modules/bandeja/BandejaFiltros'
import { BandejaPaginacion } from '@/components/modules/bandeja/BandejaPaginacion'
import { BandejaTabsNav } from '@/components/modules/bandeja/BandejaTabsNav'
import { ExpedienteCreateForm } from '@/components/modules/expedientes/ExpedienteCreateForm'
import { DerivacionModal } from '@/components/modules/expedientes/DerivacionModal'
import { AsignarEspecialistaModal } from '@/components/modules/expedientes/AsignarEspecialistaModal'
import { FinalizarExpedienteModal } from '@/components/expedientes/FinalizarExpedienteModal'
import { SubirDocumentosDialog } from '@/components/modules/expedientes/SubirDocumentosDialog'
import { RecepcionarExpedienteBanner } from '@/components/modules/expedientes/RecepcionarExpedienteBanner'
import { EmpleadosTable } from '@/components/admin/EmpleadosTable'
import { CrearEmpleadoDialog } from '@/components/admin/CrearEmpleadoDialog'
import { EditarEmpleadoDialog } from '@/components/admin/EditarEmpleadoDialog'

interface WaveFinding {
  rule: string
  message: string
  snippet: string
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function serializeElement(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const id = el.id ? `#${el.id}` : ''
  const cls =
    typeof el.className === 'string' && el.className.trim()
      ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}`
      : ''
  const text = normalizeText(el.textContent).slice(0, 45)
  return `<${tag}${id}${cls}>${text ? ` "${text}"` : ''}`
}

/**
 * Audita reglas heurísticas de WAVE sobre un árbol DOM real renderizado.
 */
function auditWaveAlertsDom(container: ParentNode, doc: Document): WaveFinding[] {
  const findings: WaveFinding[] = []

  // 1. heading_possible: card-titles o párrafos grandes en negrita sin etiqueta semántica h1-h6
  const cardTitles = container.querySelectorAll('[data-slot="card-title"]')
  cardTitles.forEach((el) => {
    const hasHeading = Boolean(el.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]'))
    const isHeadingTag = /^H[1-6]$/.test(el.tagName)
    if (!hasHeading && !isHeadingTag && el.getAttribute('role') !== 'heading') {
      findings.push({
        rule: 'heading_possible',
        message: 'CardTitle sin encabezado semántico (h1-h6)',
        snippet: serializeElement(el),
      })
    }
  })

  const nonHeadingBlocks = container.querySelectorAll('p, div, span')
  nonHeadingBlocks.forEach((el) => {
    if (el.closest('h1, h2, h3, h4, h5, h6, [role="heading"], button, a, label, th, table')) {
      return
    }
    const cls = typeof el.className === 'string' ? el.className : ''
    const hasBold = /\b(font-bold|font-semibold|font-extrabold)\b/.test(cls)
    const hasLargeSize = /\b(text-lg|text-xl|text-2xl|text-3xl|text-4xl)\b/.test(cls)
    const hasNestedHeading = Boolean(el.querySelector('h1, h2, h3, h4, h5, h6'))
    const text = normalizeText(el.textContent)
    if (
      hasBold &&
      hasLargeSize &&
      !hasNestedHeading &&
      el.children.length <= 2 &&
      text.length > 0 &&
      text.length <= 90 &&
      el.getAttribute('data-slot') !== 'card-title'
    ) {
      findings.push({
        rule: 'heading_possible',
        message: 'Texto grande en negrita debería usar etiqueta h1-h6 o estilo sutil',
        snippet: serializeElement(el),
      })
    }
  })

  // 2. title_redundant: atributo title idéntico al texto visible o aria-label
  const titledEls = container.querySelectorAll('[title]')
  titledEls.forEach((el) => {
    if (el.tagName.toLowerCase() === 'iframe') return
    const titleVal = normalizeText(el.getAttribute('title'))
    const textVal = normalizeText(el.textContent)
    const ariaVal = normalizeText(el.getAttribute('aria-label'))
    if (titleVal && (titleVal === textVal || titleVal === ariaVal)) {
      findings.push({
        rule: 'title_redundant',
        message: 'Atributo title duplica el texto visible o aria-label',
        snippet: serializeElement(el),
      })
    }
  })

  // 3. label_orphaned: label sin control asociado o apuntando a input display:none
  const labels = container.querySelectorAll('label')
  labels.forEach((label) => {
    const forId = label.getAttribute('for')
    if (!forId) {
      const hasNestedControl = Boolean(label.querySelector('input, select, textarea'))
      if (!hasNestedControl) {
        findings.push({
          rule: 'label_orphaned',
          message: 'Label sin atributo for ni control de formulario anidado',
          snippet: serializeElement(label),
        })
      }
      return
    }
    const target = doc.getElementById(forId)
    if (!target) {
      findings.push({
        rule: 'label_orphaned',
        message: `Label apunta a #${forId} inexistente`,
        snippet: serializeElement(label),
      })
      return
    }
    const targetCls = typeof target.className === 'string' ? target.className : ''
    if (target.getAttribute('type') === 'hidden' || /\bhidden\b/.test(targetCls)) {
      findings.push({
        rule: 'label_orphaned',
        message: `Label apunta a control oculto con display:none (#${forId})`,
        snippet: serializeElement(label),
      })
    }
  })

  // 4. link_redundant: enlaces consecutivos en un mismo contenedor apuntando al mismo href
  const containersWithLinks = container.querySelectorAll('tr, nav, div, td, ul')
  containersWithLinks.forEach((box) => {
    const directOrNearLinks = Array.from(box.querySelectorAll('a[href]')).filter(
      (a) => a.parentElement === box
    )
    for (let i = 1; i < directOrNearLinks.length; i += 1) {
      const prevHref = directOrNearLinks[i - 1].getAttribute('href')
      const currHref = directOrNearLinks[i].getAttribute('href')
      if (prevHref && prevHref === currHref) {
        findings.push({
          rule: 'link_redundant',
          message: `Enlaces adyacentes redundantes hacia ${currHref}`,
          snippet: serializeElement(directOrNearLinks[i]),
        })
      }
    }
  })

  // 5. nested_interactive: botón dentro de enlace o enlace dentro de botón
  const nestedInteractive = container.querySelectorAll(
    'a[href] button, button a[href], a[href] a[href], button button'
  )
  nestedInteractive.forEach((el) => {
    findings.push({
      rule: 'nested_interactive',
      message: 'Elemento interactivo anidado dentro de otro elemento interactivo',
      snippet: serializeElement(el),
    })
  })

  // 6. heading_skipped: saltos de nivel en encabezados
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  let prevLevel = 0
  headings.forEach((h) => {
    const level = Number(h.tagName.slice(1))
    if (prevLevel > 0 && level - prevLevel > 1) {
      findings.push({
        rule: 'heading_skipped',
        message: `Salto de nivel de encabezado: h${prevLevel} -> h${level}`,
        snippet: serializeElement(h),
      })
    }
    prevLevel = level
  })

  // 7. english_a11y_label: textos accesibles sin traducir al español
  const a11yTexts = container.querySelectorAll('.sr-only, [aria-label]')
  a11yTexts.forEach((el) => {
    const sr = normalizeText(el.classList.contains('sr-only') ? el.textContent : '')
    const aria = normalizeText(el.getAttribute('aria-label'))
    if (sr === 'close' || aria === 'close toast' || aria === 'close') {
      findings.push({
        rule: 'english_a11y_label',
        message: 'Etiqueta accesible en inglés sin traducir',
        snippet: serializeElement(el),
      })
    }
  })

  // 8. unhidden_decorative_svg: iconos decorativos en botones o links con texto sin aria-hidden="true"
  const controlsWithIcons = container.querySelectorAll('button, a[href]')
  controlsWithIcons.forEach((ctrl) => {
    const textVal = normalizeText(ctrl.textContent)
    const ariaLabel = normalizeText(ctrl.getAttribute('aria-label'))
    if (!textVal && !ariaLabel) return
    const svgs = ctrl.querySelectorAll('svg')
    svgs.forEach((svg) => {
      if (svg.getAttribute('aria-hidden') !== 'true' && !svg.getAttribute('aria-label')) {
        findings.push({
          rule: 'unhidden_decorative_svg',
          message: 'Ícono SVG dentro de control con texto carece de aria-hidden="true"',
          snippet: serializeElement(ctrl),
        })
      }
    })
  })

  return findings
}

async function runAxeAndWaveAudit(
  ui: React.ReactElement,
  options: { isFullPage?: boolean; openTriggerSelector?: string } = {}
) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root: Root = createRoot(host)

  const wrapped = options.isFullPage ? (
    ui
  ) : (
    <main id="main-content" tabIndex={-1}>
      <h1>Vista de prueba institucional</h1>
      {ui}
    </main>
  )

  await act(async () => {
    root.render(wrapped)
  })

  if (options.openTriggerSelector) {
    const trigger = host.querySelector(options.openTriggerSelector) as HTMLButtonElement | null
    expect(trigger).not.toBeNull()
    await act(async () => {
      trigger?.click()
    })
  }

  // En jsdom no existe canvas 2D para color-contrast ni postMessage entre frames; ambos se auditan en Chrome E2E
  const axeResults = await axe.run(document.body, {
    iframes: false,
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: true },
    },
  })

  const waveFindings = auditWaveAlertsDom(document.body, document)

  await act(async () => {
    root.unmount()
  })
  host.remove()

  return { axeResults, waveFindings }
}

const mockExpedientes: IExpedienteLectura[] = [
  {
    id: 'exp-001',
    cut: 'CUT-2026-0001',
    remitente_nombres: 'Juan Pérez Mendoza',
    remitente_dni_ruc: '41234567',
    asunto: 'Solicitud de licencia de funcionamiento comercial',
    estado: 'PENDIENTE_RECEPCION',
    area_actual_id: 'area-1',
    asignado_a: null,
    fecha_actualizacion: '2026-10-15T14:30:00Z',
  },
  {
    id: 'exp-002',
    cut: 'CUT-2026-0002',
    remitente_nombres: 'María López Torres',
    remitente_dni_ruc: '45678912',
    asunto: 'Autorización de anuncio publicitario exterior',
    estado: 'EN_TRAMITE',
    area_actual_id: 'area-1',
    asignado_a: 'esp-1',
    fecha_actualizacion: '2026-10-16T09:15:00Z',
  },
]

const mockAreas = [
  { id: 'area-1', nombre: 'Gerencia de Rentas', siglas: 'GR' },
  { id: 'area-2', nombre: 'Mesa de Partes', siglas: 'MP' },
  { id: 'area-3', nombre: 'Gerencia Municipal', siglas: 'GM' },
]

const mockEspecialistas: EspecialistaAreaOption[] = [
  {
    id: 'esp-1',
    nombres: 'Carlos',
    apellidos: 'Quispe Huamán',
    rol: 'ESPECIALISTA',
  },
]

const mockEmpleados: EmpleadoItem[] = [
  {
    id: 'emp-1',
    nombres: 'Ana',
    apellidos: 'Vargas Silva',
    dni: '40123456',
    nombre_completo: 'Ana Vargas Silva',
    email: 'ana.vargas@munilosolivos.gob.pe',
    rol: 'JEFE_AREA',
    area_id: 'area-1',
    area_nombre: 'Gerencia de Rentas',
    area_siglas: 'GR',
    activo: true,
    created_at: '2026-01-10T08:00:00Z',
  },
]

const mockMovimientos: IConsultaCiudadanaMovimiento[] = [
  {
    id: 'mov-1',
    expediente_id: 'exp-001',
    accion: 'CREACION',
    area_origen: null,
    area_destino: 'Mesa de Partes',
    proveido: 'Ingreso de expediente por Mesa de Partes presencial',
    estado_nuevo: 'PENDIENTE_RECEPCION',
    fecha_envio: '2026-10-14T10:00:00Z',
  },
  {
    id: 'mov-2',
    expediente_id: 'exp-001',
    accion: 'DERIVACION',
    area_origen: 'Mesa de Partes',
    area_destino: 'Gerencia de Rentas',
    proveido: 'Derivado para evaluación técnica',
    estado_nuevo: 'EN_TRAMITE',
    fecha_envio: '2026-10-15T11:30:00Z',
  },
]

describe('Auditoría DOM real (axe-core WCAG 2.1 AA + reglas WAVE)', () => {
  beforeEach(() => {
    document.documentElement.lang = 'es'
    document.title = 'Sistema de Gestión Documentaria - Municipalidad de Los Olivos'
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it.each([
    { name: 'LoginPage (/login)', ui: <LoginPage />, isFullPage: true },
    { name: 'ForgotPasswordPage (/forgot-password)', ui: <ForgotPasswordPage />, isFullPage: true },
    { name: 'ConsultaPublicaPage (/consulta)', ui: <ConsultaPublicaPage />, isFullPage: true },
    { name: 'ConsultaTracker', ui: <ConsultaTracker />, isFullPage: false },
    {
      name: 'HojaDeRutaTimeline',
      ui: <HojaDeRutaTimeline movimientos={mockMovimientos} />,
      isFullPage: false,
    },
    {
      name: 'Sidebar (ADMIN_TI)',
      ui: (
        <Sidebar
          userRole="ADMIN_TI"
          perfil={{ id: 'emp-1', rol: 'ADMIN_TI', area_id: 'area-1', activo: true }}
        />
      ),
      isFullPage: false,
    },
    {
      name: 'UserProfileMenu',
      ui: (
        <UserProfileMenu
          user={{
            id: 'emp-1',
            nombres: 'Ana',
            apellidos: 'Vargas',
            email: 'ana.vargas@munilosolivos.gob.pe',
            rol: 'JEFE_AREA',
            areas: { id: 'area-1', nombre: 'Gerencia de Rentas', siglas: 'GR' },
          }}
        />
      ),
      isFullPage: false,
    },
    { name: 'BackButton', ui: <BackButton />, isFullPage: false },
    {
      name: 'BandejaTable (con registros)',
      ui: (
        <BandejaTable
          data={mockExpedientes}
          currentTab="pendientes"
          perfil={{ id: 'emp-1', rol: 'JEFE_AREA', area_id: 'area-1', activo: true }}
        />
      ),
      isFullPage: false,
    },
    {
      name: 'BandejaTable (vacía)',
      ui: <BandejaTable data={[]} currentTab="pendientes" />,
      isFullPage: false,
    },
    {
      name: 'BandejaFiltros',
      ui: <BandejaFiltros currentTab="pendientes" queryDefault="" estadoDefault="TODOS" />,
      isFullPage: false,
    },
    {
      name: 'BandejaPaginacion',
      ui: (
        <BandejaPaginacion currentPage={1} totalPages={3} totalCount={25} pageSize={10} />
      ),
      isFullPage: false,
    },
    {
      name: 'BandejaTabsNav',
      ui: (
        <BandejaTabsNav
          currentTab="pendientes"
          pendientesCount={2}
          enviadosCount={5}
          finalizadosCount={10}
        />
      ),
      isFullPage: false,
    },
    { name: 'ExpedienteCreateForm', ui: <ExpedienteCreateForm />, isFullPage: false },
    {
      name: 'RecepcionarExpedienteBanner',
      ui: (
        <RecepcionarExpedienteBanner
          expedienteId="exp-001"
          cut="CUT-2026-0001"
          puedeRecepcionar={true}
        />
      ),
      isFullPage: false,
    },
    {
      name: 'EmpleadosTable',
      ui: <EmpleadosTable empleados={mockEmpleados} areas={mockAreas} />,
      isFullPage: false,
    },
  ])('$name cumple WCAG 2.1 AA en axe-core y 0 alertas WAVE', async ({ ui, isFullPage }) => {
    const { axeResults, waveFindings } = await runAxeAndWaveAudit(ui, { isFullPage })
    expect(axeResults.violations, JSON.stringify(axeResults.violations, null, 2)).toEqual([])
    expect(waveFindings, JSON.stringify(waveFindings, null, 2)).toEqual([])
  })

  it.each([
    {
      name: 'EditarEmpleadoDialog (abierto)',
      ui: (
        <EditarEmpleadoDialog
          empleado={mockEmpleados[0]}
          areas={mockAreas}
          open={true}
          onOpenChange={() => {}}
        />
      ),
      trigger: undefined,
    },
    {
      name: 'CrearEmpleadoDialog (abierto)',
      ui: <CrearEmpleadoDialog areas={mockAreas} />,
      trigger: 'button',
    },
    {
      name: 'DerivacionModal (abierto)',
      ui: (
        <DerivacionModal
          expedienteId="exp-001"
          areaOrigenId="area-1"
          areas={mockAreas}
        />
      ),
      trigger: 'button',
    },
    {
      name: 'AsignarEspecialistaModal (abierto)',
      ui: (
        <AsignarEspecialistaModal
          expedienteId="exp-001"
          especialistas={mockEspecialistas}
        />
      ),
      trigger: 'button',
    },
    {
      name: 'FinalizarExpedienteModal (abierto)',
      ui: <FinalizarExpedienteModal expedienteId="exp-001" cut="CUT-2026-0001" />,
      trigger: 'button',
    },
    {
      name: 'SubirDocumentosDialog (abierto)',
      ui: (
        <SubirDocumentosDialog
          expedienteId="exp-001"
          tiposPermitidos={['INFORME_TECNICO', 'INFORME_LEGAL']}
        />
      ),
      trigger: 'button',
    },
    {
      name: 'PdfViewerModal (abierto)',
      ui: (
        <PdfViewerModal
          url="https://ejemplo.gob.pe/documento.pdf"
          nombreArchivo="resolucion_001.pdf"
        />
      ),
      trigger: 'button',
    },
  ])('$name abierto cumple WCAG 2.1 AA y 0 alertas WAVE', async ({ ui, trigger }) => {
    const { axeResults, waveFindings } = await runAxeAndWaveAudit(ui, {
      isFullPage: false,
      openTriggerSelector: trigger,
    })
    expect(axeResults.violations, JSON.stringify(axeResults.violations, null, 2)).toEqual([])
    expect(waveFindings, JSON.stringify(waveFindings, null, 2)).toEqual([])
  })
})
