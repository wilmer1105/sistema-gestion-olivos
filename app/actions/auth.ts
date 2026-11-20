// app/actions/auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import {
  loginSchema,
  forgotPasswordSchema,
  type LoginInput,
  type ForgotPasswordInput,
} from '@/lib/validators/auth.schema'
import { obtenerRutaInicioPorRol } from '@/lib/domain/rbac'
import { redirect } from 'next/navigation'

export interface LoginResult {
  success: boolean
  error?: string
  redirectUrl?: string
}

export async function loginAction(data: LoginInput): Promise<LoginResult> {
  const parseResult = loginSchema.safeParse(data)

  if (!parseResult.success) {
    return { success: false, error: 'Datos de acceso inválidos' }
  }

  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: parseResult.data.email,
    password: parseResult.data.password,
  })

  if (error || !authData.user) {
    return { success: false, error: 'Correo o contraseña incorrectos' }
  }

  // SOLO TRAS LA AUTENTICACIÓN EXITOSA (cuenta con contexto autenticado para políticas RLS)
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('id, rol, area_id, activo, nombres, apellidos')
    .eq('id', authData.user.id)
    .single()

  if (!perfil || perfilError) {
    await supabase.auth.signOut()
    return {
      success: false,
      error: 'El perfil institucional no existe en el sistema. Contacte a la OGTIC.',
    }
  }

  if (perfil.activo === false) {
    await supabase.auth.signOut()
    return {
      success: false,
      error: 'Su cuenta se encuentra desactivada. Contacte a la OGTIC.',
    }
  }

  const redirectUrl = obtenerRutaInicioPorRol(perfil.rol)
  return { success: true, redirectUrl }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPasswordAction(data: ForgotPasswordInput) {
  const parseResult = forgotPasswordSchema.safeParse(data)
  if (!parseResult.success) {
    return { error: 'Debe ingresar un correo electrónico válido' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(parseResult.data.email)

    if (error) {
      return { error: error.message || 'No se pudo procesar la solicitud de recuperación' }
    }

    return { success: true }
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Error inesperado al solicitar recuperación de contraseña'
    return { error: msg }
  }
}
