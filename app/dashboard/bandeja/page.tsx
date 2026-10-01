// app/dashboard/bandeja/page.tsx
import { createClient } from '@/lib/supabase/server'
import { BandejaTable } from '@/components/modules/bandeja/BandejaTable'
import { redirect } from 'next/navigation'
import { BackButton } from '@/components/shared/BackButton'
import { BandejaTabsNav } from '@/components/modules/bandeja/BandejaTabsNav'
import { BandejaFiltros } from '@/components/modules/bandeja/BandejaFiltros'
import { BandejaPaginacion } from '@/components/modules/bandeja/BandejaPaginacion'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BandejaPage({ searchParams }: Props) {
  const resolvedParams = await searchParams
  const queryParam = typeof resolvedParams.query === 'string' ? resolvedParams.query.trim() : ''
  const estadoParam = typeof resolvedParams.estado === 'string' ? resolvedParams.estado.trim() : ''
  const tabParam =
    typeof resolvedParams.tab === 'string' && resolvedParams.tab === 'finalizados'
      ? 'finalizados'
      : 'pendientes'
  const pageParam = Math.max(1, parseInt(typeof resolvedParams.page === 'string' ? resolvedParams.page : '1', 10) || 1)

  const pageSize = 10
  const from = (pageParam - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Obtener perfil, rol y área del usuario
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('area_id, rol, areas(nombre)')
    .eq('id', user.id)
    .single()

  const areaId = (perfil as any)?.area_id
  const areaNombre = (perfil as any)?.areas?.nombre || 'su unidad orgánica'

  if (!areaId) {
    return (
      <div className="space-y-6">
        <div>
          <BackButton fallbackUrl="/dashboard" label="Volver al panel" />
        </div>
        <div className="p-4 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
          <strong>Atención:</strong> Su usuario no tiene un área asignada en el sistema. Contacte al administrador de TI.
        </div>
      </div>
    )
  }

  // 2. Conteo en paralelo para las pestañas de Pendientes y Finalizados
  const [pendientesCountRes, finalizadosCountRes] = await Promise.all([
    supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('area_actual_id', areaId)
      .not('estado', 'in', '(ATENDIDO,ARCHIVADO)'),
    supabase
      .from('expedientes')
      .select('id', { count: 'exact', head: true })
      .eq('area_actual_id', areaId)
      .in('estado', ['ATENDIDO', 'ARCHIVADO']),
  ])

  const pendientesCount = pendientesCountRes.count ?? 0
  const finalizadosCount = finalizadosCountRes.count ?? 0

  // 3. Consulta filtrada con range y conteo exacto ({ count: 'exact' })
  let builder = supabase
    .from('expedientes')
    .select('*', { count: 'exact' })
    .eq('area_actual_id', areaId)

  // Filtro por Estado o Pestaña
  if (estadoParam && estadoParam !== 'TODOS') {
    builder = builder.eq('estado', estadoParam)
  } else if (tabParam === 'finalizados') {
    builder = builder.in('estado', ['ATENDIDO', 'ARCHIVADO'])
  } else {
    builder = builder.not('estado', 'in', '(ATENDIDO,ARCHIVADO)')
  }

  // Filtro de búsqueda (CUT o Asunto)
  if (queryParam) {
    builder = builder.or(`cut.ilike.%${queryParam}%,asunto.ilike.%${queryParam}%`)
  }

  // Paginación y ordenamiento
  builder = builder
    .order('fecha_actualizacion', { ascending: false })
    .range(from, to)

  const { data: expedientes, count: totalCountRaw, error } = await builder
  const totalCount = totalCountRaw ?? 0
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="space-y-6">
      <div>
        <BackButton fallbackUrl="/dashboard" label="Volver al panel" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bandeja de Entrada</h1>
          <p className="text-sm text-slate-500">
            Control de expedientes de <span className="font-semibold text-slate-700">{areaNombre}</span>.
          </p>
        </div>

        {/* TAREA 3: Pestañas de 'Finalizados' para Jefes y personal del Área */}
        <BandejaTabsNav
          currentTab={tabParam}
          pendientesCount={pendientesCount}
          finalizadosCount={finalizadosCount}
        />
      </div>

      {/* TAREA 4: Filtros con sincronización en URL */}
      <BandejaFiltros
        currentTab={tabParam}
        queryDefault={queryParam}
        estadoDefault={estadoParam || 'TODOS'}
      />

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
          <strong>Error al cargar expedientes:</strong> {error.message}
        </div>
      ) : (
        <div className="space-y-4">
          <BandejaTable data={expedientes || []} />

          {/* TAREA 4: Paginación en la parte inferior de la tabla */}
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