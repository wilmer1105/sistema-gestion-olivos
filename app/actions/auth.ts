// app/actions/auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { loginSchema, forgotPasswordSchema, type LoginInput, type ForgotPasswordInput } from '@/lib/validators/auth.schema'
import { redirect } from 'next/navigation'

export async function loginAction(data: LoginInput) {
  // 1. Validación en servidor (Por si manipulan el cliente)
  const parseResult = loginSchema.safeParse(data)
  
  if (!parseResult.success) {
    return { error: 'Datos de acceso inválidos' }
  }

  const supabase = await createClient()

  // 2. Intento de inicio de sesión
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return { error: 'Correo o contraseña incorrectos' }
  }

  // 3. Redirección exitosa
  redirect('/dashboard')
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
    const { error } = await supabase.auth.resetPasswordForEmail(data.email)

    if (error) {
      return { error: error.message || 'No se pudo procesar la solicitud de recuperación' }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Error inesperado al solicitar recuperación de contraseña' }
  }
}