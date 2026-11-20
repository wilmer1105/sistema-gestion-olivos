// components/modules/consulta/ConsultaTracker.tsx
'use client'

import { useState, useTransition } from 'react'
import {
  consultarExpedientePorCut,
  type ConsultaPorCutResultado,
} from '@/app/actions/consulta'
import type { IConsultaCiudadanaMovimiento } from '@/lib/domain/contracts/expediente.contracts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  FileText,
  MapPin,
  ArrowRight,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ConsultaTrackerProps {
  cardTitle?: string
  cardDescription?: string
}

export function formatDateSafe(dateStr?: string | null): string {
  if (!dateStr) return 'Fecha no registrada'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Fecha no registrada'
    return format(d, 'dd MMM yyyy - hh:mm a', { locale: es })
  } catch {
    return 'Fecha no disponible'
  }
}

export function HojaDeRutaTimeline({
  movimientos,
}: {
  movimientos: IConsultaCiudadanaMovimiento[]
}) {
  if (movimientos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-600">
        <Clock
          className="w-8 h-8 text-slate-400 mb-2"
          aria-hidden="true"
        />
        <p className="text-sm font-medium">
          No se registran movimientos ni derivaciones para este expediente aún.
        </p>
      </div>
    )
  }

  return (
    <ol
      aria-label="Línea de tiempo cronológica de movimientos"
      className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4 list-none"
    >
      {movimientos.map((item: IConsultaCiudadanaMovimiento, index: number) => {
        const isUltimo = index === movimientos.length - 1
        const fechaEnvioTexto = formatDateSafe(item.fecha_envio || item.fecha)
        const fechaRecepcionTexto = item.fecha_recepcion
          ? formatDateSafe(item.fecha_recepcion)
          : null

        return (
          <li
            key={`${item.id || item.expediente_id || 'item'}-${index}`}
            className="relative pl-6"
          >
            <div
              aria-hidden="true"
              className={`absolute -left-2.5 mt-1.5 h-5 w-5 rounded-full ring-4 ring-white flex items-center justify-center ${
                isUltimo ? 'bg-primary' : 'bg-slate-400'
              }`}
            >
              <div className="h-2 w-2 bg-white rounded-full" />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm font-bold ${
                    isUltimo ? 'text-primary' : 'text-slate-800'
                  }`}
                >
                  {item.accion}
                </span>
                {item.estado_nuevo && (
                  <Badge
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {item.estado_nuevo}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mb-2 mt-0.5">
                <span>Envío: {fechaEnvioTexto}</span>
                {fechaRecepcionTexto && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Recepción: {fechaRecepcionTexto}
                  </span>
                )}
              </div>
              <div className="bg-slate-50 border rounded-md p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="font-medium text-slate-800">
                    {item.area_origen || 'Mesa de Partes'}
                  </span>
                  <ArrowRight
                    className="w-4 h-4 text-slate-500 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-primary">
                    {item.area_destino || 'Mesa de Partes'}
                  </span>
                </div>
                {item.proveido && (
                  <p className="text-xs text-slate-700 italic border-t border-slate-200/80 pt-1.5">
                    Proveído: &ldquo;{item.proveido}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function ConsultaTracker({
  cardTitle = 'Rastrear Expediente',
  cardDescription = 'Ingrese el Código Único de Trámite (CUT) para ver el estado actual.',
}: ConsultaTrackerProps) {
  const [cut, setCut] = useState('')
  const [isPending, startTransition] = useTransition()
  const [resultado, setResultado] = useState<ConsultaPorCutResultado | null>(
    null
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cut.trim()) return

    setErrorMsg(null)
    setResultado(null)

    startTransition(async () => {
      const res = await consultarExpedientePorCut(cut)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setResultado(res)
      }
    })
  }

  const movimientos: IConsultaCiudadanaMovimiento[] =
    resultado?.trazabilidad || []
  const ultimoMovimiento =
    movimientos.length > 0 ? movimientos[movimientos.length - 1] : null
  const ubicacionActual =
    resultado?.expediente?.area_actual ||
    ultimoMovimiento?.area_destino ||
    'Mesa de Partes'

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription id="cut-search-desc">
            {cardDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleBuscar}
            role="search"
            aria-label="Buscador de expediente por código único de trámite"
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1">
              <Label htmlFor="cut-search-input" className="sr-only">
                Código Único de Trámite (CUT)
              </Label>
              <Input
                id="cut-search-input"
                placeholder="Ej. EXP-2026-000001-MDLO"
                value={cut}
                onChange={(e) => setCut(e.target.value.toUpperCase())}
                aria-label="Código Único de Trámite (CUT)"
                aria-required="true"
                aria-invalid={Boolean(errorMsg)}
                aria-describedby={
                  errorMsg ? 'cut-search-error' : 'cut-search-desc'
                }
                className="w-full text-base py-5 uppercase"
                disabled={isPending}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              aria-busy={isPending}
              className="px-8 font-medium"
            >
              {isPending ? (
                'Buscando...'
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" aria-hidden="true" />
                  <span>Buscar</span>
                </>
              )}
            </Button>
          </form>
          {errorMsg && (
            <div
              id="cut-search-error"
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-2 text-red-700 mt-4 text-sm font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      <div aria-live="polite">
        {resultado && resultado.expediente && (
          <section
            aria-label={`Resultado de consulta del expediente ${resultado.expediente.cut}`}
            className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <Card className="border-l-4 border-l-primary shadow-sm">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Expediente
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {resultado.expediente.cut}
                    </h2>
                  </div>
                  <Badge className="bg-slate-900 text-white text-sm py-1 font-semibold">
                    {resultado.expediente.estado}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <FileText
                      className="w-5 h-5 text-slate-500 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Asunto
                      </p>
                      <p className="text-slate-900 line-clamp-2">
                        {resultado.expediente.asunto}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin
                      className="w-5 h-5 text-slate-500 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Ubicación Actual
                      </p>
                      <p className="font-semibold text-primary">
                        {ubicacionActual}
                        {resultado.expediente.area_actual_siglas
                          ? ` (${resultado.expediente.area_actual_siglas})`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {resultado.expediente.fecha_ingreso && (
                    <div className="flex items-start gap-3">
                      <Calendar
                        className="w-5 h-5 text-slate-500 mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Fecha de Ingreso
                        </p>
                        <p className="text-slate-800 text-sm font-medium">
                          {formatDateSafe(resultado.expediente.fecha_ingreso)}
                        </p>
                      </div>
                    </div>
                  )}

                  {resultado.expediente.fecha_actualizacion && (
                    <div className="flex items-start gap-3">
                      <Clock
                        className="w-5 h-5 text-slate-500 mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Última Actualización
                        </p>
                        <p className="text-slate-800 text-sm font-medium">
                          {formatDateSafe(
                            resultado.expediente.fecha_actualizacion
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Hoja de Ruta */}
            <section aria-label="Historial de movimientos del expediente">
              <h3 className="font-semibold text-slate-800 ml-1 mb-4">
                Historial de Movimientos (Línea de Tiempo)
              </h3>
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <HojaDeRutaTimeline movimientos={movimientos} />
              </div>
            </section>
          </section>
        )}
      </div>
    </div>
  )
}
