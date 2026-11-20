// components/expedientes/FinalizarExpedienteModal.tsx
'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  finalizarExpedienteAction,
  type FinalizarEstado,
} from '@/app/actions/expedientes'

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
  disabled?: boolean
}

const ESTADOS_DISPONIBLES: Record<string, string> = {
  ATENDIDO: 'ATENDIDO - Trámite finalizado con informe/resolución',
  ARCHIVADO: 'ARCHIVADO - Trámite concluido y enviado al archivo',
}

export function FinalizarExpedienteModal({
  expedienteId,
  cut,
  disabled = false,
}: Props) {
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
    if (!observacion.trim() || observacion.trim().length < 5) {
      setErrorMsg('El proveído de cierre debe tener al menos 5 caracteres.')
      return
    }

    setErrorMsg(null)
    setSuccessMsg(null)

    startTransition(async () => {
      const res = await finalizarExpedienteAction(
        expedienteId,
        estadoNuevo,
        observacion.trim()
      )

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

  const newLocal = "sm:max-w-[500px]"
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
        <Button
          variant="destructive"
          disabled={disabled}
          aria-label="Finalizar o archivar expediente"
          className="gap-2 shadow-sm font-medium"
        >
          <Archive className="w-4 h-4" aria-hidden="true" />
          <span>Finalizar / Archivar</span>
        </Button>
      </DialogTrigger>

      <DialogContent className={newLocal}>
        <DialogHeader>
          <DialogTitle className="text-lg">
            Finalizar o Archivar Expediente
          </DialogTitle>
          <DialogDescription>
            {cut ? `Expediente: ${cut}. ` : ''}
            Esta acción concluirá el ciclo de vida del expediente registrando la
            resolución en la hoja de ruta.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert role="alert" aria-live="assertive" variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <AlertDescription className="wrap-break-word font-medium">
              {errorMsg}
            </AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert
            role="status"
            aria-live="polite"
            className="border-emerald-600 bg-emerald-50 text-emerald-900"
          >
            <CheckCircle2
              className="h-4 w-4 text-emerald-700 shrink-0"
              aria-hidden="true"
            />
            <AlertDescription className="wrap-break-word font-medium">
              {successMsg}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="estado_cierre">Acción de Cierre *</Label>
            <Select
              items={estadoItems}
              itemToStringLabel={(val: string | null) =>
                val ? estadoItems[String(val)] || String(val) : ''
              }
              value={estadoNuevo}
              onValueChange={(val: string | null) =>
                setEstadoNuevo((val as FinalizarEstado) || 'ATENDIDO')
              }
              disabled={isPending}
            >
              <SelectTrigger id="estado_cierre" aria-required="true">
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
            <Label htmlFor="observacion">Observación / Proveído de Cierre *</Label>
            <Textarea
              id="observacion"
              rows={4}
              placeholder="Indique las conclusiones, informe técnico o resolución emitida para el cierre del trámite..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              disabled={isPending}
              required
              aria-required="true"
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
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? (
                <Loader2
                  className="w-4 h-4 mr-2 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              <span>Confirmar Cierre</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
