'use server'

import { createClient } from '@/lib/supabase/server'

export async function buscarExpedientePorCut(cut: string) {
  const supabase = await createClient()

  // 1. Buscar el expediente (nota que no pedimos getUser, es público)
  const { data: expediente, error } = await (supabase.from('expedientes') as any)
    .select('id, cut, asunto, estado, fecha_creacion, areas(nombre)')
    .eq('cut', cut.trim())
    .single()

  if (error || !expediente) {
    return { error: 'No se encontró ningún expediente con el código CUT ingresado. Verifique el formato (Ej: CUT-2026-0001).' }
  }

  // 2. Buscar la hoja de ruta (trazabilidad)
  const { data: trazabilidad } = await (supabase.from('trazabilidad') as any)
    .select('id, accion, proveido, fecha_envio, estado_nuevo, area_origen:area_origen_id(nombre), area_destino:area_destino_id(nombre)')
    .eq('expediente_id', expediente.id)
    .order('fecha_envio', { ascending: false })

  return { success: true, expediente, trazabilidad }
}
