// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Files, Clock, Send, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Consultas en paralelo para obtener conteos en tiempo real
  const [
    { count: totalCount },
    { count: registradosCount },
    { count: derivadosCount },
    { count: recepcionadosCount },
  ] = await Promise.all([
    supabase.from('expedientes').select('*', { count: 'exact', head: true }),
    supabase.from('expedientes').select('*', { count: 'exact', head: true }).eq('estado', 'REGISTRADO'),
    supabase.from('expedientes').select('*', { count: 'exact', head: true }).eq('estado', 'DERIVADO'),
    supabase.from('expedientes').select('*', { count: 'exact', head: true }).eq('estado', 'RECEPCIONADO'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Resumen Operativo</h1>
        <p className="text-slate-500">Métricas globales y estado actual de los expedientes.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Expedientes */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Expedientes</CardTitle>
            <Files className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCount ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Ingresados en el sistema</p>
          </CardContent>
        </Card>

        {/* Registrados */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Registrados</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{registradosCount ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Pendientes de derivación</p>
          </CardContent>
        </Card>

        {/* Derivados */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Derivados</CardTitle>
            <Send className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{derivadosCount ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">En tránsito a recepción</p>
          </CardContent>
        </Card>

        {/* Recepcionados */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Recepcionados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recepcionadosCount ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">En atención en áreas destino</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}