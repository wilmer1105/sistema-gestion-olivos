// app/actions/derivaciones.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EstadoCierreExpediente } from '@/lib/domain/contracts/expediente.contracts'
import {
  puedeDerivarExpediente,
  puedeFinalizarExpediente,
} from '@/lib/domain/rbac'
import {
  cierreExpedienteSchema,
  derivacionSchema,
} from '@/lib/validators/derivacion.schema'
import {
  SupabaseExpedienteRepository,
  SupabaseTrazabilidadRepository,
} from '@/lib/infrastructure/supabase/SupabaseRepositories'
import { ExpedienteService } from '@/lib/services/ExpedienteService'

export interface DerivarExpedientePayload {
  expediente_id: string
  area_destino_id: string
  area_origen_id?: string
  accion?: string
  proveido?: string
  asignado_a?: string | null
}

export interface DerivarOpcionesSecundarias {
  area_destino_id?: string
  area_origen_id?: string
  accion?: string
  proveido?: string
  asignado_a?: string | null
}

export type DerivarExpedienteInput = DerivarExpedientePayload | string

export async function derivarExpedienteAction(
  payloadOrExpedienteId: DerivarExpedienteInput,
  param2?: string | DerivarOpcionesSecundarias,
  param3?: string,
  param4?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let expediente_id: string | undefined
    let area_destino_id: string | undefined
    let area_origen_id: string | undefined
    let proveido: string | undefined
    let asignado_a: string | null | undefined

    if (typeof payloadOrExpedienteId === 'object' && payloadOrExpedienteId !== null) {
      expediente_id = payloadOrExpedienteId.expediente_id
      area_destino_id = payloadOrExpedienteId.area_destino_id
      area_origen_id = payloadOrExpedienteId.area_origen_id
      proveido = payloadOrExpedienteId.proveido ?? payloadOrExpedienteId.accion
      asignado_a = payloadOrExpedienteId.asignado_a
    } else if (typeof payloadOrExpedienteId === 'string') {
      expediente_id = payloadOrExpedienteId
      if (typeof param2 === 'object' && param2 !== null) {
        area_destino_id = param2.area_destino_id
        area_origen_id = param2.area_origen_id
        proveido = param2.proveido ?? param2.accion
        asignado_a = param2.asignado_a
      } else {
        area_destino_id = param2
        area_origen_id = param3
        proveido = param4
      }
    }

    if (!expediente_id || expediente_id.trim() === '') {
      return {
        success: false,
        error:
          'El identificador del expediente (expediente_id) no puede ser undefined o null.',
      }
    }

    if (!area_destino_id || area_destino_id.trim() === '') {
      return {
        success: false,
        error: 'El área de destino (area_destino_id) no puede ser undefined o null.',
      }
    }

    const validacionZod = derivacionSchema.safeParse({
      expediente_id,
      area_destino_id,
      proveido: proveido?.trim() || '',
      asignado_a: asignado_a || undefined,
    })

    if (!validacionZod.success && (!proveido || proveido.trim().length < 5)) {
      return {
        success: false,
        error:
          validacionZod.error?.issues[0]?.message ||
          'El proveído de derivación debe tener al menos 5 caracteres.',
      }
    }

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
        error: 'Su cuenta no se encuentra activa para realizar derivaciones.',
      }
    }

    const { data: expedienteActual } = await supabase
      .from('expedientes')
      .select('id, area_actual_id, estado')
      .eq('id', expediente_id)
      .single()

    if (!expedienteActual) {
      return {
        success: false,
        error: 'Expediente no encontrado en la base de datos.',
      }
    }

    if (
      !puedeDerivarExpediente(
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
            'Debe recepcionar previamente el expediente en su bandeja antes de poder derivarlo.',
        }
      }
      return {
        success: false,
        error:
          '403 Forbidden: No cuenta con permisos o el expediente no se encuentra en su unidad orgánica para ser derivado.',
      }
    }

    const origenIdEfectivo =
      area_origen_id || expedienteActual.area_actual_id || perfil.area_id || ''

    const expedienteRepo = new SupabaseExpedienteRepository(supabase)
    const trazabilidadRepo = new SupabaseTrazabilidadRepository(supabase)
    const service = new ExpedienteService(expedienteRepo, trazabilidadRepo)

    const resultado = await service.derivarExpediente({
      expediente_id,
      area_origen_id: origenIdEfectivo,
      area_destino_id,
      accion: proveido?.trim() || 'DERIVACIÓN',
      emisor_id: user.id,
      asignado_a: null,
    })

    if (!resultado.success) {
      return { success: false, error: resultado.error }
    }

    revalidatePath('/dashboard/bandeja')
    revalidatePath(`/dashboard/expedientes/${expediente_id}`)
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error: unknown) {
    const rawMsg =
      error instanceof Error
        ? error.message
        : 'Error inesperado al derivar el expediente'
    return {
      success: false,
      error: rawMsg,
    }
  }
}

