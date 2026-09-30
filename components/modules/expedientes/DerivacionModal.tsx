'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { derivacionSchema, type DerivacionInput } from '@/lib/validators/derivacion.schema'
import { derivarExpedienteAction } from '@/app/actions/derivaciones'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Area {
  id: string
  nombre: string
  siglas: string
}

interface Props {
  expedienteId: string
  areas: Area[]
}

export function DerivacionModal({ expedienteId, areas }: Props) {
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<DerivacionInput>({
    resolver: zodResolver(derivacionSchema) as any,
    defaultValues: { area_destino_id: '', proveido: '' },
  })

  function onSubmit(data: DerivacionInput) {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await derivarExpedienteAction(expedienteId, data)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        reset()
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className={errors.area_destino_id ? "text-destructive" : ""}>Área de Destino</Label>
            <Select disabled={isPending} onValueChange={(val: any) => setValue('area_destino_id', val || '')}>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
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
