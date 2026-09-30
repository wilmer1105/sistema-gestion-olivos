// components/shared/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Inbox, FilePlus2, Building2, Search, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  userRole?: string
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navItems: NavItem[] = [
  {
    name: 'Resumen',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['MESA_PARTES', 'ESPECIALISTA', 'JEFE_AREA', 'FUNCIONARIO'],
  },
  {
    name: 'Mi Bandeja',
    href: '/dashboard/bandeja',
    icon: Inbox,
    roles: ['MESA_PARTES', 'ESPECIALISTA', 'JEFE_AREA', 'FUNCIONARIO'],
  },
  {
    name: 'Nuevo Expediente',
    href: '/dashboard/expedientes/nuevo',
    icon: FilePlus2,
    roles: ['MESA_PARTES'],
  },
  {
    name: 'Consulta Pública',
    href: '/dashboard/consulta',
    icon: Search,
    roles: ['MESA_PARTES', 'ESPECIALISTA', 'JEFE_AREA', 'FUNCIONARIO'],
  },
  {
    name: 'Panel Admin',
    href: '/dashboard/admin',
    icon: Shield,
    roles: ['ADMIN_TI', 'ADMIN'],
  },
]

export function Sidebar({ userRole = 'FUNCIONARIO' }: SidebarProps) {
  const pathname = usePathname()

  // Filtra los enlaces comprobando si el rol del usuario está incluido en los roles permitidos
  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <aside className="w-64 border-r bg-white flex-col hidden md:flex min-h-screen">
      <div className="h-16 flex items-center px-6 border-b">
        <Building2 className="h-6 w-6 text-primary mr-2" />
        <span className="font-bold text-slate-800 tracking-tight">MDLO Docs</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-primary-foreground" : "text-slate-400")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <p className="text-xs text-center text-slate-400">
          Versión 1.0.0 &copy; 2026
        </p>
      </div>
    </aside>
  )
}