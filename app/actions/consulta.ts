// app/actions/consulta.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  IConsultaCiudadanaExpediente,
  IConsultaCiudadanaMovimiento,
} from '@/lib/domain/contracts/expediente.contracts'

export interface ConsultaPorCutResultado {
  success?: boolean
  error?: string
  expediente?: IConsultaCiudadanaExpediente
  trazabilidad?: IConsultaCiudadanaMovimiento[]
}

/**
 * Consulta pública ciudadana por código CUT usando exclusivamente el cliente estándar (ANON_KEY)
 * y las vistas públicas anonimizadas `vista_consulta_ciudadana` y `vista_trazabilidad_ciudadana` (RF-17, RNF-03, HU-09).
 */
export async function consultarExpedientePorCut(
  cut: string
): Promise<ConsultaPorCutResultado> {
  try {
    const cleanCut = cut?.trim().toUpperCase()
    if (!cleanCut) {
      return { error: 'Debe ingresar un Código Único de Trámite (CUT) válido.' }
    }

    const supabase = await createClient()

    const { data: expedienteRow, error } = await supabase
      .from('vista_consulta_ciudadana')
      .select('*')
      .eq('cut', cleanCut)
      .single()

    if (error || !expedienteRow || !expedienteRow.id || !expedienteRow.cut) {
      return {
        error: `No se encontró ningún expediente con el código "${cleanCut}". Verifique el formato (Ej: EXP-2026-000001-MDLO).`,
      }
    }

    const { data: trazabilidadRows } = await supabase
      .from('vista_trazabilidad_ciudadana')
      .select('*')
      .eq('expediente_id', expedienteRow.id)
      .order('fecha_envio', { ascending: true })

    const expediente: IConsultaCiudadanaExpediente = {
      id: expedienteRow.id,
      cut: expedienteRow.cut,
      asunto: expedienteRow.asunto || '',
      estado: expedienteRow.estado || 'REGISTRADO',
      tipo_tramite: expedienteRow.tipo_tramite,
      area_actual: expedienteRow.area_actual,
      area_actual_siglas: expedienteRow.area_actual_siglas,
      fecha_ingreso: expedienteRow.fecha_ingreso,
      fecha_actualizacion: expedienteRow.fecha_actualizacion,
    }

    const trazabilidad: IConsultaCiudadanaMovimiento[] = (
      trazabilidadRows || []
    ).map((t) => ({
      id: t.id,
      expediente_id: t.expediente_id || expedienteRow.id || '',
      accion: t.accion || 'MOVIMIENTO',
      proveido: t.proveido,
      estado_nuevo: t.estado_nuevo,
      area_origen: t.area_origen,
      area_destino: t.area_destino,
      fecha: t.fecha ?? t.fecha_envio,
      fecha_envio: t.fecha_envio ?? t.fecha,
      fecha_recepcion: t.fecha_recepcion,
    }))

    return {
      success: true,
      expediente,
      trazabilidad,
    }
  } catch {
    return {
      error:
        'Ocurrió un error inesperado al consultar el expediente. Intente nuevamente.',
    }
  }
}

export async function buscarExpedientePorCut(
  cut: string
): Promise<ConsultaPorCutResultado> {
  return consultarExpedientePorCut(cut)
}