export type FinalizarEstado = EstadoCierreExpediente

export type FinalizarExpedienteInput =
  | {
      expedienteId?: string
      expediente_id?: string
      estadoNuevo?: FinalizarEstado
      estado_final?: FinalizarEstado
      accion?: string
      proveido?: string
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
    let proveido: string | undefined

    if (typeof param1 === 'object' && param1 !== null) {
      expedienteId = param1.expedienteId ?? param1.expediente_id
      estadoNuevo = param1.estadoNuevo ?? param1.estado_final
      proveido = param1.proveido ?? param1.accion
    } else {
      expedienteId = param1
      estadoNuevo = param2
      proveido = param3
    }

    if (!expedienteId || String(expedienteId).trim() === '') {
      return { success: false, error: 'El ID del expediente es obligatorio.' }
    }

    if (estadoNuevo !== 'ATENDIDO' && estadoNuevo !== 'ARCHIVADO') {
      return {
        success: false,
        error: "El estado de cierre solo puede ser 'ATENDIDO' o 'ARCHIVADO'.",
      }
    }

    const validacionZod = cierreExpedienteSchema.safeParse({
      expediente_id: expedienteId,
      estado_final: estadoNuevo,
      proveido: proveido?.trim() || 'Expediente finalizado con resolución de área',
    })

    if (!validacionZod.success && proveido !== undefined && proveido.trim().length > 0 && proveido.trim().length < 5) {
      return {
        success: false,
        error:
          validacionZod.error.issues[0]?.message ||
          'El proveído de cierre debe tener al menos 5 caracteres.',
      }
    }

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

    if (!perfil || perfil.rol !== 'JEFE_AREA') {
      return {
        success: false,
        error:
          '403 Forbidden: Solo el Jefe de Área puede finalizar o archivar expedientes',
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
        error: 'Expediente no encontrado en la base de datos.',
      }
    }

    if (
      !puedeFinalizarExpediente(
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
      return {
        success: false,
        error:
          '403 Forbidden: Solo el Jefe de Área de la unidad orgánica actual puede finalizar o archivar un expediente recepcionado.',
      }
    }

    const expedienteRepo = new SupabaseExpedienteRepository(supabase)
    const trazabilidadRepo = new SupabaseTrazabilidadRepository(supabase)
    const service = new ExpedienteService(expedienteRepo, trazabilidadRepo)

    const resultado = await service.finalizarExpediente({
      expediente_id: expedienteId,
      estado_nuevo: estadoNuevo,
      observacion: proveido,
      usuario_id: user.id,
      rol_usuario: perfil.rol,
    })

    if (!resultado.success) {
      return { success: false, error: resultado.error }
    }

    revalidatePath('/dashboard/bandeja')
    revalidatePath(`/dashboard/expedientes/${expedienteId}`)
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error: unknown) {
    const rawMsg =
      error instanceof Error
        ? error.message
        : 'Error inesperado al cerrar el expediente'
    return {
      success: false,
      error: rawMsg,
    }
  }
}
