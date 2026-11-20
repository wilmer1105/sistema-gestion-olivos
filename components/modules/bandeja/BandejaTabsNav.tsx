// components/modules/bandeja/BandejaTabsNav.tsx
'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, Send, CheckCheck, Loader2 } from 'lucide-react'

interface Props {
  currentTab: 'pendientes' | 'enviados' | 'finalizados' | string
  pendientesCount?: number
  enviadosCount?: number
  finalizadosCount?: number
}

export function BandejaTabsNav({
  currentTab,
  pendientesCount,
  enviadosCount,
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
    params.delete('estado')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full sm:w-auto"
      >
        <TabsList className="grid w-full sm:w-[540px] grid-cols-3">
          <TabsTrigger value="pendientes" disabled={isPending} className="gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <span>Pendientes</span>
            {typeof pendientesCount === 'number' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 font-semibold text-slate-700">
                {pendientesCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="enviados" disabled={isPending} className="gap-1.5">
            <Send className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <span>Enviados</span>
            {typeof enviadosCount === 'number' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 font-semibold text-slate-700">
                {enviadosCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="finalizados" disabled={isPending} className="gap-1.5">
            <CheckCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>Finalizados</span>
            {typeof finalizadosCount === 'number' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 font-semibold text-slate-700">
                {finalizadosCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {isPending && (
        <Loader2 className="w-4 h-4 animate-spin text-slate-500" aria-hidden="true" />
      )}
    </div>
  )
}
