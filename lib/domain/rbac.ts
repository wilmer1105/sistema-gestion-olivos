// lib/domain/rbac.ts

import type {
  EstadoExpediente,
  RolUsuario,
  TipoDocumentoTramite,
} from './contracts/expediente.contracts'

export interface PerfilRBACContext {
  readonly id?: string
  readonly rol: RolUsuario | string
  readonly area_id: string | null
  readonly activo: boolean | null | undefined
}

export interface ExpedienteRBACContext {
  readonly id?: string
  readonly area_actual_id: string | null
  readonly estado: EstadoExpediente | string | null
  readonly asignado_a?: string | null
}

export interface NavItemConfig {
  readonly name: string
  readonly href: string
  readonly icon: 'LayoutDashboard' | 'Inbox' | 'FilePlus2' | 'Search' | 'Shield'
}

const ROLES_RECEPTORES_AREA: ReadonlyArray<string> = [
  'ASISTENTE_AREA',
  'ESPECIALISTA',
  'JEFE_AREA',
  'MESA_PARTES',
]

const ROLES_ASIGNADORES_INTERNOS: ReadonlyArray<string> = [
  'ASISTENTE_AREA',
  'JEFE_AREA',
]

const ROLES_OPERATIVOS_INTERNOS: ReadonlyArray<string> = [
  'ASISTENTE_AREA',
  'ESPECIALISTA',
  'JEFE_AREA',
]

const ESTADOS_ACTIVOS_TRAMITE: ReadonlyArray<string> = [
  'RECEPCIONADO',
  'EN_TRAMITE',
  'OBSERVADO',
]

/**
 * 1. Verifica si un usuario/funcionario tiene su cuenta activa en el sistema.
 */
export function esUsuarioActivo(
  perfil: PerfilRBACContext | null | undefined
): boolean {
  return Boolean(perfil && perfil.activo === true)
}

/**
 * Alias de verificación de acceso a la intranet institucional.
 */
export function puedeAccederIntranet(
  perfil: PerfilRBACContext | null | undefined
): boolean {
  return esUsuarioActivo(perfil)
}

/**
 * 2. Obtiene la ruta inicial por defecto según el rol del usuario.
 */
export function obtenerRutaInicioPorRol(
  rol: string | null | undefined
): string {
  if (rol === 'ADMIN_TI' || rol === 'ADMIN') {
    return '/dashboard/admin'
  }
  return '/dashboard/bandeja'
}

/**
 * 3. Obtiene la lista estricta de elementos de navegación para la barra lateral según el rol.
 */
export function obtenerItemsNavegacionPorRol(
  rol: string | null | undefined
): ReadonlyArray<NavItemConfig> {
  if (rol === 'ADMIN_TI' || rol === 'ADMIN') {
    return [
      {
        name: 'Administración TI',
        href: '/dashboard/admin',
        icon: 'Shield',
      },
    ]
  }

  if (rol === 'MESA_PARTES') {
    return [
      {
        name: 'Resumen',
        href: '/dashboard',
        icon: 'LayoutDashboard',
      },
      {
        name: 'Mi Bandeja',
        href: '/dashboard/bandeja',
        icon: 'Inbox',
      },
      {
        name: 'Nuevo Expediente',
        href: '/dashboard/expedientes/nuevo',
        icon: 'FilePlus2',
      },
      {
        name: 'Consulta Ciudadana',
        href: '/dashboard/consulta',
        icon: 'Search',
      },
    ]
  }

  // ASISTENTE_AREA, ESPECIALISTA, JEFE_AREA y funcionarios operativos
  return [
    {
      name: 'Resumen',
      href: '/dashboard',
      icon: 'LayoutDashboard',
    },
    {
      name: 'Mi Bandeja',
      href: '/dashboard/bandeja',
      icon: 'Inbox',
    },
    {
      name: 'Consulta Ciudadana',
      href: '/dashboard/consulta',
      icon: 'Search',
    },
  ]
}

/**
 * 4. Valida si un perfil de usuario tiene autorización estricta para acceder a una ruta de Next.js.
 */
