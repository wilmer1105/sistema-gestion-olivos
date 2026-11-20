// components/shared/Sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Inbox,
  FilePlus2,
  Building2,
  Search,
  Shield,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  obtenerItemsNavegacionPorRol,
  type PerfilRBACContext,
} from '@/lib/domain/rbac'

interface SidebarProps {
  userRole?: string
  perfil?: PerfilRBACContext | null
}

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Inbox,
  FilePlus2,
  Search,
  Shield,
}

export function Sidebar({ userRole, perfil }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const rolEfectivo = perfil?.rol || userRole || 'ASISTENTE_AREA'
  const navItems = obtenerItemsNavegacionPorRol(rolEfectivo)

  return (
    <>
      {/* Botón móvil de menú accesible */}
      <div className="md:hidden fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="sidebar-mobile-drawer"
          aria-label={mobileOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0F2A4A] text-white shadow-lg border border-blue-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {mobileOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          id="sidebar-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menú principal móvil"
          className="md:hidden fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-xs flex"
        >
          <div className="w-72 bg-[#0F2A4A] text-white flex flex-col min-h-full shadow-2xl border-r border-slate-800">
            <div className="h-18 flex items-center justify-between px-6 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/25 border border-blue-400/40">
                  <Building2 className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <span className="font-extrabold text-base text-white tracking-tight block leading-none">
                    SISGESDOC
                  </span>
                  <span className="text-xs font-medium text-blue-200">
                    MDLO · Gobierno Digital
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú lateral"
                className="p-1.5 rounded-lg text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Navegación principal móvil" className="flex-1 px-4 py-6 space-y-2">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                const Icon = ICON_MAP[item.icon] || LayoutDashboard

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center px-3.5 py-3 rounded-xl text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                      isActive
                        ? 'bg-white text-[#0F2A4A] shadow-sm border-l-4 border-l-amber-500'
                        : 'text-slate-100 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 mr-3 shrink-0',
                        isActive ? 'text-blue-700' : 'text-blue-200'
                      )}
                      aria-hidden="true"
                    />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Barra lateral institucional de escritorio (#0F2A4A) */}
      <aside
        aria-label="Barra lateral del sistema"
        className="w-72 border-r border-slate-800 bg-[#0F2A4A] text-white flex-col hidden md:flex min-h-screen shrink-0 shadow-sm"
      >
        <div className="h-18 flex items-center px-6 border-b border-slate-800/80 gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/25 border border-blue-400/40 shadow-2xs">
            <Building2 className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight block leading-tight">
              SISGESDOC
            </span>
            <span className="text-xs font-medium text-blue-200 block">
              MDLO · Gestión Documental
            </span>
          </div>
        </div>

        <div className="px-6 pt-5 pb-2">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
            Menú Institucional
          </p>
        </div>

        <nav aria-label="Navegación principal" className="flex-1 px-4 py-2 space-y-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = ICON_MAP[item.icon] || LayoutDashboard

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center px-3.5 py-2.5 rounded-xl text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2A4A]',
                  isActive
                    ? 'bg-white text-[#0F2A4A] shadow-sm border-l-4 border-l-amber-500'
                    : 'text-slate-100 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 mr-3 shrink-0',
                    isActive ? 'text-blue-700' : 'text-blue-200'
                  )}
                  aria-hidden="true"
                />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-5 border-t border-slate-800/80 bg-[#0B213B]">
          <div className="rounded-xl bg-white px-3.5 py-2.5 text-sm text-slate-600 border border-slate-200 shadow-2xs">
            <p className="font-bold text-slate-900">Municipalidad Distrital</p>
            <p className="text-xs font-semibold text-slate-600">de Los Olivos · OGTIC</p>
          </div>
        </div>
      </aside>
    </>
  )
}

