// components/shared/UserProfileMenu.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import {
  User,
  Shield,
  Building,
  CreditCard,
  Calendar,
  CheckCircle2,
  ChevronDown,
  LogOut,
  Info,
  Briefcase,
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
    ADMIN_TI: 'Administrador TI / OGTIC',
    ADMIN: 'Administrador TI / OGTIC',
    JEFE_AREA: 'Jefe de Área',
    ESPECIALISTA: 'Especialista',
    ASISTENTE_AREA: 'Asistente de Área',
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
        aria-haspopup="menu"
        aria-expanded={dropdownOpen}
        aria-label={`Menú de perfil de ${nombreCompleto}`}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="inline-flex items-center gap-2.5 min-h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F2A4A] text-xs font-bold text-white">
          {iniciales}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-sm font-bold leading-tight text-slate-900">{nombreCompleto}</span>
          <span className="text-xs text-slate-600 leading-tight truncate max-w-[160px]">{nombreArea}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-600" aria-hidden="true" />
      </button>

      {/* Panel Desplegable con Información Mínima */}
      {dropdownOpen && (
        <div
          role="menu"
          aria-label="Opciones de cuenta institucional"
          className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-in fade-in-0 zoom-in-95"
        >
          {/* Cabecera del Panel */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F2A4A] text-sm font-bold text-white">
              {iniciales}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{nombreCompleto}</p>
              <p className="text-xs text-slate-600 truncate">{user.email || 'Sin correo registrado'}</p>
            </div>
          </div>

          {/* Información Mínima */}
          <div className="py-3 space-y-2.5 text-sm text-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-600" aria-hidden="true" />
                Cargo:
              </span>
              <span className="font-semibold text-slate-900">{cargo}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-slate-600" aria-hidden="true" />
                Rol:
              </span>
              {rol === 'ADMIN' || rol === 'ADMIN_TI' ? (
                <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-xs py-0.5 px-2.5 font-bold">
                  ADMINISTRADOR TI
                </Badge>
              ) : rol === 'JEFE_AREA' ? (
                <Badge className="bg-indigo-100 text-indigo-900 border-indigo-300 text-xs py-0.5 px-2.5 font-bold">
                  JEFE DE ÁREA
                </Badge>
              ) : rol === 'ESPECIALISTA' ? (
                <Badge className="bg-blue-100 text-blue-900 border-blue-300 text-xs py-0.5 px-2.5 font-bold">
                  ESPECIALISTA
                </Badge>
              ) : rol === 'ASISTENTE_AREA' ? (
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs py-0.5 px-2.5 font-bold">
                  ASISTENTE DE ÁREA
                </Badge>
              ) : rol === 'MESA_PARTES' ? (
                <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs py-0.5 px-2.5 font-bold">
                  MESA DE PARTES
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs py-0.5 px-2.5 font-bold">
                  {rol}
                </Badge>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-slate-600" aria-hidden="true" />
                Área:
              </span>
              <span className="font-semibold text-slate-900 text-right truncate max-w-[170px]" title={nombreArea}>
                {siglasArea ? `${nombreArea} (${siglasArea})` : nombreArea}
              </span>
            </div>
          </div>

          {/* Acciones (Único lugar con Cerrar Sesión) */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDropdownOpen(false)
                setModalOpen(true)
              }}
              className="w-full h-10 justify-start text-sm font-semibold text-slate-800 border-slate-300 hover:text-slate-900 hover:bg-slate-100"
            >
              <Info className="w-4 h-4 mr-2 text-blue-700" aria-hidden="true" />
              <span>Ver Información Completa</span>
            </Button>

            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full h-10 flex items-center px-3 py-2 rounded-lg text-sm font-semibold text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                <span>Cerrar Sesión</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal con Información Completa del Usuario */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <User className="h-5 w-5 text-blue-700" aria-hidden="true" />
              Ficha del Usuario Institucional
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Detalles completos de la cuenta y permisos en el sistema SISGESDOC.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tarjeta de Resumen */}
            <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0F2A4A] text-base font-bold text-white shadow-xs">
                {iniciales}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">{nombreCompleto}</h3>
                <p className="text-sm text-slate-600">{user.email || 'Correo institucional no asignado'}</p>
                <div className="pt-1 flex items-center gap-2">
                  <Badge
                    variant={user.activo !== false ? 'default' : 'destructive'}
                    className={
                      user.activo !== false
                        ? 'bg-emerald-800 text-white text-xs px-2.5 py-0.5'
                        : 'text-xs px-2.5 py-0.5'
                    }
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    <span>{user.activo !== false ? 'Cuenta Activa' : 'Cuenta Suspendida'}</span>
                  </Badge>
                </div>
              </div>
            </div>

            {/* Grilla de Datos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-600 mb-1 flex items-center gap-1.5 font-medium">
                  <CreditCard className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  Documento de Identidad (DNI)
                </span>
                <span className="font-mono font-bold text-slate-900 text-base">
                  {user.dni || 'No registrado'}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-600 mb-1 flex items-center gap-1.5 font-medium">
                  <Shield className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  Rol del Sistema
                </span>
                <span className="font-bold text-slate-900 text-base">{rol}</span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 sm:col-span-2">
                <span className="text-slate-600 mb-1 flex items-center gap-1.5 font-medium">
                  <Building className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  Unidad Orgánica / Área de Adscripción
                </span>
                <span className="font-bold text-slate-900 text-base">
                  {nombreArea} {siglasArea && `(${siglasArea})`}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-600 mb-1 flex items-center gap-1.5 font-medium">
                  <Briefcase className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  Cargo Institucional
                </span>
                <span className="font-semibold text-slate-900 text-base">{cargo}</span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-600 mb-1 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  Fecha de Registro
                </span>
                <span className="font-semibold text-slate-900 text-base">{fechaRegistro}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
                <span className="text-slate-600 block mb-0.5 text-xs font-semibold">
                  ID Único de Usuario (Auth UUID):
                </span>
                <span className="font-mono text-xs text-slate-800 select-all break-all">
                  {user.id}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="h-10 px-5 font-semibold border-slate-300 text-slate-800"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
