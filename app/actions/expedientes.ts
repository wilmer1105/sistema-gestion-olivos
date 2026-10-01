// app/actions/expedientes.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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
        area_id: areaRegistrador || null,
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

export interface DerivarExpedientePayload {
  expediente_id: string
  area_destino_id: string
  area_origen_id: string
  accion: string
}

export type DerivarExpedienteInput =
  | DerivarExpedientePayload
  | {
      expediente_id: string
      area_destino_id: string
      area_origen_id: string
      accion?: string
      proveido?: string
    }
  | string

export async function derivarExpedienteAction(
  payloadOrExpedienteId: DerivarExpedienteInput,
  param2?: any,
  param3?: any,
  param4?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    let expediente_id: string | undefined
    let area_destino_id: string | undefined
    let area_origen_id: string | undefined
    let accion: string | undefined

    if (typeof payloadOrExpedienteId === 'object' && payloadOrExpedienteId !== null) {
      expediente_id = payloadOrExpedienteId.expediente_id
      area_destino_id = payloadOrExpedienteId.area_destino_id
      area_origen_id = payloadOrExpedienteId.area_origen_id
      accion = payloadOrExpedienteId.accion ?? (payloadOrExpedienteId as any).proveido
    } else if (typeof payloadOrExpedienteId === 'string') {
      expediente_id = payloadOrExpedienteId
      if (typeof param2 === 'object' && param2 !== null) {
        area_destino_id = param2.area_destino_id
        area_origen_id = param2.area_origen_id
        accion = param2.accion ?? param2.proveido
      } else {
        area_destino_id = param2
        area_origen_id = param3
        accion = param4
      }
    }

    // Validación de Datos: Si area_origen_id o area_destino_id son undefined o null antes de llamar a Supabase, lanza un error inmediatamente desde el servidor.
    if (area_origen_id === undefined || area_origen_id === null || String(area_origen_id).trim() === '') {
      throw new Error('El área de origen (area_origen_id) no puede ser undefined o null.')
    }

    if (area_destino_id === undefined || area_destino_id === null || String(area_destino_id).trim() === '') {
      throw new Error('El área de destino (area_destino_id) no puede ser undefined o null.')
    }

    if (!expediente_id || String(expediente_id).trim() === '') {
      throw new Error('El identificador del expediente (expediente_id) no puede ser undefined o null.')
    }

    const accionFinal = accion?.trim() || 'DERIVADO'

    // 1. Inicialización correcta de Supabase con cookies de usuario actual (@supabase/ssr)
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autorizado. Debe iniciar sesión en el sistema.' }
    }

    // 2. Plan de contingencia temporal (bypass de admin):
    // Inicializa el cliente usando process.env.SUPABASE_SERVICE_ROLE_KEY solo para esta transacción,
    // garantizando que la acción nunca rebote por políticas restrictivas de RLS en la base de datos.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL

    const dbClient = (serviceRoleKey && supabaseUrl)
      ? createSupabaseClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : supabase

    const area_actual_id = area_destino_id

    // Paso A: Realiza el UPDATE en la tabla expedientes usando la sintaxis exacta especificada:
    // .update({ area_actual_id, estado: 'DERIVADO' }).eq('id', expediente_id).select().single()
    const { data: expedienteActualizado, error: updateError } = await (dbClient
      .from('expedientes') as any)
      .update({ area_actual_id, estado: 'DERIVADO' })
      .eq('id', expediente_id)
      .select()
      .single()

    if (updateError) {
      return { success: false, error: 'Error BD: ' + updateError.message }
    }

    if (!expedienteActualizado) {
      return {
        success: false,
        error: 'Error BD: No se pudo actualizar el expediente. Falló la verificación por RLS o no se encontró el registro.',
      }
    }

    // Paso B: Si el Paso A es exitoso, realiza el INSERT en la tabla trazabilidad con: expediente_id, area_origen_id, area_destino_id, accion y estado_nuevo: 'DERIVADO'.
    const payloadTrazabilidad = {
      expediente_id: expediente_id,
      area_origen_id: area_origen_id,
      area_destino_id: area_destino_id,
      accion: accionFinal,
      estado_nuevo: 'DERIVADO',
      proveido: accionFinal,
      emisor_id: user.id,
      fecha_envio: new Date().toISOString(),
    }

    const { data: trazabilidadInsertada, error: insertError } = await (dbClient
      .from('trazabilidad') as any)
      .insert(payloadTrazabilidad)
      .select()
      .single()

    if (insertError) {
      return { success: false, error: 'Error BD: ' + insertError.message }
    }

    if (!trazabilidadInsertada) {
      return {
        success: false,
        error: 'Error BD: Falló el registro de trazabilidad por permisos o RLS.',
      }
    }

    // Si todo es exitoso, ejecuta revalidatePath para refrescar la bandeja y la vista de detalle.
    revalidatePath('/dashboard/bandeja')
    revalidatePath(`/dashboard/expedientes/${expediente_id}`)
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error: any) {
    console.error('Error en derivarExpedienteAction:', error)
    const rawMsg = error?.message || 'Error inesperado al derivar el expediente'
    const isValidation =
      rawMsg.includes('área de origen') ||
      rawMsg.includes('área de destino') ||
      rawMsg.includes('identificador del expediente')
    const errorMsg = rawMsg.startsWith('Error BD: ')
      ? rawMsg
      : isValidation
      ? rawMsg
      : `Error BD: ${rawMsg}`
    return {
      success: false,
      error: errorMsg,
    }
  }
}

