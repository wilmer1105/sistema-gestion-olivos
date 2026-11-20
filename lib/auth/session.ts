// lib/auth/session.ts
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { RolUsuario } from '@/lib/domain/contracts/expediente.contracts'
import { puedeAccederIntranet } from '@/lib/domain/rbac'

export interface PerfilUsuarioAutenticado {
  id: string
  auth_id: string
  email: string
  nombres: string
  apellidos: string
  dni?: string | null
  rol: RolUsuario
  area_id: string | null
  activo: boolean
  area?: {
    id: string
    nombre: string
    siglas: string
  } | null
  created_at?: string | null
}

/**
 * Obtiene el perfil autenticado del usuario actual en la sesión activa.
 * Utiliza React.cache() para deduplicar consultas dentro del mismo ciclo de renderizado (RSC).
 * Redirige a /login si no existe sesión o si la cuenta está desactivada.
 */
export const obtenerPerfilAutenticado = cache(
  async (): Promise<PerfilUsuarioAutenticado> => {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      redirect('/login')
    }

    const { data: perfilRaw, error: perfilError } = await supabase
      .from('perfiles')
      .select(
        'id, nombres, apellidos, dni, correo, rol, activo, created_at, area_id, areas(id, nombre, siglas)'
      )
      .eq('id', user.id)
      .maybeSingle()

    if (perfilError || !perfilRaw) {
      await supabase.auth.signOut()
      redirect('/login?error=perfil_no_encontrado')
    }

    if (
      !puedeAccederIntranet({
        id: perfilRaw.id,
        rol: perfilRaw.rol,
        area_id: perfilRaw.area_id,
        activo: perfilRaw.activo,
      })
    ) {
      await supabase.auth.signOut()
      redirect('/login?error=cuenta_inactiva')
    }

    const areaRel = Array.isArray(perfilRaw.areas)
      ? perfilRaw.areas[0] ?? null
      : perfilRaw.areas ?? null

    return {
      id: perfilRaw.id,
      auth_id: user.id,
      email: perfilRaw.correo || user.email || '',
      nombres: perfilRaw.nombres,
      apellidos: perfilRaw.apellidos,
      dni: perfilRaw.dni,
      rol: perfilRaw.rol as RolUsuario,
      area_id: perfilRaw.area_id,
      activo: perfilRaw.activo ?? true,
      area: areaRel,
      created_at: perfilRaw.created_at,
    }
  }
)
