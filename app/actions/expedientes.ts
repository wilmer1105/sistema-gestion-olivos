// app/actions/expedientes.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Constants, type TipoDocumentoTramite } from '@/types/database.types'
import type { IArchivoAdjuntoInput } from '@/lib/domain/contracts/expediente.contracts'
import {
  puedeRadicarExpediente,
  puedeSubirDocumentoIntermedio,
  obtenerTiposDocumentoPermitidosPorRol,
} from '@/lib/domain/rbac'
import {
  expedienteSchema,
  validarArchivoPdf,
} from '@/lib/validators/expediente.schema'
import { documentoIntermedioSchema } from '@/lib/validators/derivacion.schema'
import {
  SupabaseAdjuntoRepository,
  SupabaseExpedienteRepository,
  SupabaseStorageProvider,
  SupabaseTrazabilidadRepository,
} from '@/lib/infrastructure/supabase/SupabaseRepositories'
import { ExpedienteService } from '@/lib/services/ExpedienteService'
import { StorageService } from '@/lib/services/StorageService'
import {
  derivarExpedienteAction as derivarAction,
  finalizarExpedienteAction as finalizarAction,
  type DerivarExpedienteInput,
  type DerivarExpedientePayload,
  type DerivarOpcionesSecundarias,
  type FinalizarEstado,
  type FinalizarExpedienteInput,
} from './derivaciones'

export type {
  DerivarExpedienteInput,
  DerivarExpedientePayload,
  DerivarOpcionesSecundarias,
  FinalizarEstado,
  FinalizarExpedienteInput,
}

function normalizarTipoDocumento(valor?: string | null): TipoDocumentoTramite {
  const upper = (valor || 'FUT').trim().toUpperCase()
  const permitidos: ReadonlyArray<string> = Constants.public.Enums.tipo_documento_tramite
  if (permitidos.includes(upper)) {
    return upper as TipoDocumentoTramite
  }
  return 'FUT'
}

async function convertirYValidarArchivosPdf(
  rawArchivos: FormDataEntryValue[],
  tipoDocumento?: TipoDocumentoTramite
): Promise<{
  valido: boolean
  error?: string
  archivos: IArchivoAdjuntoInput[]
}> {
  const archivosEntries = rawArchivos.filter(
    (entry): entry is File =>
      entry instanceof File &&
      entry.size > 0 &&
      Boolean(entry.name) &&
      entry.name !== 'undefined'
  )

  const resultado: IArchivoAdjuntoInput[] = []
  for (const archivo of archivosEntries) {
    const validacionPdf = validarArchivoPdf({
      name: archivo.name,
      type: archivo.type || 'application/pdf',
      size: archivo.size,
    })

    if (!validacionPdf.valido) {
      return {
        valido: false,
        error: `${archivo.name}: ${validacionPdf.error}`,
        archivos: [],
      }
    }

    const buffer = await archivo.arrayBuffer()
    resultado.push({
      nombre: archivo.name,
      tipoMime: 'application/pdf',
      tamanoBytes: archivo.size,
      contenido: buffer,
      tipoDocumento,
    })
  }

  return { valido: true, archivos: resultado }
}

/**
 * Radica un nuevo expediente en Mesa de Partes generando CUT automático, subiendo PDF inicial
 * y registrando la trazabilidad inicial (RF-06, RF-07, HU-03).
 */
