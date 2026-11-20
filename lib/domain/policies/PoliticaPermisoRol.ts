// lib/domain/policies/PoliticaPermisoRol.ts

import type { RolUsuario, TipoAccionExpediente } from '../contracts/expediente.contracts'

export interface ResultadoAutorizacion {
  readonly autorizado: boolean
  readonly motivo?: string
}

/**
 * [OCP / LSP] Contrato y Clase Base Abstracta para Políticas de Permisos por Rol (RBAC).
 *
 * - Abierto/Cerrado (OCP): Nuevos roles se incorporan extendiendo `PoliticaPermisoRol`
 *   y registrándose en `PoliticaPermisoRolFactory` sin modificar condicionales existentes.
 * - Sustitución de Liskov (LSP): Cualquier subtipo de `PoliticaPermisoRol` puede sustituir
 *   a la clase base devolviendo siempre un `ResultadoAutorizacion` coherente y determinista,
 *   sin lanzar excepciones no controladas ni violar las pre/post-condiciones.
 */
export abstract class PoliticaPermisoRol {
  abstract readonly rol: RolUsuario | string

  abstract puedeRadicarExpediente(): boolean
  abstract puedeRecepcionar(): boolean
  abstract puedeDerivar(): boolean
  abstract puedeSubirDocumentoIntermedio(): boolean
  abstract puedeFinalizarOArchivar(): boolean
  abstract puedeAccederAdmin(): boolean

  puedeAsignarEspecialista(): boolean {
    return false
  }

  /**
   * Resuelve el área de adscripción según las reglas reactivas del rol.
   * Por defecto respeta el área seleccionada o retorna null si está vacía.
   */
  resolverAreaAdscripcion(
    areaSeleccionadaId: string | null | undefined,
    _areaMesaPartesId?: string | null
  ): string | null {
    const clean = areaSeleccionadaId?.trim()
    return clean ? clean : null
  }

  /**
   * Método plantilla (Template Method) que evalúa si el rol puede ejecutar una acción documental.
   * Cumple LSP: nunca lanza excepciones inesperadas y retorna siempre `ResultadoAutorizacion`.
   */
  verificarPermisoAccion(accion: TipoAccionExpediente): ResultadoAutorizacion {
    switch (accion) {
      case 'REGISTRO_INICIAL':
        return this.puedeRadicarExpediente()
          ? { autorizado: true }
          : {
              autorizado: false,
              motivo: `El rol ${this.rol} no está autorizado para radicar expedientes iniciales.`,
            }
      case 'RECEPCION':
        return this.puedeRecepcionar()
          ? { autorizado: true }
          : {
              autorizado: false,
              motivo: `El rol ${this.rol} no está autorizado para recepcionar expedientes.`,
            }
      case 'ASIGNACION':
        return this.puedeAsignarEspecialista()
          ? { autorizado: true }
          : {
              autorizado: false,
              motivo: `El rol ${this.rol} no está autorizado para asignar especialistas internos.`,
            }
      case 'DERIVACION':
        return this.puedeDerivar()
          ? { autorizado: true }
          : {
              autorizado: false,
              motivo: `El rol ${this.rol} no está autorizado para derivar expedientes.`,
            }
      case 'ANEXO_DOCUMENTAL':
        return this.puedeSubirDocumentoIntermedio()
          ? { autorizado: true }
          : {
              autorizado: false,
              motivo:
                'No autorizado: Solo personal de las unidades orgánicas (Asistente, Especialista o Jefe de Área) puede adjuntar documentos intermedios.',
            }
      case 'CIERRE':
        return this.puedeFinalizarOArchivar()
          ? { autorizado: true }
          : {
              autorizado: false,
              motivo:
                '403 Forbidden: Solo el Jefe de Área puede finalizar o archivar expedientes.',
            }
    }
  }
}

/**
 * Política para el rol MESA_PARTES:
 * - Crea expedientes, recepciona y deriva.
 * - NUNCA puede finalizar ni archivar expedientes.
 * - Área forzada a Mesa de Partes cuando está disponible.
 */
export class PoliticaMesaPartes extends PoliticaPermisoRol {
  readonly rol: RolUsuario = 'MESA_PARTES'

  puedeRadicarExpediente(): boolean {
    return true
  }

  puedeRecepcionar(): boolean {
    return true
  }

  puedeDerivar(): boolean {
    return true
  }

  puedeSubirDocumentoIntermedio(): boolean {
    return false
  }

  puedeFinalizarOArchivar(): boolean {
    return false
  }

  puedeAccederAdmin(): boolean {
    return false
  }

  override resolverAreaAdscripcion(
    areaSeleccionadaId: string | null | undefined,
    areaMesaPartesId?: string | null
  ): string | null {
    if (areaMesaPartesId && areaMesaPartesId.trim() !== '') {
      return areaMesaPartesId.trim()
    }
    return super.resolverAreaAdscripcion(areaSeleccionadaId)
  }
}

/**
 * Política para el rol ASISTENTE_AREA:
 * - Recepciona expedientes en su área, asigna a especialistas de su área,
 *   adjunta cargos/notificaciones y deriva por encargo.
 * - No puede finalizar expedientes.
 */
