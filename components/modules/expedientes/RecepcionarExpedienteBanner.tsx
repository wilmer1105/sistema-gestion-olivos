// components/modules/expedientes/RecepcionarExpedienteBanner.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recepcionarExpedienteAction } from '@/app/actions/bandeja'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2, Inbox } from 'lucide-react'

interface Props {
  expedienteId: string
  cut?: string | null
  puedeRecepcionar: boolean
}

export function RecepcionarExpedienteBanner({
  expedienteId,
  cut,
  puedeRecepcionar,
}: Props) {
  const router = useRouter()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRecepcionar() {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await recepcionarExpedienteAction(expedienteId)
      if (!res.success) {
        setErrorMsg(res.error || 'No se pudo recepcionar el expediente.')
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div
      role="region"
      aria-label="Aviso de recepción pendiente del expediente"
      className="rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-xs space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <Inbox className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-amber-950">
              Expediente Pendiente de Recepción en su Unidad Orgánica
            </h2>
            <p className="text-xs text-amber-900 mt-0.5">
              El expediente {cut ? <strong>{cut}</strong> : ''} ha sido derivado
              a su área pero aún se encuentra en estado{' '}
              <strong>DERIVADO</strong>. Debe acusar recepción antes de poder
              asignar especialista, subir informes técnicos/legales, derivar o
              finalizar el trámite.
            </p>
          </div>
        </div>

        {puedeRecepcionar && (
          <Button
            type="button"
            onClick={handleRecepcionar}
            disabled={isPending}
            aria-busy={isPending}
            aria-label={`Recepcionar expediente ${cut || expedienteId}`}
            className="bg-amber-700 hover:bg-amber-800 text-white shrink-0 gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            )}
            <span>Recepcionar Expediente</span>
          </Button>
        )}
      </div>

      {errorMsg && (
        <Alert role="alert" aria-live="assertive" variant="destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
