'use client'

import { useState, useTransition } from 'react'
import { buscarExpedientePorCut } from '@/app/actions/consulta'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, FileText, MapPin, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ConsultaTrackerProps {
  cardTitle?: string
  cardDescription?: string
}

export function ConsultaTracker({
  cardTitle = 'Rastrear Expediente',
  cardDescription = 'Ingrese el Código Único de Trámite (CUT) para ver el estado actual.',
}: ConsultaTrackerProps) {
  const [cut, setCut] = useState('')
  const [isPending, startTransition] = useTransition()
  const [resultado, setResultado] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cut.trim()) return

    setErrorMsg(null)
    setResultado(null)

    startTransition(async () => {
      const res = await buscarExpedientePorCut(cut)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setResultado(res)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3">
            <Input 
              placeholder="Ej. CUT-2026-0001" 
              value={cut}
              onChange={(e) => setCut(e.target.value.toUpperCase())}
              className="flex-1 text-base py-5"
              disabled={isPending}
            />
            <Button type="submit" size="lg" disabled={isPending} className="px-8">
              {isPending ? 'Buscando...' : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </form>
          {errorMsg && <p className="text-red-500 mt-4 text-sm font-medium">{errorMsg}</p>}
        </CardContent>
      </Card>

      {/* Resultados */}
      {resultado && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-l-4 border-l-primary shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Expediente</p>
                  <h2 className="text-2xl font-bold text-slate-900">{resultado.expediente.cut}</h2>
                </div>
                <Badge className="bg-slate-900 text-sm py-1">{resultado.expediente.estado}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-slate-50 rounded-lg border">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">Asunto</p>
                    <p className="text-slate-900 line-clamp-2">{resultado.expediente.asunto}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-500">Ubicación Actual</p>
                    <p className="font-semibold text-primary">{(resultado.expediente.areas as any)?.nombre}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hoja de Ruta */}
          <div>
            <h3 className="font-semibold text-slate-800 ml-1 mb-4">Historial de Movimientos (Hoja de Ruta)</h3>
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
                {resultado.trazabilidad?.map((item: any, index: number) => (
                  <div key={item.id} className="relative pl-6">
                    <div className={`absolute -left-2.5 mt-1.5 h-5 w-5 rounded-full ring-4 ring-white flex items-center justify-center ${index === 0 ? 'bg-primary' : 'bg-slate-300'}`}>
                      <div className="h-2 w-2 bg-white rounded-full" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${index === 0 ? 'text-primary' : 'text-slate-700'}`}>
                        {item.accion}
                      </span>
                      <span className="text-xs text-slate-500 mb-2">
                        {format(new Date(item.fecha_envio), "dd MMM yyyy - hh:mm a", { locale: es })}
                      </span>
                      <div className="bg-slate-50 border rounded-md p-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                          <span className="font-medium">{item.area_origen?.nombre}</span>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{item.area_destino?.nombre}</span>
                        </div>
                        <p className="text-sm text-slate-700 italic">"{item.proveido}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
