// components/modules/bandeja/BandejaTable.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Loader2,
  Clock,
  AlertCircle,
  Eye,
} from 'lucide-react'
import { recepcionarExpedienteAction } from '@/app/actions/bandeja'
import type { IExpedienteLectura } from '@/lib/domain/contracts/expediente.contracts'
import {
  puedeRecepcionarExpediente,
  type PerfilRBACContext,
} from '@/lib/domain/rbac'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface BandejaTableProps {
  data: IExpedienteLectura[]
  currentTab?: 'pendientes' | 'enviados' | 'finalizados' | string
  perfil?: PerfilRBACContext | null
}

export function BandejaTable({
  data,
  currentTab = 'pendientes',
  perfil,
}: BandejaTableProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [, startTransition] = useTransition()

  const handleRecepcionar = (id: string, cut?: string | null) => {
    setFeedback(null)
    setLoadingId(id)

    startTransition(async () => {
      try {
        const res = await recepcionarExpedienteAction(id)

        if (res?.success === false) {
          const errorText = res.error || 'Error desconocido al actualizar.'
          setFeedback({
            type: 'error',
            message: `Error al actualizar: ${errorText}`,
          })
        } else if (res?.success === true) {
          const successText = cut
            ? `Expediente ${cut} recepcionado correctamente.`
            : 'Expediente recepcionado correctamente.'
          setFeedback({
            type: 'success',
            message: successText,
          })
          router.refresh()
        }
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : 'Error de conexión inesperado.'
        setFeedback({
          type: 'error',
          message: `Error al actualizar: ${errorMsg}`,
        })
      } finally {
        setLoadingId(null)
      }
    })
  }

  // Renderizado con colores semánticos que cumplen ratio de contraste WCAG 2.1 AA (>= 4.5:1)
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'REGISTRADO':
        return (
          <Badge
            variant="secondary"
            className="bg-slate-100 text-slate-800 border-slate-300 font-medium"
          >
            {estado}
          </Badge>
        )
      case 'DERIVADO':
        return (
          <Badge className="bg-amber-700 text-white hover:bg-amber-800 font-medium">
            {estado}
          </Badge>
        )
      case 'RECEPCIONADO':
        return (
          <Badge className="bg-emerald-700 text-white hover:bg-emerald-800 font-medium">
            {estado}
          </Badge>
        )
      case 'EN_TRAMITE':
        return (
          <Badge className="bg-indigo-700 text-white hover:bg-indigo-800 font-medium">
            EN TRÁMITE
          </Badge>
        )
      case 'OBSERVADO':
        return (
          <Badge className="bg-rose-700 text-white hover:bg-rose-800 font-medium">
            {estado}
          </Badge>
        )
      case 'ATENDIDO':
        return (
          <Badge className="bg-blue-700 text-white hover:bg-blue-800 font-medium">
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
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  if (!data || data.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center p-12 bg-white border border-dashed rounded-lg text-slate-600"
      >
        <Clock className="w-10 h-10 mb-4 text-slate-400" aria-hidden="true" />
        <p>No se encontraron expedientes en esta vista de la bandeja.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4" role="region" aria-label="Listado de expedientes en bandeja">
      {feedback && (
        <Alert
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
          variant={feedback.type === 'error' ? 'destructive' : 'default'}
          className={
            feedback.type === 'success'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
              : 'shadow-sm'
          }
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
          )}
          <AlertDescription className="font-medium text-sm">
            {feedback.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white border rounded-lg shadow-sm">
        <Table aria-label="Tabla de expedientes de la unidad orgánica">
          <caption className="sr-only">
            Lista de expedientes asignados a la bandeja de entrada con su estado y acciones disponibles
          </caption>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead scope="col" className="font-semibold text-slate-800">
                CUT
              </TableHead>
              <TableHead scope="col" className="font-semibold text-slate-800">
                Asunto
              </TableHead>
              <TableHead scope="col" className="font-semibold text-slate-800">
                Remitente
              </TableHead>
              <TableHead scope="col" className="font-semibold text-slate-800">
                Estado
              </TableHead>
              <TableHead scope="col" className="font-semibold text-slate-800">
                Última Actualización
              </TableHead>
              <TableHead scope="col" className="text-right font-semibold text-slate-800">
                Acción
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((expediente) => {
              const isLoadingThis = loadingId === expediente.id
              const cutLabel = expediente.cut || expediente.id
              const esPestanaEnviados = currentTab === 'enviados'
              const puedeRecepcionarRow = perfil
                ? puedeRecepcionarExpediente(perfil, {
                    id: expediente.id,
                    area_actual_id: expediente.area_actual_id,
                    estado: expediente.estado,
                    asignado_a: expediente.asignado_a,
                  })
                : !esPestanaEnviados &&
                  (expediente.estado === 'REGISTRADO' ||
                    expediente.estado === 'DERIVADO')

              return (
                <TableRow
                  key={expediente.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/expedientes/${expediente.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {expediente.cut}
                    </Link>
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] truncate"
                    title={expediente.asunto}
                  >
                    {expediente.asunto}
                  </TableCell>
                  <TableCell className="truncate max-w-[160px]">
                    <div className="truncate">{expediente.remitente_nombres}</div>
                    {expediente.remitente_dni_ruc && (
                      <div className="text-xs text-slate-500 font-mono">
                        {expediente.remitente_dni_ruc}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(expediente.estado)}</TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {format(
                      new Date(expediente.fecha_actualizacion),
                      'dd MMM yyyy, HH:mm',
                      { locale: es }
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    {!esPestanaEnviados &&
                      expediente.estado === 'DERIVADO' &&
                      puedeRecepcionarRow && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleRecepcionar(expediente.id, expediente.cut)
                          }
                          disabled={isLoadingThis}
                          aria-busy={isLoadingThis}
                          aria-label={`Recibir expediente ${cutLabel}`}
                          className="shadow-sm"
                        >
                          {isLoadingThis ? (
                            <Loader2
                              className="w-4 h-4 animate-spin mr-1.5"
                              aria-hidden="true"
                            />
                          ) : (
                            <CheckCircle2
                              className="w-4 h-4 mr-1.5"
                              aria-hidden="true"
                            />
                          )}
                          <span>Recepcionar</span>
                        </Button>
                      )}

                    <Link
                      href={`/dashboard/expedientes/${expediente.id}`}
                      aria-label={`Ver detalle del expediente ${cutLabel}`}
                    >
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Eye className="w-4 h-4 text-slate-500" aria-hidden="true" />
                        <span>
                          {expediente.estado === 'REGISTRADO'
                            ? 'Ver / Derivar'
                            : 'Ver Detalle'}
                        </span>
                      </Button>
                    </Link>
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
