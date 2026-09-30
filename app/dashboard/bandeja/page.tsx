// app/dashboard/bandeja/page.tsx
import { createClient } from '@/lib/supabase/server'
import { BandejaTable } from '@/components/modules/bandeja/BandejaTable'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function BandejaPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Obtener el área del usuario
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('area_id')
        .eq('id', user.id)
        .single()

    const areaId = (perfil as any)?.area_id

    let expedientes: any[] = []
    let errorMessage = null

    // Validación: Solo consultamos expedientes si el usuario tiene un areaId válido
    if (areaId) {
        const { data, error } = await supabase
            .from('expedientes')
            .select('*')
            .eq('area_actual_id', areaId)
            .order('fecha_actualizacion', { ascending: false })

        expedientes = data || []
        if (error) errorMessage = error.message
    } else {
        errorMessage = "Su usuario no tiene un área asignada en el sistema. Contacte al administrador de BD."
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bandeja de Entrada</h1>
                    <p className="text-sm text-slate-500">
                        Visualización y control de los expedientes asignados a su unidad orgánica.
                    </p>
                </div>
            </div>

            {errorMessage ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                    <strong>Atención:</strong> {errorMessage}
                </div>
            ) : (
                <BandejaTable data={expedientes} />
            )}
        </div>
    )
}