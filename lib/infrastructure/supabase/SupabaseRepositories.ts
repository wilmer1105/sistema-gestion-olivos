// lib/infrastructure/supabase/SupabaseRepositories.ts

import type { SupabaseClient } from '@supabase/supabase-js'
import { Constants, type Database, type TipoDocumentoTramite } from '@/types/database.types'
import type {
  EstadoExpediente,
  IAdjuntoRegistro,
  IExpedienteIdentidad,
  IExpedienteLectura,
  IExpedienteRadicacion,
  ITrazabilidadRegistro,
} from '@/lib/domain/contracts/expediente.contracts'
import type {
  IAdjuntoRepository,
  IExpedienteRepository,
  IStorageProvider,
  ITrazabilidadRepository,
} from '@/lib/domain/repositories/expediente.repository'

function normalizarTipoDocumentoTramite(valor?: string | null): TipoDocumentoTramite {
  const upper = (valor || 'FUT').trim().toUpperCase()
  const permitidos: ReadonlyArray<string> = Constants.public.Enums.tipo_documento_tramite
  if (permitidos.includes(upper)) {
    return upper as TipoDocumentoTramite
  }
  return 'FUT'
}

/**
 * [DIP] Implementación concreta de `IExpedienteRepository` usando Supabase.
 * Cumple la Regla Crítica de `AGY_INSTRUCTIONS.md`: siempre encadenar `.select()`
 * en INSERT/UPDATE y verificar fallos silenciosos por RLS.
 */
export class SupabaseExpedienteRepository implements IExpedienteRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async obtenerPorId(id: string): Promise<IExpedienteLectura | null> {
    const { data, error } = await this.client
      .from('expedientes')
      .select(
        'id, cut, remitente_nombres, remitente_dni_ruc, asunto, estado, area_actual_id, asignado_a, fecha_actualizacion'
      )
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      cut: data.cut,
      remitente_nombres: data.remitente_nombres,
      remitente_dni_ruc: data.remitente_dni_ruc,
      asunto: data.asunto,
      estado: data.estado ?? 'REGISTRADO',
      area_actual_id: data.area_actual_id,
      asignado_a: data.asignado_a,
      fecha_actualizacion: data.fecha_actualizacion,
    }
  }

  async crear(datos: IExpedienteRadicacion): Promise<IExpedienteIdentidad> {
    const payload: Database['public']['Tables']['expedientes']['Insert'] = {
      tipo_doc_remitente: datos.tipo_doc_remitente || 'DNI',
      remitente_nombres: datos.remitente_nombres,
      remitente_dni_ruc: datos.remitente_dni_ruc,
      telefono: datos.telefono ?? null,
      correo: datos.correo ?? null,
      direccion: datos.direccion ?? null,
      tipo_tramite: normalizarTipoDocumentoTramite(datos.tipo_tramite),
      asunto: datos.asunto,
      folios: datos.folios,
      estado: 'REGISTRADO',
      area_actual_id: datos.area_actual_id,
      registrado_por: datos.registrado_por,
    }

    const { data, error } = await this.client
      .from('expedientes')
      .insert(payload)
      .select('id, cut')
      .single()

    if (error || !data?.id) {
      throw new Error(error?.message || 'No se generó el ID del expediente')
    }

    return {
      id: data.id,
      cut: data.cut,
    }
  }

  async actualizarEstadoYArea(
    id: string,
    nuevoEstado: EstadoExpediente,
    nuevaAreaId?: string | null,
    asignadoA?: string | null
  ): Promise<IExpedienteLectura> {
    const updatePayload: Database['public']['Tables']['expedientes']['Update'] = {
      estado: nuevoEstado,
      fecha_actualizacion: new Date().toISOString(),
    }

    if (nuevaAreaId !== undefined) {
      updatePayload.area_actual_id = nuevaAreaId
    }

    if (asignadoA !== undefined) {
      updatePayload.asignado_a = asignadoA
    }

    const { data, error } = await this.client
      .from('expedientes')
      .update(updatePayload)
      .eq('id', id)
      .select(
        'id, cut, remitente_nombres, remitente_dni_ruc, asunto, estado, area_actual_id, asignado_a, fecha_actualizacion'
      )

    if (error) {
      throw new Error(error.message)
    }

    if (!data || data.length === 0) {
      throw new Error(
        'No se pudo actualizar el expediente. Falló la verificación por RLS o no se encontró el registro.'
      )
    }

    const fila = data[0]
    return {
      id: fila.id,
      cut: fila.cut,
      remitente_nombres: fila.remitente_nombres,
      remitente_dni_ruc: fila.remitente_dni_ruc,
      asunto: fila.asunto,
      estado: fila.estado ?? nuevoEstado,
      area_actual_id: fila.area_actual_id,
      asignado_a: fila.asignado_a,
      fecha_actualizacion: fila.fecha_actualizacion,
    }
  }
}

