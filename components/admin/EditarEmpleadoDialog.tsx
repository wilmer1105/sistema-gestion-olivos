// components/admin/EditarEmpleadoDialog.tsx
'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserCheck, Loader2, AlertCircle, CheckCircle2, Mail, Shield } from 'lucide-react'
import { EmpleadoItem, actualizarEmpleado } from '@/app/actions/admin'

interface AreaOption {
  id: string
  nombre: string
  siglas?: string
}

interface Props {
  empleado: EmpleadoItem
  areas: AreaOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ROL_LABELS: Record<string, string> = {
  MESA_PARTES: 'Mesa de Partes',
  ESPECIALISTA: 'Especialista',
  JEFE_AREA: 'Jefe de Área',
  ADMIN_TI: 'Administrador TI',
}

export function EditarEmpleadoDialog({ empleado, areas, open, onOpenChange }: Props) {
  const router = useRouter()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Items maps for Base UI Select
  const areaItems: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {}
    for (const a of areas) {
      map[String(a.id)] = a.nombre
    }
    return map
  }, [areas])

  // Form states initialized with current employee values
  const [nombres, setNombres] = useState(empleado.nombres || '')
  const [apellidos, setApellidos] = useState(empleado.apellidos || '')
  const [dni, setDni] = useState(empleado.dni && empleado.dni !== '—' ? empleado.dni : '')
  const [rol, setRol] = useState<string>(empleado.rol || '')
  const [areaId, setAreaId] = useState<string>(empleado.area_id || '')

  // Reset form states whenever selected employee changes or modal opens
  useEffect(() => {
    if (open) {
      setNombres(empleado.nombres || '')
      setApellidos(empleado.apellidos || '')
      setDni(empleado.dni && empleado.dni !== '—' ? empleado.dni : '')
      setRol(empleado.rol || '')
      setAreaId(empleado.rol === 'ADMIN_TI' ? '' : (empleado.area_id || ''))
      setErrorMsg(null)
      setSuccessMsg(null)
    }
  }, [open, empleado])

  // Lógica Reactiva de Rol
  function handleRoleChange(value: string) {
    setRol(value)
    if (value === 'MESA_PARTES') {
      const areaMesa = areas.find((a) => a.nombre.toLowerCase().includes('mesa de partes'))
      if (areaMesa) {
        setAreaId(String(areaMesa.id))
      }
    } else if (value === 'ADMIN_TI') {
      setAreaId('')
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!nombres.trim() || nombres.trim().length < 2) {
      setErrorMsg('Por favor ingrese nombres válidos (mínimo 2 caracteres).')
      return
    }
    if (!apellidos.trim() || apellidos.trim().length < 2) {
      setErrorMsg('Por favor ingrese apellidos válidos (mínimo 2 caracteres).')
      return
    }
    if (dni.trim() && !/^\d{8}$/.test(dni.trim())) {
      setErrorMsg('El DNI debe contener exactamente 8 dígitos numéricos.')
      return
    }
    if (!rol) {
      setErrorMsg('Por favor seleccione un rol asignado.')
      return
    }
    if (rol !== 'ADMIN_TI' && !areaId) {
      setErrorMsg('Por favor seleccione un área institucional.')
      return
    }

    startTransition(async () => {
      try {
        const result = await actualizarEmpleado(empleado.id, {
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          dni: dni.trim(),
          rol,
          area_id: rol === 'ADMIN_TI' ? null : areaId,
        })

        if (!result.success) {
          setErrorMsg(result.error || 'Ocurrió un error al actualizar el empleado.')
        } else {
          setSuccessMsg('Empleado actualizado exitosamente.')
          router.refresh()
          setTimeout(() => {
            onOpenChange(false)
            setSuccessMsg(null)
          }, 1000)
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Error de comunicación con el servidor.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            Editar Empleado
          </DialogTitle>
          <DialogDescription>
            Modifique los datos institucionales, rol y área asignada al usuario.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700">{successMsg}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Identificador institucional (Solo lectura) */}
          <div className="rounded-lg bg-slate-50 border p-3 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{empleado.email}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">ID: {empleado.id.slice(0, 8)}...</span>
          </div>

          {/* Fila 1: Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-nombres">Nombres *</Label>
              <Input
                id="edit-nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-apellidos">Apellidos *</Label>
              <Input
                id="edit-apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
          </div>

          {/* Fila 2: DNI y Rol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-dni">DNI (8 dígitos)</Label>
              <Input
                id="edit-dni"
                placeholder="45892134"
                maxLength={8}
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-rol">Rol Asignado *</Label>
              <Select
                items={ROL_LABELS}
                itemToStringLabel={(val: any) => (val ? ROL_LABELS[String(val)] || String(val) : '')}
                value={rol}
                onValueChange={(val: any) => handleRoleChange(val || '')}
                disabled={isPending}
              >
                <SelectTrigger id="edit-rol">
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MESA_PARTES">Mesa de Partes</SelectItem>
                  <SelectItem value="ESPECIALISTA">Especialista</SelectItem>
                  <SelectItem value="JEFE_AREA">Jefe de Área</SelectItem>
                  <SelectItem value="ADMIN_TI">Administrador TI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fila 3: Área de Adscripción */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-area_id">
              Área de Adscripción {rol !== 'ADMIN_TI' ? '*' : ''}
            </Label>
            <Select
              items={areaItems}
              itemToStringLabel={(val: any) => (val ? areaItems[String(val)] || String(val) : '')}
              value={rol === 'ADMIN_TI' ? '' : areaId}
              onValueChange={(val: any) => setAreaId(val || '')}
              disabled={rol === 'MESA_PARTES' || rol === 'ADMIN_TI' || isPending}
            >
              <SelectTrigger id="edit-area_id" className={rol === 'ADMIN_TI' ? 'bg-slate-50 text-slate-400' : ''}>
                <SelectValue placeholder={rol === 'ADMIN_TI' ? 'No aplica (Administrador Global)' : 'Seleccione el área municipal'} />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={String(area.id)}>
                    {area.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rol === 'MESA_PARTES' && (
              <p className="text-[11px] text-emerald-600 font-medium">
                Área bloqueada y asignada automáticamente a Mesa de Partes para este rol.
              </p>
            )}
            {rol === 'ADMIN_TI' && (
              <p className="text-[11px] text-purple-600 font-medium">
                No aplica: Los Administradores TI no pertenecen a un área específica y tienen alcance global.
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
