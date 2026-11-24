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

interface ConsultaTrackerProps {
  cardTitle?: string
  cardDescription?: string
}

const DATE_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

export function formatDateSafe(dateStr?: string | null): string {
  if (!dateStr) return 'Fecha no registrada'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Fecha no registrada'
    return DATE_FORMATTER.format(d)
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
      <div className="flex flex-col items-center justify-center p-10 text-center text-slate-700">
        <Clock
          className="w-10 h-10 text-slate-600 mb-3"
          aria-hidden="true"
        />
        <p className="text-base font-semibold text-slate-800">
          No se registran movimientos ni derivaciones para este expediente aún.
        </p>
      </div>
    )
  }

  return (
    <ol
      aria-label="Línea de tiempo cronológica de movimientos"
      className="relative border-l-2 border-blue-200 ml-4 space-y-6 pb-2 list-none"
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
            className="relative pl-8"
          >
            <div
              aria-hidden="true"
              className={`absolute -left-3 mt-1.5 h-6 w-6 rounded-full ring-4 ring-white flex items-center justify-center shadow-xs ${
                isUltimo ? 'bg-blue-700' : 'bg-[#0F2A4A]'
              }`}
            >
              <div className="h-2.5 w-2.5 bg-white rounded-full" />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`text-base font-bold ${
                      isUltimo ? 'text-blue-800' : 'text-slate-900'
                    }`}
                  >
                    {item.accion}
                  </span>
                  {item.estado_nuevo && (
                    <Badge
                      variant="outline"
                      className="rounded-full bg-white text-slate-900 border-slate-300 text-xs font-semibold px-3 py-0.5"
                    >
                      {item.estado_nuevo}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
                  <span>Envío: {fechaEnvioTexto}</span>
                  {fechaRecepcionTexto && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                      Recepción: {fechaRecepcionTexto}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-base text-slate-800">
                  <span className="font-semibold text-slate-900">
                    {item.area_origen || 'Mesa de Partes'}
                  </span>
                  <ArrowRight
                    className="w-4 h-4 text-blue-700 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-bold text-blue-800">
                    {item.area_destino || 'Mesa de Partes'}
                  </span>
                </div>
                {item.proveido && (
                  <p className="text-sm text-slate-700 italic border-t border-slate-200 pt-2">
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
      {/* Buscador protagonista */}
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 border-t-blue-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-slate-900">
            <h2>{cardTitle}</h2>
          </CardTitle>
          <CardDescription id="cut-search-desc" className="text-base text-slate-700">
            {cardDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleBuscar}
            role="search"
            aria-label="Buscador de expediente por código único de trámite"
            className="flex flex-col sm:flex-row sm:items-end gap-3"
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="cut-search-input" className="block text-sm font-semibold text-slate-800">
                Código Único de Trámite (CUT)
              </Label>
              <Input
                id="cut-search-input"
                placeholder="Ej. EXP-2026-000001-MDLO"
                value={cut}
                onChange={(e) => setCut(e.target.value.toUpperCase())}
                aria-required="true"
                aria-invalid={Boolean(errorMsg)}
                aria-describedby={
                  errorMsg ? 'cut-search-error' : 'cut-search-desc'
                }
                className="w-full h-12 text-base font-mono font-semibold uppercase bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                disabled={isPending}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              aria-busy={isPending}
              className="h-12 px-8 text-base font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
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
              className="flex items-center gap-2.5 text-red-900 bg-red-50 border border-red-300 rounded-lg px-4 py-3 mt-4 text-sm font-semibold"
            >
              <AlertCircle className="w-5 h-5 text-red-700 shrink-0" aria-hidden="true" />
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
            <Card className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-700 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                      Código Único de Trámite
                    </p>
                    <h2 className="text-2xl font-extrabold font-mono text-slate-900 mt-0.5">
                      {resultado.expediente.cut}
                    </h2>
                  </div>
                  <Badge className="inline-flex items-center gap-1.5 rounded-full bg-[#0F2A4A] text-white border border-slate-800 text-sm px-3.5 py-1 font-bold">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>{resultado.expediente.estado}</span>
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-3">
                    <FileText
                      className="w-5 h-5 text-blue-700 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        Asunto
                      </p>
                      <p className="text-base font-medium text-slate-900">
                        {resultado.expediente.asunto}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin
                      className="w-5 h-5 text-blue-700 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        Ubicación Actual
                      </p>
                      <p className="text-base font-bold text-blue-800">
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
                        className="w-5 h-5 text-blue-700 mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-600">
                          Fecha de Ingreso
                        </p>
                        <p className="text-slate-900 text-base font-medium">
                          {formatDateSafe(resultado.expediente.fecha_ingreso)}
                        </p>
                      </div>
                    </div>
                  )}

                  {resultado.expediente.fecha_actualizacion && (
                    <div className="flex items-start gap-3">
                      <Clock
                        className="w-5 h-5 text-blue-700 mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-600">
                          Última Actualización
                        </p>
                        <p className="text-slate-900 text-base font-medium">
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
              <h3 className="text-lg font-bold text-slate-900 ml-1 mb-4">
                Historial de Movimientos (Línea de Tiempo)
              </h3>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <HojaDeRutaTimeline movimientos={movimientos} />
              </div>
            </section>
          </section>
        )}
      </div>
    </div>
  )
}
