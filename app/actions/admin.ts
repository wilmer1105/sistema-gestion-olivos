// app/actions/admin.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

/**
 * Retorna id y nombre de la tabla areas.
 */
export async function obtenerAreas() {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('areas') as any)
      .select('id, nombre, siglas')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error al obtener areas:', error.message)
      return []
    }

    return (data || []).map((area: any) => ({
      id: area.id,
      nombre: area.nombre,
      siglas: area.siglas || '',
    }))
  } catch (error) {
    console.error('Error inesperado en obtenerAreas:', error)
    return []
  }
}

export interface EmpleadoItem {
  id: string
  nombres: string
  apellidos: string
  dni: string
  nombre_completo: string
  email: string
  rol: string
  area_id: string | null
  area_nombre: string
  area_siglas?: string
  activo: boolean
  created_at: string
}

/**
 * Hace un SELECT a la tabla de usuarios/perfiles e incluye el nombre de su área (JOIN con la tabla areas).
 * Utiliza supabaseAdmin para garantizar que el panel de administración no sea filtrado por RLS de usuarios individuales.
 */
export async function obtenerEmpleados(): Promise<EmpleadoItem[]> {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    let client: any
    let supabaseAdmin: any = null

    if (serviceRoleKey && supabaseUrl) {
      supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      client = supabaseAdmin
    } else {
      client = await createClient()
    }

    const { data: perfiles, error } = await client
      .from('perfiles')
      .select(`
        id,
        nombres,
        apellidos,
        dni,
        rol,
        activo,
        created_at,
        area_id,
        areas (
          id,
          nombre,
          siglas
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al obtener perfiles:', error.message)
      return []
    }

    // Obtenemos los correos desde el servicio de Auth de Supabase
    const emailMap = new Map<string, string>()

    if (supabaseAdmin) {
      try {
        const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000,
        })
        if (authData?.users) {
          authData.users.forEach((u: any) => {
            if (u.id && u.email) {
              emailMap.set(u.id, u.email)
            }
          })
        }
      } catch (authErr) {
        console.error('Error obteniendo correos de auth.users:', authErr)
      }
    }

    return (perfiles || []).map((p: any) => {
      const nombres = p.nombres || ''
      const apellidos = p.apellidos || ''
      const nombreCompleto = `${nombres} ${apellidos}`.trim() || 'Sin nombre'
      const email = emailMap.get(p.id) || p.email || 'correo@munilosolivos.gob.pe'
      const areaNombre = p.areas?.nombre || 'Área no asignada'
      const areaSiglas = p.areas?.siglas || ''
      const dni = p.dni && p.dni !== 'NULL' && p.dni !== '00000000' ? p.dni : (p.dni || '—')

      return {
        id: p.id,
        nombres,
        apellidos,
        dni,
        nombre_completo: nombreCompleto,
        email,
        rol: p.rol || 'FUNCIONARIO',
        area_id: p.area_id,
        area_nombre: areaNombre,
        area_siglas: areaSiglas,
        activo: p.activo !== false,
        created_at: p.created_at || '',
      }
    })
  } catch (error) {
    console.error('Error inesperado en obtenerEmpleados:', error)
    return []
  }
}

export interface CrearEmpleadoInput {
  nombres: string
  apellidos: string
  dni: string
  email: string
  password: string
  rol: 'ADMIN_TI' | 'MESA_PARTES' | 'ESPECIALISTA' | 'JEFE_AREA' | 'FUNCIONARIO' | 'ADMIN' | string
  area_id: string
}

/**
 * Registra un nuevo empleado en auth.users y public.perfiles con todos los campos requeridos.
 * Utiliza supabaseAdmin para no invalidar la sesión del administrador.
 */
export async function crearEmpleado(formData: FormData | CrearEmpleadoInput) {
  try {
    let nombres = ''
    let apellidos = ''
    let dni = ''
    let email = ''
    let password = ''
    let rol = 'MESA_PARTES'
    let area_id = ''

    if (formData instanceof FormData) {
      nombres = (formData.get('nombres') as string)?.trim() || ''
      apellidos = (formData.get('apellidos') as string)?.trim() || ''
      dni = (formData.get('dni') as string)?.trim() || ''
      email = (formData.get('email') as string)?.trim() || ''
      password = (formData.get('password') as string) || ''
      rol = (formData.get('rol') as string) || 'FUNCIONARIO'
      area_id = (formData.get('area_id') as string) || ''
    } else {
      nombres = formData.nombres?.trim() || ''
      apellidos = formData.apellidos?.trim() || ''
      dni = formData.dni?.trim() || ''
      email = formData.email?.trim() || ''
      password = formData.password || ''
      rol = formData.rol || 'FUNCIONARIO'
      area_id = formData.area_id || ''
    }

    if (!nombres || nombres.length < 2) {
      return { success: false, error: 'Debe ingresar nombres válidos (mínimo 2 caracteres).' }
    }
    if (!apellidos || apellidos.length < 2) {
      return { success: false, error: 'Debe ingresar apellidos válidos (mínimo 2 caracteres).' }
    }
    if (!dni || !/^\d{8}$/.test(dni)) {
      return { success: false, error: 'El DNI debe tener exactamente 8 dígitos numéricos.' }
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Debe ingresar un correo electrónico institucional válido.' }
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' }
    }
    if (!rol) {
      return { success: false, error: 'Debe seleccionar un rol para el usuario.' }
    }
    const finalAreaId = rol === 'ADMIN_TI' ? null : (area_id || null)

    if (rol !== 'ADMIN_TI' && !area_id) {
      return { success: false, error: 'Debe seleccionar un área de adscripción.' }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      return {
        success: false,
        error: 'Error de configuración en el servidor: SUPABASE_SERVICE_ROLE_KEY no está definida.',
      }
    }

    // Inicializamos el cliente administrativo usando service_role_key sin persistencia de sesión
    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1. Crear el usuario en auth.users con confirmación inmediata y metadata completa
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombres,
        apellidos,
        dni,
        rol,
        area_id: finalAreaId,
      },
    })

    if (authError || !authUser.user) {
      return {
        success: false,
        error: `Error al crear el usuario en Supabase Auth: ${authError?.message || 'Error desconocido'}`,
      }
    }

    const newUserId = authUser.user.id

    // 2. Insertar o actualizar registro en la tabla perfiles con todos los datos
    const { data: existingPerfil } = await (supabaseAdmin.from('perfiles') as any)
      .select('id')
      .eq('id', newUserId)
      .maybeSingle()

    if (existingPerfil) {
      const { data: updated, error: updateError } = await (supabaseAdmin.from('perfiles') as any)
        .update({
          nombres,
          apellidos,
          dni,
          rol,
          area_id: finalAreaId,
          activo: true,
        })
        .eq('id', newUserId)
        .select()

      if (updateError || !updated || updated.length === 0) {
        return {
          success: false,
          error: `Error al actualizar perfil del empleado: ${updateError?.message || 'Fallo RLS'}`,
        }
      }
    } else {
      const { data: inserted, error: insertError } = await (supabaseAdmin.from('perfiles') as any)
        .insert({
          id: newUserId,
          nombres,
          apellidos,
          dni,
          rol,
          area_id: finalAreaId,
          activo: true,
        })
        .select()

      if (insertError || !inserted || inserted.length === 0) {
        return {
          success: false,
          error: `Error al registrar perfil del empleado: ${insertError?.message || 'Fallo RLS'}`,
        }
      }
    }

    // Refresco de la ruta para actualizar la tabla inmediatamente
    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin', 'page')
    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Ocurrió un error inesperado al crear el empleado.',
    }
  }
}

export interface ActualizarEmpleadoInput {
  nombres?: string
  apellidos?: string
  dni?: string
  rol?: string
  rol_usuario?: string
  area_id?: string | null
}

/**
 * Actualiza los datos de un empleado (nombres, apellidos, rol, area_id) en public.perfiles y auth.users metadata.
 * Si el rol es ADMIN_TI, fuerza area_id a null.
 */
export async function actualizarEmpleado(id: string, datos: ActualizarEmpleadoInput) {
  try {
    if (!id) {
      return { success: false, error: 'ID de empleado no especificado.' }
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      return {
        success: false,
        error: 'Error de configuración en el servidor: SUPABASE_SERVICE_ROLE_KEY no está definida.',
      }
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const rol = datos.rol || datos.rol_usuario || 'ESPECIALISTA'
    // REGLA CRÍTICA: Si el rol es ADMIN_TI, forzar area_id a null
    const finalAreaId = rol === 'ADMIN_TI' ? null : (datos.area_id || null)

    const updatePayload: Record<string, any> = {
      rol,
      area_id: finalAreaId,
    }

    if (datos.nombres !== undefined && datos.nombres.trim()) {
      updatePayload.nombres = datos.nombres.trim()
    }
    if (datos.apellidos !== undefined && datos.apellidos.trim()) {
      updatePayload.apellidos = datos.apellidos.trim()
    }
    if (datos.dni !== undefined && datos.dni.trim()) {
      updatePayload.dni = datos.dni.trim()
    }

    const { data: updated, error: updateError } = await (supabaseAdmin.from('perfiles') as any)
      .update(updatePayload)
      .eq('id', id)
      .select()

    if (updateError || !updated || updated.length === 0) {
      return {
        success: false,
        error: `Error al actualizar perfil del empleado: ${updateError?.message || 'Fallo en la base de datos.'}`,
      }
    }

    // Sincronizar metadata en auth.users si es posible
    try {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: updatePayload,
      })
    } catch (authErr) {
      console.warn('Advertencia al sincronizar auth.users metadata:', authErr)
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin', 'page')

    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Ocurrió un error inesperado al actualizar el empleado.',
    }
  }
}

/**
 * Actualiza la columna activo (boolean) en la tabla perfiles (desactivación lógica o reactivación).
 */
export async function cambiarEstadoEmpleado(id: string, nuevoEstado: boolean) {
  try {
    if (!id) {
      return { success: false, error: 'ID de empleado no especificado.' }
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      return {
        success: false,
        error: 'Error de configuración en el servidor: SUPABASE_SERVICE_ROLE_KEY no está definida.',
      }
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: updated, error: updateError } = await (supabaseAdmin.from('perfiles') as any)
      .update({ activo: nuevoEstado })
      .eq('id', id)
      .select()

    if (updateError || !updated || updated.length === 0) {
      return {
        success: false,
        error: `Error al cambiar estado del empleado: ${updateError?.message || 'Fallo en la base de datos.'}`,
      }
    }

    // Sincronizar metadata en auth.users si es posible
    try {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { activo: nuevoEstado },
      })
    } catch (authErr) {
      console.warn('Advertencia al sincronizar auth.users metadata:', authErr)
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin', 'page')

    return { success: true, nuevoEstado }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Ocurrió un error inesperado al cambiar estado del empleado.',
    }
  }
}
