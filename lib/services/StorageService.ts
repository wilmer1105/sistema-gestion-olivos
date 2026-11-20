// lib/services/StorageService.ts

import type {
  IAdjuntoRegistro,
  IArchivoAdjuntoInput,
  TipoDocumentoTramite,
} from '@/lib/domain/contracts/expediente.contracts'
import type {
  IAdjuntoRepository,
  IStorageProvider,
} from '@/lib/domain/repositories/expediente.repository'

export interface ParametrosCargaAdjuntos {
  readonly expedienteId: string
  readonly usuarioId: string
  readonly areaId: string | null
  readonly tipoDocumentoDefault?: TipoDocumentoTramite
  readonly archivos: IArchivoAdjuntoInput[]
}

export interface ResultadoCargaAdjuntos {
  readonly exito: boolean
  readonly cantidadSubidos: number
  readonly error?: string
}

/**
 * [SRP / DIP] Servicio con Responsabilidad Única de gestionar la sanitización de nombres,
 * carga binaria al proveedor de almacenamiento (`IStorageProvider`) y registro de metadatos
 * en `IAdjuntoRepository`.
 */
export class StorageService {
  constructor(
    private readonly storageProvider: IStorageProvider,
    private readonly adjuntoRepository: IAdjuntoRepository
  ) {}

  sanitizarNombreArchivo(nombreArchivo: string): string {
    return nombreArchivo.replace(/[^a-zA-Z0-9._-]/g, '_')
  }

  construirRutaAlmacenamiento(
    expedienteId: string,
    nombreArchivo: string,
    timestamp: number = Date.now()
  ): string {
    const cleanFileName = this.sanitizarNombreArchivo(nombreArchivo)
    return `${expedienteId}/${timestamp}_${cleanFileName}`
  }

  async subirYRegistrarArchivos(
    params: ParametrosCargaAdjuntos
  ): Promise<ResultadoCargaAdjuntos> {
    let subidos = 0

    for (const archivo of params.archivos) {
      const storagePath = this.construirRutaAlmacenamiento(
        params.expedienteId,
        archivo.nombre
      )
      const tipoMime = archivo.tipoMime || 'application/pdf'

      let uploadRes: { path: string; publicUrl: string }
      try {
        uploadRes = await this.storageProvider.subirArchivo(
          storagePath,
          archivo.contenido,
          tipoMime
        )
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Fallo en la carga'
        return {
          exito: false,
          cantidadSubidos: subidos,
          error: `Error al subir el archivo '${archivo.nombre}' a Storage: ${msg}`,
        }
      }

      const registro: IAdjuntoRegistro = {
        expediente_id: params.expedienteId,
        nombre_archivo: archivo.nombre,
        ruta_almacenamiento: uploadRes.publicUrl || storagePath,
        tipo_mime: tipoMime,
        peso_bytes: archivo.tamanoBytes,
        subido_por: params.usuarioId,
        area_id: params.areaId || null,
        tipo_documento:
          archivo.tipoDocumento || params.tipoDocumentoDefault || 'FUT',
      }

      try {
        await this.adjuntoRepository.registrar(registro)
        subidos++
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Fallo en BD'
        return {
          exito: false,
          cantidadSubidos: subidos,
          error: `Error al registrar el archivo adjunto '${archivo.nombre}' en la base de datos: ${msg}`,
        }
      }
    }

    return {
      exito: true,
      cantidadSubidos: subidos,
    }
  }
}
