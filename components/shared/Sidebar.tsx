// components/shared/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Inbox,
  FilePlus2,
  Building2,
  Search,
  Shield,
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
  const rolEfectivo = perfil?.rol || userRole || 'ASISTENTE_AREA'
  const navItems = obtenerItemsNavegacionPorRol(rolEfectivo)

  return (
    <aside
      aria-label="Barra lateral del sistema"
      className="w-64 border-r bg-white flex-col hidden md:flex min-h-screen"
    >
      <div className="h-16 flex items-center px-6 border-b">
        <Building2 className="h-6 w-6 text-primary mr-2" aria-hidden="true" />
        <span className="font-bold text-slate-800 tracking-tight">MDLO Docs</span>
      </div>

      <nav aria-label="Navegación principal" className="flex-1 px-4 py-6 space-y-2">
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
                'flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4 mr-3 shrink-0" aria-hidden="true" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t text-xs text-slate-500">
        <p className="font-medium">Municipalidad Distrital</p>
        <p>de Los Olivos</p>
      </div>
    </aside>
  )
}
