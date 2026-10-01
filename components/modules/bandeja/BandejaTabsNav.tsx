'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, CheckCheck, Loader2 } from 'lucide-react'

interface Props {
  currentTab: string
  pendientesCount?: number
  finalizadosCount?: number
}

export function BandejaTabsNav({
  currentTab,
  pendientesCount,
  finalizadosCount,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    params.set('page', '1')
    params.delete('estado') // Reinicia el filtro de estado específico al cambiar de pestaña
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
        <TabsList className="grid w-full sm:w-[380px] grid-cols-2">
          <TabsTrigger value="pendientes" disabled={isPending} className="gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Pendientes
            {typeof pendientesCount === 'number' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 font-semibold text-slate-700">
                {pendientesCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="finalizados" disabled={isPending} className="gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            Finalizados
            {typeof finalizadosCount === 'number' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 font-semibold text-slate-700">
                {finalizadosCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {isPending && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
    </div>
  )
}
