// app/dashboard/admin/page.tsx
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { obtenerAreas, obtenerEmpleados } from '@/app/actions/admin'
import { CrearEmpleadoDialog } from '@/components/admin/CrearEmpleadoDialog'
import { EmpleadosTable } from '@/components/admin/EmpleadosTable'
import { obtenerPerfilAutenticado } from '@/lib/auth/session'
import { puedeGestionarUsuarios } from '@/lib/domain/rbac'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Panel de Administración | MDLO Docs',
  description: 'Gestión de usuarios, roles y áreas del sistema',
}

export default async function AdminDashboardPage() {
  const perfil = await obtenerPerfilAutenticado()

  if (!puedeGestionarUsuarios(perfil)) {
    redirect('/dashboard')
  }

  const [areas, empleados] = await Promise.all([
    obtenerAreas(),
    obtenerEmpleados(),
  ])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 shrink-0 mt-0.5">
            <Shield className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Oficina General de Tecnologías de la Información (OGTIC)
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
              Panel de Administración TI
            </h1>
            <p className="text-base text-slate-700 mt-1">
              Gestión institucional de usuarios, credenciales y unidades orgánicas
            </p>
          </div>
        </div>

        <div>
          <CrearEmpleadoDialog areas={areas} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold text-slate-900">
            Usuarios del Sistema ({empleados.length})
          </h2>
        </div>

        <EmpleadosTable empleados={empleados} areas={areas} />
      </div>
    </div>
  )
}

