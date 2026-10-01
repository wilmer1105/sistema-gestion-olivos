'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
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

  // Opciones de estado según la pestaña activa
  const estadoOptions = useMemo(() => {
    if (currentTab === 'finalizados') {
      return {
        TODOS: 'Todos los finalizados',
        ATENDIDO: 'Atendido',
        ARCHIVADO: 'Archivado',
      }
    }
    return {
      TODOS: 'Todos los pendientes',
      REGISTRADO: 'Registrado',
      DERIVADO: 'Derivado',
      RECEPCIONADO: 'Recepcionado',
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

  const handleEstadoChange = (val: string) => {
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

  const hasActiveFilters = Boolean(searchTerm.trim() || (selectedEstado && selectedEstado !== 'TODOS'))

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Barra de búsqueda por CUT o Asunto */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por CUT (ej: EXP-2026-...) o Asunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8"
            disabled={isPending}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                applyFilters('', undefined)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selector de Estado */}
        <div className="w-full sm:w-56">
          <Select
            items={estadoOptions}
            itemToStringLabel={(val: any) => (val ? estadoOptions[val as keyof typeof estadoOptions] || String(val) : '')}
            value={selectedEstado}
            onValueChange={handleEstadoChange}
            disabled={isPending}
          >
            <SelectTrigger id="filtro_estado">
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

        {/* Botón Buscar */}
        <Button type="submit" disabled={isPending} className="gap-1.5 shadow-sm">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Buscar
        </Button>

        {/* Botón Limpiar */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            disabled={isPending}
            className="gap-1 text-slate-500 hover:text-slate-900"
          >
            <X className="w-4 h-4" />
            Limpiar
          </Button>
        )}
      </form>
    </div>
  )
}