export class PoliticaAsistenteArea extends PoliticaPermisoRol {
  readonly rol: RolUsuario = 'ASISTENTE_AREA'

  puedeRadicarExpediente(): boolean {
    return false
  }

  puedeRecepcionar(): boolean {
    return true
  }

  override puedeAsignarEspecialista(): boolean {
    return true
  }

  puedeDerivar(): boolean {
    return true
  }

  puedeSubirDocumentoIntermedio(): boolean {
    return true
  }

  puedeFinalizarOArchivar(): boolean {
    return false
  }

  puedeAccederAdmin(): boolean {
    return false
  }
}

/**
 * Política para el rol ESPECIALISTA:
 * - Puede recibir, adjuntar documentos internos y derivar.
 * - No puede finalizar ni archivar expedientes.
 */
export class PoliticaEspecialista extends PoliticaPermisoRol {
  readonly rol: RolUsuario = 'ESPECIALISTA'

  puedeRadicarExpediente(): boolean {
    return false
  }

  puedeRecepcionar(): boolean {
    return true
  }

  puedeDerivar(): boolean {
    return true
  }

  puedeSubirDocumentoIntermedio(): boolean {
    return true
  }

  puedeFinalizarOArchivar(): boolean {
    return false
  }

  puedeAccederAdmin(): boolean {
    return false
  }
}

/**
 * Política para el rol JEFE_AREA:
 * - Hereda/comparte capacidades operativas del Especialista y Asistente, y es el ÚNICO rol de área
 *   autorizado para cambiar el estado a 'ATENDIDO' o 'ARCHIVADO'.
 */
export class PoliticaJefeArea extends PoliticaPermisoRol {
  readonly rol: RolUsuario = 'JEFE_AREA'

  puedeRadicarExpediente(): boolean {
    return false
  }

  puedeRecepcionar(): boolean {
    return true
  }

  override puedeAsignarEspecialista(): boolean {
    return true
  }

  puedeDerivar(): boolean {
    return true
  }

  puedeSubirDocumentoIntermedio(): boolean {
    return true
  }

  puedeFinalizarOArchivar(): boolean {
    return true
  }

  puedeAccederAdmin(): boolean {
    return false
  }
}

/**
 * Política para el rol ADMIN_TI:
 * - Acceso exclusivo al panel de administración (/dashboard/admin).
 * - No opera expedientes en el flujo regular (según matriz RBAC).
 * - Su área de adscripción siempre es forzada a `null` (Global).
 */
export class PoliticaAdminTI extends PoliticaPermisoRol {
  readonly rol: RolUsuario = 'ADMIN_TI'

  puedeRadicarExpediente(): boolean {
    return false
  }

  puedeRecepcionar(): boolean {
    return false
  }

  puedeDerivar(): boolean {
    return false
  }

  puedeSubirDocumentoIntermedio(): boolean {
    return false
  }

  puedeFinalizarOArchivar(): boolean {
    return false
  }

  puedeAccederAdmin(): boolean {
    return true
  }

  override resolverAreaAdscripcion(
    _areaSeleccionadaId?: string | null,
    _areaMesaPartesId?: string | null
  ): string | null {
    return null
  }
}

/**
 * Política por defecto para FUNCIONARIO genérico (solo lectura/recepción básica).
 */
export class PoliticaFuncionario extends PoliticaPermisoRol {
  readonly rol: RolUsuario = 'FUNCIONARIO'

  puedeRadicarExpediente(): boolean {
    return false
  }

  puedeRecepcionar(): boolean {
    return true
  }

  puedeDerivar(): boolean {
    return false
  }

  puedeSubirDocumentoIntermedio(): boolean {
    return false
  }

  puedeFinalizarOArchivar(): boolean {
    return false
  }

  puedeAccederAdmin(): boolean {
    return false
  }
}

/**
 * [OCP] Registro y Fábrica Polimórfica de Políticas de Rol.
 * Permite registrar nuevas políticas en tiempo de ejecución sin modificar el código base.
 */
export class PoliticaPermisoRolFactory {
  private static readonly registro = new Map<string, PoliticaPermisoRol>([
    ['MESA_PARTES', new PoliticaMesaPartes()],
    ['ASISTENTE_AREA', new PoliticaAsistenteArea()],
    ['ESPECIALISTA', new PoliticaEspecialista()],
    ['JEFE_AREA', new PoliticaJefeArea()],
    ['ADMIN_TI', new PoliticaAdminTI()],
    ['ADMIN', new PoliticaAdminTI()],
    ['FUNCIONARIO', new PoliticaFuncionario()],
  ])

  static registrarPolitica(rol: string, politica: PoliticaPermisoRol): void {
    this.registro.set(rol.toUpperCase(), politica)
  }

  static obtenerPolitica(rol: string | null | undefined): PoliticaPermisoRol {
    const clave = (rol || 'FUNCIONARIO').trim().toUpperCase()
    return this.registro.get(clave) ?? new PoliticaFuncionario()
  }

  static obtenerTodas(): PoliticaPermisoRol[] {
    return [
      new PoliticaMesaPartes(),
      new PoliticaAsistenteArea(),
      new PoliticaEspecialista(),
      new PoliticaJefeArea(),
      new PoliticaAdminTI(),
      new PoliticaFuncionario(),
    ]
  }
}
