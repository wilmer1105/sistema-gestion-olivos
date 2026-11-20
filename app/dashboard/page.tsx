// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Files, Clock, Send, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { obtenerPerfilAutenticado } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const perfil = await obtenerPerfilAutenticado()

  // El Administrador de TI tiene acceso exclusivo a /dashboard/admin
  if (perfil.rol === 'ADMIN_TI') {
    redirect('/dashboard/admin')
  }

  const supabase = await createClient()
  const areaId = perfil.area_id

  if (!areaId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Resumen Operativo
          </h1>
          <p className="text-slate-600">Métricas de Unidad Orgánica</p>
        </div>
        <div
          role="alert"
          className="p-4 bg-amber-50 text-amber-900 rounded-md border border-amber-300"
        >
          <strong>Atención:</strong> Su cuenta no tiene una unidad orgánica asignada.
          Comuníquese con el Administrador de TI para configurar su área de adscripción.
        </div>
      </div>
    )
  }

  const nombreContexto = `Métricas de ${perfil.area?.nombre || 'su Unidad Orgánica'}${
    perfil.area?.siglas ? ` (${perfil.area.siglas})` : ''
  }`

  // Consultas métricas aisladas estrictamente por area_id del funcionario (RF-18)
  const [
    { count: totalCount },
    { count: pendientesRecepcionCount },
    { count: enEvaluacionCount },
    { count: finalizadosCount },
  ] = await Promise.all([
    supabase
      .from('expedientes')
      .select('*', { count: 'exact', head: true })
      .eq('area_actual_id', areaId),
    supabase
      .from('expedientes')
      .select('*', { count: 'exact', head: true })
      .eq('area_actual_id', areaId)
      .eq('estado', 'DERIVADO'),
    supabase
      .from('expedientes')
      .select('*', { count: 'exact', head: true })
      .eq('area_actual_id', areaId)
      .in('estado', ['REGISTRADO', 'RECEPCIONADO', 'EN_TRAMITE', 'OBSERVADO']),
    supabase
      .from('expedientes')
      .select('*', { count: 'exact', head: true })
      .eq('area_actual_id', areaId)
      .in('estado', ['ATENDIDO', 'ARCHIVADO']),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Resumen Operativo
        </h1>
        <p className="text-slate-600">{nombreContexto}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total en Área */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total en Área
            </CardTitle>
            <Files className="h-4 w-4 text-blue-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCount ?? 0}</div>
            <p className="text-xs text-slate-600 mt-1">
              Asignados a la unidad orgánica
            </p>
          </CardContent>
        </Card>

        {/* Pendientes de Recepción (DERIVADO) */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Pendientes de Recepción
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {pendientesRecepcionCount ?? 0}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              En estado DERIVADO hacia su área
            </p>
          </CardContent>
        </Card>

        {/* En Evaluación / Trámite */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              En Evaluación
            </CardTitle>
            <Send className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">
              {enEvaluacionCount ?? 0}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Recepcionados o en trámite activo
            </p>
          </CardContent>
        </Card>

        {/* Finalizados / Archivados */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Finalizados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {finalizadosCount ?? 0}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Atendidos o archivados por el área
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
