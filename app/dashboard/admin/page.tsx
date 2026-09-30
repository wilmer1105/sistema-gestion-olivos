// app/dashboard/admin/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { BackButton } from '@/components/shared/BackButton'
import { obtenerAreas, obtenerEmpleados } from '@/app/actions/admin'
import { CrearEmpleadoDialog } from '@/components/admin/CrearEmpleadoDialog'
import { EmpleadosTable } from '@/components/admin/EmpleadosTable'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Panel de Administración | MDLO Docs',
  description: 'Gestión de usuarios, roles y áreas del sistema',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 1. Obtener la sesión del usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Validación de seguridad: Obtener el rol del usuario logueado
  const { data: perfil } = await (supabase.from('perfiles') as any)
    .select('rol')
    .eq('id', user.id)
    .single()

  const userRole = perfil?.rol || user.user_metadata?.rol

  // Si no es 'ADMIN' o 'ADMIN_TI', redirigir inmediatamente a /dashboard (Protección de ruta)
  if (userRole !== 'ADMIN' && userRole !== 'ADMIN_TI') {
    redirect('/dashboard')
  }

  // 3. Consultas en el servidor
  const [areas, empleados] = await Promise.all([
    obtenerAreas(),
    obtenerEmpleados(),
  ])

  return (
    <div className="space-y-6">
      {/* Botón de retorno al panel anterior */}
      <div>
        <BackButton fallbackUrl="/dashboard" label="Volver al panel" />
      </div>

      {/* Encabezado Principal y Disparador de Crear Empleado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Panel de Administración
          </h1>
          <p className="text-sm text-slate-500">
            Gestión de usuarios, roles y áreas del sistema
          </p>
        </div>

        <div>
          <CrearEmpleadoDialog areas={areas} />
        </div>
      </div>

      {/* Tabla de Empleados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Directorio de Empleados</h2>
          <span className="text-xs text-slate-500">
            Total: {empleados.length} usuario{empleados.length === 1 ? '' : 's'}
          </span>
        </div>

        <EmpleadosTable empleados={empleados} areas={areas} />
      </div>
    </div>
  )
}
