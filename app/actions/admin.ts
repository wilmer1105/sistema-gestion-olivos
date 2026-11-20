// app/actions/admin.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import {
  Constants,
  type Database,
  type RolUsuario,
} from '@/types/database.types'
import { puedeGestionarUsuarios } from '@/lib/domain/rbac'
import { empleadoSchema } from '@/lib/validators/usuario.schema'
import { EmpleadoAdminValidator } from '@/lib/services/EmpleadoAdminService'

export interface AreaItem {
  id: string
  nombre: string
  siglas: string
}

function normalizarRolUsuario(rolInput?: string | null): RolUsuario {
  const upper = (rolInput || 'ESPECIALISTA').trim().toUpperCase()
  if (upper === 'ADMIN') return 'ADMIN_TI'
  if (upper === 'FUNCIONARIO') return 'ASISTENTE_AREA'
  const permitidos: ReadonlyArray<string> = Constants.public.Enums.rol_usuario
  if (permitidos.includes(upper)) {
    return upper as RolUsuario
  }
  return 'ESPECIALISTA'
}

async function verificarSesionAdminTI(): Promise<{
  autorizado: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        autorizado: false,
        error: 'No autorizado. Debe iniciar sesión como Administrador TI.',
      }
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, rol, area_id, activo')
      .eq('id', user.id)
      .maybeSingle()

    if (!perfil) {
      return {
        autorizado: false,
        error: '403 Forbidden: Perfil institucional no encontrado.',
      }
    }
    if (perfil.activo === false) {
      return {
        autorizado: false,
        error: 'Su cuenta se encuentra desactivada. Contacte a la OGTIC.',
      }
    }
    if (
      !puedeGestionarUsuarios({
        id: perfil.id,
        rol: perfil.rol,
        area_id: perfil.area_id,
        activo: perfil.activo ?? true,
      })
    ) {
      return {
        autorizado: false,
        error: '403 Forbidden: Solo el Administrador TI puede gestionar usuarios.',
      }
    }

    return { autorizado: true }
  } catch {
    return {
      autorizado: false,
      error: 'No fue posible verificar la sesión de administrador.',
    }
  }
}

async function resolverAreaMesaPartesId(
  client: SupabaseClient<Database>
): Promise<string | null> {
  const { data: areaSiglas } = await client
    .from('areas')
    .select('id')
    .eq('siglas', 'OACGD-MDP')
    .maybeSingle()

  if (areaSiglas?.id) {
    return areaSiglas.id
  }

  const { data: areaNombre } = await client
    .from('areas')
    .select('id')
    .ilike('nombre', '%Mesa de Partes%')
    .limit(1)
    .maybeSingle()

  return areaNombre?.id ?? null
}

/**
 * Retorna id, nombre y siglas de la tabla areas.
 */
export async function obtenerAreas(): Promise<AreaItem[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('areas')
      .select('id, nombre, siglas')
      .order('nombre', { ascending: true })

    if (error || !data) {
      return []
    }

    return data.map((area) => ({
      id: area.id,
      nombre: area.nombre,
      siglas: area.siglas || '',
    }))
  } catch {
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
  rol: RolUsuario
  area_id: string | null
  area_nombre: string
  area_siglas?: string
  activo: boolean
  created_at: string
}

/**
 * Hace un SELECT a la tabla perfiles e incluye el nombre de su área (JOIN con la tabla areas).
 */
