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
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Panel de Control Jurisdiccional
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Resumen Operativo
        </h1>
        <p className="text-base text-slate-700 mt-1">{nombreContexto}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total en Área */}
        <Card className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-blue-700 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-slate-800">
              <h2>Total en Área</h2>
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
              <Files className="h-5 w-5" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-slate-900 font-mono">
              {totalCount ?? 0}
            </div>
            <p className="text-sm text-slate-700 mt-1.5 font-medium">
              Asignados a la unidad orgánica
            </p>
          </CardContent>
        </Card>

        {/* Pendientes de Recepción (DERIVADO) */}
        <Card className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-amber-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-slate-800">
              <h2>Pendientes de Recepción</h2>
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-amber-800 font-mono">
              {pendientesRecepcionCount ?? 0}
            </div>
            <p className="text-sm text-slate-700 mt-1.5 font-medium">
              En estado DERIVADO hacia su área
            </p>
          </CardContent>
        </Card>

        {/* En Evaluación / Trámite */}
        <Card className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-indigo-700 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-slate-800">
              <h2>En Evaluación</h2>
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
              <Send className="h-5 w-5" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-indigo-800 font-mono">
              {enEvaluacionCount ?? 0}
            </div>
            <p className="text-sm text-slate-700 mt-1.5 font-medium">
              Recepcionados o en trámite activo
            </p>
          </CardContent>
        </Card>

        {/* Finalizados / Archivados */}
        <Card className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-emerald-700 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-slate-800">
              <h2>Finalizados</h2>
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-emerald-800 font-mono">
              {finalizadosCount ?? 0}
            </div>
            <p className="text-sm text-slate-700 mt-1.5 font-medium">
              Atendidos o archivados por el área
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

