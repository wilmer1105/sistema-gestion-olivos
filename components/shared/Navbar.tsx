// components/shared/Navbar.tsx
import { Building, ShieldCheck } from 'lucide-react'
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
      className="min-h-16 border-b border-slate-200 bg-white flex items-center justify-between gap-3 px-4 sm:px-6 md:px-8 py-2.5 sticky top-0 z-10 shadow-2xs"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1" aria-label="Unidad orgánica y cargo del usuario">
        <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-[#0F2A4A] shrink-0">
          <Building className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-full">
              {siglasArea ? `${nombreArea} (${siglasArea})` : nombreArea}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-800 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
              <span>{rolFormateado}</span>
            </span>
          </div>
          <span className="text-sm text-slate-600 hidden md:block">
            Sistema de Gestión Documental · Municipalidad Distrital de Los Olivos
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <UserProfileMenu user={userData} />
      </div>
    </header>
  )
}

