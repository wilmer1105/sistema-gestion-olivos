'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function buscarExpedientePorCut(cut: string) {
  try {
    const cleanCut = cut?.trim()
    if (!cleanCut) {
      return { error: 'Debe ingresar un Código Único de Trámite (CUT) válido.' }
    }

    // Usar cliente con SERVICE_ROLE_KEY si está disponible para consultas públicas de rastreo.
    // Esto garantiza que el ciudadano o usuario vea la línea de tiempo real sin que RLS
    // oculte los registros históricos de trazabilidad ni los nombres de las áreas.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL

    const dbClient = (serviceRoleKey && supabaseUrl)
      ? createAdminClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : await createClient()

    // 1. Buscar el expediente (insensible a mayúsculas/minúsculas)
    const { data: expediente, error } = await (dbClient.from('expedientes') as any)
      .select('id, cut, asunto, estado, fecha_creacion, areas:area_actual_id(nombre)')
      .ilike('cut', cleanCut)
      .single()

    if (error || !expediente) {
      return {
        error: `No se encontró ningún expediente con el código "${cleanCut}". Verifique el formato (Ej: EXP-2026-000001-MDLO).`,
      }
    }

    // 2. Buscar la hoja de ruta (trazabilidad completa con nombres de áreas)
    const { data: trazabilidad, error: trazError } = await (dbClient.from('trazabilidad') as any)
      .select('id, accion, proveido, fecha_envio, estado_nuevo, area_origen:area_origen_id(nombre), area_destino:area_destino_id(nombre)')
      .eq('expediente_id', expediente.id)
      .order('fecha_envio', { ascending: false })

    if (trazError) {
      console.error('Error al consultar trazabilidad en buscarExpedientePorCut:', trazError)
    }

    return {
      success: true,
      expediente,
      trazabilidad: trazabilidad || [],
    }
  } catch (err: any) {
    console.error('Error inesperado en buscarExpedientePorCut:', err)
    return {
      error: 'Ocurrió un error inesperado al consultar el expediente. Intente nuevamente.',
    }
  }
}
