// app/dashboard/consulta/page.tsx
import { ConsultaTracker } from '@/components/modules/consulta/ConsultaTracker'
import { BackButton } from '@/components/shared/BackButton'

export const dynamic = 'force-dynamic'

export default function DashboardConsultaPage() {
  return (
    <div className="space-y-6">
      <div>
        <BackButton fallbackUrl="/dashboard" label="Volver al panel" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Consulta de Expedientes
          </h1>
          <p className="text-base text-slate-700 mt-1">
            Seguimiento y búsqueda de cualquier expediente institucional por Código Único de Trámite (CUT).
          </p>
        </div>
      </div>

      <ConsultaTracker
        cardTitle="Búsqueda de Expediente"
        cardDescription="Ingrese el Código Único de Trámite (CUT) para consultar su estado, ubicación y hoja de ruta."
      />
    </div>
  )
}

