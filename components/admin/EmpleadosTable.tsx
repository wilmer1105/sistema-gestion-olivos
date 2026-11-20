// components/admin/EmpleadosTable.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Shield,
  User,
  Building,
  Mail,
  MoreHorizontal,
  Pencil,
  UserX,
  UserCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { EmpleadoItem, cambiarEstadoEmpleado } from '@/app/actions/admin'
import { EditarEmpleadoDialog } from '@/components/admin/EditarEmpleadoDialog'
import { toast } from '@/components/ui/toast'

interface AreaOption {
  id: string
  nombre: string
  siglas?: string
}

interface Props {
  empleados: EmpleadoItem[]
  areas?: AreaOption[]
}

export function EmpleadosTable({ empleados, areas = [] }: Props) {
  const router = useRouter()
  const [empleadoAEditar, setEmpleadoAEditar] = useState<EmpleadoItem | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [alerta, setAlerta] = useState<{ tipo: 'success' | 'error'; mensaje: string } | null>(null)
  const [, startTransition] = useTransition()

  function handleToggleEstado(emp: EmpleadoItem) {
    const nuevoEstado = !emp.activo
    const accionTexto = nuevoEstado ? 'activar' : 'dar de baja'
    setLoadingId(emp.id)
    setAlerta(null)

    startTransition(async () => {
      try {
        const res = await cambiarEstadoEmpleado(emp.id, nuevoEstado)
        if (!res.success) {
          const msg = res.error || `Error al ${accionTexto} al empleado.`
          setAlerta({ tipo: 'error', mensaje: msg })
          try {
            toast.add({
              title: 'Error al cambiar estado',
              description: msg,
              type: 'error',
            })
          } catch {}
        } else {
          const msg = nuevoEstado
            ? `Empleado ${emp.nombre_completo} activado con éxito.`
            : `Empleado ${emp.nombre_completo} ha sido dado de baja.`
          setAlerta({ tipo: 'success', mensaje: msg })
          try {
            toast.add({
              title: nuevoEstado ? 'Empleado activado' : 'Empleado dado de baja',
              description: msg,
              type: 'success',
            })
          } catch {}
          router.refresh()
          setTimeout(() => setAlerta(null), 4000)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error de conexión con el servidor.'
        setAlerta({ tipo: 'error', mensaje: msg })
      } finally {
        setLoadingId(null)
      }
    })
  }

  if (!empleados || empleados.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
        <User className="mx-auto h-8 w-8 text-slate-300 mb-2" />
        <p className="text-sm font-medium text-slate-700">No hay empleados registrados</p>
        <p className="text-xs text-slate-400 mt-1">
          Haga clic en &quot;Nuevo Empleado&quot; para registrar el primer usuario.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Alerta de notificación visual inmediata */}
      {alerta && (
        <Alert
          className={
            alerta.tipo === 'success'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
              : 'border-destructive bg-destructive/10 text-destructive'
          }
        >
          {alerta.tipo === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription className="text-sm font-medium">{alerta.mensaje}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
        <Table className="w-full">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Funcionario</TableHead>
              <TableHead className="font-semibold text-slate-700">Rol</TableHead>
              <TableHead className="font-semibold text-slate-700">Área de Adscripción</TableHead>
              <TableHead className="font-semibold text-slate-700 text-center">Estado</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right pr-4">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empleados.map((emp) => {
              return (
                <TableRow
                  key={emp.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    !emp.activo ? 'bg-slate-50/40 text-slate-500' : ''
                  }`}
                >
                  {/* Funcionario (Celda Compuesta: Nombre, Email y DNI) */}
                  <TableCell className="whitespace-normal py-3 align-top">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold mt-0.5 ${
                          emp.activo
                            ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                        aria-hidden="true"
                      >
                        {emp.nombres?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p
                          className={`font-semibold text-sm leading-snug ${
                            emp.activo ? 'text-slate-900' : 'text-slate-500 line-through'
                          }`}
                        >
                          {emp.nombre_completo}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="break-all">{emp.email}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          DNI: {emp.dni || '—'}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Rol */}
                  <TableCell className="whitespace-normal py-3 align-top">
                    {emp.rol === 'ADMIN_TI' ? (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-semibold gap-1 whitespace-nowrap">
                        <Shield className="h-3 w-3" />
                        Administrador TI
                      </Badge>
                    ) : emp.rol === 'JEFE_AREA' ? (
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 font-medium whitespace-nowrap">
                        Jefe de Área
                      </Badge>
                    ) : emp.rol === 'ESPECIALISTA' ? (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium whitespace-nowrap">
                        Especialista
                      </Badge>
                    ) : emp.rol === 'ASISTENTE_AREA' ? (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-medium whitespace-nowrap">
                        Asistente de Área
                      </Badge>
                    ) : emp.rol === 'MESA_PARTES' ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-medium whitespace-nowrap">
                        Mesa de Partes
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-medium whitespace-nowrap">
                        {emp.rol}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Área de Adscripción */}
                  <TableCell className="whitespace-normal py-3 align-top">
                    {emp.rol === 'ADMIN_TI' ? (
                      <span className="text-xs text-slate-400 italic">No aplica (Global)</span>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-start gap-1.5 text-sm text-slate-700">
                          <Building className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{emp.area_nombre || 'Sin área asignada'}</span>
                        </div>
                        {emp.area_siglas && (
                          <div className="pl-5">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold text-slate-600 bg-slate-50 border-slate-200 px-1.5 py-0"
                            >
                              {emp.area_siglas}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Estado */}
                  <TableCell className="whitespace-normal py-3 align-top text-center">
                    {emp.activo ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 font-medium">
                        Dado de baja
                      </Badge>
                    )}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="whitespace-normal py-3 align-top text-right pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900 focus-visible:ring-1"
                          disabled={loadingId === emp.id}
                          aria-label={`Acciones para ${emp.nombre_completo}`}
                        >
                          {loadingId === emp.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-xs text-slate-400">Acciones</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => setEmpleadoAEditar(emp)}
                            className="cursor-pointer gap-2"
                          >
                            <Pencil className="h-4 w-4 text-slate-500" />
                            <span>Editar</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {emp.activo ? (
                            <DropdownMenuItem
                              onClick={() => handleToggleEstado(emp)}
                              className="cursor-pointer gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                            >
                              <UserX className="h-4 w-4 text-red-500" />
                              <span>Dar de baja</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleToggleEstado(emp)}
                              className="cursor-pointer gap-2 text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                            >
                              <UserCheck className="h-4 w-4 text-emerald-500" />
                              <span>Activar</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Modal para Editar Empleado */}
      {empleadoAEditar && (
        <EditarEmpleadoDialog
          empleado={empleadoAEditar}
          areas={areas}
          open={!!empleadoAEditar}
          onOpenChange={(open) => {
            if (!open) setEmpleadoAEditar(null)
          }}
        />
      )}
    </div>
  )
}
