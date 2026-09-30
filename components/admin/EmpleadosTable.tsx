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
  const [isPending, startTransition] = useTransition()

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
      } catch (err: any) {
        setAlerta({ tipo: 'error', mensaje: err?.message || 'Error de conexión con el servidor.' })
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
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Empleado</TableHead>
              <TableHead className="font-semibold text-slate-700">DNI</TableHead>
              <TableHead className="font-semibold text-slate-700">Correo Electrónico</TableHead>
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
                  {/* Nombre */}
                  <TableCell className="font-medium text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          emp.activo
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {emp.nombres?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p
                          className={`font-semibold leading-tight ${
                            emp.activo ? 'text-slate-900' : 'text-slate-500 line-through'
                          }`}
                        >
                          {emp.nombre_completo}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* DNI */}
                  <TableCell className="text-slate-600 text-sm">
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {emp.dni || '—'}
                    </span>
                  </TableCell>

                  {/* Correo */}
                  <TableCell className="text-slate-600 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{emp.email}</span>
                    </div>
                  </TableCell>

                  {/* Rol */}
                  <TableCell>
                    {emp.rol === 'ADMIN_TI' || emp.rol === 'ADMIN' ? (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-semibold gap-1">
                        <Shield className="h-3 w-3" />
                        Administrador TI
                      </Badge>
                    ) : emp.rol === 'JEFE_AREA' ? (
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 font-medium">
                        Jefe de Área
                      </Badge>
                    ) : emp.rol === 'ESPECIALISTA' ? (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
                        Especialista
                      </Badge>
                    ) : emp.rol === 'MESA_PARTES' ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-medium">
                        Mesa de Partes
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-medium">
                        {emp.rol}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Área */}
                  <TableCell className="text-slate-700 text-sm">
                    {emp.rol === 'ADMIN_TI' ? (
                      <span className="text-xs text-slate-400 italic">No aplica (Global)</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{emp.area_nombre}</span>
                        {emp.area_siglas && (
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {emp.area_siglas}
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Estado */}
                  <TableCell className="text-center">
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
                  <TableCell className="text-right pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900 focus-visible:ring-1"
                          disabled={loadingId === emp.id}
                        >
                          {loadingId === emp.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                          <span className="sr-only">Acciones</span>
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
