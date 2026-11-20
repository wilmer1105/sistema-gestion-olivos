// components/modules/bandeja/BandejaFiltros.tsx
'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, Loader2 } from 'lucide-react'

interface Props {
  currentTab: string
  queryDefault?: string
  estadoDefault?: string
}

export function BandejaFiltros({
  currentTab,
  queryDefault = '',
  estadoDefault = 'TODOS',
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(queryDefault)
  const [selectedEstado, setSelectedEstado] = useState(estadoDefault)
  const [isPending, startTransition] = useTransition()

  const estadoOptions = useMemo((): Record<string, string> => {
    if (currentTab === 'finalizados') {
      return {
        TODOS: 'Todos los finalizados',
        ATENDIDO: 'Atendido',
        ARCHIVADO: 'Archivado',
      }
    }
    if (currentTab === 'enviados') {
      return {
        TODOS: 'Todos los enviados',
        DERIVADO: 'Derivado (En tránsito)',
        RECEPCIONADO: 'Recepcionado en destino',
        EN_TRAMITE: 'En trámite en destino',
        ATENDIDO: 'Atendido',
        ARCHIVADO: 'Archivado',
      }
    }
    return {
      TODOS: 'Todos los pendientes',
      REGISTRADO: 'Registrado',
      DERIVADO: 'Derivado (Por recepcionar)',
      RECEPCIONADO: 'Recepcionado',
      EN_TRAMITE: 'En Trámite',
      OBSERVADO: 'Observado',
    }
  }, [currentTab])

  const applyFilters = (newQuery?: string, newEstado?: string) => {
    const q = newQuery !== undefined ? newQuery : searchTerm
    const e = newEstado !== undefined ? newEstado : selectedEstado

    const params = new URLSearchParams(searchParams.toString())

    if (q.trim()) {
      params.set('query', q.trim())
    } else {
      params.delete('query')
    }

    if (e && e !== 'TODOS') {
      params.set('estado', e)
    } else {
      params.delete('estado')
    }

    params.set('page', '1')

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  const handleEstadoChange = (val: string | null) => {
    const estado = val || 'TODOS'
    setSelectedEstado(estado)
    applyFilters(undefined, estado)
  }

  const handleClear = () => {
    setSearchTerm('')
    setSelectedEstado('TODOS')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('query')
    params.delete('estado')
    params.set('page', '1')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const hasActiveFilters = Boolean(
    searchTerm.trim() || (selectedEstado && selectedEstado !== 'TODOS')
  )

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
      <form
        onSubmit={handleSearchSubmit}
        role="search"
        aria-label="Filtrar expedientes en bandeja"
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <div className="relative flex-1">
          <Label htmlFor="bandeja_search_query" className="sr-only">
            Buscar por CUT, DNI/RUC o Asunto
          </Label>
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            id="bandeja_search_query"
            placeholder="Buscar por CUT, DNI/RUC o Asunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8"
            disabled={isPending}
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Limpiar término de búsqueda"
              onClick={() => {
                setSearchTerm('')
                applyFilters('', undefined)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="w-full sm:w-56">
          <Label htmlFor="filtro_estado" className="sr-only">
            Filtrar por estado
          </Label>
          <Select
            items={estadoOptions}
            itemToStringLabel={(val: string | null) =>
              val ? estadoOptions[String(val)] || String(val) : ''
            }
            value={selectedEstado}
            onValueChange={handleEstadoChange}
            disabled={isPending}
          >
            <SelectTrigger id="filtro_estado" aria-label="Filtrar por estado">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(estadoOptions).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="gap-1.5 shadow-sm"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="w-4 h-4" aria-hidden="true" />
          )}
          <span>Buscar</span>
        </Button>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            disabled={isPending}
            className="gap-1 text-slate-600 hover:text-slate-900"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            <span>Limpiar</span>
          </Button>
        )}
      </form>
    </div>
  )
}
