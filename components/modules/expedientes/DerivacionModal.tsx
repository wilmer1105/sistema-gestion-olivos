'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { derivacionSchema, type DerivacionInput } from '@/lib/validators/derivacion.schema'
import { derivarExpedienteAction } from '@/app/actions/expedientes'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
}

export function DerivacionModal({ expedienteId, areaOrigenId, areas }: Props) {
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

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DerivacionInput>({
    resolver: zodResolver(derivacionSchema) as any,
    defaultValues: { area_destino_id: '', proveido: '' },
  })

  function onSubmit(data: DerivacionInput) {
    setErrorMsg(null)
    setSuccessMsg(null)
    startTransition(async () => {
      const res = await derivarExpedienteAction({
        expediente_id: expedienteId,
        area_destino_id: data.area_destino_id,
        area_origen_id: areaOrigenId as string,
        accion: data.proveido || '',
      })

      if (!res.success) {
        setErrorMsg(res.error || 'Error al derivar el expediente.')
      } else {
        setSuccessMsg('Expediente derivado correctamente.')
        reset()
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
        <Button className="gap-2">
          <Send className="w-4 h-4" />
          Derivar Expediente
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Derivar Documento</DialogTitle>
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

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className={errors.area_destino_id ? "text-destructive" : ""}>Área de Destino</Label>
            <Select 
              items={areaItems}
              itemToStringLabel={(val: any) => (val ? areaItems[String(val)] || String(val) : '')}
              disabled={isPending} 
              onValueChange={(val: any) => setValue('area_destino_id', val || '')}
            >
              <SelectTrigger>
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
            {errors.area_destino_id && <p className="text-sm text-destructive">{errors.area_destino_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className={errors.proveido ? "text-destructive" : ""}>Proveído / Instrucciones</Label>
            <Textarea 
              rows={4} 
              placeholder="Ej. Para su atención y emisión de informe técnico..."
              disabled={isPending}
              {...register('proveido')}
            />
            {errors.proveido && <p className="text-sm text-destructive">{errors.proveido.message}</p>}
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
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirmar Pase
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
