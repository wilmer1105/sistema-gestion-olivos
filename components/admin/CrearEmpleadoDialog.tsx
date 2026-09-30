// components/admin/CrearEmpleadoDialog.tsx
'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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
import { UserPlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { crearEmpleado } from '@/app/actions/admin'

interface AreaOption {
  id: string
  nombre: string
  siglas?: string
}

interface Props {
  areas: AreaOption[]
}

const ROL_LABELS: Record<string, string> = {
  MESA_PARTES: 'Mesa de Partes',
  ESPECIALISTA: 'Especialista',
  JEFE_AREA: 'Jefe de Área',
  ADMIN_TI: 'Administrador TI',
}

export function CrearEmpleadoDialog({ areas }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Items maps for Base UI Select so human-readable labels are rendered instead of raw values/UUIDs
  const areaItems: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {}
    for (const a of areas) {
      map[String(a.id)] = a.nombre
    }
    return map
  }, [areas])

  // Form states
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [dni, setDni] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<string>('')
  const [areaId, setAreaId] = useState<string>('')

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

  function resetForm() {
    setNombres('')
    setApellidos('')
    setDni('')
    setEmail('')
    setPassword('')
    setRol('')
    setAreaId('')
    setErrorMsg(null)
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      setErrorMsg(null)
      setSuccessMsg(null)
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
    if (!dni.trim() || !/^\d{8}$/.test(dni.trim())) {
      setErrorMsg('El DNI debe contener exactamente 8 dígitos numéricos.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor ingrese un correo electrónico institucional válido.')
      return
    }
    if (!password || password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.')
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
        const result = await crearEmpleado({
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          dni: dni.trim(),
          email: email.trim(),
          password,
          rol,
          area_id: rol === 'ADMIN_TI' ? '' : areaId,
        })

        if (!result.success) {
          setErrorMsg(result.error || 'Ocurrió un error al crear el empleado.')
        } else {
          setSuccessMsg('Empleado creado exitosamente en el sistema.')
          resetForm()
          router.refresh()
          setTimeout(() => {
            setOpen(false)
            setSuccessMsg(null)
          }, 1200)
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Error de comunicación con el servidor.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
          <UserPlus className="w-4 h-4" />
          Nuevo Empleado
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            Registrar Nuevo Empleado
          </DialogTitle>
          <DialogDescription>
            Alta de cuenta institucional con acceso directo al sistema municipal. Todos los datos son requeridos para users y perfiles.
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
          {/* Fila 1: Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input
                id="nombres"
                name="nombres"
                placeholder="Ej. Juan Carlos"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input
                id="apellidos"
                name="apellidos"
                placeholder="Ej. Pérez Quispe"
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
              <Label htmlFor="dni">DNI (8 dígitos) *</Label>
              <Input
                id="dni"
                name="dni"
                placeholder="45892134"
                maxLength={8}
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rol">Rol Asignado *</Label>
              <Select
                items={ROL_LABELS}
                itemToStringLabel={(val: any) => (val ? ROL_LABELS[String(val)] || String(val) : '')}
                value={rol}
                onValueChange={(val: any) => handleRoleChange(val || '')}
                disabled={isPending}
              >
                <SelectTrigger id="rol">
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
            <Label htmlFor="area_id">
              Área de Adscripción {rol !== 'ADMIN_TI' ? '*' : ''}
            </Label>
            <Select
              items={areaItems}
              itemToStringLabel={(val: any) => (val ? areaItems[String(val)] || String(val) : '')}
              value={rol === 'ADMIN_TI' ? '' : areaId}
              onValueChange={(val: any) => setAreaId(val || '')}
              disabled={rol === 'MESA_PARTES' || rol === 'ADMIN_TI' || isPending}
            >
              <SelectTrigger id="area_id" className={rol === 'ADMIN_TI' ? 'bg-slate-50 text-slate-400' : ''}>
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

          {/* Fila 4: Correo Electrónico y Contraseña */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo Institucional *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@munilosolivos.gob.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña Temporal *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                required
              />
              <p className="text-[10px] text-slate-400">
                Mínimo 6 caracteres.
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Empleado'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
