// app/dashboard/expedientes/nuevo/page.tsx
import { redirect } from 'next/navigation'
import { ExpedienteCreateForm } from '@/components/modules/expedientes/ExpedienteCreateForm'
import { BackButton } from '@/components/shared/BackButton'
import { obtenerPerfilAutenticado } from '@/lib/auth/session'
import { puedeRadicarExpediente } from '@/lib/domain/rbac'

export default async function NuevoExpedientePage() {
  const perfil = await obtenerPerfilAutenticado()

  if (perfil.rol === 'ADMIN_TI') {
    redirect('/dashboard/admin')
  }

  if (!puedeRadicarExpediente(perfil)) {
    redirect('/dashboard/bandeja')
  }

  return (
    <div className="space-y-6">
      <div>
        <BackButton fallbackUrl="/dashboard" label="Volver al panel" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Oficina de Atención al Ciudadano y Gestión Documental (OACGD-MDP)
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
          Mesa de Partes - Registro de Expediente
        </h1>
        <p className="text-base text-slate-700 mt-1">
          Ingrese los datos del administrado y adjunte el documento digitalizado para generar el Código Único de Trámite (CUT).
        </p>
      </div>

      <ExpedienteCreateForm />
    </div>
  )
}