export async function crearExpedienteAction(formData: FormData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: 'No autorizado. Debe iniciar sesión en el sistema.',
      }
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, rol, area_id, activo')
      .eq('id', user.id)
      .single()

    if (
      !perfil ||
      !puedeRadicarExpediente({
        id: perfil.id,
        rol: perfil.rol,
        area_id: perfil.area_id,
        activo: perfil.activo ?? true,
      })
    ) {
      return {
        success: false,
        error:
          '403 Forbidden: Solo el Operador de Mesa de Partes activo puede registrar expedientes iniciales.',
      }
    }

    const tipoDocRemitenteRaw = String(
      formData.get('tipo_doc_remitente') ??
        formData.get('tipo_documento_identidad') ??
        'DNI'
    )
      .trim()
      .toUpperCase()
    const tipoDocRemitente =
      tipoDocRemitenteRaw === 'RUC' || tipoDocRemitenteRaw === 'CE'
        ? tipoDocRemitenteRaw
        : 'DNI'

    const numeroDocumento = String(
      formData.get('remitente_dni_ruc') ?? ''
    ).trim()
    const remitenteNombres = String(
      formData.get('remitente_nombres') ?? ''
    ).trim()
    const correo = String(formData.get('correo') ?? '').trim() || null
    const telefono = String(formData.get('telefono') ?? '').trim() || null
    const direccion = String(formData.get('direccion') ?? '').trim() || null
    const tipoTramite = normalizarTipoDocumento(
      String(formData.get('tipo_tramite') ?? 'FUT')
    )
    const asuntoBase = String(formData.get('asunto') ?? '').trim()
    const foliosRaw = formData.get('folios')
    const folios =
      typeof foliosRaw === 'string' && foliosRaw.trim() !== ''
        ? parseInt(foliosRaw, 10)
        : 1
    const areaDestinoInicialId =
      String(formData.get('area_destino_inicial_id') ?? '').trim() || null

    const validacionDatos = expedienteSchema.safeParse({
      tipo_doc_remitente: tipoDocRemitente,
      remitente_dni_ruc: numeroDocumento,
      remitente_nombres: remitenteNombres,
      telefono,
      correo: correo || '',
      direccion,
      tipo_tramite: tipoTramite,
      asunto: asuntoBase,
      folios,
      area_destino_inicial_id: areaDestinoInicialId || '',
    })

    if (!validacionDatos.success) {
      const primerError = validacionDatos.error.issues[0]?.message
      return {
        success: false,
        error: primerError || 'Datos de registro del expediente inválidos.',
      }
    }

    const conversionArchivos = await convertirYValidarArchivosPdf(
      formData.getAll('archivos'),
      tipoTramite
    )

    if (!conversionArchivos.valido) {
      return {
        success: false,
        error: conversionArchivos.error,
      }
    }

    const expedienteRepo = new SupabaseExpedienteRepository(supabase)
    const trazabilidadRepo = new SupabaseTrazabilidadRepository(supabase)
    const adjuntoRepo = new SupabaseAdjuntoRepository(supabase)
    const storageProvider = new SupabaseStorageProvider(supabase)
    const storageService = new StorageService(storageProvider, adjuntoRepo)
    const service = new ExpedienteService(
      expedienteRepo,
      trazabilidadRepo,
      storageService
    )

    const resultado = await service.radicarExpediente(
      {
        tipo_doc_remitente: tipoDocRemitente,
        remitente_nombres: remitenteNombres,
        remitente_dni_ruc: numeroDocumento,
        telefono,
        correo,
        asunto: asuntoBase,
        folios,
        tipo_tramite: tipoTramite,
        direccion,
        area_actual_id: perfil.area_id,
        area_destino_inicial_id: areaDestinoInicialId,
        registrado_por: user.id,
      },
      conversionArchivos.archivos
    )

    if (!resultado.success) {
      return {
        success: false,
        error: resultado.error,
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bandeja')

    return {
      success: true,
      id: resultado.id,
      cut: resultado.cut,
    }
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : 'Ocurrió un error inesperado al procesar el expediente'
    return {
      success: false,
      error: msg,
    }
  }
}

export async function createExpedienteAction(formData: FormData) {
  return crearExpedienteAction(formData)
}

/**
 * Sube documentos intermedios sustentatorios (INFORME_TECNICO, INFORME_LEGAL, ACTA_FISCALIZACION, RESOLUCION)
 * agrupados bajo la unidad orgánica del funcionario (RF-14, HU-06).
 */
