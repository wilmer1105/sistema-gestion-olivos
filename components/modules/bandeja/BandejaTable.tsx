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
  FileText,
  Send,
  Archive,
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
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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

  // Renderizado píldora (texto + ícono + borde) con ratio de contraste WCAG 2.1 AA/AAA
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'REGISTRADO':
        return (
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-900 border border-slate-400 px-3 py-1 text-xs font-bold"
          >
            <FileText className="w-3.5 h-3.5 text-slate-700" aria-hidden="true" />
            <span>{estado}</span>
          </Badge>
        )
      case 'DERIVADO':
        return (
          <Badge className="inline-flex items-center gap-1.5 rounded-full bg-amber-700 text-white hover:bg-amber-800 border border-amber-900 px-3 py-1 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{estado}</span>
          </Badge>
        )
      case 'RECEPCIONADO':
        return (
          <Badge className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 text-white hover:bg-emerald-900 border border-emerald-950 px-3 py-1 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{estado}</span>
          </Badge>
        )
      case 'EN_TRAMITE':
        return (
          <Badge className="inline-flex items-center gap-1.5 rounded-full bg-indigo-800 text-white hover:bg-indigo-900 border border-indigo-950 px-3 py-1 text-xs font-bold">
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>EN TRÁMITE</span>
          </Badge>
        )
      case 'OBSERVADO':
        return (
          <Badge className="inline-flex items-center gap-1.5 rounded-full bg-rose-800 text-white hover:bg-rose-900 border border-rose-950 px-3 py-1 text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{estado}</span>
          </Badge>
        )
      case 'ATENDIDO':
        return (
          <Badge className="inline-flex items-center gap-1.5 rounded-full bg-blue-800 text-white hover:bg-blue-900 border border-blue-950 px-3 py-1 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{estado}</span>
          </Badge>
        )
      case 'ARCHIVADO':
        return (
          <Badge className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 text-white hover:bg-slate-900 border border-slate-950 px-3 py-1 text-xs font-bold">
            <Archive className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{estado}</span>
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-bold">
            {estado}
          </Badge>
        )
    }
  }

  if (!data || data.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center p-12 bg-white border border-dashed border-slate-300 rounded-xl text-slate-700"
      >
        <Clock className="w-10 h-10 mb-3 text-slate-600" aria-hidden="true" />
        <p className="text-base font-semibold text-slate-800">
          No se encontraron expedientes en esta vista de la bandeja.
        </p>
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
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 rounded-xl shadow-xs'
              : 'rounded-xl shadow-xs'
          }
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          )}
          <AlertDescription className="font-semibold text-sm">
            {feedback.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-x-auto">
        <Table aria-label="Tabla de expedientes de la unidad orgánica">
          <caption className="sr-only">
            Lista de expedientes asignados a la bandeja de entrada con su estado y acciones disponibles
          </caption>
          <TableHeader>
            <TableRow className="bg-slate-100/90 hover:bg-slate-100/90 border-b border-slate-200">
              <TableHead scope="col" className="py-3.5 px-4 text-sm font-bold text-slate-900">
                CUT
              </TableHead>
              <TableHead scope="col" className="py-3.5 px-4 text-sm font-bold text-slate-900">
                Asunto
              </TableHead>
              <TableHead scope="col" className="py-3.5 px-4 text-sm font-bold text-slate-900">
                Remitente
              </TableHead>
              <TableHead scope="col" className="py-3.5 px-4 text-sm font-bold text-slate-900">
                Estado
              </TableHead>
              <TableHead scope="col" className="py-3.5 px-4 text-sm font-bold text-slate-900">
                Última Actualización
              </TableHead>
              <TableHead scope="col" className="py-3.5 px-4 text-right text-sm font-bold text-slate-900">
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
                  className="hover:bg-blue-50/40 transition-colors border-b border-slate-200/80"
                >
                  <TableCell className="py-3.5 px-4 font-semibold whitespace-nowrap">
                    <span className="font-mono text-base font-bold text-slate-900">
                      {expediente.cut}
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5 px-4 max-w-[260px] truncate text-base text-slate-900 font-medium">
                    {expediente.asunto}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 truncate max-w-[200px]">
                    <div className="truncate text-base font-semibold text-slate-900">
                      {expediente.remitente_nombres}
                    </div>
                    {expediente.remitente_dni_ruc && (
                      <div className="text-sm text-slate-600 font-mono">
                        Doc: {expediente.remitente_dni_ruc}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(expediente.estado)}</TableCell>
                  <TableCell className="py-3.5 px-4 text-slate-700 text-sm font-medium whitespace-nowrap">
                    {format(
                      new Date(expediente.fecha_actualizacion),
                      'dd MMM yyyy, HH:mm',
                      { locale: es }
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
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
                            className="h-10 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-2xs"
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
                        className={cn(
                          buttonVariants({ size: 'sm', variant: 'outline' }),
                          'h-10 px-4 gap-1.5 rounded-xl border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-100'
                        )}
                      >
                        <Eye className="w-4 h-4 text-blue-700" aria-hidden="true" />
                        <span>
                          {expediente.estado === 'REGISTRADO'
                            ? 'Ver / Derivar'
                            : 'Ver Detalle'}
                        </span>
                      </Link>
                    </div>
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