function normalizarEstadoExpediente(
  estado?: string | null
): Database['public']['Enums']['estado_expediente'] | null {
  if (!estado) return null
  const upper = estado.trim().toUpperCase()
  const permitidos: ReadonlyArray<string> = Constants.public.Enums.estado_expediente
  if (permitidos.includes(upper)) {
    return upper as Database['public']['Enums']['estado_expediente']
  }
  return null
}

/**
 * [DIP] Implementación concreta de `ITrazabilidadRepository` usando Supabase.
 */
export class SupabaseTrazabilidadRepository implements ITrazabilidadRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async registrar(evento: ITrazabilidadRegistro): Promise<{ id: string }> {
    const payload: Database['public']['Tables']['trazabilidad']['Insert'] = {
      expediente_id: evento.expediente_id,
      area_origen_id: evento.area_origen_id,
      area_destino_id: evento.area_destino_id,
      emisor_id: evento.emisor_id,
      receptor_id: evento.receptor_id ?? null,
      accion: evento.accion,
      proveido: evento.proveido,
      estado_previo: normalizarEstadoExpediente(evento.estado_previo),
      estado_nuevo: normalizarEstadoExpediente(evento.estado_nuevo),
      fecha_envio: evento.fecha_envio,
      fecha_recepcion: evento.fecha_recepcion ?? null,
    }

    const { data, error } = await this.client
      .from('trazabilidad')
      .insert(payload)
      .select('id')

    if (error) {
      throw new Error(error.message)
    }

    if (!data || data.length === 0) {
      throw new Error('Falló el registro de trazabilidad por permisos o RLS.')
    }

    return { id: data[0].id }
  }

  async marcarRecepcionAbierta(
    expedienteId: string,
    receptorId: string,
    fechaRecepcion: string = new Date().toISOString()
  ): Promise<void> {
    const { data: ultimoAbierto } = await this.client
      .from('trazabilidad')
      .select('id')
      .eq('expediente_id', expedienteId)
      .is('fecha_recepcion', null)
      .order('fecha_envio', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (ultimoAbierto?.id) {
      await this.client
        .from('trazabilidad')
        .update({
          fecha_recepcion: fechaRecepcion,
          receptor_id: receptorId,
        })
        .eq('id', ultimoAbierto.id)
        .select('id')
    }
  }

  async obtenerPorExpediente(
    expedienteId: string
  ): Promise<ITrazabilidadRegistro[]> {
    const { data, error } = await this.client
      .from('trazabilidad')
      .select('*')
      .eq('expediente_id', expedienteId)
      .order('fecha_envio', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map((row) => ({
      expediente_id: row.expediente_id ?? expedienteId,
      area_origen_id: row.area_origen_id,
      area_destino_id: row.area_destino_id,
      emisor_id: row.emisor_id,
      receptor_id: row.receptor_id,
      accion: row.accion,
      proveido: row.proveido,
      estado_previo: row.estado_previo,
      estado_nuevo: row.estado_nuevo,
      fecha_envio: row.fecha_envio,
      fecha_recepcion: row.fecha_recepcion,
    }))
  }
}

/**
 * [DIP] Implementación concreta de `IAdjuntoRepository` usando Supabase.
 */
export class SupabaseAdjuntoRepository implements IAdjuntoRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async registrar(adjunto: IAdjuntoRegistro): Promise<{ id: string }> {
    const payload: Database['public']['Tables']['adjuntos']['Insert'] = {
      expediente_id: adjunto.expediente_id,
      nombre_archivo: adjunto.nombre_archivo,
      ruta_almacenamiento: adjunto.ruta_almacenamiento,
      tipo_mime: adjunto.tipo_mime,
      peso_bytes: adjunto.peso_bytes,
      subido_por: adjunto.subido_por,
      area_id: adjunto.area_id,
      tipo_documento: adjunto.tipo_documento ?? 'OTRO',
    }

    const { data, error } = await this.client
      .from('adjuntos')
      .insert(payload)
      .select('id')

    if (error || !data || data.length === 0) {
      throw new Error(error?.message || 'Error al insertar metadatos de adjunto.')
    }

    return { id: data[0].id }
  }
}

/**
 * [DIP] Implementación concreta de `IStorageProvider` sobre el bucket 'documentos' de Supabase.
 */
export class SupabaseStorageProvider implements IStorageProvider {
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly bucketName: string = 'documentos'
  ) {}

  async subirArchivo(
    ruta: string,
    contenido: ArrayBuffer,
    tipoMime: string
  ): Promise<{ path: string; publicUrl: string }> {
    const { data: uploadData, error: uploadError } = await this.client.storage
      .from(this.bucketName)
      .upload(ruta, contenido, {
        contentType: tipoMime || 'application/pdf',
        upsert: false,
      })

    if (uploadError || !uploadData) {
      throw new Error(uploadError?.message || 'Fallo en la carga a Storage')
    }

    const { data: publicUrlData } = this.client.storage
      .from(this.bucketName)
      .getPublicUrl(uploadData.path)

    return {
      path: uploadData.path,
      publicUrl: publicUrlData?.publicUrl || ruta,
    }
  }
}