export function puedeAccederRuta(
  perfil: PerfilRBACContext | null | undefined,
  pathname: string
): boolean {
  if (!esUsuarioActivo(perfil) || !perfil) {
    return false
  }

  const esAdminTI = perfil.rol === 'ADMIN_TI' || perfil.rol === 'ADMIN'

  // El ADMIN_TI ÚNICAMENTE puede acceder a /dashboard/admin (y sus subrutas)
  if (esAdminTI) {
    return pathname === '/dashboard/admin' || pathname.startsWith('/dashboard/admin/')
  }

  // Roles operativos: NO pueden acceder a /dashboard/admin
  if (pathname === '/dashboard/admin' || pathname.startsWith('/dashboard/admin/')) {
    return false
  }

  // Nuevo Expediente: ÚNICAMENTE rol MESA_PARTES con área asignada
  if (pathname === '/dashboard/expedientes/nuevo' || pathname.startsWith('/dashboard/expedientes/nuevo/')) {
    return puedeRadicarExpediente(perfil)
  }

  // Resto de rutas de dashboard (/dashboard, /dashboard/bandeja, /dashboard/expedientes/[id], /dashboard/consulta)
  if (pathname.startsWith('/dashboard')) {
    return true
  }

  return true
}

/**
 * 5. Verifica si el perfil pertenece a la misma área donde radica actualmente el expediente.
 */
export function perteneceAlAreaActual(
  perfil: PerfilRBACContext | null | undefined,
  expediente: ExpedienteRBACContext | null | undefined
): boolean {
  if (!esUsuarioActivo(perfil) || !perfil || !expediente) {
    return false
  }
  if (!perfil.area_id || !expediente.area_actual_id) {
    return false
  }
  return perfil.area_id === expediente.area_actual_id
}

/**
 * 6. Exclusivo para Operador de Mesa de Partes (MESA_PARTES con area_id no nulo).
 */
export function puedeRadicarExpediente(
  perfil: PerfilRBACContext | null | undefined
): boolean {
  if (!esUsuarioActivo(perfil) || !perfil) {
    return false
  }
  return perfil.rol === 'MESA_PARTES' && Boolean(perfil.area_id)
}

/**
 * 7. Verifica si el funcionario puede acusar recepción de un expediente derivado a su unidad orgánica.
 */
export function puedeRecepcionarExpediente(
  perfil: PerfilRBACContext | null | undefined,
  expediente: ExpedienteRBACContext | null | undefined
): boolean {
  if (!esUsuarioActivo(perfil) || !perfil || !expediente) {
    return false
  }
  if (!perteneceAlAreaActual(perfil, expediente)) {
    return false
  }
  if (expediente.estado !== 'DERIVADO') {
    return false
  }
  return ROLES_RECEPTORES_AREA.includes(perfil.rol)
}

/**
 * 8. Verifica si el funcionario (Asistente o Jefe de Área) puede asignar internamente a un especialista.
 */
export function puedeAsignarEspecialista(
  perfil: PerfilRBACContext | null | undefined,
  expediente: ExpedienteRBACContext | null | undefined
): boolean {
  if (!esUsuarioActivo(perfil) || !perfil || !expediente) {
    return false
  }
  if (!perteneceAlAreaActual(perfil, expediente)) {
    return false
  }
  const estado = expediente.estado ?? ''
  if (estado !== 'RECEPCIONADO' && estado !== 'EN_TRAMITE') {
    return false
  }
  return ROLES_ASIGNADORES_INTERNOS.includes(perfil.rol)
}

/**
 * 9. Verifica si el funcionario del área puede subir documentos intermedios sustentatorios.
 */
export function puedeSubirDocumentoIntermedio(
  perfil: PerfilRBACContext | null | undefined,
  expediente: ExpedienteRBACContext | null | undefined
): boolean {
  if (!esUsuarioActivo(perfil) || !perfil || !expediente) {
    return false
  }
  if (!perteneceAlAreaActual(perfil, expediente)) {
    return false
  }
  const estado = expediente.estado ?? ''
  if (!ESTADOS_ACTIVOS_TRAMITE.includes(estado)) {
    return false
  }
  return ROLES_OPERATIVOS_INTERNOS.includes(perfil.rol)
}

