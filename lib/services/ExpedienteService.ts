// lib/services/ExpedienteService.ts

import type {
  IArchivoAdjuntoInput,
  IExpedienteAsignacionInterna,
  IExpedienteCierre,
  IExpedienteDerivacion,
  IExpedienteLectura,
  IExpedienteRadicacion,
  IExpedienteRecepcion,
  TipoDocumentoTramite,
} from '@/lib/domain/contracts/expediente.contracts'
import {
  type AccionExpedienteHandler,
  AsignacionInternaHandler,
  CierreExpedienteHandler,
  DerivacionHandler,
  RecepcionHandler,
  RegistroInicialHandler,
} from '@/lib/domain/handlers/AccionExpedienteHandler'
import { PoliticaPermisoRolFactory } from '@/lib/domain/policies/PoliticaPermisoRol'
import type {
  IExpedienteRepository,
  ITrazabilidadRepository,
} from '@/lib/domain/repositories/expediente.repository'
import { ExpedienteValidator } from './ExpedienteValidator'
import type { StorageService } from './StorageService'
import { TrazabilidadLogger } from './TrazabilidadLogger'

export interface ResultadoOperacionExpediente {
  readonly success: boolean
  readonly id?: string
  readonly cut?: string | null
  readonly archivosSubidos?: number
  readonly error?: string
}

/**
 * [SRP / OCP / LSP / ISP / DIP] Servicio de Aplicación y Dominio para la gestión de Expedientes.
 */
export class ExpedienteService {
  private readonly validator: ExpedienteValidator
  private readonly trazabilidadLogger: TrazabilidadLogger

  constructor(
    private readonly expedienteRepo: IExpedienteRepository,
    private readonly trazabilidadRepo: ITrazabilidadRepository,
    private readonly storageService?: StorageService,
    validator?: ExpedienteValidator,
    trazabilidadLogger?: TrazabilidadLogger
  ) {
    this.validator = validator ?? new ExpedienteValidator()
    this.trazabilidadLogger =
      trazabilidadLogger ?? new TrazabilidadLogger(this.trazabilidadRepo)
  }

