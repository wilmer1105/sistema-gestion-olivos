'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { finalizarExpedienteAction, type FinalizarEstado } from '@/app/actions/expedientes'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Archive, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  expedienteId: string
  cut?: string | null
}

const ESTADOS_DISPONIBLES: Record<string, string> = {
  ATENDIDO: 'ATENDIDO - Trámite finalizado con informe/resolución',
  ARCHIVADO: 'ARCHIVADO - Trámite concluido y enviado al archivo',
}

export function FinalizarExpedienteModal({ expedienteId, cut }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [estadoNuevo, setEstadoNuevo] = useState<FinalizarEstado>('ATENDIDO')
  const [observacion, setObservacion] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const estadoItems = useMemo(() => ESTADOS_DISPONIBLES, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!estadoNuevo) {
      setErrorMsg('Debe seleccionar si desea ATENDER o ARCHIVAR el expediente.')
      return
    }

    setErrorMsg(null)
    setSuccessMsg(null)

    startTransition(async () => {
      const res = await finalizarExpedienteAction(expedienteId, estadoNuevo, observacion)

      if (!res.success) {
        setErrorMsg(res.error || 'Error al procesar el cierre del expediente.')
      } else {
        setSuccessMsg(`Expediente marcado como ${estadoNuevo} con éxito.`)
        setOpen(false)
        router.push('/dashboard/bandeja')
        router.refresh()
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          setErrorMsg(null)
          setSuccessMsg(null)
          setObservacion('')
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2 shadow-sm font-medium">
          <Archive className="w-4 h-4" />
          Finalizar / Archivar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Finalizar o Archivar Expediente</DialogTitle>
          <DialogDescription>
            {cut ? `Expediente: ${cut}. ` : ''}
            Esta acción concluirá el ciclo de vida del expediente registrando la resolución en la hoja de ruta.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="break-words font-medium">
              {errorMsg}
            </AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <AlertDescription className="break-words font-medium">
              {successMsg}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="estado_cierre">Acción de Cierre *</Label>
            <Select
              items={estadoItems}
              itemToStringLabel={(val: any) => (val ? estadoItems[String(val)] || String(val) : '')}
              value={estadoNuevo}
              onValueChange={(val: any) => setEstadoNuevo(val as FinalizarEstado)}
              disabled={isPending}
            >
              <SelectTrigger id="estado_cierre">
                <SelectValue placeholder="Seleccione el estado de resolución" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATENDIDO">
                  Atendido (Trámite finalizado con informe/resolución)
                </SelectItem>
                <SelectItem value="ARCHIVADO">
                  Archivado (Trámite concluido y archivado)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacion">Observación / Proveído Final</Label>
            <Textarea
              id="observacion"
              rows={4}
              placeholder="Indique las conclusiones, informe técnico o resolución emitida para el cierre del trámite..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirmar Cierre
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
