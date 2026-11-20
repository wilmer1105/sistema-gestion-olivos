// lib/domain/repositories/expediente.repository.ts

import type {
  EstadoExpediente,
  IAdjuntoRegistro,
  IExpedienteIdentidad,
  IExpedienteLectura,
  IExpedienteRadicacion,
  ITrazabilidadRegistro,
} from '../contracts/expediente.contracts'

/**
 * [DIP] Abstracción de persistencia para la entidad Expediente.
 * Permite que la capa de dominio/servicios opere sin acoplarse al SDK de Supabase.
 */
export interface IExpedienteRepository {
  obtenerPorId(id: string): Promise<IExpedienteLectura | null>
  crear(datos: IExpedienteRadicacion): Promise<IExpedienteIdentidad>
  actualizarEstadoYArea(
    id: string,
    nuevoEstado: EstadoExpediente,
    nuevaAreaId?: string | null,
    asignadoA?: string | null
  ): Promise<IExpedienteLectura>
}

/**
 * [DIP] Abstracción de persistencia para la Hoja de Ruta (Trazabilidad).
 */
export interface ITrazabilidadRepository {
  registrar(evento: ITrazabilidadRegistro): Promise<{ id: string }>
  obtenerPorExpediente(expedienteId: string): Promise<ITrazabilidadRegistro[]>
  marcarRecepcionAbierta?(
    expedienteId: string,
    receptorId: string,
    fechaRecepcion?: string
  ): Promise<void>
}

/**
 * [DIP] Abstracción de persistencia para los metadatos de Archivos Adjuntos.
 */
export interface IAdjuntoRepository {
  registrar(adjunto: IAdjuntoRegistro): Promise<{ id: string }>
}

/**
 * [DIP] Abstracción del proveedor de almacenamiento de objetos (Storage).
 */
export interface IStorageProvider {
  subirArchivo(
    ruta: string,
    contenido: ArrayBuffer,
    tipoMime: string
  ): Promise<{ path: string; publicUrl: string }>
}
