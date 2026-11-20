// components/modules/expedientes/AsignarEspecialistaModal.tsx
'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { asignarEspecialistaAction } from '@/app/actions/bandeja'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export interface EspecialistaAreaOption {
  id: string
  nombres: string
  apellidos: string
  rol: string
}

interface Props {
  expedienteId: string
  especialistas: EspecialistaAreaOption[]
  asignadoActualId?: string | null
  disabled?: boolean
}

export function AsignarEspecialistaModal({
  expedienteId,
  especialistas,
  asignadoActualId,
  disabled = false,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [especialistaId, setEspecialistaId] = useState(asignadoActualId || '')
  const [proveido, setProveido] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const especialistaItems: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {}
    for (const esp of especialistas) {
      map[esp.id] = `${esp.nombres} ${esp.apellidos}`.trim()
    }
    return map
  }, [especialistas])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!especialistaId) {
      setErrorMsg('Debe seleccionar un especialista de su unidad orgánica.')
      return
    }

    setErrorMsg(null)
    setSuccessMsg(null)

    startTransition(async () => {
      const res = await asignarEspecialistaAction({
        expediente_id: expedienteId,
        especialista_id: especialistaId,
        proveido: proveido.trim() || undefined,
      })

      if (!res.success) {
        setErrorMsg(res.error || 'No se pudo asignar el especialista.')
      } else {
        setSuccessMsg('Especialista asignado correctamente (Estado: EN_TRAMITE).')
        router.refresh()
        setTimeout(() => {
          setOpen(false)
          setSuccessMsg(null)
        }, 900)
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
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          aria-label="Asignar especialista de la unidad orgánica"
          className="h-11 px-4 gap-2 rounded-xl border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          <UserCheck className="w-4 h-4 text-indigo-700" aria-hidden="true" />
          <span>Asignar Especialista</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Asignación Interna de Especialista
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Seleccione al especialista o asesor de su misma unidad orgánica
            encargado de evaluar el expediente y elaborar el informe respectivo.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert role="alert" aria-live="assertive" variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <AlertDescription>{errorMsg}</AlertDescription>
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
            <AlertDescription>{successMsg}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="especialista_id" className="text-sm font-semibold text-slate-800">
              Especialista del Área *
            </Label>
            <Select
              items={especialistaItems}
              itemToStringLabel={(val: string | null) =>
                val ? especialistaItems[String(val)] || String(val) : ''
              }
              value={especialistaId}
              onValueChange={(val: string | null) =>
                setEspecialistaId(val || '')
              }
              disabled={isPending || especialistas.length === 0}
            >
              <SelectTrigger
                id="especialista_id"
                aria-required="true"
                aria-invalid={Boolean(errorMsg && !especialistaId)}
                className="h-11 text-base bg-white border-slate-300 text-slate-900"
              >
                <SelectValue
                  placeholder={
                    especialistas.length === 0
                      ? 'No hay especialistas registrados en su área'
                      : 'Seleccione un especialista'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {especialistas.map((esp) => (
                  <SelectItem key={esp.id} value={esp.id}>
                    {esp.nombres} {esp.apellidos} ({esp.rol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proveido_asignacion" className="text-sm font-semibold text-slate-800">
              Instrucción Interna / Proveído
            </Label>
            <Textarea
              id="proveido_asignacion"
              rows={3}
              placeholder="Ej. Evaluar planos estructurales y emitir Informe Técnico..."
              value={proveido}
              onChange={(e) => setProveido(e.target.value)}
              disabled={isPending}
              className="text-base bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="h-11 px-5 rounded-xl border-slate-300 font-semibold text-slate-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || especialistas.length === 0}
              aria-busy={isPending}
              className="h-11 px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold"
            >
              {isPending && (
                <Loader2
                  className="w-4 h-4 mr-2 animate-spin"
                  aria-hidden="true"
                />
              )}
              <span>Confirmar Asignación</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