/**
 * 10. Obtiene la lista de tipos de documentos permitidos para adjuntar según el rol.
 */
export function obtenerTiposDocumentoPermitidosPorRol(
  rol: string | null | undefined
): TipoDocumentoTramite[] {
  switch (rol) {
    case 'ASISTENTE_AREA':
      return ['NOTIFICACION', 'OTRO']
    case 'ESPECIALISTA':
      return ['INFORME_TECNICO', 'INFORME_LEGAL', 'ACTA_FISCALIZACION', 'OTRO']
    case 'JEFE_AREA':
      return [
        'RESOLUCION',
        'INFORME_TECNICO',
        'INFORME_LEGAL',
        'ACTA_FISCALIZACION',
        'NOTIFICACION',
        'OFICIO',
        'CARTA',
        'OTRO',
      ]
    case 'MESA_PARTES':
      return ['FUT', 'CARTA', 'OFICIO', 'SOLICITUD', 'OTRO']
    default:
      return ['OTRO']
  }
}

/**
 * 11. Verifica si el funcionario puede derivar el expediente hacia otra unidad orgánica.
 */
export function puedeDerivarExpediente(
  perfil: PerfilRBACContext | null | undefined,
  expediente: ExpedienteRBACContext | null | undefined
): boolean {
  if (!esUsuarioActivo(perfil) || !perfil || !expediente) {
    return false
  }
  if (!perteneceAlAreaActual(perfil, expediente)) {
    return false
  }
  const estado = expediente.estado ?? ''

  if (estado === 'REGISTRADO') {
    return perfil.rol === 'MESA_PARTES' || perfil.rol === 'JEFE_AREA'
  }

  if (
    estado === 'RECEPCIONADO' ||
    estado === 'EN_TRAMITE' ||
    estado === 'OBSERVADO'
  ) {
    return (
      perfil.rol === 'ASISTENTE_AREA' ||
      perfil.rol === 'ESPECIALISTA' ||
      perfil.rol === 'JEFE_AREA' ||
      perfil.rol === 'MESA_PARTES'
    )
  }

  return false
}

/**
 * 12. Potestad EXCLUSIVA del Jefe de Área (JEFE_AREA) para finalizar o archivar expedientes.
 */
export function puedeFinalizarExpediente(
  perfil: PerfilRBACContext | null | undefined,
  expediente: ExpedienteRBACContext | null | undefined
): boolean {
  if (!esUsuarioActivo(perfil) || !perfil || !expediente) {
    return false
  }
  if (perfil.rol !== 'JEFE_AREA') {
    return false
  }
  if (!perteneceAlAreaActual(perfil, expediente)) {
    return false
  }
  const estado = expediente.estado ?? ''
  return ESTADOS_ACTIVOS_TRAMITE.includes(estado)
}

/**
 * 13. Potestad EXCLUSIVA del Administrador de TI (ADMIN_TI) con area_id === null.
 */
export function puedeGestionarUsuarios(
  perfil: PerfilRBACContext | null | undefined
): boolean {
  if (!esUsuarioActivo(perfil) || !perfil) {
    return false
  }
  const esAdmin = perfil.rol === 'ADMIN_TI' || perfil.rol === 'ADMIN'
  return esAdmin && perfil.area_id === null
}

/**
 * 14. Devuelve la etiqueta institucional legible para cada rol oficial.
 */
export function obtenerEtiquetaRol(rol: string | null | undefined): string {
  switch (rol) {
    case 'MESA_PARTES':
      return 'Operador de Mesa de Partes'
    case 'ASISTENTE_AREA':
      return 'Asistente de Área'
    case 'ESPECIALISTA':
      return 'Especialista'
    case 'JEFE_AREA':
      return 'Jefe de Área'
    case 'ADMIN_TI':
    case 'ADMIN':
      return 'Administrador del Sistema (OGTIC)'
    default:
      return 'Funcionario Municipal'
  }
}

/**
 * Alias de compatibilidad para obtenerEtiquetaRol.
 */
export const formatearRolUsuario = obtenerEtiquetaRol
