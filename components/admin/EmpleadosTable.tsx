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
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-700">
        <User className="mx-auto h-10 w-10 text-slate-600 mb-3" aria-hidden="true" />
        <p className="text-base font-bold text-slate-900">No hay empleados registrados</p>
        <p className="text-sm text-slate-700 mt-1">
          Haga clic en &quot;Nuevo Empleado&quot; para registrar el primer usuario.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Alerta de notificación visual inmediata */}
      {alerta && (
        <Alert
          role={alerta.tipo === 'error' ? 'alert' : 'status'}
          aria-live={alerta.tipo === 'error' ? 'assertive' : 'polite'}
          className={
            alerta.tipo === 'success'
              ? 'rounded-xl border-emerald-600 bg-emerald-50 text-emerald-900'
              : 'rounded-xl border-red-300 bg-red-50 text-red-900'
          }
        >
          {alerta.tipo === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-700" aria-hidden="true" />
          )}
          <AlertDescription className="text-sm font-semibold">{alerta.mensaje}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto shadow-xs">
        <Table className="w-full" aria-label="Tabla de funcionarios y usuarios registrados">
          <TableHeader className="bg-slate-100/90 border-b border-slate-200">
            <TableRow className="hover:bg-slate-100/90">
              <TableHead scope="col" className="py-3.5 px-4 text-sm font-bold text-slate-900">
                Funcionario
              </TableHead>
              <TableHead scope="col" className="py-3.5 px-4 text-sm font-bold text-slate-900">
                Rol Institucional
              </TableHead>
              <TableHead scope="col" className="py-3.5 px-4 text-sm font-bold text-slate-900">
                Área de Adscripción
              </TableHead>
              <TableHead scope="col" className="py-3.5 px-4 text-sm font-bold text-slate-900 text-center">
                Estado
              </TableHead>
              <TableHead scope="col" className="py-3.5 px-4 text-sm font-bold text-slate-900 text-right pr-5">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empleados.map((emp) => {
              return (
                <TableRow
                  key={emp.id}
                  className={`hover:bg-blue-50/40 transition-colors border-b border-slate-200/80 ${
                    !emp.activo ? 'bg-slate-50/60' : ''
                  }`}
                >
                  {/* Funcionario (Celda Compuesta: Nombre, Email y DNI) */}
                  <TableCell className="whitespace-normal py-3.5 px-4 align-top">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold mt-0.5 ${
                          emp.activo
                            ? 'bg-[#0F2A4A] text-white'
                            : 'bg-slate-300 text-slate-800'
                        }`}
                        aria-hidden="true"
                      >
                        {emp.nombres?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p
                          className={`font-bold text-base leading-snug ${
                            emp.activo ? 'text-slate-900' : 'text-slate-700 line-through'
                          }`}
                        >
                          {emp.nombre_completo}
                        </p>
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-blue-700" aria-hidden="true" />
                          <span className="break-all">{emp.email}</span>
                        </div>
                        <p className="text-xs text-slate-700 font-mono font-semibold">
                          DNI: {emp.dni || '—'}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Rol */}
                  <TableCell className="whitespace-normal py-3.5 px-4 align-top">
                    {emp.rol === 'ADMIN_TI' ? (
                      <Badge className="inline-flex items-center rounded-full bg-purple-100 text-purple-950 border border-purple-300 px-3 py-1 text-xs font-bold gap-1.5 whitespace-nowrap">
                        <Shield className="h-3.5 w-3.5 text-purple-800" aria-hidden="true" />
                        <span>Administrador TI</span>
                      </Badge>
                    ) : emp.rol === 'JEFE_AREA' ? (
                      <Badge className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-950 border border-indigo-300 px-3 py-1 text-xs font-bold whitespace-nowrap">
                        <span>Jefe de Área</span>
                      </Badge>
                    ) : emp.rol === 'ESPECIALISTA' ? (
                      <Badge className="inline-flex items-center rounded-full bg-blue-100 text-blue-950 border border-blue-300 px-3 py-1 text-xs font-bold whitespace-nowrap">
                        <span>Especialista</span>
                      </Badge>
                    ) : emp.rol === 'ASISTENTE_AREA' ? (
                      <Badge className="inline-flex items-center rounded-full bg-amber-100 text-amber-950 border border-amber-300 px-3 py-1 text-xs font-bold whitespace-nowrap">
                        <span>Asistente de Área</span>
                      </Badge>
                    ) : emp.rol === 'MESA_PARTES' ? (
                      <Badge className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 px-3 py-1 text-xs font-bold whitespace-nowrap">
                        <span>Mesa de Partes</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap">
                        {emp.rol}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Área de Adscripción */}
                  <TableCell className="whitespace-normal py-3.5 px-4 align-top">
                    {emp.rol === 'ADMIN_TI' ? (
                      <span className="text-sm text-slate-700 italic font-medium">
                        No aplica (Alcance Global)
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-start gap-2 text-base text-slate-900 font-medium">
                          <Building className="h-4 w-4 text-blue-700 shrink-0 mt-1" aria-hidden="true" />
                          <span className="leading-snug">{emp.area_nombre || 'Sin área asignada'}</span>
                        </div>
                        {emp.area_siglas && (
                          <div className="pl-6">
                            <Badge
                              variant="outline"
                              className="text-xs font-bold text-slate-800 bg-slate-100 border-slate-300 px-2 py-0.5"
                            >
                              {emp.area_siglas}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Estado (texto + ícono + borde independiente del color) */}
                  <TableCell className="whitespace-normal py-3.5 px-4 align-top text-center">
                    {emp.activo ? (
                      <Badge className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 text-white border border-emerald-950 px-3 py-1 text-xs font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Activo</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 text-slate-900 border border-slate-400 px-3 py-1 text-xs font-bold"
                      >
                        <UserX className="h-3.5 w-3.5 text-slate-700" aria-hidden="true" />
                        <span>Dado de baja</span>
                      </Badge>
                    )}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="whitespace-normal py-3.5 px-4 align-top text-right pr-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-xl border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600"
                          disabled={loadingId === emp.id}
                          aria-label={`Acciones para ${emp.nombre_completo}`}
                        >
                          {loadingId === emp.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-700" aria-hidden="true" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-xs font-bold text-slate-700">
                            Acciones de cuenta
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => setEmpleadoAEditar(emp)}
                            className="cursor-pointer gap-2 text-sm font-medium text-slate-800"
                          >
                            <Pencil className="h-4 w-4 text-blue-700" aria-hidden="true" />
                            <span>Editar</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {emp.activo ? (
                            <DropdownMenuItem
                              onClick={() => handleToggleEstado(emp)}
                              className="cursor-pointer gap-2 text-sm font-semibold text-red-700 focus:text-red-800 focus:bg-red-50"
                            >
                              <UserX className="h-4 w-4 text-red-700" aria-hidden="true" />
                              <span>Dar de baja</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleToggleEstado(emp)}
                              className="cursor-pointer gap-2 text-sm font-semibold text-emerald-800 focus:text-emerald-900 focus:bg-emerald-50"
                            >
                              <UserCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
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

