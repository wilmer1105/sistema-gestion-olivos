// components/modules/bandeja/BandejaTable.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ArrowRightCircle, Loader2, Clock, AlertCircle, Eye } from 'lucide-react'
import { recepcionarExpedienteAction } from '@/app/actions/bandeja'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function BandejaTable({ data }: { data: any[] }) {
    const router = useRouter()
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const [, startTransition] = useTransition()

    const handleRecepcionar = (id: string, cut?: string) => {
        setFeedback(null)
        setLoadingId(id)

        startTransition(async () => {
            try {
                const res = await recepcionarExpedienteAction(id)

                if (res?.success === false) {
                    const errorText = res.error || 'Error desconocido al actualizar.'
                    setFeedback({
                        type: 'error',
                        message: `Error al actualizar: ${errorText}`
                    })
                    alert('Error al actualizar: ' + errorText)
                } else if (res?.success === true) {
                    const successText = cut 
                        ? `Expediente ${cut} recepcionado correctamente.` 
                        : 'Expediente recepcionado correctamente.'
                    setFeedback({
                        type: 'success',
                        message: successText
                    })
                    alert(successText)
                    router.refresh()
                }
            } catch (err: any) {
                const errorMsg = err?.message || 'Error de conexión inesperado.'
                setFeedback({
                    type: 'error',
                    message: `Error al actualizar: ${errorMsg}`
                })
                alert('Error al actualizar: ' + errorMsg)
            } finally {
                // Siempre limpiar el estado de carga para no dejar el botón bloqueado
                setLoadingId(null)
            }
        })
    }

    // Renderizado con el valor exacto de la base de datos y colores semánticos
    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case 'REGISTRADO':
                return (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-300 font-medium">
                        {estado}
                    </Badge>
                )
            case 'DERIVADO':
                return (
                    <Badge className="bg-amber-500 text-white hover:bg-amber-600 font-medium">
                        {estado}
                    </Badge>
                )
            case 'RECEPCIONADO':
                return (
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 font-medium">
                        {estado}
                    </Badge>
                )
            case 'ATENDIDO':
                return (
                    <Badge className="bg-blue-600 text-white hover:bg-blue-700 font-medium">
                        {estado}
                    </Badge>
                )
            case 'ARCHIVADO':
                return (
                    <Badge className="bg-slate-700 text-white hover:bg-slate-800 font-medium">
                        {estado}
                    </Badge>
                )
            default:
                return (
                    <Badge variant="outline">
                        {estado}
                    </Badge>
                )
        }
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed rounded-lg text-slate-500">
                <Clock className="w-10 h-10 mb-4 text-slate-300" />
                <p>No hay expedientes pendientes en su bandeja actual.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Banner de Feedback (Éxito o Error) */}
            {feedback && (
                <Alert
                    variant={feedback.type === 'error' ? 'destructive' : 'default'}
                    className={
                        feedback.type === 'success'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                            : 'shadow-sm'
                    }
                >
                    {feedback.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription className="font-medium text-sm">
                        {feedback.message}
                    </AlertDescription>
                </Alert>
            )}

            <div className="bg-white border rounded-lg shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="font-semibold">CUT</TableHead>
                            <TableHead className="font-semibold">Asunto</TableHead>
                            <TableHead className="font-semibold">Remitente</TableHead>
                            <TableHead className="font-semibold">Estado</TableHead>
                            <TableHead className="font-semibold">Última Actualización</TableHead>
                            <TableHead className="text-right font-semibold">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((expediente) => {
                            const isLoadingThis = loadingId === expediente.id

                            return (
                                <TableRow key={expediente.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-900">{expediente.cut}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={expediente.asunto}>
                                        {expediente.asunto}
                                    </TableCell>
                                    <TableCell className="truncate max-w-[150px]">
                                        {expediente.remitente_nombres}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(expediente.estado)}</TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {format(new Date(expediente.fecha_actualizacion), "dd MMM yyyy, HH:mm", { locale: es })}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">

                                        {/* Si estado es REGISTRADO o DERIVADO: Botón 'Recibir' que ejecuta la Server Action */}
                                        {(expediente.estado === 'REGISTRADO' || expediente.estado === 'DERIVADO') && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleRecepcionar(expediente.id, expediente.cut)}
                                                disabled={isLoadingThis}
                                                className="shadow-sm"
                                            >
                                                {isLoadingThis ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                                                ) : (
                                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                                )}
                                                Recibir
                                            </Button>
                                        )}

                                        {/* Si estado es RECEPCIONADO: Botón 'Atender / Derivar' que navega al detalle */}
                                        {expediente.estado === 'RECEPCIONADO' && (
                                            <Link href={`/dashboard/expedientes/${expediente.id}`}>
                                                <Button size="sm" variant="outline" className="shadow-sm border-slate-300 gap-1.5 hover:bg-slate-100">
                                                    <ArrowRightCircle className="w-4 h-4 text-emerald-600" />
                                                    Atender / Derivar
                                                </Button>
                                            </Link>
                                        )}

                                        {/* Si estado es ATENDIDO o ARCHIVADO: Botón 'Ver Detalle' para consulta histórica */}
                                        {(expediente.estado === 'ATENDIDO' || expediente.estado === 'ARCHIVADO') && (
                                            <Link href={`/dashboard/expedientes/${expediente.id}`}>
                                                <Button size="sm" variant="outline" className="shadow-sm border-slate-300 gap-1.5 hover:bg-slate-100 text-slate-700">
                                                    <Eye className="w-4 h-4 text-slate-500" />
                                                    Ver Detalle
                                                </Button>
                                            </Link>
                                        )}

                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}