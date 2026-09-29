// app/actions/expedientes.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { expedienteSchema, type ExpedienteInput } from '@/lib/validators/expediente.schema'
import { revalidatePath } from 'next/cache'

export async function createExpedienteAction(data: ExpedienteInput) {
  const validation = expedienteSchema.safeParse(data)
  if (!validation.success) {
    return { 
      error: 'Datos inválidos. Verifique los campos ingresados.',
      details: validation.error.flatten().fieldErrors 
    }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'No autorizado. Debe iniciar sesión.' }
  }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('area_id')
    .eq('id', user.id)
    .single()

  const areaRegistrador = (perfil as any)?.area_id

  // FORZAMOS EL TIPO CON "as any" PARA EVITAR EL ERROR DE TYPESCRIPT (never[])
  const payloadExpediente = {
    remitente_nombres: validation.data.remitente_nombres,
    remitente_dni_ruc: validation.data.remitente_dni_ruc,
    telefono: validation.data.telefono || null,
    correo: validation.data.correo || null,
    asunto: validation.data.asunto,
    folios: validation.data.folios,
    estado: 'REGISTRADO',
    area_actual_id: areaRegistrador,
    registrado_por: user.id,
  } as any

  const { data: nuevoExpediente, error: insertError } = await supabase
    .from('expedientes')
    .insert(payloadExpediente)
    .select('id, cut')
    .single()

  if (insertError) {
    return { error: `Error al registrar: ${insertError.message}` }
  }

  // FORZAMOS EL TIPO CON "as any" AQUÍ TAMBIÉN
  const payloadTrazabilidad = {
    expediente_id: (nuevoExpediente as any).id,
    area_origen_id: areaRegistrador,
    area_destino_id: areaRegistrador,
    emisor_id: user.id,
    accion: 'REGISTRO_INICIAL',
    proveido: 'Ingreso inicial por Mesa de Partes',
    estado_previo: null,
    estado_nuevo: 'REGISTRADO',
    fecha_envio: new Date().toISOString(),
  } as any

  await supabase.from('trazabilidad').insert(payloadTrazabilidad)

  revalidatePath('/dashboard/bandeja')
  return { 
    success: true, 
    cut: (nuevoExpediente as any).cut,
    id: (nuevoExpediente as any).id 
  }
}