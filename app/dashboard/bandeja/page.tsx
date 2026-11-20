// app/dashboard/bandeja/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FilePlus2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BandejaTable } from '@/components/modules/bandeja/BandejaTable'
import { BackButton } from '@/components/shared/BackButton'
import { BandejaTabsNav } from '@/components/modules/bandeja/BandejaTabsNav'
import { BandejaFiltros } from '@/components/modules/bandeja/BandejaFiltros'
import { BandejaPaginacion } from '@/components/modules/bandeja/BandejaPaginacion'
import { Button } from '@/components/ui/button'
import { Constants, type EstadoExpediente } from '@/types/database.types'
import { obtenerPerfilAutenticado } from '@/lib/auth/session'
import { puedeRadicarExpediente } from '@/lib/domain/rbac'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function esEstadoExpedienteValido(valor: string): valor is EstadoExpediente {
  const permitidos: ReadonlyArray<string> = Constants.public.Enums.estado_expediente
  return permitidos.includes(valor)
}

export default async function BandejaPage({ searchParams }: Props) {
  const perfil = await obtenerPerfilAutenticado()

  // El ADMIN_TI no tiene acceso a bandejas ciudadanas operativas
  if (perfil.rol === 'ADMIN_TI') {
    redirect('/dashboard/admin')
  }

  const resolvedParams = await searchParams
  const queryParam =
    typeof resolvedParams.query === 'string' ? resolvedParams.query.trim() : ''
  const estadoParam =
    typeof resolvedParams.estado === 'string'
      ? resolvedParams.estado.trim()
      : ''
  const rawTab =
    typeof resolvedParams.tab === 'string' ? resolvedParams.tab : 'pendientes'
  const tabParam: 'pendientes' | 'enviados' | 'finalizados' =
    rawTab === 'enviados' || rawTab === 'finalizados' ? rawTab : 'pendientes'

  const pageParam = Math.max(
    1,
    parseInt(
      typeof resolvedParams.page === 'string' ? resolvedParams.page : '1',
      10
    ) || 1
  )

  const pageSize = 10
  const from = (pageParam - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()
  const areaId = perfil.area_id
  const areaNombre = perfil.area?.nombre || 'su unidad orgánica'

  if (!areaId) {
    return (
      <div className="space-y-6">
        <div>
          <BackButton fallbackUrl="/dashboard" label="Volver al panel" />
        </div>
        <div
          role="alert"
          className="p-4 bg-amber-50 text-amber-900 rounded-md border border-amber-300"
        >
          <strong>Atención:</strong> Su usuario no tiene una unidad orgánica
          asignada en el sistema (Rol sin adscripción operativa). Comuníquese con el Administrador de TI.
        </div>
      </div>
    )
  }

  // Obtener IDs de expedientes derivados por esta área en trazabilidad para la pestaña "Enviados" (Bandeja de Salida)
  const { data: trazEnviados } = await supabase
    .from('trazabilidad')
    .select('expediente_id')
    .eq('area_origen_id', areaId)
    .not('area_destino_id', 'eq', areaId)

  const enviadosIds = Array.from(
    new Set(
      (trazEnviados || [])
        .map((t) => t.expediente_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  const [pendientesCountRes, enviadosCountRes, finalizadosCountRes] =
    await Promise.all([
      supabase
        .from('expedientes')
        .select('id', { count: 'exact', head: true })
        .eq('area_actual_id', areaId)
        .in('estado', [
          'REGISTRADO',
          'DERIVADO',
          'RECEPCIONADO',
          'EN_TRAMITE',
          'OBSERVADO',
        ]),
      enviadosIds.length > 0
        ? supabase
            .from('expedientes')
            .select('id', { count: 'exact', head: true })
            .in('id', enviadosIds)
            .neq('area_actual_id', areaId)
        : Promise.resolve({ count: 0 }),
      supabase
        .from('expedientes')
        .select('id', { count: 'exact', head: true })
        .eq('area_actual_id', areaId)
        .in('estado', ['ATENDIDO', 'ARCHIVADO']),
    ])

  const pendientesCount = pendientesCountRes.count ?? 0
  const enviadosCount = enviadosCountRes.count ?? 0
  const finalizadosCount = finalizadosCountRes.count ?? 0

  let expedientesData: Array<{
    id: string
    cut: string | null
    remitente_nombres: string
    remitente_dni_ruc: string
    asunto: string
    estado: EstadoExpediente
    area_actual_id: string | null
    asignado_a: string | null
    fecha_actualizacion: string
  }> = []
  let totalCount = 0
  let queryError: { message: string } | null = null

  if (tabParam === 'enviados' && enviadosIds.length === 0) {
    expedientesData = []
    totalCount = 0
  } else {
    let builder = supabase.from('expedientes').select('*', { count: 'exact' })

    if (tabParam === 'enviados') {
      builder = builder.in('id', enviadosIds).neq('area_actual_id', areaId)
    } else {
      builder = builder.eq('area_actual_id', areaId)
    }

    if (
      estadoParam &&
      estadoParam !== 'TODOS' &&
      esEstadoExpedienteValido(estadoParam)
    ) {
      builder = builder.eq('estado', estadoParam)
    } else if (tabParam === 'finalizados') {
      builder = builder.in('estado', ['ATENDIDO', 'ARCHIVADO'])
    } else if (tabParam === 'pendientes') {
      builder = builder.in('estado', [
        'REGISTRADO',
        'DERIVADO',
        'RECEPCIONADO',
        'EN_TRAMITE',
        'OBSERVADO',
      ])
    }

    if (queryParam) {
      builder = builder.or(
        `cut.ilike.%${queryParam}%,remitente_dni_ruc.ilike.%${queryParam}%,asunto.ilike.%${queryParam}%`
      )
    }

    builder = builder
      .order('fecha_actualizacion', { ascending: false })
      .range(from, to)

    const { data, count, error } = await builder
    queryError = error
    totalCount = count ?? 0
    expedientesData = (data || []).map((row) => ({
      id: row.id,
      cut: row.cut,
      remitente_nombres: row.remitente_nombres,
      remitente_dni_ruc: row.remitente_dni_ruc,
      asunto: row.asunto,
      estado: row.estado ?? 'REGISTRADO',
      area_actual_id: row.area_actual_id,
      asignado_a: row.asignado_a,
      fecha_actualizacion: row.fecha_actualizacion,
    }))
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const puedeRadicar = puedeRadicarExpediente(perfil)

  return (
    <div className="space-y-6">
      <div>
        <BackButton fallbackUrl="/dashboard" label="Volver al panel" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Gestión de Trámite Documentario
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Bandeja Documental de Unidad Orgánica
          </h1>
          <p className="text-base text-slate-700 mt-1">
            Control de expedientes de{' '}
            <span className="font-bold text-slate-900">{areaNombre}</span>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {puedeRadicar && (
            <Link href="/dashboard/expedientes/nuevo" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-11 px-5 gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                <FilePlus2 className="w-5 h-5" aria-hidden="true" />
                <span>Nuevo Expediente</span>
              </Button>
            </Link>
          )}

          <BandejaTabsNav
            currentTab={tabParam}
            pendientesCount={pendientesCount}
            enviadosCount={enviadosCount}
            finalizadosCount={finalizadosCount}
          />
        </div>
      </div>

      <BandejaFiltros
        currentTab={tabParam}
        queryDefault={queryParam}
        estadoDefault={estadoParam || 'TODOS'}
      />

      {queryError ? (
        <div
          role="alert"
          className="p-4 bg-red-50 text-red-900 rounded-xl border border-red-300 text-base font-medium"
        >
          <strong>Error al cargar expedientes:</strong> {queryError.message}
        </div>
      ) : (
        <div className="space-y-4">
          <BandejaTable
            data={expedientesData}
            currentTab={tabParam}
            perfil={perfil}
          />

          <BandejaPaginacion
            currentPage={pageParam}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
          />
        </div>
      )}
    </div>
  )
}

