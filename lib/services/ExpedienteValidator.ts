// lib/services/ExpedienteValidator.ts

import type {
  EstadoCierreExpediente,
  IArchivoAdjuntoInput,
} from '@/lib/domain/contracts/expediente.contracts'
import { MAX_PDF_SIZE_BYTES } from '@/lib/validators/expediente.schema'

export interface ValidacionResultado {
  readonly valido: boolean
  readonly error?: string
}

export interface DatosRadicacionValidar {
  readonly remitente_nombres: string
  readonly remitente_dni_ruc: string
  readonly asunto: string
  readonly folios?: number
}

export interface DatosDerivacionValidar {
  readonly expediente_id?: string | null
  readonly area_origen_id?: string | null
  readonly area_destino_id?: string | null
  readonly accion?: string | null
}

export interface DatosCierreValidar {
  readonly expediente_id?: string | null
  readonly estado_nuevo?: string | null
}

/**
 * [SRP] Clase con Responsabilidad Única de validar las reglas de datos y formato
 * de los trámites documentarios antes de cualquier operación de persistencia.
 */
export class ExpedienteValidator {
  validarRadicacion(datos: DatosRadicacionValidar): ValidacionResultado {
    const nombres = datos.remitente_nombres?.trim() || ''
    const documento = datos.remitente_dni_ruc?.trim() || ''
    const asunto = datos.asunto?.trim() || ''

    if (!nombres || nombres.length < 3) {
      return {
        valido: false,
        error: 'El nombre o razón social debe tener al menos 3 caracteres.',
      }
    }

    if (!documento || documento.length < 8) {
      return {
        valido: false,
        error: 'El número de documento de identidad debe tener al menos 8 caracteres.',
      }
    }

    if (!asunto || asunto.length < 5) {
      return {
        valido: false,
        error: 'El asunto del trámite debe tener al menos 5 caracteres.',
      }
    }

    if (datos.folios !== undefined && datos.folios < 1) {
      return {
        valido: false,
        error: 'El expediente debe contar con al menos 1 folio.',
      }
    }

    return { valido: true }
  }

  validarDerivacion(datos: DatosDerivacionValidar): ValidacionResultado {
    const origen = datos.area_origen_id ? String(datos.area_origen_id).trim() : ''
    const destino = datos.area_destino_id ? String(datos.area_destino_id).trim() : ''
    const expedienteId = datos.expediente_id ? String(datos.expediente_id).trim() : ''

    if (!origen) {
      return {
        valido: false,
        error: 'El área de origen (area_origen_id) no puede ser undefined o null.',
      }
    }

    if (!destino) {
      return {
        valido: false,
        error: 'El área de destino (area_destino_id) no puede ser undefined o null.',
      }
    }

    if (origen === destino) {
      return {
        valido: false,
        error: 'El área de destino debe ser distinta al área de origen.',
      }
    }

    if (!expedienteId) {
      return {
        valido: false,
        error: 'El identificador del expediente (expediente_id) no puede ser undefined o null.',
      }
    }

    return { valido: true }
  }

  validarCierre(datos: DatosCierreValidar): ValidacionResultado {
    if (!datos.expediente_id || String(datos.expediente_id).trim() === '') {
      return {
        valido: false,
        error: 'El ID del expediente es obligatorio.',
      }
    }

    if (datos.estado_nuevo !== 'ATENDIDO' && datos.estado_nuevo !== 'ARCHIVADO') {
      return {
        valido: false,
        error: "El estado de cierre solo puede ser 'ATENDIDO' o 'ARCHIVADO'.",
      }
    }

    return { valido: true }
  }

  validarArchivosAdjuntos(
    archivos: IArchivoAdjuntoInput[],
    requiereAlMenosUno = false,
    maxBytesPorArchivo = MAX_PDF_SIZE_BYTES
  ): ValidacionResultado {
    if (requiereAlMenosUno && archivos.length === 0) {
      return {
        valido: false,
        error: 'Debe seleccionar al menos un archivo válido.',
      }
    }

    for (const archivo of archivos) {
      if (archivo.tamanoBytes <= 0) {
        return {
          valido: false,
          error: `El archivo '${archivo.nombre}' está vacío.`,
        }
      }
      if (archivo.tamanoBytes > maxBytesPorArchivo) {
        return {
          valido: false,
          error: `El archivo '${archivo.nombre}' supera el límite permitido.`,
        }
      }
    }

    return { valido: true }
  }

  construirAsuntoDescriptivo(
    tipoTramite: string,
    asuntoBase: string,
    direccion?: string | null
  ): string {
    const tramite = tipoTramite?.trim() || 'FUT'
    let asuntoCompleto = `[${tramite}] ${asuntoBase.trim()}`
    if (direccion && direccion.trim() !== '') {
      asuntoCompleto += ` (Dirección: ${direccion.trim()})`
    }
    return asuntoCompleto
  }

  esEstadoCierreValido(estado: string): estado is EstadoCierreExpediente {
    return estado === 'ATENDIDO' || estado === 'ARCHIVADO'
  }
}