export async function subirDocumentoIntermedioAction(formData: FormData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'No autorizado. Debe iniciar sesión en el sistema.',
      }
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, rol, area_id, activo')
      .eq('id', user.id)
      .single()

    if (!perfil || perfil.activo === false) {
      return {
        success: false,
        error: 'Su cuenta no se encuentra activa para adjuntar documentos.',
      }
    }

    const expedienteId = String(formData.get('expediente_id') ?? '').trim()
    const tipoDocumentoRaw = String(
      formData.get('tipo_documento') ?? 'INFORME_TECNICO'
    ).trim()
    const tipoDocumento = normalizarTipoDocumento(tipoDocumentoRaw)
    const descripcion = String(formData.get('descripcion') ?? '').trim()

    const validacionMeta = documentoIntermedioSchema.safeParse({
      expediente_id: expedienteId,
      tipo_documento: tipoDocumento,
      descripcion,
    })

    if (!validacionMeta.success) {
      return {
        success: false,
        error:
          validacionMeta.error.issues[0]?.message ||
          'Metadatos del documento intermedio inválidos.',
      }
    }

    const { data: expedienteActual } = await supabase
      .from('expedientes')
      .select('id, area_actual_id, estado')
      .eq('id', expedienteId)
      .single()

    if (!expedienteActual) {
      return {
        success: false,
        error: 'Expediente no encontrado.',
      }
    }

    if (
      !puedeSubirDocumentoIntermedio(
        {
          id: perfil.id,
          rol: perfil.rol,
          area_id: perfil.area_id,
          activo: perfil.activo ?? true,
        },
        {
          id: expedienteActual.id,
          area_actual_id: expedienteActual.area_actual_id,
          estado: expedienteActual.estado,
        }
      )
    ) {
      if (expedienteActual.estado === 'DERIVADO') {
        return {
          success: false,
          error:
            'Debe acusar recepción del expediente en su bandeja antes de subir documentos intermedios.',
        }
      }
      return {
        success: false,
        error:
          '403 Forbidden: No cuenta con permisos en esta unidad orgánica para subir documentos intermedios.',
      }
    }

    const tiposPermitidos = obtenerTiposDocumentoPermitidosPorRol(perfil.rol)
    if (!tiposPermitidos.includes(tipoDocumento)) {
      return {
        success: false,
        error: `403 Forbidden: El rol ${perfil.rol} no está autorizado para emitir documentos de tipo ${tipoDocumento}.`,
      }
    }

    const conversionArchivos = await convertirYValidarArchivosPdf(
      formData.getAll('archivos'),
      tipoDocumento
    )

    if (!conversionArchivos.valido) {
      return {
        success: false,
        error: conversionArchivos.error,
      }
    }

    const expedienteRepo = new SupabaseExpedienteRepository(supabase)
    const trazabilidadRepo = new SupabaseTrazabilidadRepository(supabase)
    const adjuntoRepo = new SupabaseAdjuntoRepository(supabase)
    const storageProvider = new SupabaseStorageProvider(supabase)
    const storageService = new StorageService(storageProvider, adjuntoRepo)
    const service = new ExpedienteService(
      expedienteRepo,
      trazabilidadRepo,
      storageService
    )

    const resultado = await service.anexarDocumentosIntermedios({
      expedienteId,
      usuarioId: user.id,
      rolUsuario: perfil.rol,
      areaId: perfil.area_id,
      tipoDocumento,
      archivos: conversionArchivos.archivos,
      requerirRecepcionPrevia: true,
    })

    if (!resultado.success) {
      return {
        success: false,
        error: resultado.error,
      }
    }

    revalidatePath(`/dashboard/expedientes/${expedienteId}`)
    revalidatePath('/dashboard/bandeja')
    revalidatePath('/dashboard')

    return {
      success: true,
      archivosSubidos: resultado.archivosSubidos,
    }
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : 'Error inesperado al subir los documentos intermedios'
    return {
      success: false,
      error: msg,
    }
  }
}

export async function subirDocumentosIntermediosAction(formData: FormData) {
  return subirDocumentoIntermedioAction(formData)
}

export async function derivarExpedienteAction(
  payloadOrExpedienteId: DerivarExpedienteInput,
  param2?: string | DerivarOpcionesSecundarias,
  param3?: string,
  param4?: string
): Promise<{ success: boolean; error?: string }> {
  return derivarAction(payloadOrExpedienteId, param2, param3, param4)
}

export async function finalizarExpedienteAction(
  param1: FinalizarExpedienteInput,
  param2?: FinalizarEstado | string,
  param3?: string
): Promise<{ success: boolean; error?: string }> {
  return finalizarAction(param1, param2, param3)
}
