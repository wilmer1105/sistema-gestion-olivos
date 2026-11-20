'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
}

export function BandejaPaginacion({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  if (totalCount === 0) return null

  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalCount)

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <nav
      aria-label="Paginación de expedientes"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 px-5 bg-white rounded-xl border border-slate-200 shadow-2xs text-sm text-slate-700"
    >
      <div aria-live="polite" className="text-base">
        Mostrando <span className="font-bold text-slate-900">{from}</span> a{' '}
        <span className="font-bold text-slate-900">{to}</span> de{' '}
        <span className="font-bold text-slate-900">{totalCount}</span> expedientes
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold text-slate-700 mr-2">
          Página {currentPage} de {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
          aria-label="Ir a la página anterior"
          className="h-10 px-3.5 gap-1.5 rounded-xl border-slate-300 text-sm font-semibold text-slate-800 shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Anterior</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
          aria-label="Ir a la página siguiente"
          className="h-10 px-3.5 gap-1.5 rounded-xl border-slate-300 text-sm font-semibold text-slate-800 shadow-2xs"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}