export async function obtenerEmpleados(): Promise<EmpleadoItem[]> {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    let client: SupabaseClient<Database>
    let supabaseAdmin: SupabaseClient<Database> | null = null

    if (serviceRoleKey && supabaseUrl) {
      supabaseAdmin = createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      client = supabaseAdmin
    } else {
      client = await createClient()
    }

    const { data: perfilesRaw, error } = await client
      .from('perfiles')
      .select(`
        id,
        nombres,
        apellidos,
        dni,
        correo,
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

    if (error || !perfilesRaw) {
      return []
    }

    const emailMap = new Map<string, string>()

    if (supabaseAdmin) {
      try {
        const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000,
        })
        if (authData?.users) {
          authData.users.forEach((u) => {
            if (u.id && u.email) {
              emailMap.set(u.id, u.email)
            }
          })
        }
      } catch {
        // Fallback a columna correo de perfiles
      }
    }

    return perfilesRaw.map((p) => {
      const nombres = p.nombres || ''
      const apellidos = p.apellidos || ''
      const nombreCompleto = `${nombres} ${apellidos}`.trim() || 'Sin nombre'
      const email =
        p.correo || emailMap.get(p.id) || 'correo@munilosolivos.gob.pe'
      const areaObj = Array.isArray(p.areas) ? p.areas[0] : p.areas
      const areaNombre = areaObj?.nombre || 'Área no asignada'
      const areaSiglas = areaObj?.siglas || ''
      const dni =
        p.dni && p.dni !== 'NULL' && p.dni !== '00000000' ? p.dni : p.dni || '—'

      return {
        id: p.id,
        nombres,
        apellidos,
        dni,
        nombre_completo: nombreCompleto,
        email,
        rol: p.rol,
        area_id: p.area_id,
        area_nombre: areaNombre,
        area_siglas: areaSiglas,
        activo: p.activo !== false,
        created_at: p.created_at || '',
      }
    })
  } catch {
    return []
  }
}

export interface CrearEmpleadoInput {
  nombres: string
  apellidos: string
  dni: string
  email?: string
  correo?: string
  password: string
  rol: RolUsuario | string
  area_id?: string | null
}

/**
 * Registra un nuevo empleado en auth.users y public.perfiles aplicando la regla reactiva RF-04.
 */
export async function crearEmpleado(formData: FormData | CrearEmpleadoInput) {
  try {
    const authCheck = await verificarSesionAdminTI()
    if (!authCheck.autorizado) {
      return { success: false, error: authCheck.error }
    }

    let nombres = ''
    let apellidos = ''
    let dni = ''
    let email = ''
    let password = ''
    let rolRaw = 'MESA_PARTES'
    let area_id: string | null = null

    if (formData instanceof FormData) {
      nombres = String(formData.get('nombres') ?? '').trim()
      apellidos = String(formData.get('apellidos') ?? '').trim()
      dni = String(formData.get('dni') ?? '').trim()
      email = String(formData.get('email') ?? formData.get('correo') ?? '').trim()
      password = String(formData.get('password') ?? '')
      rolRaw = String(formData.get('rol') ?? 'ESPECIALISTA').trim()
      const rawArea = String(formData.get('area_id') ?? '').trim()
      area_id = rawArea || null
    } else {
      nombres = formData.nombres?.trim() || ''
      apellidos = formData.apellidos?.trim() || ''
      dni = formData.dni?.trim() || ''
      email = (formData.email ?? formData.correo ?? '').trim()
      password = formData.password || ''
      rolRaw = formData.rol || 'ESPECIALISTA'
      area_id = formData.area_id?.trim() ? formData.area_id.trim() : null
    }

    const rol = normalizarRolUsuario(rolRaw)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      return {
        success: false,
        error:
          'Error de configuración en el servidor: SUPABASE_SERVICE_ROLE_KEY no está definida.',
      }
    }

    const supabaseAdmin = createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Regla reactiva RF-04 en servidor:
    // - Si rol === 'ADMIN_TI', fuerza area_id = null
    // - Si rol === 'MESA_PARTES', busca y asigna automáticamente el UUID de Mesa de Partes (OACGD-MDP)
    const areaMesaPartesId =
      rol === 'MESA_PARTES' ? await resolverAreaMesaPartesId(supabaseAdmin) : null

    const validator = new EmpleadoAdminValidator()
    const finalAreaId =
      rol === 'ADMIN_TI'
        ? null
        : rol === 'MESA_PARTES'
        ? areaMesaPartesId ?? validator.resolverAreaPorRol(rol, area_id)
        : validator.resolverAreaPorRol(rol, area_id)

    const validacionZod = empleadoSchema.safeParse({
      nombres,
      apellidos,
      dni,
      correo: email,
      password,
      rol,
      area_id: finalAreaId,
    })

    if (!validacionZod.success) {
      const primerError = validacionZod.error.issues[0]?.message
      return {
        success: false,
        error: primerError || 'Datos del empleado inválidos.',
      }
    }

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
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
        error: `Error al crear el usuario en Supabase Auth: ${
          authError?.message || 'Error desconocido'
        }`,
      }
    }

    const newUserId = authUser.user.id

    const { data: existingPerfil } = await supabaseAdmin
      .from('perfiles')
      .select('id')
      .eq('id', newUserId)
      .maybeSingle()

    if (existingPerfil) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('perfiles')
        .update({
          nombres,
          apellidos,
          dni,
          correo: email,
          rol,
          area_id: finalAreaId,
          activo: true,
        })
        .eq('id', newUserId)
        .select()

      if (updateError || !updated || updated.length === 0) {
        return {
          success: false,
          error: `Error al actualizar perfil del empleado: ${
            updateError?.message || 'Fallo RLS'
          }`,
        }
      }
    } else {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('perfiles')
        .insert({
          id: newUserId,
          nombres,
          apellidos,
          dni,
          correo: email,
          rol,
          area_id: finalAreaId,
          activo: true,
        })
        .select()

      if (insertError || !inserted || inserted.length === 0) {
        return {
          success: false,
          error: `Error al registrar perfil del empleado: ${
            insertError?.message || 'Fallo RLS'
          }`,
        }
      }
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin', 'page')
    return { success: true }
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Ocurrió un error inesperado al crear el empleado.'
    return {
      success: false,
      error: msg,
    }
  }
}

export interface ActualizarEmpleadoInput {
  nombres?: string
  apellidos?: string
  dni?: string
  rol?: RolUsuario | string
  rol_usuario?: RolUsuario | string
  area_id?: string | null
}

/**
 * Actualiza los datos de un empleado en public.perfiles y auth.users metadata aplicando RF-04.
 */
export async function actualizarEmpleado(id: string, datos: ActualizarEmpleadoInput) {
  try {
    if (!id) {
      return { success: false, error: 'ID de empleado no especificado.' }
    }

    const authCheck = await verificarSesionAdminTI()
    if (!authCheck.autorizado) {
      return { success: false, error: authCheck.error }
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      return {
        success: false,
        error:
          'Error de configuración en el servidor: SUPABASE_SERVICE_ROLE_KEY no está definida.',
      }
    }

    const supabaseAdmin = createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const validator = new EmpleadoAdminValidator()
    const rol = normalizarRolUsuario(datos.rol || datos.rol_usuario)
    const areaMesaPartesId =
      rol === 'MESA_PARTES' ? await resolverAreaMesaPartesId(supabaseAdmin) : null

    const finalAreaId =
      rol === 'ADMIN_TI'
        ? null
        : rol === 'MESA_PARTES'
        ? areaMesaPartesId ?? validator.resolverAreaPorRol(rol, datos.area_id)
        : validator.resolverAreaPorRol(rol, datos.area_id)

    if (rol !== 'ADMIN_TI' && !finalAreaId) {
      return {
        success: false,
        error: 'Debe asignar una unidad orgánica válida para este rol.',
      }
    }

    const updatePayload: Database['public']['Tables']['perfiles']['Update'] = {
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

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('perfiles')
      .update(updatePayload)
      .eq('id', id)
      .select()

    if (updateError || !updated || updated.length === 0) {
      return {
        success: false,
        error: `Error al actualizar perfil del empleado: ${
          updateError?.message || 'Fallo en la base de datos.'
        }`,
      }
    }

    try {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: updatePayload,
      })
    } catch {
      // Ignorar advertencia de sincronización en metadata
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin', 'page')

    return { success: true }
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Ocurrió un error inesperado al actualizar el empleado.'
    return {
      success: false,
      error: msg,
    }
  }
}

/**
 * Actualiza la columna activo (boolean) en la tabla perfiles (Baja lógica RF-05).
 */
export async function cambiarEstadoEmpleado(id: string, nuevoEstado: boolean) {
  try {
    if (!id) {
      return { success: false, error: 'ID de empleado no especificado.' }
    }

    const authCheck = await verificarSesionAdminTI()
    if (!authCheck.autorizado) {
      return { success: false, error: authCheck.error }
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      return {
        success: false,
        error:
          'Error de configuración en el servidor: SUPABASE_SERVICE_ROLE_KEY no está definida.',
      }
    }

    const supabaseAdmin = createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('perfiles')
      .update({ activo: nuevoEstado })
      .eq('id', id)
      .select()

    if (updateError || !updated || updated.length === 0) {
      return {
        success: false,
        error: `Error al cambiar estado del empleado: ${
          updateError?.message || 'Fallo en la base de datos.'
        }`,
      }
    }

    try {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { activo: nuevoEstado },
      })
    } catch {
      // Ignorar advertencia
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin', 'page')

    return { success: true, nuevoEstado }
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Ocurrió un error inesperado al cambiar estado del empleado.'
    return {
      success: false,
      error: msg,
    }
  }
}

export async function toggleActivoEmpleado(
  empleadoId: string,
  nuevoEstado: boolean
) {
  return cambiarEstadoEmpleado(empleadoId, nuevoEstado)
}
