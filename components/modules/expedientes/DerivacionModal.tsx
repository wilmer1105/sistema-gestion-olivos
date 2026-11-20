// components/modules/expedientes/DerivacionModal.tsx
'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  derivacionSchema,
  type DerivacionInput,
} from '@/lib/validators/derivacion.schema'
import { derivarExpedienteAction } from '@/app/actions/expedientes'

import {
  Dialog,
  DialogContent,
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
import { Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Area {
  id: string
  nombre: string
  siglas: string
}

interface Props {
  expedienteId: string
  areaOrigenId?: string | null
  areas: Area[]
  disabled?: boolean
}

export function DerivacionModal({
  expedienteId,
  areaOrigenId,
  areas,
  disabled = false,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const areaItems: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {}
    for (const a of areas) {
      map[String(a.id)] = a.siglas ? `${a.nombre} (${a.siglas})` : a.nombre
    }
    return map
  }, [areas])

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DerivacionInput>({
    resolver: zodResolver(derivacionSchema),
    defaultValues: {
      expediente_id: expedienteId,
      area_destino_id: '',
      proveido: '',
    },
  })

  function onSubmit(data: DerivacionInput) {
    setErrorMsg(null)
    setSuccessMsg(null)
    startTransition(async () => {
      const res = await derivarExpedienteAction({
        expediente_id: expedienteId,
        area_destino_id: data.area_destino_id,
        area_origen_id: areaOrigenId || '',
        proveido: data.proveido || '',
        accion: data.proveido || '',
      })

      if (!res.success) {
        setErrorMsg(res.error || 'Error al derivar el expediente.')
      } else {
        setSuccessMsg('Expediente derivado correctamente.')
        reset({
          expediente_id: expedienteId,
          area_destino_id: '',
          proveido: '',
        })
        setErrorMsg(null)
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
        if (!isOpen) setErrorMsg(null)
      }}
    >
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          aria-label="Derivar expediente a otra unidad orgánica"
          className="gap-2"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span>Derivar Expediente</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Derivar Documento</DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <Alert role="alert" aria-live="assertive" variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <AlertDescription className="break-words font-medium">
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
            <AlertDescription className="break-words font-medium">
              {successMsg}
            </AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          aria-label="Formulario de derivación de expediente"
          className="space-y-4 pt-4"
        >
          <div className="space-y-2">
            <Label
              htmlFor="area_destino_id"
              className={errors.area_destino_id ? 'text-destructive' : ''}
            >
              Área de Destino *
            </Label>
            <Select
              items={areaItems}
              itemToStringLabel={(val: string | null) =>
                val ? areaItems[String(val)] || String(val) : ''
              }
              disabled={isPending}
              onValueChange={(val: string | null) =>
                setValue('area_destino_id', val || '')
              }
            >
              <SelectTrigger
                id="area_destino_id"
                aria-required="true"
                aria-invalid={Boolean(errors.area_destino_id)}
                aria-describedby={
                  errors.area_destino_id ? 'area-destino-error' : undefined
                }
              >
                <SelectValue placeholder="Seleccione la unidad orgánica" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.nombre} ({area.siglas})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.area_destino_id && (
              <p
                id="area-destino-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.area_destino_id.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="proveido"
              className={errors.proveido ? 'text-destructive' : ''}
            >
              Proveído / Instrucciones *
            </Label>
            <Textarea
              id="proveido"
              rows={4}
              placeholder="Ej. Para su atención y emisión de informe técnico..."
              disabled={isPending}
              aria-required="true"
              aria-invalid={Boolean(errors.proveido)}
              aria-describedby={errors.proveido ? 'proveido-error' : undefined}
              {...register('proveido')}
            />
            {errors.proveido && (
              <p
                id="proveido-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.proveido.message}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setErrorMsg(null)
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
              {isPending ? (
                <Loader2
                  className="w-4 h-4 mr-2 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              <span>Confirmar Pase</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
