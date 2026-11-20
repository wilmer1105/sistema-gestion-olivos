// components/shared/Navbar.tsx
import { UserProfileMenu, type UserProfileData } from '@/components/shared/UserProfileMenu'
import { obtenerEtiquetaRol } from '@/lib/domain/rbac'
import {
  obtenerPerfilAutenticado,
  type PerfilUsuarioAutenticado,
} from '@/lib/auth/session'

interface NavbarProps {
  perfil?: PerfilUsuarioAutenticado | null
}

export async function Navbar({ perfil }: NavbarProps) {
  const perfilActual = perfil ?? (await obtenerPerfilAutenticado())

  const userData: UserProfileData = {
    id: perfilActual.id,
    email: perfilActual.email,
    nombres: perfilActual.nombres,
    apellidos: perfilActual.apellidos,
    dni: perfilActual.dni ?? null,
    rol: perfilActual.rol,
    activo: perfilActual.activo,
    created_at: perfilActual.created_at ?? null,
    areas: perfilActual.area
      ? {
          id: perfilActual.area.id,
          nombre: perfilActual.area.nombre,
          siglas: perfilActual.area.siglas,
        }
      : null,
  }

  const esAdminTI = perfilActual.rol === 'ADMIN_TI'
  const nombreArea = esAdminTI
    ? 'Oficina General de Tecnologías de la Información y Comunicaciones'
    : perfilActual.area?.nombre || 'Área no asignada'
  const siglasArea = esAdminTI ? 'OGTIC' : perfilActual.area?.siglas
  const rolFormateado = obtenerEtiquetaRol(perfilActual.rol)

  return (
    <header
      role="banner"
      aria-label="Barra superior institucional"
      className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10"
    >
      <div className="flex flex-col" aria-label="Unidad orgánica y cargo del usuario">
        <span className="text-sm font-semibold text-slate-800">
          {siglasArea ? `${nombreArea} (${siglasArea})` : nombreArea}
        </span>
        <span className="text-xs text-slate-600 uppercase tracking-wider">
          {rolFormateado}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <UserProfileMenu user={userData} />
      </div>
    </header>
  )
}
