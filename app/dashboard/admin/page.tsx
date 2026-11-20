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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" aria-hidden="true" />
            Panel de Administración TI
          </h1>
          <p className="text-sm text-slate-600">
            Gestión institucional de usuarios, credenciales y unidades orgánicas
          </p>
        </div>

        <div>
          <CrearEmpleadoDialog areas={areas} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Usuarios del Sistema ({empleados.length})
          </h2>
        </div>

        <EmpleadosTable empleados={empleados} areas={areas} />
      </div>
    </div>
  )
}
