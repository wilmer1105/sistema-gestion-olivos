// lib/domain/handlers/AccionExpedienteHandler.ts

import type {
  EstadoCierreExpediente,
  EstadoExpediente,
  IExpedienteLectura,
  ITrazabilidadRegistro,
  TipoAccionExpediente,
} from '../contracts/expediente.contracts'
import type {
  IExpedienteRepository,
  ITrazabilidadRepository,
} from '../repositories/expediente.repository'

export interface ContextoAccionExpediente {
  readonly usuarioId: string
  readonly rolUsuario?: string
  readonly areaOrigenId?: string | null
  readonly areaDestinoId?: string | null
  readonly asignadoA?: string | null
  readonly proveido?: string | null
  readonly estadoCierre?: EstadoCierreExpediente
  readonly tipoTramite?: string
}

export interface ResultadoValidacionTransicion {
  readonly valido: boolean
  readonly error?: string
}

export interface ResultadoAccionExpediente {
  readonly exito: boolean
  readonly estadoNuevo?: EstadoExpediente
  readonly areaActualId?: string | null
  readonly trazabilidadId?: string
  readonly error?: string
}

/**
 * [OCP / LSP] Clase Base Abstracta Polimórfica para Manejadores de Acciones Documentales.
 */
export abstract class AccionExpedienteHandler {
  abstract readonly tipoAccion: TipoAccionExpediente

  abstract obtenerEstadoResultante(contexto: ContextoAccionExpediente): EstadoExpediente

  abstract obtenerAreaResultante(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): string | null

  obtenerAsignadoResultante(
    expedienteActual: IExpedienteLectura,
    _contexto: ContextoAccionExpediente
  ): string | null | undefined {
    return expedienteActual.asignado_a
  }

  abstract validarTransicion(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): ResultadoValidacionTransicion

  abstract construirTrazabilidad(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): ITrazabilidadRegistro

  /**
   * Método Plantilla (Template Method) que ejecuta el flujo completo de una acción.
   */
  async ejecutar(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente,
    expedienteRepo: IExpedienteRepository,
    trazabilidadRepo: ITrazabilidadRepository
  ): Promise<ResultadoAccionExpediente> {
    const validacion = this.validarTransicion(expedienteActual, contexto)
    if (!validacion.valido) {
      return {
        exito: false,
        error: validacion.error || 'Transición de expediente no válida.',
      }
    }

    const estadoNuevo = this.obtenerEstadoResultante(contexto)
    const areaResultante = this.obtenerAreaResultante(expedienteActual, contexto)
    const asignadoResultante = this.obtenerAsignadoResultante(expedienteActual, contexto)

    try {
      if (this.tipoAccion !== 'REGISTRO_INICIAL') {
        await expedienteRepo.actualizarEstadoYArea(
          expedienteActual.id,
          estadoNuevo,
          areaResultante,
          asignadoResultante
        )
      }

      if (
        this.tipoAccion === 'RECEPCION' &&
        typeof trazabilidadRepo.marcarRecepcionAbierta === 'function'
      ) {
        await trazabilidadRepo.marcarRecepcionAbierta(
          expedienteActual.id,
          contexto.usuarioId
        )
      }

      const registroTrazabilidad = this.construirTrazabilidad(expedienteActual, contexto)
      const trazabilidadCreada = await trazabilidadRepo.registrar(registroTrazabilidad)

      return {
        exito: true,
        estadoNuevo,
        areaActualId: areaResultante,
        trazabilidadId: trazabilidadCreada.id,
      }
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error ? err.message : 'Error inesperado al ejecutar acción documental.'
      return {
        exito: false,
        error: mensaje,
      }
    }
  }
}

/**
 * Manejador para REGISTRO_INICIAL (Mesa de Partes).
 */
export class RegistroInicialHandler extends AccionExpedienteHandler {
  readonly tipoAccion: TipoAccionExpediente = 'REGISTRO_INICIAL'

  obtenerEstadoResultante(): EstadoExpediente {
    return 'REGISTRADO'
  }

  obtenerAreaResultante(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): string | null {
    return contexto.areaDestinoId ?? expedienteActual.area_actual_id
  }

  validarTransicion(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): ResultadoValidacionTransicion {
    if (!expedienteActual.id) {
      return { valido: false, error: 'El expediente debe contar con un identificador válido.' }
    }
    if (!contexto.usuarioId) {
      return { valido: false, error: 'Se requiere un usuario autenticado para el registro inicial.' }
    }
    return { valido: true }
  }