export type FinalizarEstado = 'ATENDIDO' | 'ARCHIVADO'

export type FinalizarExpedienteInput =
  | {
      expedienteId: string
      estadoNuevo: FinalizarEstado
      accion?: string
    }
  | string

export async function finalizarExpedienteAction(
  param1: FinalizarExpedienteInput,
  param2?: FinalizarEstado | string,
  param3?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let expedienteId: string | undefined
    let estadoNuevo: string | undefined
    let accion: string | undefined

    if (typeof param1 === 'object' && param1 !== null) {
      expedienteId = param1.expedienteId
      estadoNuevo = param1.estadoNuevo
      accion = param1.accion
    } else {
      expedienteId = param1
      estadoNuevo = param2
      accion = param3
    }

    if (!expedienteId || String(expedienteId).trim() === '') {
      throw new Error('El ID del expediente es obligatorio.')
    }

    if (estadoNuevo !== 'ATENDIDO' && estadoNuevo !== 'ARCHIVADO') {
      throw new Error("El estado de cierre solo puede ser 'ATENDIDO' o 'ARCHIVADO'.")
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autorizado. Debe iniciar sesión en el sistema.' }
    }

    // Validación RBAC: Solo JEFE_AREA o ADMIN_TI pueden finalizar/archivar expedientes
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    const rol = (perfil as any)?.rol
    if (rol !== 'JEFE_AREA' && rol !== 'ADMIN_TI') {
      return {
        success: false,
        error: 'No autorizado: Solo el Jefe de Área puede finalizar o archivar expedientes.',
      }
    }

    // Plan de contingencia temporal (bypass de admin):
    // Inicializa el cliente usando process.env.SUPABASE_SERVICE_ROLE_KEY solo para esta transacción,
    // garantizando que la acción nunca rebote por políticas restrictivas de RLS en la base de datos.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL

    const dbClient = (serviceRoleKey && supabaseUrl)
      ? createSupabaseClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : supabase

    // Consultar expediente actual para conocer su área actual y estado previo
    const { data: expediente, error: expError } = await (dbClient
      .from('expedientes') as any)
      .select('id, area_actual_id, estado')
      .eq('id', expedienteId)
      .single()

    if (expError || !expediente) {
      return { success: false, error: 'Expediente no encontrado en la base de datos.' }
    }

    // Transacción: Actualiza la tabla expedientes con el nuevo estado ('ATENDIDO' o 'ARCHIVADO')
    const { data: expedienteActualizado, error: updateError } = await (dbClient
      .from('expedientes') as any)
      .update({
        estado: estadoNuevo,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', expedienteId)
      .select()
      .single()

    if (updateError) {
      return { success: false, error: 'Error BD: ' + updateError.message }
    }

    if (!expedienteActualizado) {
      return { success: false, error: 'Error BD: No se pudo actualizar el estado del expediente.' }
    }

    // Luego, inserta en trazabilidad la huella del cierre (con el área actual como origen y destino, detallando la accion/observación)
    const observacionFinal =
      accion?.trim() ||
      (estadoNuevo === 'ATENDIDO' ? 'Expediente Atendido / Finalizado' : 'Expediente Archivado')

    const payloadTrazabilidad = {
      expediente_id: expedienteId,
      area_origen_id: expediente.area_actual_id,
      area_destino_id: expediente.area_actual_id,
      accion: estadoNuevo,
      proveido: observacionFinal,
      estado_previo: expediente.estado,
      estado_nuevo: estadoNuevo,
      emisor_id: user.id,
      fecha_envio: new Date().toISOString(),
    }

    const { data: trazabilidadInsertada, error: insertError } = await (dbClient
      .from('trazabilidad') as any)
      .insert(payloadTrazabilidad)
      .select()
      .single()

    if (insertError) {
      return { success: false, error: 'Error BD: ' + insertError.message }
    }

    if (!trazabilidadInsertada) {
      return { success: false, error: 'Error BD: No se pudo registrar la trazabilidad de cierre.' }
    }

    // Revalidar rutas afectadas
    revalidatePath('/dashboard/bandeja')
    revalidatePath(`/dashboard/expedientes/${expedienteId}`)
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error: any) {
    console.error('Error en finalizarExpedienteAction:', error)
    const rawMsg = error?.message || 'Error inesperado al cerrar el expediente'
    const errorMsg = rawMsg.startsWith('Error BD: ') ? rawMsg : `Error: ${rawMsg}`
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Server Action para subida de documentos intermedios (Especialistas y Jefes).
 * Inserta en la tabla adjuntos registrando el area_id del usuario logueado.
 */
export async function subirDocumentosIntermediosAction(formData: FormData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autorizado. Debe iniciar sesión en el sistema.' }
    }

    // 1. Obtener perfil del usuario (área y rol)
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, area_id')
      .eq('id', user.id)
      .single()

    const rol = (perfil as any)?.rol
    const areaId = (perfil as any)?.area_id

    // Solo ESPECIALISTA, JEFE_AREA o ADMIN_TI pueden subir documentos intermedios
    if (rol !== 'ESPECIALISTA' && rol !== 'JEFE_AREA' && rol !== 'ADMIN_TI') {
      return {
        success: false,
        error: 'No autorizado: Solo Especialistas o Jefes de Área pueden adjuntar documentos intermedios.',
      }
    }

    const expedienteId = (formData.get('expediente_id') as string)?.trim()
    if (!expedienteId) {
      return { success: false, error: 'Identificador del expediente no proporcionado.' }
    }

    // 2. Extraer lista de archivos
    const rawArchivos = formData.getAll('archivos') as File[]
    const archivos = rawArchivos.filter(
      (a) => a && typeof a === 'object' && a.size > 0 && a.name && a.name !== 'undefined'
    )

    if (archivos.length === 0) {
      return { success: false, error: 'Debe seleccionar al menos un archivo válido.' }
    }

    // 3. Cliente transaccional para bypass de RLS si está configurado
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL

    const dbClient = (serviceRoleKey && supabaseUrl)
      ? createSupabaseClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : supabase

    // 4. Subir cada archivo a Storage e insertar en tabla adjuntos con area_id
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
          error: `Error al subir el archivo '${archivo.name}': ${uploadError?.message || 'Fallo de subida'}`,
        }
      }

      const { data: publicUrlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(uploadData.path)

      const publicUrl = publicUrlData?.publicUrl || storagePath

      const payloadAdjunto = {
        expediente_id: expedienteId,
        nombre_archivo: archivo.name,
        ruta_almacenamiento: publicUrl,
        tipo_mime: archivo.type || 'application/pdf',
        peso_bytes: archivo.size,
        subido_por: user.id,
        area_id: areaId || null, // Registra el area_id del usuario logueado
      }

      const { error: adjuntoDbError } = await (dbClient
        .from('adjuntos') as any)
        .insert(payloadAdjunto)

      if (adjuntoDbError) {
        return {
          success: false,
          error: `Error al registrar el archivo '${archivo.name}' en la base de datos: ${adjuntoDbError.message}`,
        }
      }
    }

    // 5. Registrar hito en trazabilidad
    if (areaId) {
      await (dbClient.from('trazabilidad') as any).insert({
        expediente_id: expedienteId,
        area_origen_id: areaId,
        area_destino_id: areaId,
        accion: 'ANEXO_DOCUMENTAL',
        proveido: `Se anexaron ${archivos.length} nuevo(s) documento(s) al expediente`,
        emisor_id: user.id,
        fecha_envio: new Date().toISOString(),
      })
    }

    revalidatePath(`/dashboard/expedientes/${expedienteId}`)
    revalidatePath('/dashboard/bandeja')
    revalidatePath('/dashboard')

    return {
      success: true,
      archivosSubidos: archivos.length,
    }
  } catch (error: any) {
    console.error('Error en subirDocumentosIntermediosAction:', error)
    return {
      success: false,
      error: error?.message || 'Error inesperado al subir los documentos intermedios',
    }
  }
}