  /**
   * Caso de Uso 1: Radicar (Crear) un nuevo expediente inicial con archivos adjuntos opcionales.
   */
  async radicarExpediente(
    datos: IExpedienteRadicacion,
    archivos: IArchivoAdjuntoInput[] = []
  ): Promise<ResultadoOperacionExpediente> {
    const validacion = this.validator.validarRadicacion({
      remitente_nombres: datos.remitente_nombres,
      remitente_dni_ruc: datos.remitente_dni_ruc,
      asunto: datos.asunto,
      folios: datos.folios,
    })

    if (!validacion.valido) {
      return { success: false, error: validacion.error }
    }

    const asuntoCompleto = datos.tipo_tramite
      ? this.validator.construirAsuntoDescriptivo(
          datos.tipo_tramite,
          datos.asunto,
          datos.direccion
        )
      : datos.asunto

    try {
      const nuevoExpediente = await this.expedienteRepo.crear({
        ...datos,
        asunto: asuntoCompleto,
      })

      const handler: AccionExpedienteHandler = new RegistroInicialHandler()
      const expedienteLectura: IExpedienteLectura = {
        id: nuevoExpediente.id,
        cut: nuevoExpediente.cut,
        remitente_nombres: datos.remitente_nombres,
        remitente_dni_ruc: datos.remitente_dni_ruc,
        asunto: asuntoCompleto,
        estado: 'REGISTRADO',
        area_actual_id: datos.area_actual_id,
        fecha_actualizacion: new Date().toISOString(),
      }

      await handler.ejecutar(
        expedienteLectura,
        {
          usuarioId: datos.registrado_por,
          areaOrigenId: datos.area_actual_id,
          areaDestinoId: datos.area_actual_id,
          tipoTramite: datos.tipo_tramite || 'FUT',
        },
        this.expedienteRepo,
        this.trazabilidadRepo
      )

      if (archivos.length > 0 && this.storageService) {
        const resArchivos = await this.storageService.subirYRegistrarArchivos({
          expedienteId: nuevoExpediente.id,
          usuarioId: datos.registrado_por,
          areaId: datos.area_actual_id,
          tipoDocumentoDefault: (datos.tipo_tramite as TipoDocumentoTramite) || 'FUT',
          archivos,
        })

        if (!resArchivos.exito) {
          return {
            success: false,
            error: resArchivos.error,
          }
        }
      }

      // Si se especificó un área de destino inicial distinta de Mesa de Partes, realiza el pase inicial a DERIVADO
      if (
        datos.area_destino_inicial_id &&
        datos.area_destino_inicial_id.trim() !== '' &&
        datos.area_destino_inicial_id !== datos.area_actual_id &&
        datos.area_actual_id
      ) {
        const derivacionInicial = new DerivacionHandler()
        await derivacionInicial.ejecutar(
          expedienteLectura,
          {
            usuarioId: datos.registrado_por,
            areaOrigenId: datos.area_actual_id,
            areaDestinoId: datos.area_destino_inicial_id,
            proveido: 'Derivación inicial desde Mesa de Partes para atención',
          },
          this.expedienteRepo,
          this.trazabilidadRepo
        )
      }

      return {
        success: true,
        id: nuevoExpediente.id,
        cut: nuevoExpediente.cut,
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'No se generó el ID del expediente'
      return {
        success: false,
        error: `Error al registrar el expediente: ${msg}`,
      }
    }
  }

  /**
   * Caso de Uso 2: Recepcionar un expediente en la bandeja de entrada.
   */
  async recepcionarExpediente(
    datos: IExpedienteRecepcion
  ): Promise<ResultadoOperacionExpediente> {
    try {
      const expediente = await this.expedienteRepo.obtenerPorId(datos.expediente_id)
      if (!expediente) {
        return { success: false, error: 'Expediente no encontrado.' }
      }

      if (
        datos.area_receptor_id &&
        expediente.area_actual_id &&
        datos.area_receptor_id !== expediente.area_actual_id
      ) {
        return {
          success: false,
          error: 'No autorizado: El expediente pertenece a otra unidad orgánica.',
        }
      }

      const handler: AccionExpedienteHandler = new RecepcionHandler()
      const res = await handler.ejecutar(
        expediente,
        {
          usuarioId: datos.usuario_id,
          areaOrigenId: expediente.area_actual_id ?? datos.area_receptor_id,
          areaDestinoId: datos.area_receptor_id ?? expediente.area_actual_id,
        },
        this.expedienteRepo,
        this.trazabilidadRepo
      )

      if (!res.exito) {
        return { success: false, error: res.error }
      }

      return { success: true }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error desconocido al recepcionar el expediente.'
      return { success: false, error: msg }
    }
  }

  /**
   * Caso de Uso 2B: Asignar internamente un expediente a un especialista de la misma área (RF-12).
   */
  async asignarEspecialistaInterno(
    datos: IExpedienteAsignacionInterna
  ): Promise<ResultadoOperacionExpediente> {
    try {
      const expediente = await this.expedienteRepo.obtenerPorId(datos.expediente_id)
      if (!expediente) {
        return { success: false, error: 'Expediente no encontrado.' }
      }

      if (expediente.area_actual_id !== datos.area_id) {
        return {
          success: false,
          error: 'No autorizado: El expediente no se encuentra en su unidad orgánica.',
        }
      }

      const handler: AccionExpedienteHandler = new AsignacionInternaHandler()
      const res = await handler.ejecutar(
        expediente,
        {
          usuarioId: datos.usuario_id,
          areaOrigenId: datos.area_id,
          areaDestinoId: datos.area_id,
          asignadoA: datos.especialista_id,
          proveido: datos.proveido,
        },
        this.expedienteRepo,
        this.trazabilidadRepo
      )

      if (!res.exito) {
        return { success: false, error: res.error }
      }

      return { success: true }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error desconocido al asignar especialista.'
      return { success: false, error: msg }
    }
  }

  /**
   * Caso de Uso 3: Derivar un expediente hacia otra unidad orgánica.
   */
  async derivarExpediente(
    datos: IExpedienteDerivacion
  ): Promise<ResultadoOperacionExpediente> {
    const validacion = this.validator.validarDerivacion({
      expediente_id: datos.expediente_id,
      area_origen_id: datos.area_origen_id,
      area_destino_id: datos.area_destino_id,
      accion: datos.accion,
    })

    if (!validacion.valido) {
      return { success: false, error: validacion.error }
    }

    try {
      const expedienteExistente = await this.expedienteRepo.obtenerPorId(
        datos.expediente_id
      )

      const expedienteBase: IExpedienteLectura = expedienteExistente ?? {
        id: datos.expediente_id,
        cut: null,
        remitente_nombres: '',
        asunto: '',
        estado: 'RECEPCIONADO',
        area_actual_id: datos.area_origen_id,
        fecha_actualizacion: new Date().toISOString(),
      }

      const handler: AccionExpedienteHandler = new DerivacionHandler()
      const resultado = await handler.ejecutar(
        expedienteBase,
        {
          usuarioId: datos.emisor_id,
          areaOrigenId: datos.area_origen_id,
          areaDestinoId: datos.area_destino_id,
          asignadoA: datos.asignado_a ?? null,
          proveido: datos.accion?.trim() || 'DERIVADO',
        },
        this.expedienteRepo,
        this.trazabilidadRepo
      )

      if (!resultado.exito) {
        const msg = resultado.error || 'No se pudo derivar el expediente.'
        return {
          success: false,
          error: msg.startsWith('Error BD: ') ? msg : `Error BD: ${msg}`,
        }
      }

      return { success: true }
    } catch (err: unknown) {
      const rawMsg =
        err instanceof Error
          ? err.message
          : 'Error inesperado al derivar el expediente'
      const errorMsg = rawMsg.startsWith('Error BD: ')
        ? rawMsg
        : `Error BD: ${rawMsg}`
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Caso de Uso 4: Finalizar o Archivar un expediente aplicando política RBAC polimórfica.
   * EXCLUSIVO para JEFE_AREA (RF-16, HU-08).
   */
  async finalizarExpediente(
    datos: IExpedienteCierre
  ): Promise<ResultadoOperacionExpediente> {
    const validacion = this.validator.validarCierre({
      expediente_id: datos.expediente_id,
      estado_nuevo: datos.estado_nuevo,
    })

    if (!validacion.valido) {
      return { success: false, error: `Error: ${validacion.error}` }
    }

    // Evaluación estricta de permisos RBAC: Exclusivo JEFE_AREA (OP-13, RF-16, HU-08)
    const politica = PoliticaPermisoRolFactory.obtenerPolitica(datos.rol_usuario)
    const autorizacion = politica.verificarPermisoAccion('CIERRE')
    if (!autorizacion.autorizado || datos.rol_usuario !== 'JEFE_AREA') {
      return {
        success: false,
        error:
          '403 Forbidden: Solo el Jefe de Área puede finalizar o archivar expedientes.',
      }
    }

    try {
      const expediente = await this.expedienteRepo.obtenerPorId(datos.expediente_id)
      if (!expediente) {
        return {
          success: false,
          error: 'Expediente no encontrado en la base de datos.',
        }
      }

      const handler: AccionExpedienteHandler = new CierreExpedienteHandler()
      const resultado = await handler.ejecutar(
        expediente,
        {
          usuarioId: datos.usuario_id,
          rolUsuario: datos.rol_usuario,
          estadoCierre: datos.estado_nuevo,
          proveido: datos.observacion,
        },
        this.expedienteRepo,
        this.trazabilidadRepo
      )

      if (!resultado.exito) {
        const msg = resultado.error || 'No se pudo actualizar el estado del expediente.'
        return {
          success: false,
          error: msg.startsWith('Error BD: ') ? msg : `Error BD: ${msg}`,
        }
      }

      return { success: true }
    } catch (err: unknown) {
      const rawMsg =
        err instanceof Error ? err.message : 'Error inesperado al cerrar el expediente'
      const errorMsg = rawMsg.startsWith('Error BD: ') ? rawMsg : `Error: ${rawMsg}`
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Caso de Uso 5: Subida intermedia de documentos internos por personal del área (OP-09, RF-14, HU-06).
   */
  async anexarDocumentosIntermedios(params: {
    expedienteId: string
    usuarioId: string
    rolUsuario: string
    areaId: string | null
    tipoDocumento?: TipoDocumentoTramite
    archivos: IArchivoAdjuntoInput[]
    requerirRecepcionPrevia?: boolean
  }): Promise<ResultadoOperacionExpediente> {
    const politica = PoliticaPermisoRolFactory.obtenerPolitica(params.rolUsuario)
    const autorizacion = politica.verificarPermisoAccion('ANEXO_DOCUMENTAL')

    if (!autorizacion.autorizado) {
      return {
        success: false,
        error:
          autorizacion.motivo ||
          'No autorizado: Solo personal de las unidades orgánicas puede adjuntar documentos intermedios.',
      }
    }

    if (!params.expedienteId || params.expedienteId.trim() === '') {
      return {
        success: false,
        error: 'Identificador del expediente no proporcionado.',
      }
    }

    if (params.requerirRecepcionPrevia) {
      const expedienteExistente = await this.expedienteRepo.obtenerPorId(
        params.expedienteId
      )
      if (expedienteExistente && expedienteExistente.estado === 'DERIVADO') {
        return {
          success: false,
          error:
            'No puede anexar documentos intermedios sin haber recepcionado previamente el expediente en su bandeja.',
        }
      }
    }

    const valArchivos = this.validator.validarArchivosAdjuntos(
      params.archivos,
      true,
      10 * 1024 * 1024
    )
    if (!valArchivos.valido) {
      return { success: false, error: valArchivos.error }
    }

    if (!this.storageService) {
      return {
        success: false,
        error: 'Servicio de almacenamiento no disponible.',
      }
    }

    const resCarga = await this.storageService.subirYRegistrarArchivos({
      expedienteId: params.expedienteId,
      usuarioId: params.usuarioId,
      areaId: params.areaId,
      tipoDocumentoDefault: params.tipoDocumento || 'INFORME_TECNICO',
      archivos: params.archivos,
    })

    if (!resCarga.exito) {
      return {
        success: false,
        error: resCarga.error,
      }
    }

    await this.trazabilidadLogger.registrarAnexoDocumental({
      expedienteId: params.expedienteId,
      areaId: params.areaId,
      usuarioId: params.usuarioId,
      cantidadArchivos: resCarga.cantidadSubidos,
    })

    return {
      success: true,
      archivosSubidos: resCarga.cantidadSubidos,
    }
  }
}
