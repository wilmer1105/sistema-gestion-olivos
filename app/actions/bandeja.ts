// app/actions/bandeja.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  puedeAsignarEspecialista,
  puedeRecepcionarExpediente,
} from '@/lib/domain/rbac'
import { asignacionInternaSchema } from '@/lib/validators/derivacion.schema'
import {
  SupabaseExpedienteRepository,
  SupabaseTrazabilidadRepository,
} from '@/lib/infrastructure/supabase/SupabaseRepositories'
import { ExpedienteService } from '@/lib/services/ExpedienteService'

/**
 * Acusa recepción de un expediente derivado a la bandeja del área actual (RF-11, HU-05).
 */
export async function recepcionarExpedienteAction(expedienteId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autorizado. Debe iniciar sesión.' }
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, rol, area_id, activo')
      .eq('id', user.id)
      .single()

    if (!perfil || perfil.activo === false) {
      return {
        success: false,
        error: 'Su cuenta se encuentra inactiva.',
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

    const permitidoPorRbac =
      puedeRecepcionarExpediente(
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
      ) ||
      (perfil.rol === 'MESA_PARTES' &&
        perfil.area_id === expedienteActual.area_actual_id &&
        expedienteActual.estado === 'REGISTRADO')

    if (!permitidoPorRbac) {
      return {
        success: false,
        error:
          'No autorizado para recepcionar este expediente (verifique que pertenezca a su área y esté en estado DERIVADO).',
      }
    }

    const expedienteRepo = new SupabaseExpedienteRepository(supabase)
    const trazabilidadRepo = new SupabaseTrazabilidadRepository(supabase)
    const service = new ExpedienteService(expedienteRepo, trazabilidadRepo)

    const resultado = await service.recepcionarExpediente({
      expediente_id: expedienteId,
      area_receptor_id: perfil.area_id,
      usuario_id: user.id,
    })

    if (!resultado.success) {
      return {
        success: false,
        error:
          resultado.error ||
          'Error de permisos o RLS. No se pudo actualizar el estado.',
      }
    }

    revalidatePath('/dashboard/bandeja')
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/expedientes/${expedienteId}`)

    return { success: true }
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Error desconocido al recepcionar el expediente.'
    return { success: false, error: msg }
  }
}

export interface AsignarEspecialistaPayload {
  expediente_id: string
  especialista_id: string
  proveido?: string | null
}

/**
 * Asigna internamente un expediente recepcionado a un Especialista de la misma unidad orgánica
 * cambiando su estado a 'EN_TRAMITE' (OP-07, RF-12).
 */
export async function asignarEspecialistaAction(
  payload: AsignarEspecialistaPayload
) {
  try {
    const validacion = asignacionInternaSchema.safeParse(payload)
    if (!validacion.success) {
      return {
        success: false,
        error:
          validacion.error.issues[0]?.message ||
          'Datos de asignación interna inválidos.',
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autorizado. Debe iniciar sesión.' }
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, rol, area_id, activo')
      .eq('id', user.id)
      .single()

    if (!perfil || !perfil.area_id || perfil.activo === false) {
      return {
        success: false,
        error: 'Su cuenta no cuenta con un área activa asignada.',
      }
    }

    const { data: expedienteActual } = await supabase
      .from('expedientes')
      .select('id, area_actual_id, estado')
      .eq('id', validacion.data.expediente_id)
      .single()

    if (!expedienteActual) {
      return { success: false, error: 'Expediente no encontrado.' }
    }

    if (
      !puedeAsignarEspecialista(
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
          '403 Forbidden: Solo el Asistente de Área o Jefe de Área puede asignar especialistas a un expediente recepcionado.',
      }
    }

    // Verificar que el especialista destino pertenezca a la misma área y esté activo
    const { data: especialista } = await supabase
      .from('perfiles')
      .select('id, nombres, apellidos, rol, area_id, activo')
      .eq('id', validacion.data.especialista_id)
      .single()

    if (
      !especialista ||
      especialista.activo === false ||
      especialista.area_id !== perfil.area_id
    ) {
      return {
        success: false,
        error:
          'El especialista seleccionado no pertenece a su unidad orgánica o no se encuentra activo.',
      }
    }

    const expedienteRepo = new SupabaseExpedienteRepository(supabase)
    const trazabilidadRepo = new SupabaseTrazabilidadRepository(supabase)
    const service = new ExpedienteService(expedienteRepo, trazabilidadRepo)

    const nombreEspecialista = `${especialista.nombres} ${especialista.apellidos}`.trim()
    const proveidoAsignacion =
      validacion.data.proveido?.trim() ||
      `Asignado internamente a ${nombreEspecialista} para evaluación y emisión de informe`

    const resultado = await service.asignarEspecialistaInterno({
      expediente_id: validacion.data.expediente_id,
      especialista_id: validacion.data.especialista_id,
      area_id: perfil.area_id,
      usuario_id: user.id,
      proveido: proveidoAsignacion,
    })

    if (!resultado.success) {
      return { success: false, error: resultado.error }
    }

    revalidatePath('/dashboard/bandeja')
    revalidatePath(`/dashboard/expedientes/${validacion.data.expediente_id}`)
    revalidatePath('/dashboard')

    return { success: true }
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Error inesperado al asignar especialista.'
    return { success: false, error: msg }
  }
}
