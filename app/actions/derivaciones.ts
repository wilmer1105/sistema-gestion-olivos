'use server'

import { createClient } from '@/lib/supabase/server'
import { derivacionSchema, type DerivacionInput } from '@/lib/validators/derivacion.schema'
import { revalidatePath } from 'next/cache'

export async function derivarExpedienteAction(expedienteId: string, data: DerivacionInput) {
  const validation = derivacionSchema.safeParse(data)
  if (!validation.success) {
    return { error: 'Datos de derivación inválidos.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }

  // 1. Obtener área origen
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('area_id')
    .eq('id', user.id)
    .single()
  const areaOrigenId = (perfil as any)?.area_id

  // 2. Obtener estado previo del expediente
  const { data: expediente } = await (supabase.from('expedientes') as any)
    .select('estado')
    .eq('id', expedienteId)
    .single()

  // 3. Actualizar expediente a DERIVADO y cambiar su área actual
  const updatePayload = {
    estado: 'DERIVADO',
    area_actual_id: validation.data.area_destino_id,
    fecha_actualizacion: new Date().toISOString(),
  } as any

  const { error: updateError } = await (supabase.from('expedientes') as any)
    .update(updatePayload)
    .eq('id', expedienteId)

  if (updateError) return { error: 'Error al derivar el expediente.' }

  // 4. Registrar en la Hoja de Ruta (Trazabilidad)
  const tracePayload = {
    expediente_id: expedienteId,
    area_origen_id: areaOrigenId,
    area_destino_id: validation.data.area_destino_id,
    emisor_id: user.id,
    accion: 'DERIVACION',
    proveido: validation.data.proveido,
    estado_previo: (expediente as any).estado,
    estado_nuevo: 'DERIVADO',
    fecha_envio: new Date().toISOString(),
  } as any

  await (supabase.from('trazabilidad') as any).insert(tracePayload)

  revalidatePath(`/dashboard/expedientes/${expedienteId}`)
  revalidatePath('/dashboard/bandeja')
  
  return { success: true }
}