  construirTrazabilidad(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): ITrazabilidadRegistro {
    const tipoTramite = contexto.tipoTramite || 'FUT'
    const areaId = contexto.areaOrigenId ?? expedienteActual.area_actual_id
    return {
      expediente_id: expedienteActual.id,
      area_origen_id: areaId,
      area_destino_id: areaId,
      emisor_id: contexto.usuarioId,
      accion: 'REGISTRO_INICIAL',
      proveido: contexto.proveido || `Ingreso inicial de ${tipoTramite} por Mesa de Partes`,
      estado_previo: null,
      estado_nuevo: 'REGISTRADO',
      fecha_envio: new Date().toISOString(),
    }
  }
}

/**
 * Manejador para RECEPCION en Bandeja de Entrada.
 */
export class RecepcionHandler extends AccionExpedienteHandler {
  readonly tipoAccion: TipoAccionExpediente = 'RECEPCION'

  obtenerEstadoResultante(): EstadoExpediente {
    return 'RECEPCIONADO'
  }

  obtenerAreaResultante(expedienteActual: IExpedienteLectura): string | null {
    return expedienteActual.area_actual_id
  }

  validarTransicion(expedienteActual: IExpedienteLectura): ResultadoValidacionTransicion {
    if (expedienteActual.estado === 'RECEPCIONADO') {
      return { valido: false, error: 'Este expediente ya fue recepcionado.' }
    }
    if (expedienteActual.estado === 'ATENDIDO' || expedienteActual.estado === 'ARCHIVADO') {
      return {
        valido: false,
        error: `No se puede recepcionar un expediente que ya se encuentra ${expedienteActual.estado}.`,
      }
    }
    return { valido: true }
  }

  construirTrazabilidad(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): ITrazabilidadRegistro {
    const areaActual = expedienteActual.area_actual_id ?? contexto.areaDestinoId ?? null
    const now = new Date().toISOString()
    return {
      expediente_id: expedienteActual.id,
      area_origen_id: areaActual,
      area_destino_id: contexto.areaDestinoId ?? areaActual,
      emisor_id: contexto.usuarioId,
      receptor_id: contexto.usuarioId,
      accion: 'RECEPCION',
      proveido: contexto.proveido || 'Expediente recepcionado en bandeja de entrada',
      estado_previo: expedienteActual.estado,
      estado_nuevo: 'RECEPCIONADO',
      fecha_envio: now,
      fecha_recepcion: now,
    }
  }
}

/**
 * Manejador para ASIGNACION interna a un Especialista de la misma unidad orgánica.
 */
export class AsignacionInternaHandler extends AccionExpedienteHandler {
  readonly tipoAccion: TipoAccionExpediente = 'ASIGNACION'

  obtenerEstadoResultante(): EstadoExpediente {
    return 'EN_TRAMITE'
  }

  obtenerAreaResultante(expedienteActual: IExpedienteLectura): string | null {
    return expedienteActual.area_actual_id
  }

  override obtenerAsignadoResultante(
    _expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): string | null {
    return contexto.asignadoA ?? null
  }

  validarTransicion(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): ResultadoValidacionTransicion {
    if (!contexto.asignadoA || contexto.asignadoA.trim() === '') {
      return {
        valido: false,
        error: 'Debe seleccionar el especialista al cual asignar el expediente.',
      }
    }
    if (expedienteActual.estado === 'DERIVADO') {
      return {
        valido: false,
        error:
          'No se puede asignar un especialista sin haber recepcionado previamente el expediente.',
      }
    }
    if (
      expedienteActual.estado === 'ATENDIDO' ||
      expedienteActual.estado === 'ARCHIVADO'
    ) {
      return {
        valido: false,
        error: `No se puede asignar un expediente que ya está ${expedienteActual.estado}.`,
      }
    }
    return { valido: true }
  }

  construirTrazabilidad(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): ITrazabilidadRegistro {
    const now = new Date().toISOString()
    return {
      expediente_id: expedienteActual.id,
      area_origen_id: expedienteActual.area_actual_id,
      area_destino_id: expedienteActual.area_actual_id,
      emisor_id: contexto.usuarioId,
      receptor_id: contexto.asignadoA ?? null,
      accion: 'ASIGNACIÓN',
      proveido:
        contexto.proveido?.trim() ||
        'Asignación interna a especialista para evaluación técnica/legal',
      estado_previo: expedienteActual.estado,
      estado_nuevo: 'EN_TRAMITE',
      fecha_envio: now,
    }
  }
}

