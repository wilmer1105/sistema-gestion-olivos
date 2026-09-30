import { createClient } from '@/lib/supabase/server'
import { UserProfileMenu, type UserProfileData } from '@/components/shared/UserProfileMenu'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Obtenemos los datos del perfil y área desde la base de datos
  const { data: perfil } = await (supabase.from('perfiles') as any)
    .select('id, nombres, apellidos, dni, rol, activo, created_at, areas(id, nombre, siglas)')
    .eq('id', user?.id || '')
    .single()

  const perfilData = perfil as any

  const userData: UserProfileData = {
    id: user?.id || '',
    email: user?.email || null,
    nombres: perfilData?.nombres || 'Usuario',
    apellidos: perfilData?.apellidos || 'Municipal',
    dni: perfilData?.dni || null,
    rol: perfilData?.rol || 'FUNCIONARIO',
    activo: perfilData?.activo,
    created_at: perfilData?.created_at,
    areas: perfilData?.areas || null,
  }

  const nombreArea = userData.areas?.nombre || 'Área no asignada'
  const rol = userData.rol

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-800">{nombreArea}</span>
        <span className="text-xs text-slate-500 uppercase tracking-wider">{rol}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Componente del menú de usuario con panel desplegable y modal de ficha técnica */}
        <UserProfileMenu user={userData} />
      </div>
    </header>
  )
}