// app/actions/expedientes.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createExpedienteAction(formData: FormData) {
  try {
    const supabase = await createClient()

    // 1. Validar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'No autorizado. Debe iniciar sesión en el sistema.' }
    }

    // 2. Obtener área del usuario actual (registrador en Mesa de Partes)
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('area_id')
      .eq('id', user.id)
      .single()

    const areaRegistrador = (perfil as any)?.area_id

    // 3. Extraer campos del formulario
    const tipoDocIdentidad = (formData.get('tipo_documento_identidad') as string) || 'DNI'
    const numeroDocumento = (formData.get('remitente_dni_ruc') as string)?.trim() || ''
    const remitenteNombres = (formData.get('remitente_nombres') as string)?.trim() || ''
    const correo = (formData.get('correo') as string)?.trim() || null
    const telefono = (formData.get('telefono') as string)?.trim() || null
    const direccion = (formData.get('direccion') as string)?.trim() || ''

    const tipoTramite = (formData.get('tipo_tramite') as string) || 'FUT'
    const asuntoBase = (formData.get('asunto') as string)?.trim() || ''
    const foliosRaw = formData.get('folios')
    const folios = foliosRaw ? Math.max(1, parseInt(foliosRaw as string, 10)) : 1

    // Capturar lista de archivos
    const rawArchivos = formData.getAll('archivos') as File[]
    const archivos = rawArchivos.filter(
      (archivo) => archivo && typeof archivo === 'object' && archivo.size > 0 && archivo.name && archivo.name !== 'undefined'
    )

    // Validaciones del servidor
    if (!remitenteNombres || remitenteNombres.length < 3) {
      return { success: false, error: 'El nombre o razón social debe tener al menos 3 caracteres.' }
    }
    if (!numeroDocumento || numeroDocumento.length < 8) {
      return { success: false, error: 'El número de documento de identidad debe tener al menos 8 caracteres.' }
    }
    if (!asuntoBase || asuntoBase.length < 5) {
      return { success: false, error: 'El asunto del trámite debe tener al menos 5 caracteres.' }
    }

    // Construir asunto descriptivo preservando tipo de trámite y dirección
    let asuntoCompleto = `[${tipoTramite}] ${asuntoBase}`
    if (direccion) {
      asuntoCompleto += ` (Dirección: ${direccion})`
    }

    // 4. Insertar expediente principal y obtener su id
    const payloadExpediente = {
      remitente_nombres: remitenteNombres,
      remitente_dni_ruc: numeroDocumento,
      telefono: telefono,
      correo: correo,
      asunto: asuntoCompleto,
      folios: folios,
      estado: 'REGISTRADO',
      area_actual_id: areaRegistrador,
      registrado_por: user.id,
    } as any

    const { data: nuevoExpediente, error: insertError } = await (supabase
      .from('expedientes') as any)
      .insert(payloadExpediente)
      .select('id, cut')
      .single()

    if (insertError || !nuevoExpediente?.id) {
      return {
        success: false,
        error: `Error al registrar el expediente: ${insertError?.message || 'No se generó el ID del expediente'}`,
      }
    }

    const expedienteId = (nuevoExpediente as any).id
    const expedienteCut = (nuevoExpediente as any).cut

    // 5. Registrar en la trazabilidad (Hoja de ruta inicial)
    const payloadTrazabilidad = {
      expediente_id: expedienteId,
      area_origen_id: areaRegistrador,
      area_destino_id: areaRegistrador,
      emisor_id: user.id,
      accion: 'REGISTRO_INICIAL',
      proveido: `Ingreso inicial de ${tipoTramite} por Mesa de Partes`,
      estado_previo: null,
      estado_nuevo: 'REGISTRADO',
      fecha_envio: new Date().toISOString(),
    } as any

    await (supabase.from('trazabilidad') as any).insert(payloadTrazabilidad)

    // 6. Itera sobre el array archivos (for (const archivo of archivos))
    for (const archivo of archivos) {
      const cleanFileName = archivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${expedienteId}/${Date.now()}_${cleanFileName}`

      const fileBuffer = await archivo.arrayBuffer()
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(storagePath, fileBuffer, {
          contentType: archivo.type || 'application/pdf',
          upsert: false,
        })

      if (uploadError || !uploadData) {
        return {
          success: false,
          error: `Error al subir el archivo '${archivo.name}' a Storage: ${uploadError?.message || 'Fallo en la carga'}`,
        }
      }

      // Obtener la URL pública del archivo
      const { data: publicUrlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(uploadData.path)

      const publicUrl = publicUrlData?.publicUrl || storagePath

      // Insertar en la tabla adjuntos con expediente_id, nombre_archivo y ruta_almacenamiento
      const payloadAdjunto: any = {
        expediente_id: expedienteId,
        nombre_archivo: archivo.name,
        ruta_almacenamiento: publicUrl,
        tipo_mime: archivo.type || 'application/pdf',
        peso_bytes: archivo.size,
        subido_por: user.id,
      }

      const { error: adjuntoDbError } = await (supabase
        .from('adjuntos') as any)
        .insert(payloadAdjunto)

      if (adjuntoDbError) {
        return {
          success: false,
          error: `Error al registrar el archivo adjunto '${archivo.name}' en la base de datos: ${adjuntoDbError.message}`,
        }
      }
    }

    // 7. Revalidar cachés de rutas
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bandeja')

    return {
      success: true,
      id: expedienteId,
      cut: expedienteCut,
    }
  } catch (error: any) {
    console.error('Error general en createExpedienteAction:', error)
    return {
      success: false,
      error: error?.message || 'Ocurrió un error inesperado al procesar el expediente',
    }
  }
}