/**
 * Manejador para DERIVACION entre áreas municipales.
 */
export class DerivacionHandler extends AccionExpedienteHandler {
  readonly tipoAccion: TipoAccionExpediente = 'DERIVACION'

  obtenerEstadoResultante(): EstadoExpediente {
    return 'DERIVADO'
  }

  obtenerAreaResultante(
    _expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): string | null {
    return contexto.areaDestinoId ?? null
  }

  override obtenerAsignadoResultante(
    _expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): string | null {
    return contexto.asignadoA ?? null
  }

  validarTransicion(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): ResultadoValidacionTransicion {
    if (!expedienteActual.id || expedienteActual.id.trim() === '') {
      return {
        valido: false,
        error: 'El identificador del expediente (expediente_id) no puede ser undefined o null.',
      }
    }
    if (!contexto.areaOrigenId || contexto.areaOrigenId.trim() === '') {
      return {
        valido: false,
        error: 'El área de origen (area_origen_id) no puede ser undefined o null.',
      }
    }
    if (!contexto.areaDestinoId || contexto.areaDestinoId.trim() === '') {
      return {
        valido: false,
        error: 'El área de destino (area_destino_id) no puede ser undefined o null.',
      }
    }
    if (expedienteActual.estado === 'DERIVADO') {
      return {
        valido: false,
        error:
          'Debe acusar recepción del expediente en su bandeja antes de poder derivarlo a otra unidad orgánica.',
      }
    }
    if (
      expedienteActual.estado === 'ARCHIVADO' ||
      expedienteActual.estado === 'ATENDIDO'
    ) {
      return {
        valido: false,
        error: `No se puede derivar un expediente que se encuentra ${expedienteActual.estado}.`,
      }
    }
    return { valido: true }
  }

  construirTrazabilidad(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): ITrazabilidadRegistro {
    const instruccion = contexto.proveido?.trim() || 'DERIVADO'
    return {
      expediente_id: expedienteActual.id,
      area_origen_id: contexto.areaOrigenId ?? expedienteActual.area_actual_id,
      area_destino_id: contexto.areaDestinoId ?? null,
      emisor_id: contexto.usuarioId,
      accion: instruccion,
      proveido: instruccion,
      estado_previo: expedienteActual.estado,
      estado_nuevo: 'DERIVADO',
      fecha_envio: new Date().toISOString(),
    }
  }
}

/**
 * Manejador para CIERRE ('ATENDIDO' o 'ARCHIVADO').
 */
export class CierreExpedienteHandler extends AccionExpedienteHandler {
  readonly tipoAccion: TipoAccionExpediente = 'CIERRE'

  obtenerEstadoResultante(contexto: ContextoAccionExpediente): EstadoExpediente {
    return contexto.estadoCierre === 'ARCHIVADO' ? 'ARCHIVADO' : 'ATENDIDO'
  }

  obtenerAreaResultante(expedienteActual: IExpedienteLectura): string | null {
    return expedienteActual.area_actual_id
  }

  validarTransicion(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): ResultadoValidacionTransicion {
    if (!expedienteActual.id || expedienteActual.id.trim() === '') {
      return { valido: false, error: 'El ID del expediente es obligatorio.' }
    }
    if (contexto.estadoCierre !== 'ATENDIDO' && contexto.estadoCierre !== 'ARCHIVADO') {
      return {
        valido: false,
        error: "El estado de cierre solo puede ser 'ATENDIDO' o 'ARCHIVADO'.",
      }
    }
    return { valido: true }
  }

  construirTrazabilidad(
    expedienteActual: IExpedienteLectura,
    contexto: ContextoAccionExpediente
  ): ITrazabilidadRegistro {
    const estadoFinal = this.obtenerEstadoResultante(contexto)
    const observacion =
      contexto.proveido?.trim() ||
      (estadoFinal === 'ATENDIDO' ? 'Expediente Atendido / Finalizado' : 'Expediente Archivado')

    return {
      expediente_id: expedienteActual.id,
      area_origen_id: expedienteActual.area_actual_id,
      area_destino_id: expedienteActual.area_actual_id,
      emisor_id: contexto.usuarioId,
      accion: estadoFinal,
      proveido: observacion,
      estado_previo: expedienteActual.estado,
      estado_nuevo: estadoFinal,
      fecha_envio: new Date().toISOString(),
    }
  }
}
