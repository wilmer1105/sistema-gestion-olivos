'use server'

import { createClient } from '@/lib/supabase/server'

export async function buscarExpedientePorCut(cut: string) {
  try {
    const cleanCut = cut?.trim()
    if (!cleanCut) {
      return { error: 'Debe ingresar un Código Único de Trámite (CUT) válido.' }
    }

    // Cliente público estándar de Supabase (anon / servidor estándar)
    const supabase = await createClient()

    // 1. Consultar la vista pública segura 'vista_consulta_ciudadana'
    const { data: expediente, error } = await (supabase.from('vista_consulta_ciudadana') as any)
      .select('*')
      .eq('cut', cleanCut)
      .single()

    if (error || !expediente) {
      return {
        error: `No se encontró ningún expediente con el código "${cleanCut}". Verifique el formato (Ej: EXP-2026-000001-MDLO).`,
      }
    }

    // 2. Consultar la vista pública segura 'vista_trazabilidad_ciudadana'
    const { data: trazabilidad, error: trazError } = await (supabase.from('vista_trazabilidad_ciudadana') as any)
      .select('*')
      .eq('expediente_id', expediente.id)
      .order('fecha', { ascending: true })

    if (trazError) {
      console.error('Error al consultar vista_trazabilidad_ciudadana:', trazError)
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
