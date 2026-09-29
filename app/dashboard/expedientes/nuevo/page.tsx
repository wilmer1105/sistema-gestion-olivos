// app/dashboard/expedientes/nuevo/page.tsx
import { ExpedienteCreateForm } from '@/components/modules/expedientes/ExpedienteCreateForm'

export default function NuevoExpedientePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Mesa de Partes - Registro de Expediente
        </h1>
        <p className="text-sm text-slate-500">
          Ingrese los datos del administrado para generar el Código Único de Trámite (CUT).
        </p>
      </div>

      <ExpedienteCreateForm />
    </div>
  )
}