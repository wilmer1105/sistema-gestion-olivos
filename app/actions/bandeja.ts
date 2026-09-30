// app/actions/bandeja.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function recepcionarExpedienteAction(expedienteId: string) {
    try {
        const supabase = await createClient()

        // 0. Validar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'No autorizado. Debe iniciar sesión.' }
        }

        // Obtener el área del usuario actual
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('area_id')
            .eq('id', user.id)
            .single()

        const areaId = (perfil as any)?.area_id

        // PASO 1: Validación Previa
        // Haz un SELECT estado del expediente. Si el estado ya es 'RECEPCIONADO', retorna inmediatamente error.
        const { data: expediente, error: expError } = await (supabase.from('expedientes') as any)
            .select('estado, area_actual_id')
            .eq('id', expedienteId)
            .single()

        if (expError || !expediente) {
            return { success: false, error: 'Expediente no encontrado.' }
        }

        if (expediente.estado === 'RECEPCIONADO') {
            return { success: false, error: 'Este expediente ya fue recepcionado.' }
        }

        // PASO 2: Actualización Estricta
        // Ejecuta el UPDATE en expedientes cambiando a 'RECEPCIONADO'. Obligatorio encadenar .select() al final.
        const { data, error } = await (supabase.from('expedientes') as any)
            .update({
                estado: 'RECEPCIONADO',
                fecha_actualizacion: new Date().toISOString(),
            })
            .eq('id', expedienteId)
            .select()

        // PASO 3: Verificación de Éxito
        // Si el update da error o no retorna datos (!data || data.length === 0), retorna error y se detiene la ejecución.
        if (error || !data || (data as any[]).length === 0) {
            return {
                success: false,
                error: error?.message || 'Error de permisos o RLS. No se pudo actualizar el estado.',
            }
        }

        // PASO 4: Inserción de Trazabilidad
        // SOLO SI el paso 3 fue exitoso, ejecuta el INSERT en la tabla trazabilidad.
        const payloadTrazabilidad = {
            expediente_id: expedienteId,
            area_origen_id: expediente.area_actual_id || areaId,
            area_destino_id: areaId,
            emisor_id: user.id,
            accion: 'RECEPCION',
            proveido: 'Expediente recepcionado en bandeja de entrada',
            estado_previo: expediente.estado,
            estado_nuevo: 'RECEPCIONADO',
            fecha_envio: new Date().toISOString(),
        } as any

        await (supabase.from('trazabilidad') as any).insert(payloadTrazabilidad)

        // PASO 5: Cierre
        // Llama a revalidatePath('/dashboard/bandeja') y retorna { success: true }.
        revalidatePath('/dashboard/bandeja')
        revalidatePath('/dashboard')
        revalidatePath(`/dashboard/expedientes/${expedienteId}`)

        return { success: true }
    } catch (err: any) {
        console.error('Error en recepcionarExpedienteAction:', err)
        return { success: false, error: err?.message || 'Error desconocido al recepcionar el expediente.' }
    }
}
