// lib/services/TrazabilidadLogger.ts

import type { ITrazabilidadRegistro } from '@/lib/domain/contracts/expediente.contracts'
import type { ITrazabilidadRepository } from '@/lib/domain/repositories/expediente.repository'

/**
 * [SRP / DIP] Servicio con Responsabilidad Única de construir y registrar
 * eventos en la Hoja de Ruta (auditoría documental) a través de `ITrazabilidadRepository`.
 */
export class TrazabilidadLogger {
  constructor(private readonly trazabilidadRepository: ITrazabilidadRepository) {}

  async registrarEvento(evento: ITrazabilidadRegistro): Promise<{ id: string }> {
    return this.trazabilidadRepository.registrar(evento)
  }

  async registrarIngresoInicial(params: {
    expedienteId: string
    areaId: string | null
    usuarioId: string
    tipoTramite: string
  }): Promise<{ id: string }> {
    return this.trazabilidadRepository.registrar({
      expediente_id: params.expedienteId,
      area_origen_id: params.areaId,
      area_destino_id: params.areaId,
      emisor_id: params.usuarioId,
      accion: 'REGISTRO_INICIAL',
      proveido: `Ingreso inicial de ${params.tipoTramite || 'FUT'} por Mesa de Partes`,
      estado_previo: null,
      estado_nuevo: 'REGISTRADO',
      fecha_envio: new Date().toISOString(),
    })
  }

  async registrarAnexoDocumental(params: {
    expedienteId: string
    areaId: string | null
    usuarioId: string
    cantidadArchivos: number
  }): Promise<{ id: string } | null> {
    if (!params.areaId) {
      return null
    }
    return this.trazabilidadRepository.registrar({
      expediente_id: params.expedienteId,
      area_origen_id: params.areaId,
      area_destino_id: params.areaId,
      emisor_id: params.usuarioId,
      accion: 'ANEXO_DOCUMENTAL',
      proveido: `Se anexaron ${params.cantidadArchivos} nuevo(s) documento(s) al expediente`,
      estado_previo: null,
      estado_nuevo: null,
      fecha_envio: new Date().toISOString(),
    })
  }
}
