// components/shared/UserProfileMenu.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import {
  User,
  Shield,
  Building,
  Mail,
  CreditCard,
  Calendar,
  CheckCircle2,
  ChevronDown,
  LogOut,
  Info,
  Briefcase,
  X,
} from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface UserProfileData {
  id: string
  email?: string | null
  nombres: string
  apellidos: string
  dni?: string | null
  rol: string
  activo?: boolean
  created_at?: string | null
  areas?: {
    id?: string
    nombre?: string
    siglas?: string
  } | null
}

interface Props {
  user: UserProfileData
}

export function UserProfileMenu({ user }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const nombreCompleto = `${user.nombres} ${user.apellidos}`.trim() || 'Usuario Municipal'
  const nombreArea = user.areas?.nombre || 'Área no asignada'
  const siglasArea = user.areas?.siglas || ''
  const rol = user.rol || 'FUNCIONARIO'
  const cargoMap: Record<string, string> = {
    ADMIN_TI: 'Administrador TI / OTI',
    ADMIN: 'Administrador TI / OTI',
    JEFE_AREA: 'Jefe de Área',
    ESPECIALISTA: 'Especialista',
    MESA_PARTES: 'Operador de Mesa de Partes',
    FUNCIONARIO: 'Funcionario Municipal',
  }
  const cargo = cargoMap[rol] || 'Funcionario Municipal'

  // Cerrar el menú desplegable al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  // Obtener iniciales
  const iniciales = `${user.nombres?.charAt(0) || ''}${user.apellidos?.charAt(0) || ''}`.toUpperCase() || 'U'

  // Formato de fecha
  let fechaRegistro = 'No registrada'
  if (user.created_at) {
    try {
      fechaRegistro = format(new Date(user.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es })
    } catch {
      fechaRegistro = user.created_at
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Botón Disparador del Menú de Usuario */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="inline-flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {iniciales}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold leading-tight text-slate-800">{nombreCompleto}</span>
          <span className="text-[10px] text-slate-400 leading-tight">{nombreArea}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {/* Panel Desplegable con Información Mínima */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
          {/* Cabecera del Panel */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {iniciales}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-slate-900 truncate">{nombreCompleto}</h4>
              <p className="text-xs text-slate-500 truncate">{user.email || 'Sin correo registrado'}</p>
            </div>
          </div>

          {/* Información Mínima */}
          <div className="py-3 space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                Cargo:
              </span>
              <span className="font-medium text-slate-800">{cargo}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Rol:
              </span>
              {rol === 'ADMIN' || rol === 'ADMIN_TI' ? (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] py-0 px-2 font-semibold">
                  ADMINISTRADOR TI
                </Badge>
              ) : rol === 'JEFE_AREA' ? (
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] py-0 px-2 font-semibold">
                  JEFE DE ÁREA
                </Badge>
              ) : rol === 'ESPECIALISTA' ? (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] py-0 px-2 font-semibold">
                  ESPECIALISTA
                </Badge>
              ) : rol === 'MESA_PARTES' ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] py-0 px-2 font-semibold">
                  MESA DE PARTES
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] py-0 px-2 font-semibold">
                  {rol}
                </Badge>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                Área:
              </span>
              <span className="font-medium text-slate-800 text-right truncate max-w-[170px]" title={nombreArea}>
                {siglasArea ? `${nombreArea} (${siglasArea})` : nombreArea}
              </span>
            </div>
          </div>

          {/* Acciones */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDropdownOpen(false)
                setModalOpen(true)
              }}
              className="w-full justify-start text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            >
              <Info className="w-3.5 h-3.5 mr-2 text-primary" />
              Ver Información Completa
            </Button>

            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal con Información Completa del Usuario */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <User className="h-5 w-5 text-primary" />
              Ficha del Usuario Institucional
            </DialogTitle>
            <DialogDescription>
              Detalles completos de la cuenta y permisos en el sistema MDLO Docs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tarjeta de Resumen */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-white shadow-xs">
                {iniciales}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-semibold text-slate-900">{nombreCompleto}</h3>
                <p className="text-xs text-slate-500">{user.email || 'Correo institucional no asignado'}</p>
                <div className="pt-1 flex items-center gap-2">
                  <Badge variant={user.activo !== false ? 'default' : 'destructive'} className="text-[10px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {user.activo !== false ? 'Cuenta Activa' : 'Cuenta Suspendida'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Grilla de Datos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Documento de Identidad (DNI)
                </span>
                <span className="font-mono font-medium text-slate-900 text-sm">
                  {user.dni || 'No registrado'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Rol del Sistema
                </span>
                <span className="font-semibold text-slate-900 text-sm">{rol}</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 sm:col-span-2">
                <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  Unidad Orgánica / Área de Adscripción
                </span>
                <span className="font-medium text-slate-900 text-sm">
                  {nombreArea} {siglasArea && `(${siglasArea})`}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Cargo Institucional
                </span>
                <span className="font-medium text-slate-900 text-sm">{cargo}</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Fecha de Registro
                </span>
                <span className="font-medium text-slate-900 text-sm">{fechaRegistro}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                <span className="text-slate-400 block mb-0.5 text-[11px]">ID Único de Usuario (Auth UUID):</span>
                <span className="font-mono text-[11px] text-slate-600 select-all break-all">{user.id}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
