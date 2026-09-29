// components/modules/expedientes/ExpedienteCreateForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { expedienteSchema, type ExpedienteInput } from '@/lib/validators/expediente.schema'
import { createExpedienteAction } from '@/app/actions/expedientes'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, ShieldAlert } from 'lucide-react'

export function ExpedienteCreateForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [createdCut, setCreatedCut] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpedienteInput>({
    resolver: zodResolver(expedienteSchema) as any, // <-- Agregamos "as any" aquí
    defaultValues: {
      remitente_nombres: '',
      remitente_dni_ruc: '',
      telefono: '',
      correo: '',
      asunto: '',
      folios: 1,
    },
  })

  function onSubmit(data: ExpedienteInput) {
    setServerError(null)
    setCreatedCut(null)

    startTransition(async () => {
      const res = await createExpedienteAction(data)
      if (res.error) {
        setServerError(res.error)
      } else if (res.success && res.cut) {
        setCreatedCut(res.cut)
        reset()
      }
    })
  }

  return (
    <div className="space-y-6">
      {serverError && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {createdCut && (
        <Alert className="border-emerald-500 bg-emerald-50 text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription>
            Expediente registrado con éxito. <strong>Código CUT: {createdCut}</strong>
          </AlertDescription>
        </Alert>
      )}

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">        
        {/* Sección Datos del Remitente */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-semibold text-slate-800">1. Datos del Solicitante / Administrado</h2>
          <p className="text-sm text-slate-500">Información del titular o representante legal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="remitente_nombres" className={errors.remitente_nombres ? "text-destructive" : ""}>
              Nombres y Apellidos / Razón Social *
            </Label>
            <Input
              id="remitente_nombres"
              placeholder="Ej. Juan Pérez Quispe"
              disabled={isPending}
              {...register('remitente_nombres')}
            />
            {errors.remitente_nombres && (
              <p className="text-xs text-destructive">{errors.remitente_nombres.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="remitente_dni_ruc" className={errors.remitente_dni_ruc ? "text-destructive" : ""}>
              DNI o RUC (8 u 11 dígitos) *
            </Label>
            <Input
              id="remitente_dni_ruc"
              placeholder="45892134"
              maxLength={11}
              disabled={isPending}
              {...register('remitente_dni_ruc')}
            />
            {errors.remitente_dni_ruc && (
              <p className="text-xs text-destructive">{errors.remitente_dni_ruc.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono / Celular</Label>
            <Input
              id="telefono"
              placeholder="987654321"
              disabled={isPending}
              {...register('telefono')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="correo" className={errors.correo ? "text-destructive" : ""}>
              Correo Electrónico
            </Label>
            <Input
              id="correo"
              type="email"
              placeholder="vecino@gmail.com"
              disabled={isPending}
              {...register('correo')}
            />
            {errors.correo && (
              <p className="text-xs text-destructive">{errors.correo.message}</p>
            )}
          </div>
        </div>

        {/* Sección Contenido del Trámite */}
        <div className="border-b pb-4 pt-2">
          <h2 className="text-lg font-semibold text-slate-800">2. Detalle del Documento</h2>
          <p className="text-sm text-slate-500">Materia y contenido de la solicitud.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asunto" className={errors.asunto ? "text-destructive" : ""}>
              Asunto del Trámite *
            </Label>
            <Textarea
              id="asunto"
              rows={3}
              placeholder="Describe detalladamente la solicitud o pretensión..."
              disabled={isPending}
              {...register('asunto')}
            />
            {errors.asunto && (
              <p className="text-xs text-destructive">{errors.asunto.message}</p>
            )}
          </div>

          <div className="w-full md:w-1/3 space-y-2">
            <Label htmlFor="folios" className={errors.folios ? "text-destructive" : ""}>
              Número de Folios *
            </Label>
            <Input
              id="folios"
              type="number"
              min={1}
              disabled={isPending}
              {...register('folios')}
            />
            {errors.folios && (
              <p className="text-xs text-destructive">{errors.folios.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending} className="px-6">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando Expediente...
              </>
            ) : (
              'Ingresar Expediente'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}